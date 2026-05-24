import { createHmac, timingSafeEqual } from 'crypto';
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
} from '@/lib/ai/kia/kia-response-variation';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { sendEmail } from '@/lib/email/send';
import { documentRequired } from '@/lib/email/templates';
import {
  processKiaStep,
  detectLanguage,
  type KiaSession,
  type KiaReply,
  type KiaSideEffects,
  SERVICES,
} from '@/lib/integrations/kia-engine';

// Numbers used internally for testing — no lead creation, no session persistence.
const TEST_PHONE_NUMBERS = new Set(['34669045528']);
import { resolveKiaContactContext, type KiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { SERVICES_CATALOG } from '@/lib/data/services-catalog';
import { getService } from '@/lib/services/service-registry';
import { getServiceCheckoutByPriceId } from '@/lib/integrations/service-checkout';

// ── Meta webhook verification ─────────────────────────────────────────────────

const META_SIGNATURE_HEADER = 'x-hub-signature-256';
const META_SIGNATURE_PREFIX = 'sha256=';

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<Record<string, unknown>>;
      };
    }>;
  }>;
};

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET?.trim();

  if (!appSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[WhatsApp webhook] META_APP_SECRET not configured');
      return false;
    }
    return true;
  }

  if (!signatureHeader?.startsWith(META_SIGNATURE_PREFIX)) {
    return false;
  }

  const receivedSignature = signatureHeader.slice(META_SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(receivedSignature)) {
    return false;
  }

  const expectedSignature = createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const received = Buffer.from(receivedSignature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

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

async function sendKiaReply(
  reply       : KiaReply,
  phone       : string,
  clientId    : string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin       : any,
  aiResponded = false,
  recentTexts : string[] = [],
): Promise<void> {
  if (reply.type === 'text') {
    const body = recentTexts.length > 0
      ? applyDeterministicVariation(reply.body, recentTexts)
      : reply.body;
    const sent = await sendWhatsAppMessage({ to: phone, body });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body, whatsappMessageId: sent.messageId,
        aiResponded, needsReview: false,
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
    const btnBody = recentTexts.length > 0
      ? applyDeterministicVariation(reply.body, recentTexts)
      : reply.body;
    const sent = await sendWhatsAppInteractive({
      to: phone, body: btnBody, footer: reply.footer,
      buttons: reply.buttons,
    });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: `[Kia] ${btnBody} | ${reply.buttons.map((b) => b.title).join(' / ')}`,
        whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
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
    const listBody = recentTexts.length > 0
      ? applyDeterministicVariation(reply.body, recentTexts)
      : reply.body;
    const sent = await sendWhatsAppInteractive({
      to: phone, body: listBody, footer: reply.footer,
      list: { buttonText: reply.buttonText, sections: reply.sections },
    });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: `[Kia:list] ${listBody}`,
        whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
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
      const sent = await sendWhatsAppMessage({ to: phone, body });
      if (sent.success) {
        await logWhatsAppConversation({
          clientId, phoneNumber: phone, direction: 'outbound',
          body: `[Kia:contratar] ${svc.label.es} → ${url}`,
          whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
        });
      } else {
        await admin.from('whatsapp_conversations')
          .update({ needs_review: true })
          .eq('phone_number', phone)
          .eq('direction', 'inbound')
          .is('read_at', null);
      }
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
  conversationHistory : { direction: string; body: string }[];
  contactCtx         ?: KiaContactContext;
}

function isStructuredKiaAiEnabled(): boolean {
  return process.env.KIA_STRUCTURED_AI_ENABLED?.toLowerCase() === 'true'
    && process.env.KIA_STRUCTURED_AI_WABA_ENABLED?.toLowerCase() === 'true'
    && process.env.KIA_AI_PROVIDER_ROUTER_ENABLED?.toLowerCase() !== 'false';
}

function recentAssistantTextsFromWabaHistory(history: KiaAiContext['conversationHistory']): string[] {
  return history
    .filter((item) => item.direction === 'outbound')
    .map((item) => item.body.replace(/^\[Kia(?::AI|:list)?\]\s*/i, '').trim())
    .filter(Boolean)
    .slice(-6);
}

async function generateKiaAiResponse({
  clientId, phone, msgBody, session, conversationHistory, contactCtx,
}: KiaAiContext): Promise<{ reply: string | null; interactive?: { body: string; buttons: { id: string; title: string }[] } }> {
  // Always detect lang from the current message — session.lang may be stale mid-conversation.
  const lang = msgBody ? detectLanguage(msgBody) : session.lang;
  const languageInstruction = lang === 'ru'
    ? 'ruso. Responde ÚNICAMENTE en ruso con alfabeto cirílico. NUNCA uses español ni otro idioma en la misma respuesta.'
    : 'español. Responde ÚNICAMENTE en español. NUNCA uses ruso ni otro idioma en la misma respuesta.';

  const officialSourceContext = await buildOfficialSourceContext(
    [...conversationHistory.slice(-3).map((h) => `${h.direction}: ${h.body}`), `inbound: ${msgBody}`].join('\n'),
  );
  const recentAssistantTexts = recentAssistantTextsFromWabaHistory(conversationHistory);
  const antiRepeatInstruction = buildNoRepeatInstruction(recentAssistantTexts);

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
          conversationHistory.slice(-8).map((h) => `${h.direction}: ${h.body}`).join('\n') || 'Sin historial previo.',
          'CONTEXTO DEL CONTACTO:',
          clientContext,
          antiRepeatInstruction,
          'Reglas: no pedir API keys ni email por WhatsApp; usar login/panel seguro para datos sensibles; mantener respuesta breve.',
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
        const qr = structured.decision.quickReplies ?? [];
        if (qr.length >= 2) {
          return { reply: null, interactive: { body: reply, buttons: qr.slice(0, 3) } };
        }
        return { reply };
      }
    } catch (err) {
      console.error('[Kia structured AI fallback]', err);
    }
  }

  const systemPrompt = `Eres *Kia*, la asistente virtual IA de EXPERT Asesoría, gestoría española y Partner Oficial de Holded.
*Eres una inteligencia artificial (IA), NO un ser humano.* Si alguien pregunta si eres humano o una persona real, responde siempre con honestidad: "Soy Kia, una IA de EXPERT. No soy una persona, soy un sistema automatizado al servicio de EXPERT Asesoría."
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

OPCIÓN A — TEXTO (la mayoría de casos):
Responde directamente con texto claro y conciso. Máximo 3 párrafos cortos.
Termina con un siguiente paso natural solo si encaja con el contexto. Firma: "EXPERT 💼"

OPCIÓN B — BOTONES INTERACTIVOS (solo cuando necesitas contexto antes de responder):
Responde ÚNICAMENTE con este JSON exacto, sin texto antes ni después:
{"type":"btns","body":"Tu mensaje aquí","buttons":["Botón 1","Botón 2","Botón 3"]}
Reglas: mínimo 2, máximo 3 botones. Cada botón ≤ 20 caracteres, sin emojis ni puntuación especial.

CUÁNDO usar botones:
✓ Consulta muy vaga sin contexto ("necesito ayuda", "¿qué servicios tenéis?")
✓ Pregunta de precio sin especificar servicio ("¿cuánto cuesta?")
✓ Si detectas interes real pero faltan datos fiables, ofrece login/registro, presupuesto o cita en el portal seguro

CUÁNDO NO usar botones:
✗ Si el historial ya muestra "[Kia]" o "[Kia:list]" — el cliente ya navegó el menú; responde con texto
✗ Si la consulta es concreta (nombre de servicio, pregunta técnica específica)
✗ Si ya sabes lo que necesita por el historial

IDIOMA: ${languageInstruction}
NEGRITA en WhatsApp: *texto* (UN asterisco, NO **texto**)
Emojis con moderación: ✅ 👋 📋 📅 💼 🚀

REGLAS:
- Varía la redacción segun historial y contexto; evita repetir la misma frase si ya la has dicho.
- Antes de responder, compara tu borrador con CONVERSACIÓN RECIENTE y con mensajes anteriores de EXPERT. Si se parece demasiado, reescríbelo con otra apertura, otra estructura y otro cierre.
- No uses varias veces seguidas frases como "te oriento", "para avanzar", "puedes reservar una llamada" o "entra en el portal seguro"; adapta la frase al contexto.
- Si ya ofreciste enlace/cita/panel en el hilo, no repitas exactamente el CTA. Explica el siguiente paso o pide un dato mínimo.
- Si requiere decision profesional compleja, da primero orientacion util y despues ofrece reserva de llamada/reunion: https://expertconsulting.es/auth/login?next=%2Fcita
- Si hay urgencia legal (requerimiento, sancion, denegacion, recurso, inspeccion, embargo, multa), da pasos iniciales prudentes y recomienda llamada/reunion de 15 minutos.
- [NEEDS_REVIEW] es ultimo recurso tecnico, no flujo comercial. Usalo solo si no puedes dar ninguna respuesta segura o hay ambiguedad extrema.
- PRECIOS: NUNCA des precios, rangos ni estimaciones (ni exactos ni aproximados). Todos los precios de EXPERT son fijos y exactos, disponibles en https://expertconsulting.es/planes. Ante cualquier pregunta de precio, indica esa URL. Si el servicio no aparece en planes, envía a https://expertconsulting.es/auth/login?next=%2Fsolicitar-presupuesto
- Nunca inventes plazos ni documentos
- Máximo 2 intercambios de aclaración antes de cerrar con acción concreta
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

${antiRepeatInstruction}`;

  const messages: WabaAiMessage[] = conversationHistory.map((h) => ({
    role:    h.direction === 'inbound' ? 'user' : 'assistant',
    content: h.body,
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
          const buttons = (parsed.buttons as unknown[])
            .filter((b): b is string => typeof b === 'string')
            .slice(0, 3)
            .map((b, i) => ({ id: `kia_ai_${i}`, title: b.slice(0, 20) }));
          if (buttons.length >= 2) return { reply: null, interactive: { body: parsed.body, buttons } };
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
          const sentAsk = await sendWhatsAppMessage({ to: from, body: askMsg });
          if (sentAsk.success) {
            await logWhatsAppConversation({
              clientId: undefined, phoneNumber: from, direction: 'outbound',
              body: askMsg, whatsappMessageId: sentAsk.messageId, aiResponded: false, needsReview: false,
            });
          }
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
          const sentSelect = await sendWhatsAppInteractive({
            to: from, body: `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel}. ¿A qué expediente pertenece?`,
            footer: 'EXPERT 💼', buttons: caseButtons,
          });
          if (sentSelect.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: `[Kia:doc_select] ${mediaLabel} → ? | ${openCases.map((c) => c.service).join(' / ')}`,
              whatsappMessageId: sentSelect.messageId, aiResponded: false, needsReview: false,
            });
          }
          continue;
        }

        const sentAck = await sendWhatsAppMessage({ to: from, body: ackBody });
        if (sentAck.success) {
          await logWhatsAppConversation({
            clientId, phoneNumber: from, direction: 'outbound',
            body: ackBody, whatsappMessageId: sentAck.messageId, aiResponded: false, needsReview: false,
          });
        }
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

      // ── Catalog: category selection → send services list ──────────────────
      if (buttonId?.startsWith('menu_cat_')) {
        const categoryId = buttonId.slice('menu_cat_'.length);
        const section = SERVICES_CATALOG.find((s) => s.id === categoryId);
        if (section) {
          const isRu = /[А-Яа-яЁё]/.test(msgBody);
          const rows = section.services.slice(0, 10).map((s) => ({
            id:          `svc_cat_${s.id}`,
            title:       s.title.slice(0, 24),
            description: s.description.slice(0, 72),
          }));
          const replyBody = isRu
            ? `Услуги раздела *${section.title}*. Выберите нужную:`
            : `Servicios de *${section.emoji} ${section.title}*. Elige el que necesitas:`;
          const sentList = await sendWhatsAppInteractive({
            to:     from,
            header: { type: 'text', text: `${section.emoji} ${section.title}`.slice(0, 60) },
            body:   replyBody,
            footer: 'expertconsulting.es/cita',
            list: {
              buttonText: isRu ? 'Ver servicios' : 'Ver servicios',
              sections:   [{ title: section.title.slice(0, 24), rows }],
            },
          });
          if (sentList.success) {
            await logWhatsAppConversation({
              clientId,
              phoneNumber: from,
              direction:   'outbound',
              body:        `[Catálogo:cat] ${section.emoji} ${section.title}`,
              whatsappMessageId: sentList.messageId,
              aiResponded: false,
              needsReview: false,
            });
          }
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
          const isRu       = /[А-Яа-яЁё]/.test(msgBody);
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

          const sentSvc = await sendWhatsAppInteractive({ to: from, body, footer: 'EXPERT 💼', buttons });
          if (sentSvc.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: `[Catálogo:svc] ${foundService.title} → ${pageUrl}${hasCheckout ? ' [checkout disponible]' : ''}`,
              whatsappMessageId: sentSvc.messageId, aiResponded: false, needsReview: false,
            });
          }
          await persistSessionUpdates(admin, from, {});
          continue;
        }
      }

      // ── Catalog: "Contratar online" button → send /contratar link ─────────
      if (buttonId?.startsWith('btn_contratar_')) {
        const serviceId   = buttonId.slice('btn_contratar_'.length);
        const registrySvc = getService(serviceId);
        if (registrySvc?.hasCheckout) {
          const isRu = /[А-Яа-яЁё]/.test(msgBody);
          const url  = absoluteAppUrl(`/contratar?service=${serviceId}&source=whatsapp`);
          const body = isRu
            ? `🔐 *Contratación online — ${registrySvc.name}:*\n\n${url}\n\nAccede con tu cuenta o registrate, confirma tus datos y paga de forma segura. Tu expediente se abre automáticamente. EXPERT 💼`
            : `🔐 *Contratación online — ${registrySvc.name}:*\n\n${url}\n\nAccede con tu cuenta o registrate, confirma tus datos y paga de forma segura. Tu expediente se abre automáticamente. EXPERT 💼`;
          const sent = await sendWhatsAppMessage({ to: from, body });
          if (sent.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: `[Catálogo:contratar] ${registrySvc.name} → ${url}`,
              whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
            });
          }
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
          const sentBad = await sendWhatsAppMessage({ to: from, body: bad });
          if (sentBad.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: bad, whatsappMessageId: sentBad.messageId, aiResponded: false, needsReview: true,
            });
          }
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
        const sentAck = await sendWhatsAppMessage({ to: from, body: ack });
        if (sentAck.success) {
          await logWhatsAppConversation({
            clientId, phoneNumber: from, direction: 'outbound',
            body: ack, whatsappMessageId: sentAck.messageId, aiResponded: false, needsReview: false,
          });
        }
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
      const session  = isTestNumber
        ? ({
            phone_number: from,
            client_id   : null,
            lang        : msgBody ? detectLanguage(msgBody) : 'es',
            flow        : 'welcome',
            step        : 'init',
            service_id  : null,
            precal_step : 0,
            data        : {},
            name        : null,
            email       : null,
            priority    : 'normal',
            escalated   : false,
          } as KiaSession)
        : await getOrCreateSession(admin, from, clientId);
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
          const sentAskService = await sendWhatsAppMessage({ to: from, body: askService });
          if (sentAskService.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: askService, whatsappMessageId: sentAskService.messageId, aiResponded: false, needsReview: false,
            });
          }
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
          const sentAckDoc = await sendWhatsAppMessage({ to: from, body: ackDoc });
          if (sentAckDoc.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: ackDoc, whatsappMessageId: sentAckDoc.messageId, aiResponded: false, needsReview: false,
            });
          }
          notifyAdmins({
            title: `📎 Doc lead sin ficha — ${session.name ?? from}`,
            body:  `${mediaLabel}${docCaption ? ': ' + docCaption : ''} | seguimiento por portal`,
            url: '/admin/whatsapp', tag: `wa-doc-${from}`,
          }).catch(() => {});
          continue;
        }
      }

      // Run the Kia state machine (language detection is handled inside)
      const { replies, updates, sideEffects } = processKiaStep(session, msgBody, buttonId, clientName, {
        status              : contactCtx.status,
        openCases           : contactCtx.openCases,
        profileCompleted    : contactCtx.profileCompleted,
        billingReady        : contactCtx.billingReady,
        habitualAddressReady: contactCtx.habitualAddressReady,
      });
      const updatedSession = { ...session, ...updates };

      // Load recent outbound texts for anti-repetition (lightweight — 4 rows max)
      const { data: recentOutboundRows } = await admin
        .from('whatsapp_conversations')
        .select('body')
        .eq('phone_number', from)
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false })
        .limit(4);
      const kiaEngineRecentTexts: string[] = (recentOutboundRows ?? [])
        .map((r: { body: string }) => r.body.replace(/^\[Kia(?::AI|:list)?\]\s*/i, '').trim())
        .filter(Boolean);

      // Send all structured replies
      for (const reply of replies) {
        await sendKiaReply(reply, from, clientId, admin, false, kiaEngineRecentTexts);
      }

      // Handle side effects (test numbers skip lead/case creation)
      const effectiveSideEffects: KiaSideEffects = isTestNumber
        ? { ...sideEffects, saveLead: false, createCase: false }
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
      const newNif = updates.data?.prof_nif;
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
              const sentInfo = await sendWhatsAppMessage({ to: from, body: infoBody });
              if (sentInfo.success) {
                await logWhatsAppConversation({
                  clientId, phoneNumber: from, direction: 'outbound',
                  body: infoBody, whatsappMessageId: sentInfo.messageId, aiResponded: false, needsReview: false,
                });
              }
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
          .select('direction, body, created_at')
          .eq('phone_number', from)
          .neq('whatsapp_message_id', messageId)
          .order('created_at', { ascending: false })
          .limit(8);

        const conversationHistory = ((history ?? []).reverse()) as { direction: string; body: string }[];
        const aiResult = await generateKiaAiResponse({
          clientId, phone: from, msgBody,
          session: updatedSession,
          conversationHistory,
          contactCtx,
        });

        if (aiResult.interactive) {
          const sent = await sendWhatsAppInteractive({
            to: from, body: aiResult.interactive.body, footer: 'EXPERT 💼',
            buttons: aiResult.interactive.buttons,
          });
          if (sent.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: `[Kia:AI] ${aiResult.interactive.body} | ${aiResult.interactive.buttons.map((b) => b.title).join(' / ')}`,
              whatsappMessageId: sent.messageId, aiResponded: true, needsReview: false,
            });
          } else {
            console.error('[Kia AI interactive send failed]', { phone: from, error: sent.error, detail: sent.detail });
            await admin
              .from('whatsapp_conversations')
              .update({ needs_review: true })
              .eq('phone_number', from)
              .eq('direction', 'inbound')
              .is('read_at', null);
          }
        } else if (aiResult.reply) {
          const sent = await sendWhatsAppMessage({ to: from, body: aiResult.reply });
          if (sent.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: aiResult.reply, whatsappMessageId: sent.messageId, aiResponded: true, needsReview: false,
            });
          } else {
            console.error('[Kia AI text send failed]', { phone: from, error: sent.error, detail: sent.detail });
            await admin
              .from('whatsapp_conversations')
              .update({ needs_review: true })
              .eq('phone_number', from)
              .eq('direction', 'inbound')
              .is('read_at', null);
          }
        } else {
          await admin
            .from('whatsapp_conversations')
            .update({ needs_review: true })
            .eq('phone_number', from)
            .eq('direction', 'inbound')
            .is('read_at', null);
        }
      }

      // Persist session state changes (skipped for test numbers)
      if (!isTestNumber) {
        await persistSessionUpdates(admin, from, updates);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp webhook]', error);
    return NextResponse.json({ received: true });
  }
}
