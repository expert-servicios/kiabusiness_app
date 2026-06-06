import { NextRequest, NextResponse } from 'next/server';
import {
  logWhatsAppConversation,
  downloadAndStoreWhatsAppMedia,
  mapWhatsAppMessageToClient,
  sendWhatsAppMessage,
  sendWhatsAppInteractive,
} from '@/lib/integrations/whatsapp';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';
import { generateWabaAiText, type WabaAiMessage } from '@/lib/integrations/waba-ai';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import {
  buildNoRepeatInstruction,
  findSimilarRecentMessage,
  applyDeterministicVariation,
  isRepeatedKiaMessage,
} from '@/lib/ai/kia/kia-response-variation';
import { normalizeKiaQuickReplies, quickRepliesToButtons } from '@/lib/ai/kia/kia-quick-replies';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { sendEmail } from '@/lib/email/send';
import { documentRequired } from '@/lib/email/templates';
import {
  processKiaStep,
  detectLanguage,
  type KiaSession,
  type KiaLang,
  type KiaReply,
  type KiaSideEffects,
  SERVICES,
} from '@/lib/integrations/kia-engine';

// Numbers used internally for testing — keep conversational memory, skip business side effects.
const TEST_PHONE_NUMBERS = new Set(['34669045528']);
import { resolveKiaContactContext, type KiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { SERVICES_CATALOG } from '@/lib/data/services-catalog';
import { getService } from '@/lib/services/service-registry';
import { getServiceCheckoutByPriceId } from '@/lib/integrations/service-checkout';
import { parseKiaFeedbackButtonId, storeKiaFeedback } from '@/lib/ai/kia/kia-feedback-store';

import { verifyMetaSignature } from '@/lib/security/webhook-signature';

// ── Meta webhook verification ─────────────────────────────────────────────────

const META_SIGNATURE_HEADER = 'x-hub-signature-256';

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<Record<string, unknown>>;
      };
    }>;
  }>;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ── Message helpers ───────────────────────────────────────────────────────────

function extractMessageText(msg: Record<string, unknown>): string | null {
  const type = msg.type as string;
  if (type === 'text') {
    return (msg.text as { body?: string })?.body?.trim() || null;
  }
  if (type === 'interactive') {
    const interactive = msg.interactive as Record<string, unknown>;
    const iType = interactive?.type as string;
    if (iType === 'button_reply') return (interactive.button_reply as { title?: string })?.title?.trim() || null;
    if (iType === 'list_reply')   return (interactive.list_reply   as { title?: string })?.title?.trim() || null;
  }
  return null;
}

function extractButtonId(msg: Record<string, unknown>): string | null {
  if (msg.type !== 'interactive') return null;
  const interactive = msg.interactive as Record<string, unknown>;
  if (interactive?.type === 'button_reply') return (interactive.button_reply as { id?: string })?.id?.trim() || null;
  if (interactive?.type === 'list_reply')   return (interactive.list_reply   as { id?: string })?.id?.trim() || null;
  return null;
}

function hasReliableLeadIdentity(session: KiaSession): boolean {
  const fullName = session.name?.trim() ?? '';
  const hasNameAndSurname = fullName.split(/\s+/).filter(Boolean).length >= 2;
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.email?.trim() ?? '');
  return hasNameAndSurname && hasValidEmail;
}

function safeLeadState(state: string | undefined): 'new' | 'contacted' | 'quoted' | 'converted' | undefined {
  return state === 'new' || state === 'contacted' || state === 'quoted' || state === 'converted'
    ? state
    : undefined;
}

function secureLoginUrl(nextPath: string): string {
  return absoluteAppUrl(`/auth/login?next=${encodeURIComponent(nextPath)}`);
}

// ── Kia session helpers ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateSession(admin: any, phone: string, clientId?: string): Promise<KiaSession> {
  const { data } = await admin
    .from('kia_sessions')
    .select('*')
    .eq('phone_number', phone)
    .maybeSingle();

  if (data) {
    if (clientId && !data.client_id) {
      await admin.from('kia_sessions').update({ client_id: clientId }).eq('phone_number', phone);
      return { ...data, client_id: clientId } as KiaSession;
    }
    return data as KiaSession;
  }

  const newSession = {
    phone_number: phone,
    client_id:   clientId ?? null,
    lang:        'es' as const,
    flow:        'welcome',
    step:        'init',
    service_id:  null,
    precal_step: 0,
    data:        {},
    name:        null,
    email:       null,
    priority:    'normal' as const,
    escalated:   false,
  };

  const { data: created } = await admin
    .from('kia_sessions')
    .insert(newSession)
    .select()
    .single();

  return (created ?? newSession) as KiaSession;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function persistSessionUpdates(admin: any, phone: string, updates: Partial<KiaSession>): Promise<void> {
  if (Object.keys(updates).length === 0) return;
  await admin
    .from('kia_sessions')
    .update({ ...updates, last_activity: new Date().toISOString() })
    .eq('phone_number', phone);
}

// ── Send a single Kia reply ───────────────────────────────────────────────────

function cleanKiaOutboundForSimilarity(body: string): string {
  const interactiveLog = body.match(/^\[[^\]]+\]\s*([\s\S]*?)\s+\|\s+[^\n]+$/);
  if (interactiveLog?.[1]) return interactiveLog[1].trim();

  return body.replace(/^\[(?:Kia(?::AI|:list)?|Kia:doc_select|Cat[aá]logo)\]\s*/i, '').trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadRecentKiaOutboundTexts(admin: any, phone: string, limit = 6): Promise<string[]> {
  const { data } = await admin
    .from('whatsapp_conversations')
    .select('body')
    .eq('phone_number', phone)
    .eq('direction', 'outbound')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? [])
    .map((row: { body: string }) => cleanKiaOutboundForSimilarity(row.body))
    .filter(Boolean);
}

function withKiaReplyBody(reply: KiaReply, body: string): KiaReply {
  if (reply.type === 'text') return { ...reply, body };
  if (reply.type === 'buttons') return { ...reply, body };
  return { ...reply, body };
}

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const URL_RE = /https?:\/\/\S+/g;
const WABA_INTERACTIVE_BODY_MAX = 1024;

function localizeButtonTitle(title: string, lang: KiaLang): string {
  const normalized = title.trim().toLowerCase();
  if (lang === 'ru') {
    const map: Record<string, string> = {
      'llamada 15 min': 'Звонок 15 мин',
      'reservar llamada': 'Звонок 15 мин',
      'tengo dudas': 'Есть вопрос',
      'escríbeme aquí': 'Написать',
      'escribeme aqui': 'Написать',
      'escribir aquí': 'Написать',
      'responder': 'Написать',
      'contratar ahora': 'Заказать',
      'contratar online': 'Заказать онлайн',
      'preparar contratación': 'Подготовить',
      'preparar contratacion': 'Подготовить',
      'preparar migración': 'Подготовить',
      'preparar migracion': 'Подготовить',
      'prueba 14 días gratis': 'Проба 14 дней',
      'prueba 14 dias gratis': 'Проба 14 дней',
      'prueba holded': 'Проба Holded',
      'solicitar presupuesto': 'Смета',
      'ver precios': 'Цены',
      'ver planes': 'Планы',
      'ver servicio': 'Об услуге',
      'otro': 'Другое',
      'no sé / otro': 'Другое',
      'otro / no sé': 'Другое',
    };
    return map[normalized] ?? title;
  }

  const map: Record<string, string> = {
    'другое': 'Otro',
    'другой': 'Otro',
    'звонок 15 мин': 'Llamada 15 min',
    'есть вопрос': 'Tengo dudas',
    'написать': 'Escribir aquí',
    'написать здесь': 'Escribir aquí',
    'подготовить': 'Preparar',
    'проба 14 дней': 'Prueba 14 días',
    'смета': 'Presupuesto',
    'цены': 'Ver precios',
    'планы': 'Ver planes',
  };
  return map[normalized] ?? title;
}

function fitInteractiveBody(body: string): string {
  if (body.length <= WABA_INTERACTIVE_BODY_MAX) return body;

  const urls = body.match(URL_RE) ?? [];
  const firstUrl = urls[0] ?? '';
  const suffix = firstUrl ? `\n\n${firstUrl}\n\n...` : '\n\n...';
  const maxPrefix = Math.max(240, WABA_INTERACTIVE_BODY_MAX - suffix.length);
  return `${body.slice(0, maxPrefix).trimEnd()}${suffix}`.slice(0, WABA_INTERACTIVE_BODY_MAX);
}

function textQuickReplyButtons(lang: KiaLang): { id: string; title: string }[] {
  return quickRepliesToButtons(normalizeKiaQuickReplies([
    { id: 'btn_write_here', title: lang === 'ru' ? 'Написать' : 'Escribir aquí', kind: 'secondary' },
    { id: 'btn_other', title: lang === 'ru' ? 'Другое' : 'Otro', kind: 'other' },
  ], lang, { ensureOther: true }));
}

function normalizeButtonReplies(buttons: { id: string; title: string }[], lang: KiaLang): { id: string; title: string }[] {
  return quickRepliesToButtons(normalizeKiaQuickReplies(
    buttons.map((button) => ({
      id: button.id,
      title: localizeButtonTitle(button.title, lang),
      kind: button.id === 'btn_other' ? 'other' as const : 'secondary' as const,
    })),
    lang,
    { ensureOther: true },
  ));
}

function normalizeListRows(
  sections: Extract<KiaReply, { type: 'list' }>['sections'],
  lang: KiaLang,
): Extract<KiaReply, { type: 'list' }>['sections'] {
  const otherTitle = lang === 'ru' ? 'Другое' : 'Otro';
  const otherDescription = lang === 'ru'
    ? 'Написать свой вариант'
    : 'Escribir otra opción';
  const normalized = sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({
      ...row,
      title: localizeButtonTitle(row.title, lang).slice(0, 24),
    })),
  }));
  const hasOther = normalized.some((section) =>
    section.rows.some((row) => row.id === 'btn_other' || ['otro', 'другое', 'другой'].includes(row.title.trim().toLowerCase())),
  );
  if (hasOther) return normalized;

  const lastSection = normalized[normalized.length - 1];
  if (!lastSection) {
    return [{
      title: lang === 'ru' ? 'ДРУГОЕ' : 'OTRA OPCION',
      rows: [{ id: 'btn_other', title: otherTitle, description: otherDescription }],
    }];
  }

  const otherRow = { id: 'btn_other', title: otherTitle, description: otherDescription };
  const rows = lastSection.rows.length >= 10
    ? [...lastSection.rows.slice(0, 9), otherRow]
    : [...lastSection.rows, otherRow];
  return [
    ...normalized.slice(0, -1),
    { ...lastSection, rows },
  ];
}

