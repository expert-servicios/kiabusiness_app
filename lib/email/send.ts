import { getResendClient } from '@/lib/integrations/resend';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { BRAND } from './templates';

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  type?: string;
}

interface SendEmailOptions {
  to: string | string[];
  eventType: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  idempotencyKey?: string;
}

function withIntentMetadata(
  metadata: Record<string, unknown> | undefined,
  idempotencyKey: string | undefined,
): Record<string, unknown> | null {
  if (!metadata && !idempotencyKey) return null;
  return {
    ...(metadata ?? {}),
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  };
}

export async function sendEmail({
  to,
  eventType,
  subject,
  html,
  metadata,
  attachments,
  idempotencyKey,
}: SendEmailOptions): Promise<string> {
  const recipients = Array.isArray(to) ? to : [to];
  const supabase = getSupabaseAdmin();
  const eventMetadata = withIntentMetadata(metadata, idempotencyKey);

  const resend = getResendClient();
  const payload = {
    from: BRAND.from,
    to: recipients,
    subject,
    html,
    ...(attachments?.length
      ? {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: Buffer.from(a.content, 'base64'),
            ...(a.type ? { type: a.type } : {})
          }))
        }
      : {})
  };

  const { data, error } = idempotencyKey
    ? await resend.emails.send(payload, { idempotencyKey })
    : await resend.emails.send(payload);

  if (error) {
    const errMsg = (error as { message?: string }).message ?? String(error);
    await Promise.all(
      recipients.map((email) =>
        supabase.from('email_events').insert({
          event_type: eventType,
          recipient_email: email,
          subject,
          resend_id: null,
          status: 'failed',
          last_error: errMsg,
          metadata: eventMetadata
        })
      )
    ).catch(() => null);
    throw new Error(`Resend rejected ${eventType}: ${errMsg}`);
  }

  const resendId = data!.id;

  await Promise.all(
    recipients.map((email) =>
      supabase.from('email_events').insert({
        event_type: eventType,
        recipient_email: email,
        subject,
        resend_id: resendId,
        status: 'sent',
        metadata: eventMetadata
      })
    )
  ).catch(() => null); // best-effort — don't fail delivery because audit log failed

  return resendId;
}

/**
 * Sends one logical email intent at most once from EXPERT's point of view.
 *
 * The durable email_events lookup suppresses retries even after Resend's
 * 24-hour idempotency window. Resend's own idempotency key closes the race
 * between concurrent callers that both pass the lookup before either audit
 * row is visible.
 *
 * A failed provider request has resend_id = null and remains retryable.
 * Once Resend accepted the request (resend_id != null), later delivery/bounce
 * status must not cause the same logical email to be sent again.
 */
export async function sendEmailOnce(
  options: SendEmailOptions & { idempotencyKey: string },
): Promise<{ sent: boolean; resendId: string | null }> {
  const key = options.idempotencyKey.trim();
  if (!key || key.length > 256) {
    throw new Error('Email idempotency key must contain 1-256 characters');
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('email_events')
    .select('resend_id')
    .contains('metadata', { idempotency_key: key })
    .not('resend_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`[email] idempotency lookup failed: ${lookupError.message}`);
  }
  if (existing?.resend_id) {
    return { sent: false, resendId: existing.resend_id };
  }

  const resendId = await sendEmail({ ...options, idempotencyKey: key });
  return { sent: true, resendId };
}