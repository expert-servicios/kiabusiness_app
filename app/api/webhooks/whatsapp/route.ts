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
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { sendEmail } from '@/lib/email/send';
import { documentRequired } from '@/lib/email/templates';
import {
  processKiaStep,
  getServicePageUrl,
  type KiaSession,
  type KiaReply,
  type KiaSideEffects,
  SERVICES,
} from '@/lib/integrations/kia-engine';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { SERVICES_CATALOG } from '@/lib/data/services-catalog';

// ── Meta webhook verification ─────────────────────────────────────────────────

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
  reply    : KiaReply,
  phone    : string,
  clientId : string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin    : any,
  aiResponded = false,
): Promise<void> {
  if (reply.type === 'text') {
    const sent = await sendWhatsAppMessage({ to: phone, body: reply.body });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: reply.body, whatsappMessageId: sent.messageId,
        aiResponded, needsReview: false,
      });
    }
  } else if (reply.type === 'buttons') {
    const sent = await sendWhatsAppInteractive({
      to: phone, body: reply.body, footer: reply.footer,
      buttons: reply.buttons,
    });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: `[Kia] ${reply.body} | ${reply.buttons.map((b) => b.title).join(' / ')}`,
        whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
      });
    }
  } else if (reply.type === 'list') {
    const sent = await sendWhatsAppInteractive({
      to: phone, body: reply.body, footer: reply.footer,
      list: { buttonText: reply.buttonText, sections: reply.sections },
    });
    if (sent.success) {
      await logWhatsAppConversation({
        clientId, phoneNumber: phone, direction: 'outbound',
        body: `[Kia:list] ${reply.body}`,
        whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
      });
    }
  }
}

// ── Handle Kia side effects ───────────────────────────────────────────────────

