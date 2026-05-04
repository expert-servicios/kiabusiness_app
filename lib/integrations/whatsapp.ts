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

/**
 * Send a WhatsApp message via Meta Cloud API.
 * TODO: replace stub with real Meta Graph API call using WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.
 */
export async function sendWhatsAppMessage(
  message: WhatsAppOutbound
): Promise<{ success: boolean; messageId?: string }> {
  console.log('[WhatsApp stub] sendWhatsAppMessage', message);
  return { success: true };
}

/**
 * Parse an inbound Meta Cloud webhook payload into a normalized message.
 * TODO: extract entry[0].changes[0].value.messages[0] per Meta Webhooks spec.
 */
export async function handleWhatsAppWebhook(payload: unknown): Promise<WhatsAppInbound | null> {
  console.log('[WhatsApp stub] handleWhatsAppWebhook', payload);
  return null;
}

/**
 * Match a WhatsApp `from` number to a client profile id.
 * Normalizes both sides to digits only before comparing.
 */
export function mapWhatsAppMessageToClient(
  from: string,
  profiles: { id: string; phone: string | null }[]
): string | null {
  const normalized = from.replace(/\D/g, '');
  const match = profiles.find((p) => p.phone && p.phone.replace(/\D/g, '') === normalized);
  return match?.id ?? null;
}

/**
 * Persist a WhatsApp conversation record in whatsapp_conversations.
 */
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