function normalizeKiaReplyControls(reply: KiaReply, lang: KiaLang): KiaReply {
  if (reply.type === 'buttons') {
    return {
      ...reply,
      body: fitInteractiveBody(reply.body),
      buttons: normalizeButtonReplies(reply.buttons, lang),
    };
  }
  if (reply.type === 'list') {
    return {
      ...reply,
      body: fitInteractiveBody(reply.body),
      sections: normalizeListRows(reply.sections, lang),
    };
  }
  return {
    type: 'buttons',
    body: fitInteractiveBody(reply.body),
    footer: 'EXPERT 💼',
    buttons: textQuickReplyButtons(lang),
  };
}

function bodyMatchesLocale(body: string, lang: KiaLang): boolean {
  const withoutUrls = body.replace(URL_RE, '').replace(/\b(EXPERT|Kia|Holded|Stripe|GoCardless|Cl@ve|AEAT)\b/gi, '');
  if (lang === 'ru') {
    const cyrillicCount = withoutUrls.match(/[А-Яа-яЁё]/g)?.length ?? 0;
    const latinCount = withoutUrls.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡]/g)?.length ?? 0;
    const spanishMarkers = /\b(hola|perfecto|gracias|puedes|quieres|cuentame|cuéntame|servicio|llamada|contratar|datos|equipo|aqui|aquí|ayudo|necesitas|expediente|trámite|tramite)\b/i;
    return cyrillicCount > 0
      && cyrillicCount / Math.max(cyrillicCount + latinCount, 1) >= 0.45
      && !spanishMarkers.test(withoutUrls);
  }
  return !CYRILLIC_RE.test(withoutUrls);
}

function detectLatestMessageLanguage(text: string, fallback: KiaLang): KiaLang {
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  if (CYRILLIC_RE.test(trimmed)) return 'ru';
  if (trimmed.length < 4) return fallback;
  return detectLanguage(trimmed);
}

function fallbackLocalizedBody(reply: KiaReply, lang: KiaLang): string {
  const urls = reply.body.match(URL_RE) ?? [];
  if (lang === 'ru') {
    if (urls.length > 0) {
      return `Поняла 😊 Для следующего шага используйте эту безопасную ссылку:\n${urls[0]}\n\nЕсли что-то не подходит, коротко напишите ваш вопрос.`;
    }
    return reply.type === 'text'
      ? 'Поняла 😊 Коротко опишите вашу ситуацию, и я подскажу следующий полезный шаг.'
      : 'Поняла 😊 Выберите подходящий вариант ниже или нажмите “Другое”.';
  }

  if (urls.length > 0) {
    return `Claro 😊 Para el siguiente paso usa este enlace seguro:\n${urls[0]}\n\nSi no encaja, cuéntame brevemente tu caso.`;
  }
  return reply.type === 'text'
    ? 'Claro 😊 Cuéntame brevemente tu caso y te hago la siguiente pregunta útil.'
    : 'Claro 😊 Elige una opción abajo o pulsa “Otro”.';
}

function applyFeminineKiaVoice(body: string, lang: KiaLang): string {
  if (lang === 'ru') {
    return body
      .replace(/\bя готов\b/gi, 'я готова')
      .replace(/\bя уверен\b/gi, 'я уверена')
      .replace(/виртуальный ассистент/gi, 'виртуальная ассистентка')
      .replace(/виртуальный ИИ-ассистент/gi, 'виртуальная ИИ-ассистентка');
  }

  return body
    .replace(/\bestoy seguro\b/gi, 'estoy segura')
    .replace(/\bencantado\b/gi, 'encantada')
    .replace(/\bpreparado para ayudarte\b/gi, 'preparada para ayudarte')
    .replace(/\bsoy el asistente\b/gi, 'soy la asistente')
    .replace(/\bcomo asesor virtual\b/gi, 'como asistente virtual');
}

function kiaIdentityIntro(lang: KiaLang, recentAssistantTexts: string[]): string {
  const variants = lang === 'ru'
    ? [
        'Здравствуйте, я Kia, виртуальная ассистентка EXPERT 😊',
        'Я Kia, виртуальная ассистентка EXPERT 😊',
        'Kia на связи, виртуальная ассистентка EXPERT 😊',
        'Здравствуйте 😊 Это Kia, виртуальная ассистентка EXPERT',
      ]
    : [
        'Hola, soy Kia, la asistente virtual de EXPERT 😊',
        'Soy Kia, tu asistente virtual de EXPERT 😊',
        'Te atiende Kia, asistente virtual de EXPERT 😊',
        'Hola 😊 Kia por aquí, asistente virtual de EXPERT',
      ];
  return variants[recentAssistantTexts.length % variants.length];
}

function enforceKiaVoice(reply: KiaReply, lang: KiaLang, recentAssistantTexts: string[]): KiaReply {
  let body = applyFeminineKiaVoice(reply.body, lang)
    .replace(/\bNuestro equipo lo revisar[aá] y te responderemos\b/gi, 'Desde EXPERT lo revisaremos y yo te avisaré por aquí')
    .replace(/\bEl equipo de EXPERT\b/gi, 'Desde EXPERT')
    .replace(/\bAsesor[ií]a EXPERT 💼\b/gi, 'Kia · EXPERT 💼');

  if (!/\bKia\b/i.test(body)) {
    body = `${kiaIdentityIntro(lang, recentAssistantTexts)}\n\n${body}`;
  }

  return withKiaReplyBody(reply, body);
}

async function enforceKiaReplyLanguage(reply: KiaReply, lang: KiaLang): Promise<KiaReply> {
  if (bodyMatchesLocale(reply.body, lang)) return reply;

  try {
    const ai = await generateWabaAiText({
      systemPrompt: [
        'Eres un traductor de mensajes WhatsApp de Kia/EXPERT.',
        lang === 'ru'
          ? 'Traduce TODO el mensaje a ruso natural con alfabeto cirilico.'
          : 'Traduce TODO el mensaje a espanol claro.',
        'Conserva URLs, nombres de marca, formato WhatsApp con *negrita* y saltos de linea.',
        'No anadas explicaciones. Devuelve solo el mensaje final.',
      ].join('\n'),
      messages: [{ role: 'user', content: reply.body }],
      maxTokens: 500,
    });
    const translated = ai?.text?.trim().replace(/\*\*(.+?)\*\*/gs, '*$1*') ?? '';
    if (translated && bodyMatchesLocale(translated, lang)) {
      console.info('[Kia language guard applied]', { type: reply.type, lang });
      return withKiaReplyBody(reply, translated);
    }
  } catch (error) {
    console.warn('[Kia language guard failed]', { type: reply.type, lang, error: String(error).slice(0, 120) });
  }

  console.warn('[Kia language guard fallback]', { type: reply.type, lang });
  return withKiaReplyBody(reply, fallbackLocalizedBody(reply, lang));
}

async function prepareKiaReplyForSending({
  admin,
  phone,
  reply,
  currentUserMessage,
  lang,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any;
  phone: string;
  reply: KiaReply;
  currentUserMessage?: string;
  lang: KiaLang;
}): Promise<KiaReply> {
  reply = await enforceKiaReplyLanguage(normalizeKiaReplyControls(reply, lang), lang);
  const recentAssistantTexts = await loadRecentKiaOutboundTexts(admin, phone, 6);
  reply = enforceKiaVoice(reply, lang, recentAssistantTexts);
  reply = await enforceKiaReplyLanguage(reply, lang);
  if (recentAssistantTexts.length === 0) return reply;

  const before = isRepeatedKiaMessage({
    candidate: reply.body,
    recentAssistantTexts,
  });
  if (!before.repeated) return reply;

  const variedBody = applyDeterministicVariation(reply.body, recentAssistantTexts);
  const after = isRepeatedKiaMessage({
    candidate: variedBody,
    recentAssistantTexts,
  });

  const logContext = {
    phoneLast4: phone.slice(-4),
    type: reply.type,
    lang,
    similarity: before.match?.similarity,
    varied: variedBody !== reply.body,
    stillRepeated: after.repeated,
    hasCurrentUserMessage: Boolean(currentUserMessage?.trim()),
  };

  if (variedBody !== reply.body) {
    console.info('[Kia variation applied]', logContext);
  }
  if (after.repeated || variedBody === reply.body) {
    console.warn('[Kia repetition_risk_detected]', logContext);
  }

  return enforceKiaReplyLanguage(withKiaReplyBody(reply, variedBody), lang);
}

async function sendKiaReply(
  originalReply: KiaReply,
  phone        : string,
  clientId     : string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin        : any,
  options: {
    aiResponded?: boolean;
    currentUserMessage?: string;
    lang?: KiaLang;
    logPrefix?: string;
    needsReview?: boolean;
  } = {},
): Promise<void> {
  const aiResponded = options.aiResponded ?? false;
  const logPrefix = options.logPrefix ?? 'Kia';
  const needsReview = options.needsReview ?? false;
  const reply = await prepareKiaReplyForSending({
    admin,
    phone,
    reply: originalReply,
    currentUserMessage: options.currentUserMessage,
    lang: options.lang ?? 'es',
  });

  if (reply.type === 'text') {
    const sent = await sendWhatsAppMessage({ to: phone, body: reply.body });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: reply.body, whatsappMessageId: sent.messageId,
        aiResponded, needsReview,
      });
    } else {
      console.error('[Kia send reply failed]', { phone, type: reply.type, error: sent.error, detail: sent.detail });
      await admin.from('whatsapp_conversations')
        .update({ needs_review: true })
        .eq('phone_number', phone)
        .eq('direction', 'inbound')
        .is('read_at', null);
    }
  } else if (reply.type === 'buttons') {
    const sent = await sendWhatsAppInteractive({
      to: phone, body: reply.body, footer: reply.footer,
      buttons: reply.buttons,
    });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: `[${logPrefix}] ${reply.body} | ${reply.buttons.map((b) => b.title).join(' / ')}`,
        whatsappMessageId: sent.messageId, aiResponded, needsReview,
      });
    } else {
      console.error('[Kia send reply failed]', { phone, type: reply.type, error: sent.error, detail: sent.detail });
      await admin.from('whatsapp_conversations')
        .update({ needs_review: true })
        .eq('phone_number', phone)
        .eq('direction', 'inbound')
        .is('read_at', null);
    }
  } else if (reply.type === 'list') {
    const sent = await sendWhatsAppInteractive({
      to: phone, body: reply.body, footer: reply.footer,
      list: { buttonText: reply.buttonText, sections: reply.sections },
    });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: `[${logPrefix}:list] ${reply.body}`,
        whatsappMessageId: sent.messageId, aiResponded, needsReview,
      });
    } else {
      console.error('[Kia send reply failed]', { phone, type: reply.type, error: sent.error, detail: sent.detail });
      await admin.from('whatsapp_conversations')
        .update({ needs_review: true })
        .eq('phone_number', phone)
        .eq('direction', 'inbound')
        .is('read_at', null);
    }
  }
}

// ── Handle Kia side effects ───────────────────────────────────────────────────

