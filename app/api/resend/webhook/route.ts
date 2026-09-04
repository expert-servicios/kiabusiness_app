import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const STATUS_MAP: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'failed'
};

type ResendWebhookPayload = {
  type: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
  };
};

function getRecipients(payload: ResendWebhookPayload): string[] {
  const value = payload.data?.to;
  if (!value) return [];
  const recipients = Array.isArray(value) ? value : [value];
  return recipients.map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const headers = {
    'webhook-id': req.headers.get('webhook-id') ?? '',
    'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': req.headers.get('webhook-signature') ?? ''
  };

  try {
    const wh = new Webhook(secret);
    wh.verify(rawBody, headers);
  } catch (error) {
    console.error('Resend webhook verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const newStatus = STATUS_MAP[payload.type];
  const resendId = payload.data?.email_id;
  const recipients = getRecipients(payload);

  if (newStatus && resendId) {
    const supabase = getSupabaseAdmin();
    const updatePayload = { status: newStatus, updated_at: new Date().toISOString() };

    if (recipients.length) {
      for (const recipient of recipients) {
        const { error } = await supabase
          .from('email_events')
          .update(updatePayload)
          .eq('resend_id', resendId)
          .ilike('recipient_email', recipient);
        if (error) {
          console.error('[resend/webhook] recipient status update failed:', resendId, recipient, error.message);
          return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
        }
      }
    } else {
      // Backwards-compatible fallback for old/partial payloads that do not
      // include the recipient. New Resend webhook events include data.to.
      const { error } = await supabase
        .from('email_events')
        .update(updatePayload)
        .eq('resend_id', resendId);
      if (error) {
        console.error('[resend/webhook] status update failed:', resendId, error.message);
        return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}