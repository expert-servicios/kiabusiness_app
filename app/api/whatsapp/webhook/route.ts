import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  handleWhatsAppWebhook,
  logWhatsAppConversation,
  mapWhatsAppMessageToClient
} from '@/lib/integrations/whatsapp';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

// GET: Meta webhook verification challenge
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Incoming WhatsApp messages from Meta Cloud
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const appSecret = process.env.META_WHATSAPP_APP_SECRET;
    const signature = request.headers.get('x-hub-signature-256') ?? '';

    if (!appSecret) {
      console.error('META_WHATSAPP_APP_SECRET not configured');
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const sigBuffer = Buffer.from(signature.padEnd(expected.length));
    const expBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const message = await handleWhatsAppWebhook(payload);

    if (message) {
      // Try to resolve the sender to a known client
      const adminSupabase = getSupabaseAdmin();
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id,phone')
        .not('phone', 'is', null);

      const clientId = mapWhatsAppMessageToClient(message.from, profiles ?? []) ?? undefined;

      await logWhatsAppConversation({
        clientId,
        phoneNumber: message.from,
        direction: 'inbound',
        body: message.body,
        whatsappMessageId: message.messageId
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
