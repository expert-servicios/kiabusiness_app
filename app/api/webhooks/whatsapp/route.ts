import { NextRequest, NextResponse } from 'next/server';
import { logWhatsAppConversation, mapWhatsAppMessageToClient } from '@/lib/integrations/whatsapp';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

// Meta webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ received: true });
    }

    const admin = getSupabaseAdmin();
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, phone')
      .not('phone', 'is', null);

    for (const msg of messages) {
      if (msg.type !== 'text') continue;

      const from: string = msg.from;
      const body: string = msg.text?.body ?? '';
      const messageId: string = msg.id;

      const clientId = mapWhatsAppMessageToClient(from, profiles ?? []) ?? undefined;

      await logWhatsAppConversation({
        clientId,
        phoneNumber: from,
        direction: 'inbound',
        body,
        whatsappMessageId: messageId,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp webhook] error:', error);
    return NextResponse.json({ received: true });
  }
}