async function handleKiaSideEffects({
  sideEffects, session, phone, clientId, contactCtx, admin,
}: {
  sideEffects : KiaSideEffects;
  session     : KiaSession;
  phone       : string;
  clientId    : string | undefined;
  contactCtx ?: KiaContactContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin       : any;
}): Promise<void> {
  const { escalate, createCase, saveLead, sendDocsEmail, sendPaymentLink, priority = 'normal', leadState } = sideEffects;
  const contactStatus = contactCtx?.status ?? (clientId ? 'client' : 'lead');

  if (escalate) {
    await admin
      .from('whatsapp_conversations')
      .update({ needs_review: true })
      .eq('phone_number', phone)
      .eq('direction', 'inbound')
      .is('read_at', null);

    notifyAdmins({
      title: `🚨 Kia: derivación de ${session.name ?? phone}`,
      body:  `Prioridad: ${priority}`,
      url:   '/admin/whatsapp',
      tag:   `wa-escalate-${phone}`,
    }).catch(() => {});
  }

  const svc = session.service_id ? SERVICES[session.service_id] : null;

  if (createCase && clientId && svc) {
    await admin.from('cases').insert({
      client_id:      clientId,
      category:       svc.category,
      service:        svc.label.es,
      state:          'docs_pendientes',
      docs_checklist: svc.docs,
    }).catch((e: unknown) => console.error('[Kia createCase]', e));
  }

  if (contactStatus === 'lead' && !clientId && (saveLead || createCase) && hasReliableLeadIdentity(session)) {
    const state = safeLeadState(leadState);
    await admin.from('leads').upsert(
      {
        phone,
        name        : session.name,
        email       : session.email,
        client_type : 'particular',
        category    : svc?.category ?? 'general',
        service     : svc?.label.es ?? 'Consulta WhatsApp',
        source      : 'whatsapp',
        notes       : svc ? `Interesado/a en: ${svc.label.es}` : 'Consulta por WhatsApp',
        updated_at  : new Date().toISOString(),
        ...(state ? { state } : {}),
      },
      { onConflict: 'phone' },
    ).catch((e: unknown) => console.error('[Kia saveLead]', e));
  }

  if (sendDocsEmail && session.email && svc && svc.docs.length > 0) {
    try {
      const tpl = documentRequired(session.name ?? 'cliente', svc.label.es, svc.docs);
      await sendEmail({
        to:        session.email,
        eventType: 'case.docs_required',
        ...tpl,
        metadata:  { service: svc.label.es, source: 'whatsapp' },
      });
    } catch (e) {
      console.error('[Kia sendDocsEmail]', e);
    }
  }

  if (sendPaymentLink && svc?.id) {
    try {
      // Send /contratar link — user must log in before payment (login obligatorio).
      // Direct Stripe session creation from WABA bypasses the auth gate.
      const checkoutSlug = svc.stripePriceId ? getServiceCheckoutByPriceId(svc.stripePriceId)?.slug : null;
      if (!checkoutSlug) {
        console.warn('[Kia sendPaymentLink] checkout slug not found', { serviceId: svc.id, stripePriceId: svc.stripePriceId });
        await admin.from('whatsapp_conversations')
          .update({ needs_review: true })
          .eq('phone_number', phone)
          .eq('direction', 'inbound')
          .is('read_at', null);
        return;
      }
      const url = absoluteAppUrl(`/contratar?service=${checkoutSlug}&source=whatsapp`);
      const body = session.lang === 'ru'
        ? `🔐 *Para contratar ${svc.label.ru}:*\n\n${url}\n\nAccede con tu cuenta o registrate, confirma tus datos y paga de forma segura. Tu expediente se abrirá automáticamente. EXPERT 💼`
        : `🔐 *Para contratar el servicio ${svc.label.es}:*\n\n${url}\n\nAccede con tu cuenta o registrate, confirma tus datos y paga de forma segura. Tu expediente se abrirá automáticamente. EXPERT 💼`;
      await sendKiaReply({ type: 'text', body }, phone, clientId, admin, {
        currentUserMessage: 'send_payment_link',
        lang: session.lang,
      });
    } catch (e) {
      console.error('[Kia sendPaymentLink]', e);
      await admin.from('whatsapp_conversations')
        .update({ needs_review: true })
        .eq('phone_number', phone)
        .eq('direction', 'inbound')
        .is('read_at', null);
    }
  }
}

// ── Kia AI fallback ───────────────────────────────────────────────────────────

interface KiaAiContext {
  clientId?           : string;
  phone               : string;
  msgBody             : string;
  session             : KiaSession;
  conversationHistory : { direction: string; body: string; ai_responded?: boolean | null }[];
  contactCtx         ?: KiaContactContext;
}

function featureFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function isStructuredKiaAiEnabled(): boolean {
  return featureFlag('KIA_STRUCTURED_AI_ENABLED', true)
    && featureFlag('KIA_STRUCTURED_AI_WABA_ENABLED', true)
    && featureFlag('KIA_AI_PROVIDER_ROUTER_ENABLED', true);
}

function recentAssistantTextsFromWabaHistory(history: KiaAiContext['conversationHistory']): string[] {
  return history
    .filter((item) => item.direction === 'outbound')
    .map((item) => item.body.replace(/^\[Kia(?::AI|:list)?\]\s*/i, '').trim())
    .filter(Boolean)
    .slice(-6);
}

function isKiaAuthoredWabaHistoryMessage(message: { direction: string; body: string; ai_responded?: boolean | null }): boolean {
  if (message.direction !== 'outbound') return false;
  if (message.ai_responded === true) return true;
  return /^\[(Kia|Kia:AI|Kia:list|Kia:doc_select|Cat[aá]logo)/i.test(message.body.trim());
}

function wabaHistorySpeakerLabel(message: { direction: string; body: string; ai_responded?: boolean | null }): string {
  if (message.direction === 'inbound') return 'Cliente';
  return isKiaAuthoredWabaHistoryMessage(message) ? 'Kia' : 'Admin humano';
}

function formatWabaHistoryForPrompt(history: KiaAiContext['conversationHistory'], limit = 10): string {
  return history
    .slice(-limit)
    .map((message) => {
      const text = message.direction === 'outbound'
        ? cleanKiaOutboundForSimilarity(message.body)
        : message.body;
      return `${wabaHistorySpeakerLabel(message)}: ${text}`;
    })
    .join('\n');
}

function humanAdminStyleExamples(history: KiaAiContext['conversationHistory']): string {
  return history
    .filter((message) => message.direction === 'outbound' && !isKiaAuthoredWabaHistoryMessage(message))
    .slice(-6)
    .map((message, index) => `${index + 1}. ${cleanKiaOutboundForSimilarity(message.body).slice(0, 500)}`)
    .join('\n');
}

function isHoldedContext(params: {
  msgBody: string;
  session: KiaSession;
  conversationHistory: KiaAiContext['conversationHistory'];
}): boolean {
  const text = [
    params.msgBody,
    params.session.service_id ?? '',
    params.session.data?.area ?? '',
    params.session.data?.selected_service ?? '',
    ...params.conversationHistory.slice(-4).map((message) => message.body),
  ].join(' ').toLowerCase();

  return /\bholded\b|pack starter|migraci[oó]n|inventario|api key|erp/.test(text);
}

function isPriceQuestion(text: string): boolean {
  return /\b(precio|precios|cu[aá]nto cuesta|coste|tarifa|pagar|presupuesto|importe)\b/i.test(text)
    || /(цена|стоим|сколько стоит|тариф|оплат|бюджет)/i.test(text);
}

function buildHoldedPriceInteractive(lang: KiaLang): { body: string; buttons: { id: string; title: string }[] } {
  const body = lang === 'ru'
    ? [
      'Я Kia, виртуальная ассистентка EXPERT 😊',
      '',
      'По Holded у нас есть такие опубликованные цены:',
      '*Pack Starter* — 499 EUR + IVA',
      '*Миграция без склада* — 899 EUR + IVA',
      '*Миграция со складом* — 1.199 EUR + IVA',
      '',
      'Для Holded я использую подготовку/readiness, не юридическую проверку viability. Что посмотрим дальше?',
    ].join('\n')
    : [
      'Soy Kia, asistente virtual de EXPERT 😊',
      '',
      'Para Holded tenemos estos precios publicados:',
      '*Pack Starter* — 499 € + IVA',
      '*Migración sin inventario* — 899 € + IVA',
      '*Migración con inventario* — 1.199 € + IVA',
      '',
      'Para Holded preparo el caso con readiness, no con viabilidad jurídica. ¿Qué quieres revisar ahora?',
    ].join('\n');

  return {
    body,
    buttons: quickRepliesToButtons(normalizeKiaQuickReplies([
      { id: 'btn_holded_prepare', title: lang === 'ru' ? 'Подготовить' : 'Preparar', kind: 'readiness' },
      { id: 'btn_monthly_plans', title: lang === 'ru' ? 'Планы' : 'Ver planes', kind: 'secondary' },
      { id: 'btn_other', title: lang === 'ru' ? 'Другое' : 'Otro', kind: 'other' },
    ], lang, { ensureOther: true })),
  };
}

function hasHoldedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return /\bholded\b/.test(lower) || lower.includes('\u0445\u043e\u043b\u0434\u0435\u0434');
}

function hasHoldedSessionHint(session: KiaSession): boolean {
  return [
    session.service_id ?? '',
    session.data?.area ?? '',
    session.data?.selected_service ?? '',
  ].some((value) => /holded/i.test(value));
}

function isHoldedLaborQuestion(text: string): boolean {
  if (!hasHoldedWord(text)) return false;
  const lower = text.toLowerCase();
  const spanish = /(laboral|emplead|trabajador|fich|control horario|registro horario|jornada|entrada|salida|ausencia|rrhh|recursos humanos)/i.test(lower);
  const russian = [
    '\u043b\u0430\u0431\u043e\u0440\u0430\u043b',
    '\u0441\u043e\u0442\u0440\u0443\u0434\u043d',
    '\u0440\u0430\u0431\u043e\u0442\u043d',
    '\u043e\u0442\u043c\u0435\u0447',
    '\u043f\u0440\u0438\u0445\u043e\u0434',
    '\u0443\u0445\u043e\u0434',
    '\u0440\u0430\u0431\u043e\u0447',
    '\u0443\u0447\u0435\u0442 \u0432\u0440\u0435\u043c',
    '\u0443\u0447\u0451\u0442 \u0432\u0440\u0435\u043c',
    '\u0442\u0430\u0431\u0435\u043b',
    '\u043a\u0430\u0434\u0440',
  ].some((term) => lower.includes(term));
  return spanish || russian;
}

function isHoldedGeneralInfoQuestion(text: string): boolean {
  if (!hasHoldedWord(text)) return false;
  return /(\?|¿|que es|como funciona|para que sirve|funciones|funcionalidades|modulos|incluye|informacion|info|explica)/i.test(text)
    || /[\u0400-\u04FF]/.test(text);
}