async function handleKiaSideEffects({
  sideEffects, session, phone, clientId, admin,
}: {
  sideEffects : KiaSideEffects;
  session     : KiaSession;
  phone       : string;
  clientId    : string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin       : any;
}): Promise<void> {
  const { escalate, createCase, saveLead, sendDocsEmail, sendPaymentLink, priority = 'normal' } = sideEffects;

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

  if (saveLead || (createCase && !clientId)) {
    // leads table requires name, email, client_type, category, service (NOT NULL).
    // Provide safe defaults for WhatsApp contacts that may not have shared their email yet.
    await admin.from('leads').upsert(
      {
        phone,
        name        : session.name ?? phone,
        email       : session.email ?? `wa.${phone}@noreply.expert`,
        client_type : 'particular',
        category    : svc?.category ?? 'general',
        service     : svc?.label.es ?? 'Consulta WhatsApp',
        source      : 'whatsapp',
        notes       : svc ? `Interesado/a en: ${svc.label.es}` : 'Consulta por WhatsApp',
        updated_at  : new Date().toISOString(),
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
      const url = absoluteAppUrl(`/contratar?service=${svc.id}&source=whatsapp`);
      const body = session.lang === 'ru'
        ? `🔐 *Para contratar ${svc.label.ru}:*\n\n${url}\n\nAccede con tu email, confirma tus datos y paga de forma segura. Tu expediente se abrirá automáticamente. EXPERT 💼`
        : `🔐 *Para contratar el servicio ${svc.label.es}:*\n\n${url}\n\nAccede con tu email, confirma tus datos y paga de forma segura. Tu expediente se abrirá automáticamente. EXPERT 💼`;
      const sent = await sendWhatsAppMessage({ to: phone, body });
      if (sent.success) {
        await logWhatsAppConversation({
          clientId, phoneNumber: phone, direction: 'outbound',
          body: `[Kia:contratar] ${svc.label.es} → ${url}`,
          whatsappMessageId: sent.messageId, aiResponded: false, needsReview: false,
        });
      }
    } catch (e) {
      console.error('[Kia sendPaymentLink]', e);
    }
  }
}

// ── Kia AI fallback ───────────────────────────────────────────────────────────

interface KiaAiContext {
  clientId?           : string;
  phone               : string;
  msgBody             : string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin               : any;
  session             : KiaSession;
  conversationHistory : { direction: string; body: string }[];
}

async function generateKiaAiResponse({
  clientId, msgBody, admin, session, conversationHistory,
}: KiaAiContext): Promise<{ reply: string | null; interactive?: { body: string; buttons: { id: string; title: string }[] } }> {
  const lang               = session.lang;
  const languageInstruction = lang === 'ru'
    ? 'ruso. Responde ÚNICAMENTE en ruso con alfabeto cirílico. No uses español salvo que el cliente lo pida explícitamente.'
    : 'español. Responde en español.';

  const officialSourceContext = await buildOfficialSourceContext(
    [...conversationHistory.slice(-3).map((h) => `${h.direction}: ${h.body}`), `inbound: ${msgBody}`].join('\n'),
  );

  let clientContext = '';
  if (clientId) {
    const [{ data: profile }, { data: cases }, { data: obligations }] = await Promise.all([
      admin.from('profiles').select('full_name, email, phone').eq('id', clientId).single(),
      admin.from('cases').select('service, category, state, opened_at').eq('client_id', clientId).order('opened_at', { ascending: false }).limit(5),
      admin.from('fiscal_obligations').select('modelo, description, deadline, status').eq('user_id', clientId).eq('status', 'pending').order('deadline').limit(5),
    ]);
    const name     = profile?.full_name ?? session.name ?? 'el cliente';
    const caseList = (cases ?? []).map((c: { service: string; category: string; state: string; opened_at: string }) =>
      `- ${c.service} (${c.category}): estado "${c.state}", abierto el ${new Date(c.opened_at).toLocaleDateString('es-ES')}`
    ).join('\n');
    const obList = (obligations ?? []).map((o: { modelo: string; description: string; deadline: string }) =>
      `- M${o.modelo} ${o.description}: vence ${new Date(o.deadline).toLocaleDateString('es-ES')}`
    ).join('\n');
    clientContext = `Cliente: ${name}\nExpedientes activos:\n${caseList || 'Ninguno'}\nObligaciones fiscales pendientes:\n${obList || 'Ninguna'}`;
  } else if (session.name || session.email) {
    clientContext = `Contacto por WhatsApp: ${session.name ?? 'cliente'}${session.email ? ` · email: ${session.email}` : ''}\nSin cuenta en el portal.`;
  } else {
    clientContext = 'Número desconocido — no hay cliente registrado con este teléfono.';
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
2. FUERA DE ALCANCE: Si el cliente hace preguntas de educación/formación fiscal general (¿qué es el IVA?, ¿cómo funciona el IRPF?, ¿qué diferencia hay entre autónomo y empresa?, etc.) que NO buscan contratar un servicio concreto, responde: "Soy un asistente de EXPERT y solo gestiono servicios y consultas específicas. Para orientación detallada, te recomiendo reservar una consulta: https://expertconsulting.es/cita"
3. URGENCIA LEGAL: Si el cliente menciona requerimiento de Hacienda, sanción fiscal, denegación, recurso, inspección tributaria, embargo, multa fiscal o acta de inspección, responde SIEMPRE y ÚNICAMENTE: [NEEDS_REVIEW]
4. DATOS MÍNIMOS: Solo pide los datos estrictamente necesarios para identificar el servicio. Nunca solicites información fiscal sensible (números de cuenta, claves de acceso, datos de declaraciones).

═══════════════════════════════════════
FORMATO DE RESPUESTA — ELIGE UNO:
═══════════════════════════════════════

OPCIÓN A — TEXTO (la mayoría de casos):
Responde directamente con texto claro y conciso. Máximo 3 párrafos cortos.
Termina con una CTA natural con enlace. Firma: "EXPERT 💼"

OPCIÓN B — BOTONES INTERACTIVOS (solo cuando necesitas contexto antes de responder):
Responde ÚNICAMENTE con este JSON exacto, sin texto antes ni después:
{"type":"btns","body":"Tu mensaje aquí","buttons":["Botón 1","Botón 2","Botón 3"]}
Reglas: mínimo 2, máximo 3 botones. Cada botón ≤ 20 caracteres, sin emojis ni puntuación especial.

CUÁNDO usar botones:
✓ Consulta muy vaga sin contexto ("necesito ayuda", "¿qué servicios tenéis?")
✓ Pregunta de precio sin especificar servicio ("¿cuánto cuesta?")

CUÁNDO NO usar botones:
✗ Si el historial ya muestra "[Kia]" o "[Kia:list]" — el cliente ya navegó el menú; responde con texto
✗ Si la consulta es concreta (nombre de servicio, pregunta técnica específica)
✗ Si ya sabes lo que necesita por el historial

IDIOMA: ${languageInstruction}
NEGRITA en WhatsApp: *texto* (UN asterisco, NO **texto**)
Emojis con moderación: ✅ 👋 📋 📅 💼 🚀

REGLAS:
- Si requiere decisión profesional compleja → responde EXACTAMENTE: [NEEDS_REVIEW]
- Urgencia legal detectada (requerimiento, sanción, denegación, recurso, inspección, embargo, multa) → responde EXACTAMENTE: [NEEDS_REVIEW]
- Nunca inventes plazos, precios exactos ni documentos
- Máximo 2 intercambios de aclaración antes de cerrar con acción concreta
- Si hay fuentes oficiales disponibles, cita 1-2 enlaces oficiales útiles
- No digas que has comprobado información oficial si no aparece en FUENTES OFICIALES DISPONIBLES
- WhatsApp no sustituye el portal: orienta y lleva al cliente a cita, presupuesto o panel seguro

CIERRE OBLIGATORIO — cada respuesta debe terminar con una acción concreta, nunca dejar la conversación abierta:
• Si necesita presupuesto → https://expertconsulting.es/solicitar-presupuesto
• Si necesita cita o asesoría → https://expertconsulting.es/cita
• Si es complejo/urgente → [NEEDS_REVIEW]

${officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.'}

CONTEXTO DEL CLIENTE:
${clientContext}`;

  const messages: WabaAiMessage[] = conversationHistory.map((h) => ({
    role:    h.direction === 'inbound' ? 'user' : 'assistant',
    content: h.body,
  }));
  messages.push({ role: 'user', content: msgBody });

  try {
    const ai   = await generateWabaAiText({ systemPrompt, messages, maxTokens: 500 });
    const text = ai?.text.trim() ?? '';

    if (!text || text.includes('[NEEDS_REVIEW]')) return { reply: null };

    const normalizedText = text.replace(/\*\*(.+?)\*\*/gs, '*$1*');

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

    return { reply: normalizedText };
  } catch (err) {
    console.error('[Kia AI]', err);
    return { reply: null };
  }
}

// ── Incoming messages ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body     = await request.json();
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

      const from       : string = msg.from;
      const messageId  : string = msg.id;
      const clientId             = mapWhatsAppMessageToClient(from, profiles ?? []) ?? undefined;
      const senderName           = profiles?.find((p) => p.id === clientId)?.full_name ?? from;

      // ── Media: download, store, log, notify — bot stays silent ───────────
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
          mediaUrl: storedUrl ?? mediaId ?? undefined, mediaType: msgType,
        });

        const mediaIcon = msgType === 'image' ? '📷' : msgType === 'audio' ? '🎤' : msgType === 'video' ? '🎥' : '📄';
        notifyAdmins({ title: `${mediaIcon} Archivo de ${senderName}`, body: caption || `Ha enviado un ${msgType}`, url: '/admin/whatsapp', tag: `wa-${from}` }).catch(() => {});
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
          const isRu   = /[А-Яа-яЁё]/.test(msgBody);
          const pageUrl = `https://expertconsulting.es/servicios/${foundSection.id}/${foundService.id}`;
          const body = isRu
            ? `*${foundService.title}*\n\n${foundService.description}\n\n🌐 *Información y contratación:*\n${pageUrl}\n\n¿Todavía tienes dudas? Reserva una *llamada informativa gratuita de 15 min* con nuestro equipo.`
            : `*${foundService.title}*\n\n${foundService.description}\n\n🌐 *Más información y contratación:*\n${pageUrl}\n\n¿Todavía tienes dudas? Reserva una *llamada informativa gratuita de 15 min* con nuestro equipo.`;
          const sentSvc = await sendWhatsAppInteractive({
            to: from, body, footer: 'EXPERT 💼',
            buttons: [
              { id: 'btn_book_call',  title: isRu ? 'Llamada 15 min' : 'Llamada 15 min'  },
              { id: 'btn_write_here', title: isRu ? 'Tengo más dudas' : 'Tengo más dudas' },
            ],
          });
          if (sentSvc.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: `[Catálogo:svc] ${foundService.title} → ${pageUrl}`,
              whatsappMessageId: sentSvc.messageId, aiResponded: false, needsReview: false,
            });
          }
          await persistSessionUpdates(admin, from, {});
          continue;
        }
      }

      // ── Kia session ────────────────────────────────────────────────────────
      const session  = await getOrCreateSession(admin, from, clientId);
      const clientName = clientId
        ? (profiles?.find((p) => p.id === clientId)?.full_name ?? null)
        : (session.name ?? null);

      // Run the Kia state machine (language detection is handled inside)
      const { replies, updates, sideEffects } = processKiaStep(session, msgBody, buttonId, clientName);
      const updatedSession = { ...session, ...updates };

      // Send all structured replies
      for (const reply of replies) {
        await sendKiaReply(reply, from, clientId, admin);
      }

      // Handle side effects (createCase, saveLead, sendDocsEmail, escalate)
      await handleKiaSideEffects({ sideEffects, session: updatedSession, phone: from, clientId, admin });

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
          clientId, phone: from, msgBody, admin,
          session: updatedSession,
          conversationHistory,
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
          }
        } else if (aiResult.reply) {
          const sent = await sendWhatsAppMessage({ to: from, body: aiResult.reply });
          if (sent.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: aiResult.reply, whatsappMessageId: sent.messageId, aiResponded: true, needsReview: false,
            });
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

      // Persist session state changes
      await persistSessionUpdates(admin, from, updates);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp webhook]', error);
    return NextResponse.json({ received: true });
  }
}
