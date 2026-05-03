import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const STATUS_MAP: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'failed'
};

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

  let payload: { type: string; data?: { email_id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const newStatus = STATUS_MAP[payload.type];
  const resendId = payload.data?.email_id;

  if (newStatus && resendId) {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('email_events')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('resend_id', resendId);
  }

  return NextResponse.json({ received: true });
}