function buildHoldedLaborInteractive(lang: KiaLang): { body: string; buttons: { id: string; title: string }[] } {
  const controlUrl = 'https://www.holded.com/es/gestion-de-recursos-humanos/control-horario';
  const faqUrl = 'https://help.holded.com/es/articles/12700544-preguntas-frecuentes-sobre-el-uso-de-mi-zona-para-empleados';
  const expertUrl = 'https://expertconsulting.es/holded';
  const body = lang === 'ru'
    ? [
      '\u042f Kia, \u0432\u0438\u0440\u0442\u0443\u0430\u043b\u044c\u043d\u0430\u044f \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442\u043a\u0430 EXPERT 😊',
      '',
      '\u0414\u0430, \u0443 Holded \u0435\u0441\u0442\u044c \u0431\u043b\u043e\u043a HR/\u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0438 \u0438 *control horario*: \u0444\u0438\u043a\u0441\u0430\u0446\u0438\u044f \u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u0432\u0445\u043e\u0434\u0430/\u0432\u044b\u0445\u043e\u0434\u0430, \u043f\u0430\u0443\u0437, \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0439 \u0438 \u043e\u0442\u0447\u0435\u0442\u043e\u0432.',
      '',
      'Holded \u043f\u0443\u0431\u043b\u0438\u043a\u0443\u0435\u0442, \u0447\u0442\u043e \u044d\u0442\u043e\u0442 \u0443\u0447\u0435\u0442 \u043f\u0440\u0435\u0434\u0443\u0441\u043c\u043e\u0442\u0440\u0435\u043d \u0434\u043b\u044f \u0430\u0443\u0434\u0438\u0442\u0430 \u0438 \u0441\u043e\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u044f \u0443\u0447\u0435\u0442\u0430 \u0440\u0430\u0431\u043e\u0447\u0435\u0433\u043e \u0432\u0440\u0435\u043c\u0435\u043d\u0438. \u041d\u043e \u044e\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043f\u0440\u0438\u0433\u043e\u0434\u043d\u043e\u0441\u0442\u044c \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043e\u0442 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043a, \u043f\u043e\u043b\u0438\u0442\u0438\u043a \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u0438 \u0442\u043e\u0433\u043e, \u043a\u0430\u043a \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0438 \u0444\u0438\u043a\u0441\u0438\u0440\u0443\u044e\u0442 \u0432\u0440\u0435\u043c\u044f.',
      '',
      `Info Holded: ${controlUrl}`,
      `FAQ empleados: ${faqUrl}`,
      `EXPERT + Holded: ${expertUrl}`,
    ].join('\n')
    : [
      'Soy Kia, asistente virtual de EXPERT 😊',
      '',
      'Si: Holded tiene bloque de equipo/HR y *control horario* para registrar entrada, salida, pausas, ausencias e informes.',
      '',
      'Holded publica que esos registros estan pensados para auditorias y cumplimiento del registro horario. Aun asi, el cumplimiento final depende de la configuracion, politica interna, privacidad y de no obligar al empleado a usar medios personales si no procede.',
      '',
      `Info Holded: ${controlUrl}`,
      `FAQ empleados: ${faqUrl}`,
      `EXPERT + Holded: ${expertUrl}`,
    ].join('\n');

  return {
    body,
    buttons: quickRepliesToButtons(normalizeKiaQuickReplies([
      { id: 'btn_holded_prepare', title: lang === 'ru' ? '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430' : 'Configurar', kind: 'readiness' },
      { id: 'btn_book_call', title: lang === 'ru' ? '\u0417\u0432\u043e\u043d\u043e\u043a' : 'Llamada 15 min', kind: 'call' },
      { id: 'btn_other', title: lang === 'ru' ? '\u0414\u0440\u0443\u0433\u043e\u0435' : 'Otro', kind: 'other' },
    ], lang, { ensureOther: true })),
  };
}

function buildHoldedGeneralInteractive(lang: KiaLang): { body: string; buttons: { id: string; title: string }[] } {
  const featuresUrl = 'https://www.holded.com/es/funcionalidades';
  const expertUrl = 'https://expertconsulting.es/holded';
  const body = lang === 'ru'
    ? [
      '\u042f Kia, \u0432\u0438\u0440\u0442\u0443\u0430\u043b\u044c\u043d\u0430\u044f \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442\u043a\u0430 EXPERT 😊',
      '',
      'Holded - \u044d\u0442\u043e ERP/\u0431\u0438\u0437\u043d\u0435\u0441-\u043f\u0430\u043d\u0435\u043b\u044c \u0434\u043b\u044f \u0441\u0447\u0435\u0442\u043e\u0432, \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u0432, \u0431\u0430\u043d\u043a\u043e\u0432, \u0441\u043a\u043b\u0430\u0434\u0430, \u043f\u0440\u043e\u0435\u043a\u0442\u043e\u0432, \u043e\u0442\u0447\u0435\u0442\u043e\u0432 \u0438 \u0447\u0430\u0441\u0442\u0438 HR.',
      '',
      '\u041a\u0430\u043a Partner Oficial, EXPERT \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0441 Pack Starter, \u043c\u0438\u0433\u0440\u0430\u0446\u0438\u0435\u0439, \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435\u043c \u0438 \u0435\u0436\u0435\u043c\u0435\u0441\u044f\u0447\u043d\u044b\u043c\u0438 \u043f\u043b\u0430\u043d\u0430\u043c\u0438.',
      `Holded: ${featuresUrl}`,
      `EXPERT + Holded: ${expertUrl}`,
    ].join('\n')
    : [
      'Soy Kia, asistente virtual de EXPERT 😊',
      '',
      'Holded es un ERP/panel de gestion para facturacion, gastos, bancos, inventario, proyectos, reporting y parte de equipo/HR.',
      '',
      'Como Partner Oficial, EXPERT puede ayudarte con Pack Starter, migracion, formacion y planes mensuales con Holded conectado.',
      `Holded: ${featuresUrl}`,
      `EXPERT + Holded: ${expertUrl}`,
    ].join('\n');

  return {
    body,
    buttons: quickRepliesToButtons(normalizeKiaQuickReplies([
      { id: 'btn_holded_prepare', title: lang === 'ru' ? '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430' : 'Configurar', kind: 'readiness' },
      { id: 'btn_holded_trial', title: lang === 'ru' ? '\u041f\u0440\u043e\u0431\u0430 14 \u0434\u043d\u0435\u0439' : 'Prueba 14 dias', kind: 'holded' },
      { id: 'btn_other', title: lang === 'ru' ? '\u0414\u0440\u0443\u0433\u043e\u0435' : 'Otro', kind: 'other' },
    ], lang, { ensureOther: true })),
  };
}

function buildDirectHoldedInteractive(
  msgBody: string,
  lang: KiaLang,
  session: KiaSession,
): { body: string; buttons: { id: string; title: string }[] } | null {
  if (isHoldedLaborQuestion(msgBody)) return buildHoldedLaborInteractive(lang);
  if (isPriceQuestion(msgBody) && (hasHoldedWord(msgBody) || hasHoldedSessionHint(session))) {
    return buildHoldedPriceInteractive(lang);
  }
  if (isHoldedGeneralInfoQuestion(msgBody)) return buildHoldedGeneralInteractive(lang);
  return null;
}

