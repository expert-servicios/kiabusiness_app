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

export interface WaInteractiveButton {
  id: string;
  title: string; // max 20 chars
}

export interface WaInteractiveListRow {
  id: string;
  title: string;        // max 24 chars
  description?: string; // max 72 chars
}

export interface WaInteractiveListSection {
  title: string;
  rows: WaInteractiveListRow[];
}

export interface WaInteractiveOutbound {
  to: string;
  body: string;
  footer?: string;
  buttons?: WaInteractiveButton[];
  list?: { buttonText: string; sections: WaInteractiveListSection[] };
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

export async function sendWhatsAppInteractive(params: WaInteractiveOutbound): Promise<WaSendResult> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp no configurado' };
  }

  let to = params.to.replace(/\D/g, '');
  if (to.length === 9 && (to.startsWith('6') || to.startsWith('7'))) to = '34' + to;

  let interactive: Record<string, unknown>;

  if (params.buttons?.length) {
    interactive = {
      type: 'button',
      body: { text: params.body },
      ...(params.footer ? { footer: { text: params.footer } } : {}),
      action: {
        buttons: params.buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) },
        })),
      },
    };
  } else if (params.list) {
    interactive = {
      type: 'list',
      body: { text: params.body },
      ...(params.footer ? { footer: { text: params.footer } } : {}),
      action: {
        button: params.list.buttonText.slice(0, 20),
        sections: params.list.sections.map((s) => ({
          title: s.title.slice(0, 24),
          rows: s.rows.map((r) => ({
            id: r.id,
            title: r.title.slice(0, 24),
            ...(r.description ? { description: r.description.slice(0, 72) } : {}),
          })),
        })),
      },
    };
  } else {
    return { success: false, error: 'Se requieren buttons o list' };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[WhatsApp interactive] API error:', JSON.stringify(data));
      return { success: false, error: data?.error?.message ?? 'Error de API Meta', detail: data?.error };
    }
    return { success: true, messageId: data?.messages?.[0]?.id ?? '' };
  } catch (err) {
    console.error('[WhatsApp interactive] fetch error:', err);
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

    // Interactive replies (button_reply or list_reply from user clicking a button)
    if (type === 'interactive') {
      const interactive = msg.interactive as Record<string, unknown>;
      const interactiveType = interactive?.type as string;
      if (interactiveType === 'button_reply') {
        const reply = interactive.button_reply as { id: string; title: string };
        return { ...base, body: reply?.title ?? '' };
      }
      if (interactiveType === 'list_reply') {
        const reply = interactive.list_reply as { id: string; title: string; description?: string };
        return { ...base, body: reply?.title ?? '' };
      }
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
  profiles: { id: string; phone: string | null; whatsapp_number?: string | null }[]
): string | null {
  const normalized = from.replace(/\D/g, '');
  // Match by last 9 digits (Spain) or full number
  const match = profiles.find((p) => {
    const numbers = [p.phone, p.whatsapp_number].filter(Boolean) as string[];
    return numbers.some((number) => {
      const pn = number.replace(/\D/g, '');
      return pn === normalized || pn.slice(-9) === normalized.slice(-9);
    });
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
