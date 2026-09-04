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

function stringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function deriveIdempotencyKey(
  eventType: string,
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const sessionId = stringMetadata(metadata, 'session_id');
  if (sessionId) return `email/${eventType}/session/${sessionId}`.slice(0, 256);

  const invoiceId = stringMetadata(metadata, 'invoice_id');
  if (invoiceId) return `email/${eventType}/invoice/${invoiceId}`.slice(0, 256);

  // A subscription is created only once. Do not apply this fallback to
  // subscription.payment_failed because the same subscription can fail again
  // legitimately in a later billing cycle; those notifications use invoice_id.
  const subscriptionId = stringMetadata(metadata, 'subscription_id');
  if (subscriptionId && (eventType === 'subscription.created' || eventType === 'subscription.created.admin')) {
    return `email/${eventType}/subscription/${subscriptionId}`.slice(0, 256);
  }

  return undefined;
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

async function findAcceptedIntent(idempotencyKey: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from('email_events')
    .select('resend_id')
    .contains('metadata', { idempotency_key: idempotencyKey })
    .not('resend_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`[email] idempotency lookup failed: ${error.message}`);
  return existing?.resend_id ?? null;
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
  const effectiveIdempotencyKey = idempotencyKey ?? deriveIdempotencyKey(eventType, metadata);

  if (effectiveIdempotencyKey) {
    if (effectiveIdempotencyKey.length > 256) {
      throw new Error('Email idempotency key must contain 1-256 characters');
    }
    const acceptedResendId = await findAcceptedIntent(effectiveIdempotencyKey);
    if (acceptedResendId) return acceptedResendId;
  }

  const eventMetadata = withIntentMetadata(metadata, effectiveIdempotencyKey);
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

  const { data, error } = effectiveIdempotencyKey
    ? await resend.emails.send(payload, { idempotencyKey: effectiveIdempotencyKey })
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

  const existingResendId = await findAcceptedIntent(key);
  if (existingResendId) {
    return { sent: false, resendId: existingResendId };
  }

  const resendId = await sendEmail({ ...options, idempotencyKey: key });
  return { sent: true, resendId };
}