async function generateKiaAiResponse({
  clientId, phone, msgBody, session, conversationHistory, contactCtx,
}: KiaAiContext): Promise<{ reply: string | null; interactive?: { body: string; buttons: { id: string; title: string }[] } }> {
  // Always detect lang from the current message — session.lang may be stale mid-conversation.
  const lang = detectLatestMessageLanguage(msgBody, session.lang);
  const languageInstruction = lang === 'ru'
    ? 'ruso. Responde ÚNICAMENTE en ruso con alfabeto cirílico. NUNCA uses español ni otro idioma en la misma respuesta.'
    : 'español. Responde ÚNICAMENTE en español. NUNCA uses ruso ni otro idioma en la misma respuesta.';

  if (isPriceQuestion(msgBody) && isHoldedContext({ msgBody, session, conversationHistory })) {
    return { reply: null, interactive: buildHoldedPriceInteractive(lang) };
  }

  const officialSourceContext = await buildOfficialSourceContext(
    [formatWabaHistoryForPrompt(conversationHistory, 3), `Cliente: ${msgBody}`].filter(Boolean).join('\n'),
  );
  const recentAssistantTexts = recentAssistantTextsFromWabaHistory(conversationHistory);
  const antiRepeatInstruction = buildNoRepeatInstruction(recentAssistantTexts);
  const labeledHistory = formatWabaHistoryForPrompt(conversationHistory, 10);
  const humanStyle = humanAdminStyleExamples(conversationHistory);

  let clientContext = '';
  if (contactCtx) {
    const caseList = contactCtx.openCases.map((c) =>
      `- ${c.service} (${c.category ?? 'sin categoría'}): estado "${c.state}", abierto el ${new Date(c.opened_at).toLocaleDateString('es-ES')}`
    ).join('\n');
    const obList = contactCtx.pendingFiscalObligations.map((o) =>
      `- M${o.modelo} ${o.description}: vence ${new Date(o.deadline).toLocaleDateString('es-ES')} (${o.status})`
    ).join('\n');
    clientContext = [
      `Contact status: ${contactCtx.status}`,
      `Teléfono: ${contactCtx.phone}`,
      `ClientId: ${contactCtx.clientId ?? 'no'}`,
      `LeadId: ${contactCtx.leadId ?? 'no'}`,
      `Nombre: ${contactCtx.name ?? session.name ?? 'desconocido'}`,
      `Email: ${contactCtx.email ?? session.email ?? 'no disponible'}`,
      `Rol: ${contactCtx.role ?? 'sin rol'}`,
      `Perfil completado: ${contactCtx.profileCompleted ? 'sí' : 'no'}`,
      `Facturación lista: ${contactCtx.billingReady ? 'sí' : 'no'}`,
      `Dirección habitual lista: ${contactCtx.habitualAddressReady ? 'sí' : 'no'}`,
      `Último estado lead: ${contactCtx.lastLeadStatus ?? 'no aplica'}`,
      `Último servicio seleccionado: ${contactCtx.lastSelectedService ?? session.service_id ?? 'no aplica'}`,
      `Expedientes activos:\n${caseList || 'Ninguno'}`,
      `Obligaciones fiscales pendientes:\n${obList || 'Ninguna'}`,
    ].join('\n');
  } else if (clientId) {
    clientContext = `Cliente registrado (${clientId}). No se pudo cargar contexto ampliado.`;
  } else if (session.name || session.email) {
    clientContext = `Contacto por WhatsApp: ${session.name ?? 'cliente'}${session.email ? ` · email: ${session.email}` : ''}\nSin cuenta en el portal.`;
  } else {
    clientContext = 'Número desconocido — no hay cliente registrado con este teléfono.';
  }

  const kiaDisposition = session.data?.kia_contact_disposition;
  if (kiaDisposition === 'low_intent') {
    clientContext += [
      '',
      'Memoria Kia: este contacto fue marcado internamente como bajo interes/diversion.',
      `Motivo: ${session.data?.kia_low_intent_reason ?? 'no especificado'}.`,
      `Veces detectado: ${session.data?.kia_low_intent_count ?? '1'}.`,
      'Actua con tono amable y breve. Si ahora trae una consulta real de EXPERT, ayudale con normalidad; si sigue en entretenimiento, cierra sin venta.',
    ].join('\n');
  } else if (kiaDisposition === 'reactivated_after_low_intent') {
    clientContext += [
      '',
      'Memoria Kia: este contacto tuvo uso de bajo interes/diversion antes, pero ahora parece haber vuelto con una consulta util.',
      'Ayuda con normalidad, manteniendo respuestas concretas y evitando insistir en captacion innecesaria.',
    ].join('\n');
  }

  if (isStructuredKiaAiEnabled()) {
    try {
      const structured = await runKiaDecision({
        taskType: 'waba_reply',
        channel: 'waba',
        message: [
          msgBody,
          officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.',
          'HISTORIAL RECIENTE:',
          labeledHistory || 'Sin historial previo.',
          humanStyle ? `RESPUESTAS HUMANAS/ADMIN PREVIAS PARA APRENDER TONO Y CONTINUIDAD, SIN COPIAR LITERALMENTE:\n${humanStyle}` : '',
          'CONTEXTO DEL CONTACTO:',
          clientContext,
          antiRepeatInstruction,
          'Reglas: responde como Kia, asistente virtual de EXPERT, en femenino; no pedir API keys ni email por WhatsApp; usar login/panel seguro para datos sensibles; mantener respuesta breve.',
        ].join('\n\n'),
        contextInput: {
          channel: 'waba',
          phone: contactCtx?.phone ?? phone,
          clientId: contactCtx?.clientId ?? clientId,
          leadId: contactCtx?.leadId ?? undefined,
          serviceSlug: session.service_id ?? undefined,
          latestMessage: msgBody,
        },
        locale: lang,
        allowTools: false,
      });

      const reply = structured.userMessage.replace(/\*\*(.+?)\*\*/gs, '*$1*').trim();
      if (reply && structured.decision.nextAction !== 'needs_review' && !structured.decision.requiresManualReview) {
        const qr = normalizeKiaQuickReplies(structured.decision.quickReplies, lang, { ensureOther: true });
        if (qr.length >= 2) {
          return { reply: null, interactive: { body: reply, buttons: quickRepliesToButtons(qr) } };
        }
        return { reply };
      }
    } catch (err) {
      console.error('[Kia structured AI fallback]', err);
    }
  }

  const systemPrompt = `Eres *Kia*, la asistente virtual IA de EXPERT Asesoría, gestoría española y Partner Oficial de Holded.
*Eres una inteligencia artificial (IA), NO un ser humano.* Si alguien pregunta si eres humano o una persona real, responde siempre con honestidad: "Soy Kia, una IA de EXPERT. No soy una persona, soy un sistema automatizado al servicio de EXPERT Asesoría."
Hablas sobre ti misma en femenino: "encantada", "estoy segura", "preparada para ayudarte". No firmes como "equipo EXPERT" ni finjas ser humana.
Nuestra web: https://expertconsulting.es

ÁREAS Y SERVICIOS (único alcance permitido):
• 💰 Fiscal: IRPF, Autónomo/IVA trimestral, No Residente (IRNR), Modelo 151/Beckham, Modelo 720
• 🌍 Extranjería: Residencia/TIE, Arraigo, Reagrupación familiar, Nacionalidad española
• 🏢 Empresa / Autónomo: Alta de autónomo, Constitución SL, Gestión mensual
• ⚡ Holded ERP (Partner Oficial): Pack Starter/onboarding, Formación por horas, Migración completa
• 🔐 Certificado Digital: Persona física, Empresa
• 🚗 Tráfico / Capitanía: Vehículos, Embarcaciones
• 🏠 Notaría / Propiedades: Compraventa, Herencia/Sucesión

PÁGINAS CLAVE (comparte el enlace completo cuando sea relevante):
• Servicios → https://expertconsulting.es/servicios
• Planes y precios → https://expertconsulting.es/planes
• Presupuesto → https://expertconsulting.es/solicitar-presupuesto
• Cita gratuita → https://expertconsulting.es/cita
• Holded → https://expertconsulting.es/holded

═══════════════════════════════════════
ALCANCE ESTRICTO — OBLIGATORIO:
═══════════════════════════════════════
1. IDENTIDAD IA: Nunca finjas ser humano. Nunca uses frases como "en mi experiencia personal", "yo personalmente pienso", "como persona". Si preguntan si eres IA o humano, sé siempre honesta.
2. ASESORAMIENTO PERMITIDO: Puedes orientar como asesora profesional en fiscal, laboral, mercantil, juridico, extranjeria, empresa, autonomos y gestion documental. Da pasos, guias, tramites, checklist y enlaces oficiales cuando existan, incluso si la persona no es cliente ni pide contratar.
3. REVISION PROFESIONAL: Puedes revisar el contenido que el usuario aporte de documentos empresariales, fiscales, laborales o juridicos y señalar riesgos, pasos y dudas a confirmar. Si falta el documento o no puedes verlo, dilo y pide que pegue el texto o suba una captura legible. Para requerimientos, sanciones, denegaciones, recursos, inspecciones, embargos, multas o actas, ofrece orientacion inicial y recomienda cita/revision profesional.
4. DATOS MÍNIMOS: No pidas email por WhatsApp al inicio ni para orientar. Usa solo el nombre de trato si ya existe. Cuando haya interes real en presupuesto, cita, contratacion, expediente o seguimiento formal, envia al portal/login seguro para recoger datos fiables. Nunca solicites claves de acceso, numeros completos de cuenta, certificados o informacion sensible innecesaria por WhatsApp.

═══════════════════════════════════════
FORMATO DE RESPUESTA — ELIGE UNO:
═══════════════════════════════════════

OPCIÓN A — TEXTO (solo si la respuesta es una explicación concreta y no necesita elección):
Responde directamente con texto claro y conciso. Máximo 3 párrafos cortos.
Empieza de forma natural como Kia, asistente virtual de EXPERT, sin repetir siempre la misma apertura.
Termina con un siguiente paso natural solo si encaja con el contexto. Firma solo si queda natural: "Kia · EXPERT 💼"

OPCIÓN B — BOTONES INTERACTIVOS (preferida en WhatsApp):
Responde ÚNICAMENTE con este JSON exacto, sin texto antes ni después:
{"type":"btns","body":"Tu mensaje aquí","buttons":["Botón 1","Botón 2","Botón 3"]}
Reglas: mínimo 2, máximo 3 botones. Cada botón ≤ 20 caracteres, sin emojis ni puntuación especial. El último botón debe ser siempre "Otro" en español o "Другое" en ruso.

LÓGICA PRINCIPAL — PREGUNTAR PRIMERO, RESPONDER DESPUÉS:
Antes de dar información específica sobre un servicio o trámite, Kia diagnostica primero la situación concreta del cliente. Una pregunta de diagnóstico al inicio es SIEMPRE mejor que una respuesta genérica que no se ajusta a la situación real.

CUÁNDO preguntar primero (usa botones con pregunta de diagnóstico):
✓ Servicio mencionado de forma genérica: "quiero la renta", "necesito residencia", "quiero el arraigo", "necesito certificado digital".
✓ La respuesta correcta cambia según la situación del cliente y el cliente no la ha dado todavía.
✓ El cliente dice "no sé qué necesito" o pide orientación general.
✓ Consulta muy vaga sin contexto ("necesito ayuda", "¿qué servicios tenéis?").
✓ Si haces una pregunta de diagnóstico o aclaratoria.

PREGUNTAS DE DIAGNÓSTICO POR SERVICIO (la más determinante):
- IRPF / Renta genérica → "¿La declaración es para ti como persona física, como autónomo, o para una empresa?"
- Arraigo genérico → "¿Cuánto tiempo llevas en España de forma continuada?" (social 3+, familiar o laboral)
- Residencia genérica → "¿Es primera vez, una renovación de TIE, o un cambio de tipo de permiso?"
- Certificado digital genérico → "¿El certificado es para ti como persona física o para tu empresa?"
- Empresa / Autónomo genérico → "¿Ya tienes actividad en marcha o estás pensando en empezar?"

CUÁNDO responder directamente sin preguntar:
✓ El cliente ya ha dado su situación concreta en el mismo mensaje.
✓ Pregunta de precio sobre un servicio ya identificado sin ambigüedad.
✓ Ya se preguntó en este hilo y las respuestas son suficientes para actuar.
✓ El cliente tiene expediente activo y consulta sobre su propio trámite.
✓ Urgencia clara (requerimiento, sanción, embargo): orienta y recomienda llamada sin más preguntas.

CUÁNDO usar botones:
✓ Siempre que hagas una pregunta de diagnóstico o aclaratoria.
✓ Si detectas interés real pero faltan datos fiables, ofrece login/presupuesto o cita en el portal seguro.
✓ Si el usuario puede elegir entre servicio, plan, llamada, presupuesto, panel o escribir libremente.

CUÁNDO NO usar botones:
✗ Si la consulta ya tiene suficiente contexto y solo debes dar información concreta.
✗ Si la consulta requiere una explicación técnica larga sin decisión inmediata.
Aunque el historial ya tenga botones, NO repitas el mismo menú literal: ofrece una variante breve y conserva "Otro"/"Другое" como última opción.

IDIOMA: ${languageInstruction}
NEGRITA en WhatsApp: *texto* (UN asterisco, NO **texto**)
Emojis con moderación: ✅ 👋 📋 📅 💼 🚀

REGLAS:
- Responde siempre como Kia, asistente virtual de EXPERT. Usa femenino cuando hables de ti misma.
- Consulta las respuestas de "Admin humano" del historial como ejemplos de tono, cercania y continuidad. Aprende el estilo, pero no copies literalmente.
- Varía la redacción segun historial y contexto; evita repetir la misma frase si ya la has dicho.
- Antes de responder, compara tu borrador con CONVERSACIÓN RECIENTE y con mensajes anteriores de EXPERT. Si se parece demasiado, reescríbelo con otra apertura, otra estructura y otro cierre.
- No uses varias veces seguidas frases como "te oriento", "para avanzar", "puedes reservar una llamada" o "entra en el portal seguro"; adapta la frase al contexto.
- Si ya ofreciste enlace/cita/panel en el hilo, no repitas exactamente el CTA. Explica el siguiente paso o pide un dato mínimo.
- Si requiere decision profesional compleja, da primero orientacion util y despues ofrece reserva de llamada/reunion: https://expertconsulting.es/auth/login?next=%2Fcita
- Si hay urgencia legal (requerimiento, sancion, denegacion, recurso, inspeccion, embargo, multa), da pasos iniciales prudentes y recomienda llamada/reunion de 15 minutos.
- [NEEDS_REVIEW] es ultimo recurso tecnico, no flujo comercial. Usalo solo si no puedes dar ninguna respuesta segura o hay ambiguedad extrema.
- PRECIOS: puedes dar precios públicos exactos cuando estén definidos. Plan Supervisión 49 €/mes + IVA; Plan Avanzado 99 €/mes + IVA; Plan Colaborativo 199 €/mes + IVA; Pack Starter Holded 499 € + IVA; Migración Holded sin inventario 899 € + IVA; Migración Holded con inventario 1.199 € + IVA. Si el alcance es personalizado, alto volumen o no está definido, envía a https://expertconsulting.es/auth/login?next=%2Fsolicitar-presupuesto
- HOLDED Y PLANES: nunca digas "comprobar viabilidad" para Holded, migraciones o planes mensuales. Usa preparación/readiness, conexión Holded, prueba Holded o Pack Starter.
- Nunca inventes plazos ni documentos
- Maximo 2 intercambios de clarificacion antes de cerrar con accion concreta. En cada turno de clarificacion haz UNA SOLA pregunta. Ofrece botones con la ultima opcion siendo "Otro". Si el usuario pulsa "Otro" o escribe "otro"/"другое", invitale a describir libremente sin crear expediente.
- Si hay fuentes oficiales disponibles, cita 1-2 enlaces oficiales útiles
- No digas que has comprobado información oficial si no aparece en FUENTES OFICIALES DISPONIBLES
- Si la conversacion es solo entretenimiento, pruebas, flirteo, insultos o bromas sin relacion con EXPERT, responde una vez con tono amable, marca limite sutil y cierra sin empujar venta.
- No crees friccion pidiendo correo o apellidos por WhatsApp; para formalizar usa https://expertconsulting.es/auth/login
- WhatsApp puede orientar; para tramitar, contratar, compartir datos sensibles o hacer seguimiento de expediente, lleva al cliente a cita, presupuesto o panel seguro

CIERRE CONTEXTUAL:
• Si pide informacion general → resume pasos y enlaza 1-2 fuentes oficiales si existen.
• Si necesita presupuesto → https://expertconsulting.es/auth/login?next=%2Fsolicitar-presupuesto
• Si necesita cita o asesoría → https://expertconsulting.es/auth/login?next=%2Fcita
• Si es complejo/urgente → orientacion inicial + reserva llamada/reunion: https://expertconsulting.es/auth/login?next=%2Fcita
• Si es entretenimiento o uso negativo → cierre amable y breve, sin CTA comercial.

${officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.'}

TIPO DE CONTACTO: ${contactCtx?.status === 'client' ? 'CLIENTE' : 'LEAD'}
${contactCtx?.status === 'client' ? `
REGLAS PARA CLIENTE:
- Objetivo: soporte de expediente, documentación, estado, perfil, nuevo servicio o equipo humano.
- Usa el contexto de expedientes y obligaciones para dar respuestas concretas.
- NO pidas datos que ya existen (nombre, email, teléfono).
- Si pregunta por estado, ofrece revisar expediente.
- Si envía documentos, asocia a expediente.
- Si pide nuevo servicio, abre flujo de contratación manteniendo tratamiento de cliente.
- No uses CTA genérica de captación si tiene expediente activo.
- Perfil completado: ${contactCtx.profileCompleted ? 'Sí' : 'No — recomendar completar en portal'}.
- Facturación configurada: ${contactCtx.billingReady ? 'Sí' : 'No'}.
` : `
REGLAS PARA LEAD:
- Objetivo: orientar de forma util, comprobar viabilidad cuando proceda y llevar a login/registro, presupuesto o llamada solo cuando haya interes real.
- NO hablar de expedientes salvo que el lead haya indicado un trámite concreto.
- NO afirmar que es cliente ni asumir que tiene cuenta.
- NO pedir documentación completa antes de contratar.
- NO pedir email por WhatsApp; si hace falta identificarlo formalmente, envia al portal seguro.
- No fuerces una accion comercial si solo necesita informacion general o si el uso es claramente de diversion/bajo interes.
`}

CONTEXTO DEL CONTACTO:
${clientContext}

CONVERSACION RECIENTE ETIQUETADA:
${labeledHistory || 'Sin historial previo.'}

${humanStyle ? `RESPUESTAS HUMANAS/ADMIN PREVIAS COMO REFERENCIA DE TONO, SIN COPIAR LITERALMENTE:\n${humanStyle}\n` : ''}

${antiRepeatInstruction}`;

  const messages: WabaAiMessage[] = conversationHistory.map((h) => ({
    role:    h.direction === 'inbound' ? 'user' : 'assistant',
    content: `${wabaHistorySpeakerLabel(h)}: ${h.direction === 'outbound' ? cleanKiaOutboundForSimilarity(h.body) : h.body}`,
  }));
  messages.push({ role: 'user', content: msgBody });

  try {
    const ai   = await generateWabaAiText({ systemPrompt, messages, maxTokens: 500 });
    const text = ai?.text.trim() ?? '';

    if (!text || text.includes('[NEEDS_REVIEW]')) return { reply: null };

    let normalizedText = text.replace(/\*\*(.+?)\*\*/gs, '*$1*');

    if (normalizedText.startsWith('{')) {
      try {
        const parsed = JSON.parse(normalizedText) as { type?: string; body?: string; buttons?: unknown[] };
        if (
          parsed.type === 'btns' &&
          typeof parsed.body === 'string' &&
          Array.isArray(parsed.buttons) &&
          parsed.buttons.length >= 2
        ) {
          const buttons = normalizeKiaQuickReplies((parsed.buttons as unknown[])
            .filter((b): b is string => typeof b === 'string')
            .slice(0, 3)
            .map((b, i) => ({ id: `kia_ai_${i}`, title: b.slice(0, 20), kind: 'secondary' as const })), lang, { ensureOther: true });
          if (buttons.length >= 2) return { reply: null, interactive: { body: parsed.body, buttons: quickRepliesToButtons(buttons) } };
        }
      } catch { /* not valid JSON — fall through */ }
    }

    const repeated = findSimilarRecentMessage(normalizedText, recentAssistantTexts);
    if (repeated) {
      const retry = await generateWabaAiText({
        systemPrompt,
        messages: [
          ...messages,
          {
            role: 'user',
            content: [
              'La respuesta anterior se parece demasiado a una respuesta reciente de Kia/EXPERT.',
              'Reescribe la respuesta con el mismo objetivo operativo, pero sin repetir apertura, cierre, CTA ni estructura.',
              'Respuesta reciente que debes evitar:',
              repeated.text.slice(0, 1200),
            ].join('\n'),
          },
        ],
        maxTokens: 450,
      });
      const retryText = retry?.text.trim().replace(/\*\*(.+?)\*\*/gs, '*$1*') ?? '';
      if (retryText && !findSimilarRecentMessage(retryText, recentAssistantTexts)) {
        normalizedText = retryText;
      }
    }

    return { reply: normalizedText };
  } catch (err) {
    console.error('[Kia AI]', err);
    return { reply: null };
  }
}

