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
}

export async function sendEmail({
  to,
  eventType,
  subject,
  html,
  metadata,
  attachments
}: SendEmailOptions): Promise<string> {
  const recipients = Array.isArray(to) ? to : [to];
  const supabase = getSupabaseAdmin();

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
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
  });

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
          metadata: metadata ?? null
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
        metadata: metadata ?? null
      })
    )
  ).catch(() => null); // best-effort — don't fail delivery because audit log failed

  return resendId;
}
