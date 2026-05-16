export interface WhatsAppOutbound {
  to: string;
  body: string;
  clientId?: string;
}

export interface WhatsAppInbound {
  from: string;
  body: string;
  messageId: string;
  timestamp: string;
}

export interface LogConversationParams {
  clientId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  body: string;
  whatsappMessageId?: string;
}

export async function sendWhatsAppMessage(
  message: WhatsAppOutbound
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error('[WhatsApp] Missing META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID');
    return { success: false, error: 'WhatsApp not configured' };
  }

  // Normalize phone: digits only, add country code if missing
  const to = message.to.replace(/\D/g, '');

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: message.body },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] API error:', data);
      return { success: false, error: data?.error?.message ?? 'API error' };
    }

    const messageId: string = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    console.error('[WhatsApp] fetch error:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function handleWhatsAppWebhook(payload: unknown): Promise<WhatsAppInbound | null> {
  try {
    const p = payload as Record<string, unknown>;
    const entry = (p?.entry as unknown[])?.[0] as Record<string, unknown>;
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = change?.value as Record<string, unknown>;
    const messages = value?.messages as Record<string, unknown>[] | undefined;
    const msg = messages?.[0];

    if (!msg || msg.type !== 'text') return null;

    return {
      from: msg.from as string,
      body: (msg.text as Record<string, string>)?.body ?? '',
      messageId: msg.id as string,
      timestamp: msg.timestamp as string,
    };
  } catch {
    return null;
  }
}

export function mapWhatsAppMessageToClient(
  from: string,
  profiles: { id: string; phone: string | null }[]
): string | null {
  const normalized = from.replace(/\D/g, '');
  const match = profiles.find((p) => p.phone && p.phone.replace(/\D/g, '') === normalized);
  return match?.id ?? null;
}

export async function logWhatsAppConversation(params: LogConversationParams): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import('./supabase');
    await getSupabaseAdmin().from('whatsapp_conversations').insert({
      client_id: params.clientId ?? null,
      phone_number: params.phoneNumber,
      direction: params.direction,
      body: params.body,
      whatsapp_message_id: params.whatsappMessageId ?? null
    });
  } catch (err) {
    console.error('[WhatsApp] logWhatsAppConversation error:', err);
  }
}
