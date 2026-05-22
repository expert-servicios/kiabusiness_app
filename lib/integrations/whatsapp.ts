// Strip BOM (﻿) and surrounding whitespace — Vercel CLI on Windows can
// inject a byte-order-mark when piping env vars via PowerShell 5.1.
function getWaToken(): string | undefined {
  return process.env.META_WHATSAPP_ACCESS_TOKEN?.replace(/^﻿/, '').trim() || undefined;
}

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

export type WaHeader =
  | { type: 'text'; text: string }
  | { type: 'image'; imageUrl: string };

export interface WaInteractiveOutbound {
  to: string;
  body: string;
  footer?: string;
  header?: WaHeader;
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
  metaMediaId?: string;
}

export type WaSendResult = { success: true; messageId: string } | { success: false; error: string; detail?: unknown };

export async function sendWhatsAppMessage(message: WhatsAppOutbound): Promise<WaSendResult> {
  const token = getWaToken();
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
  const token = getWaToken();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp no configurado' };
  }

  let to = params.to.replace(/\D/g, '');
  if (to.length === 9 && (to.startsWith('6') || to.startsWith('7'))) to = '34' + to;

  let interactive: Record<string, unknown>;

  function buildHeaderPayload(h?: WaHeader, forList = false): Record<string, unknown> | undefined {
    if (!h) return undefined;
    if (h.type === 'text') return { type: 'text', text: h.text.slice(0, 60) };
    if (!forList && h.type === 'image') return { type: 'image', image: { link: h.imageUrl } };
    return undefined;
  }

  if (params.buttons?.length) {
    const header = buildHeaderPayload(params.header);
    interactive = {
      type: 'button',
      ...(header ? { header } : {}),
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
    const header = buildHeaderPayload(params.header, true);
    interactive = {
      type: 'list',
      ...(header ? { header } : {}),
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

export async function sendWhatsAppImageMessage(params: {
  to: string;
  imageUrl: string;
  caption?: string;
}): Promise<WaSendResult> {
  const token = getWaToken();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { success: false, error: 'WhatsApp no configurado' };

  let to = params.to.replace(/\D/g, '');
  if (to.length === 9 && (to.startsWith('6') || to.startsWith('7'))) to = '34' + to;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
          link: params.imageUrl,
          ...(params.caption ? { caption: params.caption.slice(0, 1024) } : {}),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[WhatsApp image] API error:', JSON.stringify(data));
      return { success: false, error: data?.error?.message ?? 'Error API Meta' };
    }
    return { success: true, messageId: data?.messages?.[0]?.id ?? '' };
  } catch (err) {
    console.error('[WhatsApp image] fetch error:', err);
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

/** Download a WhatsApp media object from Meta and store it in Supabase Storage.
 *  Returns the public URL, or null if anything fails (non-fatal). */
export async function downloadAndStoreWhatsAppMedia(
  mediaId: string,
  mediaType: string,
  filename: string,
  phone: string,
  clientId: string | undefined,
): Promise<string | null> {
  const token = getWaToken();
  if (!token) return null;
  try {
    // 1. Resolve download URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) return null;
    const metaData = await metaRes.json() as { url?: string; mime_type?: string };
    const downloadUrl = metaData.url;
    if (!downloadUrl) return null;

    // 2. Download the file
    const fileRes = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!fileRes.ok) return null;
    const buffer = await fileRes.arrayBuffer();

    // 3. Determine extension
    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'application/pdf': 'pdf', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3',
      'video/mp4': 'mp4',
    };
    const mimeType = metaData.mime_type ?? (
      mediaType === 'image' ? 'image/jpeg' :
      mediaType === 'audio' ? 'audio/ogg' :
      mediaType === 'video' ? 'video/mp4' : 'application/pdf'
    );
    const ext = MIME_TO_EXT[mimeType] ?? filename.split('.').pop() ?? 'bin';
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    const folder = clientId ? `clients/${clientId}` : `unknown/${phone.replace(/\D/g, '')}`;
    const path = `${folder}/${Date.now()}-${safeName}.${ext}`;

    // 4. Upload to Supabase Storage
    const { getSupabaseAdmin } = await import('./supabase');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('whatsapp-attachments')
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (error || !data) { console.error('[WA media upload]', error); return null; }
    const { data: { publicUrl } } = supabase.storage.from('whatsapp-attachments').getPublicUrl(data.path);
    return publicUrl;
  } catch (err) {
    console.error('[WA media download]', err);
    return null;
  }
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
      meta_media_id:      params.metaMediaId ?? null,
    });
  } catch (err) {
    console.error('[WhatsApp] logWhatsAppConversation error:', err);
  }
}
