import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { syncOrderToHolded, syncSubscriptionToHolded } from '@/lib/integrations/holded';
import { verifyCronRequest } from '@/lib/security/cron';

// Vercel Cron: runs every 15 minutes
// Protected by CRON_SECRET header (same as other crons)
// Retries holded_sync_jobs with status 'queued' or 'failed' (max 3 attempts)

const MAX_ATTEMPTS    = 3;
const BATCH_SIZE      = 10;
// Exponential back-off: attempt 1→5 min, attempt 2→15 min, attempt 3→stop
const RETRY_DELAY_MIN = [5, 15];

function nextRunAt(attempts: number): string {
  const delayMin = RETRY_DELAY_MIN[attempts] ?? 60;
  return new Date(Date.now() + delayMin * 60 * 1000).toISOString();
}

type SyncJobRow = {
  id: string;
  job_type: string;
  attempts: number;
  metadata: Record<string, unknown>;
};

async function executeJob(job: SyncJobRow): Promise<{ ok: boolean; error?: string }> {
  const m = job.metadata as {
    clientName?: string;
    clientEmail?: string;
    description?: string;
    planName?: string;
    amountEur?: number;
    orderId?: string;
    subscriptionId?: string;
    localEntity?: string;
  };

  try {
    if (
      job.job_type === 'sync_order_holded' ||
      job.job_type === 'sync_holded_migration' ||
      job.job_type === 'sync_holded_formacion'
    ) {
      await syncOrderToHolded({
        clientName : m.clientName  ?? 'Cliente',
        clientEmail: m.clientEmail ?? '',
        description: m.description ?? 'Servicio EXPERT',
        amountEur  : m.amountEur   ?? 0,
        orderId    : m.orderId,
        localEntity: (m.localEntity as 'orders' | 'stripe_checkout_sessions') ?? 'orders',
      });
      return { ok: true };
    }

    if (job.job_type === 'sync_subscription_holded') {
      await syncSubscriptionToHolded({
        clientName    : m.clientName  ?? 'Cliente',
        clientEmail   : m.clientEmail ?? '',
        planName      : m.planName    ?? 'Plan EXPERT',
        amountEur     : m.amountEur   ?? 0,
        subscriptionId: m.subscriptionId ?? '',
        localEntity   : (m.localEntity as 'stripe_subscriptions') ?? 'stripe_subscriptions',
      });
      return { ok: true };
    }

    return { ok: false, error: `Unknown job_type: ${job.job_type}` };
  } catch (err) {
    return {
      ok: false,
      error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
    };
  }
}

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/holded-sync');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  const admin = getSupabaseAdmin();
  const now   = new Date().toISOString();

  // Pick up jobs that need processing: queued OR failed with retries remaining
  const { data: jobs, error: fetchError } = await admin
    .from('holded_sync_jobs')
    .select('id, job_type, attempts, metadata')
    .in('status', ['queued', 'failed'])
    .lt('attempts', MAX_ATTEMPTS)
    .or(`next_run_at.is.null,next_run_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('[cron/holded-sync] fetch failed:', fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending jobs' });
  }

  let succeeded = 0;
  let failed    = 0;

  for (const job of jobs as SyncJobRow[]) {
    // Mark as running
    await admin.from('holded_sync_jobs').update({
      status    : 'running',
      started_at: new Date().toISOString(),
    }).eq('id', job.id);

    const result = await executeJob(job);
    const newAttempts = job.attempts + 1;

    if (result.ok) {
      await admin.from('holded_sync_jobs').update({
        status     : 'success',
        finished_at: new Date().toISOString(),
        attempts   : newAttempts,
        error      : null,
      }).eq('id', job.id);
      succeeded++;
    } else {
      const isLastAttempt = newAttempts >= MAX_ATTEMPTS;
      await admin.from('holded_sync_jobs').update({
        status      : isLastAttempt ? 'failed' : 'retrying',
        finished_at : new Date().toISOString(),
        attempts    : newAttempts,
        error       : result.error ?? null,
        next_run_at : isLastAttempt ? null : nextRunAt(newAttempts),
      }).eq('id', job.id);
      failed++;
      console.error(`[cron/holded-sync] job ${job.id} (${job.job_type}) failed (attempt ${newAttempts}/${MAX_ATTEMPTS}):`, result.error);
    }
  }

  console.info(`[cron/holded-sync] processed ${jobs.length} jobs: ${succeeded} ok, ${failed} failed`);
  return NextResponse.json({ processed: jobs.length, succeeded, failed });
}
