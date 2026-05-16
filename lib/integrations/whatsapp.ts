export interface WhatsAppOutbound {
  to: string;
  body?: string;
  clientId?: string;
  // Media — supply either mediaUrl (link) or mediaId (already uploaded to Meta)
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
  mediaFilename?: string; // for documents
  caption?: string;
}

export interface WhatsAppInbound {
  from: string;
  body: string;
  messageId: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface LogConversationParams {
  clientId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  body: string;
  whatsappMessageId?: string;
  aiResponded?: boolean;
  needsReview?: boolean;
  caseId?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export type WaSendResult = { success: true; messageId: string } | { success: false; error: string; detail?: unknown };

export async function sendWhatsAppMessage(message: WhatsAppOutbound): Promise<WaSendResult> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp no configurado: faltan META_WHATSAPP_ACCESS_TOKEN o META_WHATSAPP_PHONE_NUMBER_ID' };
  }

  // Normalize: digits only, ensure country code
  let to = message.to.replace(/\D/g, '');
  // If Spanish number without country code (9 digits starting with 6/7)
  if (to.length === 9 && (to.startsWith('6') || to.startsWith('7'))) to = '34' + to;

  let payload: Record<string, unknown>;

  if (message.mediaUrl && message.mediaType) {
    const mediaObj: Record<string, string> = { link: message.mediaUrl };
    if (message.caption) mediaObj.caption = message.caption;
    if (message.mediaType === 'document' && message.mediaFilename) {
      mediaObj.filename = message.mediaFilename;
    }
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: message.mediaType,
      [message.mediaType]: mediaObj,
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: message.body ?? '' },
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] API error:', JSON.stringify(data));
      const errMsg = data?.error?.message ?? data?.error?.error_data?.details ?? 'Error de API Meta';
      return { success: false, error: errMsg, detail: data?.error };
    }

    const messageId: string = data?.messages?.[0]?.id ?? '';
    return { success: true, messageId };
  } catch (err) {
    console.error('[WhatsApp] fetch error:', err);
    return { success: false, error: 'Error de red al contactar Meta API' };
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

    if (!msg) return null;

    const type = msg.type as string;
    const base = {
      from: msg.from as string,
      messageId: msg.id as string,
      timestamp: msg.timestamp as string,
    };

    if (type === 'text') {
      return { ...base, body: (msg.text as Record<string, string>)?.body ?? '' };
    }

    // Media messages (image, document, audio, video)
    if (['image', 'document', 'audio', 'video'].includes(type)) {
      const mediaObj = msg[type] as Record<string, string> | undefined;
      return {
        ...base,
        body: mediaObj?.caption ?? `[${type}]`,
        mediaType: type,
        mediaUrl: mediaObj?.id ?? '',  // This is actually a media ID; resolve URL separately if needed
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function mapWhatsAppMessageToClient(
  from: string,
  profiles: { id: string; phone: string | null }[]
): string | null {
  const normalized = from.replace(/\D/g, '');
  // Match by last 9 digits (Spain) or full number
  const match = profiles.find((p) => {
    if (!p.phone) return false;
    const pn = p.phone.replace(/\D/g, '');
    return pn === normalized || pn.slice(-9) === normalized.slice(-9);
  });
  return match?.id ?? null;
}

export async function logWhatsAppConversation(params: LogConversationParams): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import('./supabase');
    await getSupabaseAdmin().from('whatsapp_conversations').insert({
      client_id:          params.clientId ?? null,
      phone_number:       params.phoneNumber,
      direction:          params.direction,
      body:               params.body,
      whatsapp_message_id: params.whatsappMessageId ?? null,
      ai_responded:       params.aiResponded ?? false,
      needs_review:       params.needsReview ?? false,
      case_id:            params.caseId ?? null,
      media_url:          params.mediaUrl ?? null,
      media_type:         params.mediaType ?? null,
    });
  } catch (err) {
    console.error('[WhatsApp] logWhatsAppConversation error:', err);
  }
}
