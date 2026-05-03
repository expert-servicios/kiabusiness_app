import { getResendClient } from '@/lib/integrations/resend';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { BRAND } from './templates';

interface SendEmailOptions {
  to: string | string[];
  eventType: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}

export async function sendEmail({
  to,
  eventType,
  subject,
  html,
  metadata
}: SendEmailOptions): Promise<string | null> {
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: BRAND.from,
      to: recipients,
      subject,
      html
    });

    const resendId = data?.id ?? null;

    if (error) {
      console.error(`[sendEmail] Resend error for ${eventType}:`, error);
    }

    // Log each recipient
    const supabase = getSupabaseAdmin();
    await Promise.all(
      recipients.map((email) =>
        supabase.from('email_events').insert({
          event_type: eventType,
          recipient_email: email,
          subject,
          resend_id: resendId,
          status: error ? 'failed' : 'sent',
          metadata: metadata ?? null
        })
      )
    );

    return resendId;
  } catch (err) {
    console.error(`[sendEmail] Unexpected error for ${eventType}:`, err);
    return null;
  }
}