// ── Incoming messages ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!verifyMetaSignature(rawBody, request.headers.get(META_SIGNATURE_HEADER))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: WhatsAppWebhookBody;
    try {
      body = JSON.parse(rawBody) as WhatsAppWebhookBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return NextResponse.json({ received: true });

    const admin = getSupabaseAdmin();
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, phone, whatsapp_number, full_name')
      .or('phone.not.is.null,whatsapp_number.not.is.null');

    for (const msg of messages) {
      const msgType = msg.type as string;
      const isMedia = ['image', 'document', 'audio', 'video'].includes(msgType);
      if (!['text', 'interactive'].includes(msgType) && !isMedia) continue;

      const from       = String(msg.from ?? '');
      const messageId  = String(msg.id ?? '');
      if (!from || !messageId) continue;

      // Resolve contact context (lead vs client) — single query, cached per message
      const contactCtx: KiaContactContext = await resolveKiaContactContext(admin, from);
      const mappedClientId       = mapWhatsAppMessageToClient(from, profiles ?? []) ?? undefined;
      const clientId             = contactCtx.clientId ?? mappedClientId;
      const senderName           = contactCtx.name ?? profiles?.find((p) => p.id === clientId)?.full_name ?? from;

      // F6: Feedback detection — handle 👍/👎 button presses before main flow
      const feedbackButtonId = extractButtonId(msg as Record<string, unknown>);
      if (feedbackButtonId) {
        const feedback = parseKiaFeedbackButtonId(feedbackButtonId);
        if (feedback) {
          await storeKiaFeedback({
            rating: feedback.rating,
            decisionLogId: feedback.decisionLogId,
            phone: from,
            clientId: clientId ?? null,
            leadId: contactCtx.leadId ?? null,
            channel: 'waba',
          }).catch(() => {});
          // Send a simple acknowledgement and skip normal processing
          const ack = feedback.rating === 'positive' ? '¡Gracias! Tu valoración me ayuda a mejorar. 😊' : 'Gracias por el feedback. Intentaré hacerlo mejor. 🙏';
          await sendWhatsAppMessage({ to: from, body: ack });
          continue;
        }
      }

      // ── Media: download, store, log, notify, and ACK ─────────────────
      if (isMedia) {
        const mediaObj      = msg[msgType] as { id?: string; caption?: string; filename?: string } | undefined;
        const mediaId       = mediaObj?.id ?? '';
        const caption       = mediaObj?.caption ?? '';
        const rawFilename   = (mediaObj as { filename?: string })?.filename
          ?? `archivo.${msgType === 'image' ? 'jpg' : msgType === 'audio' ? 'ogg' : msgType === 'video' ? 'mp4' : 'pdf'}`;

        const storedUrl = mediaId
          ? await downloadAndStoreWhatsAppMedia(mediaId, msgType, rawFilename, from, clientId)
          : null;

        await logWhatsAppConversation({
          clientId, phoneNumber: from, direction: 'inbound',
          body: caption || `[${msgType}]`, whatsappMessageId: messageId,
          mediaUrl: storedUrl ?? undefined, mediaType: msgType,
          metaMediaId: mediaId || undefined,
        });

        const mediaIcon  = msgType === 'image' ? '📷' : msgType === 'audio' ? '🎤' : msgType === 'video' ? '🎥' : '📄';
        const mediaLabel = msgType === 'document' ? 'documento' : msgType === 'image' ? 'imagen' : msgType === 'audio' ? 'audio' : 'archivo';
        notifyAdmins({ title: `${mediaIcon} Archivo de ${senderName}`, body: caption || `Ha enviado un ${msgType}`, url: '/admin/whatsapp', tag: `wa-${from}` }).catch(() => {});

        // ── Document classification (fire-and-forget) ─────────────────
        if (!TEST_PHONE_NUMBERS.has(from) && storedUrl && (msgType === 'document' || msgType === 'image')) {
          void import('@/lib/documents/document-router')
            .then(({ routeIncomingDocument }) =>
              routeIncomingDocument({
                fileName:  rawFilename,
                mimeType:  msgType === 'image' ? 'image/jpeg' : 'application/octet-stream',
                caption:   caption || undefined,
                source:    'whatsapp',
                clientId:  clientId ?? undefined,
                sourceUrl: storedUrl,
              })
            )
            .catch(() => {});
        }

        // ── Kia response to media ─────────────────────────────────────
        const mediaSess  = await getOrCreateSession(admin, from, clientId);
        const mediaLang  = caption ? detectLanguage(caption) : mediaSess.lang;
        const docRef     = storedUrl ?? mediaId ?? null;
        const clientDisplay = contactCtx.name ?? mediaSess.name ?? senderName;

        if (contactCtx.status === 'lead') {
          await persistSessionUpdates(admin, from, {
            flow: !contactCtx.name && !mediaSess.name ? 'identify_for_doc' : 'lead_media_followup',
            step: !contactCtx.name && !mediaSess.name ? 'awaiting_name' : 'awaiting_service',
            data: {
              ...mediaSess.data,
              pending_doc_url:      docRef ?? '',
              pending_doc_type:     msgType,
              pending_doc_caption:  caption,
              pending_doc_filename: rawFilename,
              pending_doc_message_id: messageId,
            },
          });
          const askMsg = !contactCtx.name && !mediaSess.name
            ? `👋 ¡Hola! Hemos recibido tu ${mediaLabel} y lo hemos guardado de forma segura.\n\nPara vincularlo a tu ficha y darte seguimiento, necesito identificarte. ¿Cuál es tu nombre?`
            : `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel} ✅\n\nPara orientarlo correctamente, dime a qué trámite corresponde o si prefieres reservar una llamada de 15 min antes de contratar.`;
          await sendKiaReply({ type: 'text', body: askMsg }, from, undefined, admin, {
            currentUserMessage: caption || `[${msgType}]`,
            lang: mediaLang,
          });
          continue;
        }

        // Client number — use resolved open expedientes.
        const openCases: Array<{ id: string; service: string }> = contactCtx.openCases
          .slice(0, 3)
          .map((c) => ({ id: c.id, service: c.service }));

        let ackBody: string;

        if (openCases.length === 0) {
          ackBody = `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel} ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
        } else if (openCases.length === 1) {
          ackBody = `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel} y lo hemos vinculado al expediente de *${openCases[0].service}* ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
          // Actually link the media message to the case in the DB
          await admin.from('whatsapp_conversations')
            .update({ case_id: openCases[0].id })
            .eq('whatsapp_message_id', messageId)
            .eq('phone_number', from);
        } else {
          // Multiple open cases — ask which one, save pending doc in session
          await persistSessionUpdates(admin, from, {
            flow: 'doc_case_select',
            step: 'waiting',
            data: {
              ...mediaSess.data,
              pending_doc_url:      docRef ?? '',
              pending_doc_type:     msgType,
              pending_doc_caption:  caption,
              pending_doc_filename: rawFilename,
              pending_doc_message_id: messageId,
            },
          });
          const caseButtons = openCases.slice(0, 3).map((c) => ({ id: `doc_case_${c.id}`, title: c.service.slice(0, 20) }));
          await sendKiaReply({
            type: 'buttons',
            body: `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel}. ¿A qué expediente pertenece?`,
            footer: 'EXPERT 💼',
            buttons: caseButtons,
          }, from, clientId, admin, {
            currentUserMessage: caption || `[${msgType}]`,
            lang: mediaLang,
            logPrefix: 'Kia:doc_select',
          });
          continue;
        }

        await sendKiaReply({ type: 'text', body: ackBody }, from, clientId, admin, {
          currentUserMessage: caption || `[${msgType}]`,
          lang: mediaLang,
        });
        notifyAdmins({
          title: `📎 Doc recibido — ${clientDisplay}`,
          body:  `${mediaLabel}${caption ? ': ' + caption : ''}${openCases.length === 1 ? ' → ' + openCases[0].service : ''}`,
          url: '/admin/whatsapp', tag: `wa-doc-${from}`,
        }).catch(() => {});
        continue;
      }

      const msgBody = extractMessageText(msg as Record<string, unknown>);
      if (!msgBody) continue;

      // Log inbound
      await logWhatsAppConversation({
        clientId, phoneNumber: from, direction: 'inbound',
        body: msgBody, whatsappMessageId: messageId,
      });

      // Notify admins
      notifyAdmins({
        title: `WhatsApp de ${senderName}`,
        body:  msgBody.length > 100 ? msgBody.slice(0, 97) + '…' : msgBody,
        url:   '/admin/whatsapp',
        tag:   `wa-${from}`,
      }).catch(() => {});

      const buttonId = extractButtonId(msg as Record<string, unknown>);
      const inboundLang = detectLatestMessageLanguage(msgBody, 'es');

      // ── Catalog: category selection → send services list ──────────────────
      if (buttonId?.startsWith('menu_cat_')) {
        const categoryId = buttonId.slice('menu_cat_'.length);
        const section = SERVICES_CATALOG.find((s) => s.id === categoryId);
        if (section) {
          const isRu = inboundLang === 'ru';
          const rows = section.services.slice(0, 10).map((s) => ({
            id:          `svc_cat_${s.id}`,
            title:       s.title.slice(0, 24),
            description: s.description.slice(0, 72),
          }));
          const replyBody = isRu
            ? `Услуги раздела *${section.title}*. Выберите нужную:`
            : `Servicios de *${section.emoji} ${section.title}*. Elige el que necesitas:`;
          await sendKiaReply({
            type: 'list',
            body: replyBody,
            footer: 'expertconsulting.es/cita',
            buttonText: isRu ? 'Услуги' : 'Ver servicios',
            sections: [{ title: section.title.slice(0, 24), rows }],
          }, from, clientId, admin, {
            currentUserMessage: msgBody,
            lang: inboundLang,
            logPrefix: 'Catálogo:cat',
          });
          await persistSessionUpdates(admin, from, {});
          continue;
        }
      }

      // ── Catalog: service selection → page link + booking CTA ─────────────
      if (buttonId?.startsWith('svc_cat_')) {
        const serviceId = buttonId.slice('svc_cat_'.length);
        let foundSection: (typeof SERVICES_CATALOG)[number] | null = null;
        let foundService: (typeof SERVICES_CATALOG)[number]['services'][number] | null = null;
        for (const section of SERVICES_CATALOG) {
          const svc = section.services.find((s) => s.id === serviceId);
          if (svc) { foundSection = section; foundService = svc; break; }
        }
        if (foundSection && foundService) {
          const isRu       = inboundLang === 'ru';
          const pageUrl    = `https://expertconsulting.es/servicios/${foundSection.id}/${foundService.id}`;
          const registrySvc = getService(foundService.id);
          const hasCheckout = registrySvc?.hasCheckout ?? false;

          const body = isRu
            ? `*${foundService.title}*\n\n${foundService.description}\n\n🌐 *Más información:*\n${pageUrl}`
            : `*${foundService.title}*\n\n${foundService.description}\n\n🌐 *Más información:*\n${pageUrl}`;

          // Up to 3 buttons: Contratar (if available) + Llamada + Dudas
          const buttons: { id: string; title: string }[] = [];
          if (hasCheckout) {
            buttons.push({ id: `btn_contratar_${foundService.id}`, title: isRu ? 'Contratar online' : 'Contratar online' });
          }
          buttons.push({ id: 'btn_book_call',  title: 'Llamada 15 min' });
          if (buttons.length < 3) {
            buttons.push({ id: 'btn_write_here', title: 'Tengo dudas' });
          }

          await sendKiaReply({ type: 'buttons', body, footer: 'EXPERT 💼', buttons }, from, clientId, admin, {
            currentUserMessage: msgBody,
            lang: inboundLang,
            logPrefix: 'Catálogo:svc',
          });
          await persistSessionUpdates(admin, from, {});
          continue;
        }
      }

      // ── Catalog: "Contratar online" button → send /contratar link ─────────
      if (buttonId?.startsWith('btn_contratar_')) {
        const serviceId   = buttonId.slice('btn_contratar_'.length);
        const registrySvc = getService(serviceId);
        if (registrySvc?.hasCheckout) {
          const isRu = inboundLang === 'ru';
          const url  = absoluteAppUrl(`/contratar?service=${serviceId}&source=whatsapp`);
          const body = isRu
            ? `🔐 *Contratación online — ${registrySvc.name}:*\n\n${url}\n\nAccede con tu cuenta o registrate, confirma tus datos y paga de forma segura. Tu expediente se abre automáticamente. EXPERT 💼`
            : `🔐 *Contratación online — ${registrySvc.name}:*\n\n${url}\n\nAccede con tu cuenta o registrate, confirma tus datos y paga de forma segura. Tu expediente se abre automáticamente. EXPERT 💼`;
          await sendKiaReply({ type: 'text', body }, from, clientId, admin, {
            currentUserMessage: msgBody,
            lang: inboundLang,
            logPrefix: 'Catálogo:contratar',
          });
          await persistSessionUpdates(admin, from, {});
          continue;
        }
      }

      // ── Doc case selection (user chose which expediente) ─────────────────
      if (buttonId?.startsWith('doc_case_')) {
        const docSess   = await getOrCreateSession(admin, from, clientId);
        const caseId    = buttonId.slice('doc_case_'.length);
        const docType   = docSess.data?.pending_doc_type ?? 'document';
        const docCaption = docSess.data?.pending_doc_caption ?? '';
        const mediaIcon  = docType === 'image' ? '📷' : docType === 'audio' ? '🎤' : docType === 'video' ? '🎥' : '📄';
        const mediaLabel = docType === 'document' ? 'documento' : docType === 'image' ? 'imagen' : docType === 'audio' ? 'audio' : 'archivo';
        const { data: selectedCase } = await admin
          .from('cases')
          .select('service')
          .eq('id', caseId)
          .eq('client_id', clientId ?? '')
          .maybeSingle();
        if (!selectedCase) {
          const bad = 'No he podido validar ese expediente para este número. Lo dejo para revisión del equipo.';
          await sendKiaReply({ type: 'text', body: bad }, from, clientId, admin, {
            currentUserMessage: msgBody,
            lang: inboundLang,
            needsReview: true,
          });
          continue;
        }
        const serviceName = selectedCase?.service ?? 'tu expediente';
        const pendingDocMessageId = docSess.data?.pending_doc_message_id;

        await persistSessionUpdates(admin, from, {
          flow: 'welcome',
          step: 'init',
          data: { ...docSess.data, pending_doc_url: '', pending_doc_type: '', pending_doc_caption: '', pending_doc_filename: '', pending_doc_message_id: '' },
        });

        const ack = `${mediaIcon} Perfecto. Tu ${mediaLabel} ha sido vinculado al expediente de *${serviceName}* ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
        await sendKiaReply({ type: 'text', body: ack }, from, clientId, admin, {
          currentUserMessage: msgBody,
          lang: inboundLang,
        });
        if (pendingDocMessageId) {
          await admin.from('whatsapp_conversations')
            .update({ case_id: caseId })
            .eq('whatsapp_message_id', pendingDocMessageId)
            .eq('phone_number', from);
        }
        notifyAdmins({
          title: `📎 Doc vinculado — ${docSess.name ?? from}`,
          body:  `${mediaLabel}${docCaption ? ': ' + docCaption : ''} → ${serviceName}`,
          url: '/admin/whatsapp', tag: `wa-doc-${from}`,
        }).catch(() => {});
        continue;
      }

      // ── Kia session ────────────────────────────────────────────────────────
      const isTestNumber = TEST_PHONE_NUMBERS.has(from);
      const session = await getOrCreateSession(admin, from, clientId);
      const clientName = clientId
        ? (contactCtx.name ?? profiles?.find((p) => p.id === clientId)?.full_name ?? null)
        : (session.name ?? null);

      // ── identify_for_doc flow — keep lightweight memory; formal follow-up goes through login ──
      if (session.flow === 'identify_for_doc') {
        if (session.step === 'awaiting_name') {
          const nameInput = msgBody.trim();
          await persistSessionUpdates(admin, from, { name: nameInput, flow: 'lead_media_followup', step: 'awaiting_service' });
          const loginUrl = secureLoginUrl('/solicitar-presupuesto');
          const askService = `Gracias, *${nameInput}*. Ya tengo tu nombre para esta conversacion.\n\nPara vincular el documento a una ficha o expediente con datos correctos, hazlo desde el portal seguro:\n${loginUrl}\n\nMientras tanto, dime a que tramite corresponde y te oriento por aqui sin pedirte email.`;
          await sendKiaReply({ type: 'text', body: askService }, from, clientId, admin, {
            currentUserMessage: msgBody,
            lang: inboundLang,
          });
          continue;
        }

        if (session.step === 'awaiting_email') {
          await persistSessionUpdates(admin, from, {
            flow: 'lead_media_followup',
            step: 'awaiting_service',
          });

          const docType    = session.data?.pending_doc_type ?? 'document';
          const docCaption = session.data?.pending_doc_caption ?? '';
          const mediaIcon  = docType === 'image' ? '📷' : docType === 'audio' ? '🎤' : docType === 'video' ? '🎥' : '📄';
          const mediaLabel = docType === 'document' ? 'documento' : docType === 'image' ? 'imagen' : docType === 'audio' ? 'audio' : 'archivo';
          const loginUrl = secureLoginUrl('/solicitar-presupuesto');
          const ackDoc = `${mediaIcon} *${session.name ?? from}*, muchas gracias. Hemos guardado tu ${mediaLabel} ✅\n\nPara seguimiento formal o expediente, entra desde el portal seguro:\n${loginUrl}\n\nSi quieres, dime a que tramite corresponde y te oriento por aqui. EXPERT 💼`;
          await sendKiaReply({ type: 'text', body: ackDoc }, from, clientId, admin, {
            currentUserMessage: msgBody,
            lang: inboundLang,
          });
          notifyAdmins({
            title: `📎 Doc lead sin ficha — ${session.name ?? from}`,
            body:  `${mediaLabel}${docCaption ? ': ' + docCaption : ''} | seguimiento por portal`,
            url: '/admin/whatsapp', tag: `wa-doc-${from}`,
          }).catch(() => {});
          continue;
        }
      }

      // Direct Holded knowledge guard: answer concrete Holded questions before
      // the menu state machine can fall back to a generic greeting.
      const currentMessageLang = detectLatestMessageLanguage(msgBody, session.lang);
      const directHolded = buildDirectHoldedInteractive(msgBody, currentMessageLang, session);
      if (!buttonId && directHolded) {
        await sendKiaReply({
          type: 'buttons',
          body: directHolded.body,
          footer: 'EXPERT 💼',
          buttons: directHolded.buttons,
        }, from, clientId, admin, {
          aiResponded: true,
          currentUserMessage: msgBody,
          lang: currentMessageLang,
          logPrefix: 'Kia:Holded',
        });
        await persistSessionUpdates(admin, from, {
          flow: 'consult',
          step: 'holded_info',
          lang: currentMessageLang,
          service_id: session.service_id ?? 'svc_holded_starter',
          data: { ...session.data, area: 'holded', last_holded_info: 'true' },
        });
        continue;
      }

      // Run the Kia state machine (language detection is handled inside)
      const { replies, updates, sideEffects } = processKiaStep(session, msgBody, buttonId, clientName, {
        status              : contactCtx.status,
        openCases           : contactCtx.openCases,
        profileCompleted    : contactCtx.profileCompleted,
        billingReady        : contactCtx.billingReady,
        habitualAddressReady: contactCtx.habitualAddressReady,
      });
      const updatesWithLanguage: Partial<KiaSession> = { ...updates, lang: updates.lang ?? currentMessageLang };
      const updatedSession = { ...session, ...updatesWithLanguage };

      // Send all structured replies
      for (const reply of replies) {
        await sendKiaReply(reply, from, clientId, admin, {
          currentUserMessage: msgBody,
          lang: currentMessageLang,
        });
      }

      // Handle side effects (test numbers skip lead/case creation)
      const effectiveSideEffects: KiaSideEffects = isTestNumber
        ? { ...sideEffects, saveLead: false, createCase: false, addToCart: false, generateReport: false, sendPaymentLink: false }
        : sideEffects;
      await handleKiaSideEffects({ sideEffects: effectiveSideEffects, session: updatedSession, phone: from, clientId, contactCtx, admin });

      // ── Profitability: register whatsapp_message_handled for known clients ───
      if (!isTestNumber && clientId && contactCtx.openCases.length > 0) {
        const firstCase = contactCtx.openCases[0];
        void import('@/lib/profitability/register-event')
          .then(({ registerProfitabilityEvent }) => registerProfitabilityEvent({
            caseId:    firstCase.id,
            clientId,
            serviceId: updatedSession.service_id ?? firstCase.service ?? 'unknown',
            eventType: 'whatsapp_message_handled',
            source:    'auto',
            operator:  'kia',
            metadata:  { phone: from, flow: updatedSession.flow ?? 'unknown' },
          }))
          .catch(() => {});
      }

      // ── Cart: add service to kia_cart_items ──────────────────────────────────
      if (!isTestNumber && sideEffects.addToCart && updatedSession.service_id) {
        const cartSvc = SERVICES[updatedSession.service_id];
        if (cartSvc) {
          const { error: cartErr } = await admin.from('kia_cart_items').insert({
            phone_number    : from,
            client_id       : clientId ?? null,
            service_id      : cartSvc.id,
            service_label   : cartSvc.label.es,
            service_area    : cartSvc.area,
            stripe_price_id : cartSvc.stripePriceId ?? null,
            expires_at      : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          });
          if (cartErr) console.error('[Kia addToCart]', cartErr.message);
        }
      }

      // ── Report: trigger AI report generation (fire-and-forget) ───────────────
      if (!isTestNumber && sideEffects.generateReport && updatedSession.service_id) {
        void fetch(absoluteAppUrl('/api/kia/report/generate'), {
          method : 'POST',
          headers: {
            'Content-Type'     : 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
          },
          body: JSON.stringify({
            phone_number: from,
            service_id  : updatedSession.service_id,
            lang        : updatedSession.lang,
            precal_data : updatedSession.data,
            client_id   : clientId ?? null,
            generated_by: 'kia',
          }),
        }).catch((e: unknown) => console.error('[Kia generateReport fire-and-forget]', e));
      }

      // ── CIF scraping: if prof_nif was just set and matches a company CIF ──────
      const CIF_PATTERN = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/i;
      const newNif = updatesWithLanguage.data?.prof_nif;
      const oldNif = session.data?.prof_nif;
      if (!isTestNumber && newNif && newNif !== oldNif && CIF_PATTERN.test(newNif.trim())) {
        try {
          const { resolveCompanyData } = await import('@/lib/integrations/company-data-resolver');
          const resolved = await resolveCompanyData({ taxId: newNif.trim().toUpperCase(), country: 'ES' });
          const best = resolved.bestSuggestion;
          if (best) {
            const scrapedData: Record<string, string> = {};
            if (best.name && !updatedSession.data.prof_nombre_empresa) {
              scrapedData.prof_nombre_empresa = best.name;
            }
            const fullAddress = [best.registeredAddress, best.city, best.province].filter(Boolean).join(', ');
            if (fullAddress && !updatedSession.data.prof_direccion_fiscal) {
              scrapedData.prof_direccion_fiscal = fullAddress;
            }
            if (best.incorporationDate && !updatedSession.data.prof_fecha_inicio) {
              scrapedData.prof_fecha_inicio = best.incorporationDate;
            }
            if (Object.keys(scrapedData).length > 0) {
              await persistSessionUpdates(admin, from, { data: { ...updatedSession.data, ...scrapedData } });
              const infoLines = [
                best.name            ? `🏢 *Empresa:* ${best.name}` : null,
                fullAddress          ? `📍 *Dirección:* ${fullAddress}` : null,
                best.incorporationDate ? `📅 *Constitución:* ${best.incorporationDate}` : null,
              ].filter(Boolean).join('\n');
              const infoBody = updatedSession.lang === 'ru'
                ? `✅ Данные из публичных источников для CIF *${newNif}*:\n\n${infoLines}\n\nПроверьте, всё ли верно, и сообщите если что-то изменилось.`
                : `✅ He encontrado datos públicos para el CIF *${newNif}*:\n\n${infoLines}\n\nConfirma que son correctos o dime si algo ha cambiado.`;
              await sendKiaReply({ type: 'text', body: infoBody }, from, clientId, admin, {
                currentUserMessage: msgBody,
                lang: inboundLang,
              });
            }
          }
        } catch (e) {
          console.error('[Kia CIF scraping]', e);
        }
      }

      // AI fallback when the step delegates to free-form conversation
      if (sideEffects.needsAiFallback) {
        const { data: history } = await admin
          .from('whatsapp_conversations')
          .select('direction, body, created_at, ai_responded')
          .eq('phone_number', from)
          .neq('whatsapp_message_id', messageId)
          .order('created_at', { ascending: false })
          .limit(8);

        const conversationHistory = ((history ?? []).reverse()) as { direction: string; body: string; ai_responded?: boolean | null }[];
        const aiResult = await generateKiaAiResponse({
          clientId, phone: from, msgBody,
          session: updatedSession,
          conversationHistory,
          contactCtx,
        });

        if (aiResult.interactive) {
          await sendKiaReply({
            type: 'buttons',
            body: aiResult.interactive.body,
            footer: 'EXPERT 💼',
            buttons: aiResult.interactive.buttons,
          }, from, clientId, admin, {
            aiResponded: true,
            currentUserMessage: msgBody,
            lang: currentMessageLang,
            logPrefix: 'Kia:AI',
          });
        } else if (aiResult.reply) {
          await sendKiaReply({ type: 'text', body: aiResult.reply }, from, clientId, admin, {
            aiResponded: true,
            currentUserMessage: msgBody,
            lang: currentMessageLang,
            logPrefix: 'Kia:AI',
          });
        } else {
          await admin
            .from('whatsapp_conversations')
            .update({ needs_review: true })
            .eq('phone_number', from)
            .eq('direction', 'inbound')
            .is('read_at', null);
        }
      }

      // Persist session state changes, including test numbers, so Kia can keep context and avoid loops.
      await persistSessionUpdates(admin, from, updatesWithLanguage);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp webhook]', error);
    return NextResponse.json({ received: true });
  }
}
