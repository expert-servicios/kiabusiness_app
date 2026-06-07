/**
 * Durable email queue backed by the `email_queue` Supabase table.
 *
 * Usage:
 *   await enqueueEmail({ to, subject, html, eventType });
 *
 * The worker (/api/cron/email-queue) calls processEmailQueue() on a schedule.
 * Failed sends are retried up to max_attempts with exponential back-off.
 */

import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail }        from '@/lib/email/send';

const BATCH_SIZE    = 20;  // ~10s max at 480ms/email — fits Vercel 60s maxDuration safely
const RETRY_BASE_S  = 120; // 2 min → 4 min → 8 min
const WALL_CLOCK_MS = 50_000; // stop claiming new jobs after 50s to leave Vercel buffer

// ── Enqueue ───────────────────────────────────────────────────────────────────

export interface EnqueueEmailParams {
  to          : string;
  subject     : string;
  html        : string;
  eventType   : string;
  metadata   ?: Record<string, unknown>;
  delayMs    ?: number;
  maxAttempts?: number;
}

export async function enqueueEmail(params: EnqueueEmailParams): Promise<void> {
  const admin = getSupabaseAdmin();
  const scheduledAt = params.delayMs
    ? new Date(Date.now() + params.delayMs).toISOString()
    : new Date().toISOString();

  const { error } = await admin.from('email_queue').insert({
    to_email    : params.to,
    subject     : params.subject,
    html        : params.html,
    event_type  : params.eventType,
    metadata    : params.metadata ?? {},
    scheduled_at: scheduledAt,
    max_attempts: params.maxAttempts ?? 3,
  });

  if (error) {
    // Throw so callers can log or alert — hiding queue failures makes monitoring blind.
    throw new Error(`[email-queue] enqueue failed: ${error.message}`);
  }
}

// ── Worker ────────────────────────────────────────────────────────────────────

type QueueRow = {
  id          : string;
  to_email    : string;
  subject     : string;
  html        : string;
  event_type  : string;
  attempts    : number;
  max_attempts: number;
  scheduled_at: string;
};

export async function processEmailQueue(
  batchSize = BATCH_SIZE,
): Promise<{ processed: number; failed: number; skipped: number }> {
  const admin   = getSupabaseAdmin();
  const now     = new Date().toISOString();
  const startMs = Date.now();

  // Step 1: Fetch candidate IDs (pending, due, not exhausted)
  const { data: candidates, error: selectError } = await admin
    .from('email_queue')
    .select('id, attempts, max_attempts')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(batchSize);

  if (selectError) {
    console.error('[email-queue] failed to fetch jobs:', selectError.message);
    return { processed: 0, failed: 0, skipped: 0 };
  }
  if (!candidates?.length) return { processed: 0, failed: 0, skipped: 0 };

  // Separate exhausted jobs (shouldn't be pending, but defensive)
  const exhaustedIds = candidates.filter((r) => r.attempts >= r.max_attempts).map((r) => r.id);
  const eligibleIds  = candidates.filter((r) => r.attempts <  r.max_attempts).map((r) => r.id);

  let skipped = 0;
  if (exhaustedIds.length) {
    await admin.from('email_queue')
      .update({ status: 'failed', error: 'max_attempts_exceeded' })
      .in('id', exhaustedIds);
    skipped = exhaustedIds.length;
  }
  if (!eligibleIds.length) return { processed: 0, failed: 0, skipped };

  // Step 2: Claim eligible jobs atomically — only rows still in 'pending' get claimed.
  // Any row already grabbed by a concurrent invocation will be in 'processing' and skipped.
  const { data: claimed } = await admin
    .from('email_queue')
    .update({ status: 'processing', updated_at: new Date().toISOString() } as Record<string, unknown>)
    .in('id', eligibleIds)
    .eq('status', 'pending')
    .select('id, to_email, subject, html, event_type, attempts, max_attempts, scheduled_at');

  if (!claimed?.length) return { processed: 0, failed: 0, skipped };

  // Step 3: Process claimed jobs sequentially with wall-clock guard
  const jobs = claimed as QueueRow[];
  let processed = 0;
  let failed    = 0;
  let lastProcessedIdx = -1;

  for (let i = 0; i < jobs.length; i++) {
    if (Date.now() - startMs > WALL_CLOCK_MS) break;

    const job = jobs[i]!;
    lastProcessedIdx = i;

    try {
      await sendEmail({
        to        : job.to_email,
        subject   : job.subject,
        html      : job.html,
        eventType : job.event_type,
      });

      await admin.from('email_queue').update({
        status  : 'sent',
        sent_at : new Date().toISOString(),
        attempts: job.attempts + 1,
        error   : null,
      }).eq('id', job.id);

      processed++;
    } catch (err) {
      const nextAttempt   = job.attempts + 1;
      const isFinal       = nextAttempt >= job.max_attempts;
      const retryDelaySec = RETRY_BASE_S * Math.pow(2, job.attempts);
      const nextScheduled = new Date(Date.now() + retryDelaySec * 1_000).toISOString();

      await admin.from('email_queue').update({
        attempts    : nextAttempt,
        error       : err instanceof Error ? err.message.slice(0, 500) : 'unknown',
        status      : isFinal ? 'failed' : 'pending',
        scheduled_at: isFinal ? job.scheduled_at : nextScheduled,
      }).eq('id', job.id);

      if (isFinal) {
        console.error(`[email-queue] job ${job.id} permanently failed after ${nextAttempt} attempts`);
      }
      failed++;
    }
  }

  // Step 4: Release any claimed-but-unprocessed jobs (wall-clock guard hit mid-batch)
  const unprocessed = jobs.slice(lastProcessedIdx + 1);
  if (unprocessed.length) {
    await admin
      .from('email_queue')
      .update({ status: 'pending' })
      .in('id', unprocessed.map((j) => j.id));
  }

  return { processed, failed, skipped };
}
