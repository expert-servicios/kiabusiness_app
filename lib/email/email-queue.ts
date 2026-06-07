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

const BATCH_SIZE   = 50;
const RETRY_BASE_S = 120; // 2 min → 4 min → 8 min

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
    // Fallback: attempt direct send so the email is not silently lost
    console.error('[email-queue] insert failed, falling back to direct send:', error.message);
    await sendEmail({ to: params.to, subject: params.subject, html: params.html, eventType: params.eventType }).catch(
      (e: unknown) => console.error('[email-queue] fallback send also failed:', e),
    );
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
  const admin = getSupabaseAdmin();
  const now   = new Date().toISOString();

  const { data: jobs, error } = await admin
    .from('email_queue')
    .select('id, to_email, subject, html, event_type, attempts, max_attempts, scheduled_at')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error('[email-queue] failed to fetch jobs:', error.message);
    return { processed: 0, failed: 0, skipped: 0 };
  }
  if (!jobs?.length) return { processed: 0, failed: 0, skipped: 0 };

  let processed = 0;
  let failed    = 0;
  let skipped   = 0;

  for (const job of (jobs as QueueRow[])) {
    // Guard: skip if we've already hit max attempts (shouldn't happen but defensive)
    if (job.attempts >= job.max_attempts) {
      await admin
        .from('email_queue')
        .update({ status: 'failed', error: 'max_attempts_exceeded' })
        .eq('id', job.id);
      skipped++;
      continue;
    }

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
      const nextAttempt = job.attempts + 1;
      const isFinal     = nextAttempt >= job.max_attempts;
      const retryDelaySec = RETRY_BASE_S * Math.pow(2, job.attempts); // 2m → 4m → 8m
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

  return { processed, failed, skipped };
}
