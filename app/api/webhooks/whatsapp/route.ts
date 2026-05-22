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
import { getService } from '@/lib/services/service-registry';

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
          mediaUrl: storedUrl ?? mediaId ?? undefined, mediaType: msgType,
        });

        const mediaIcon  = msgType === 'image' ? '📷' : msgType === 'audio' ? '🎤' : msgType === 'video' ? '🎥' : '📄';
        const mediaLabel = msgType === 'document' ? 'documento' : msgType === 'image' ? 'imagen' : msgType === 'audio' ? 'audio' : 'archivo';
        notifyAdmins({ title: `${mediaIcon} Archivo de ${senderName}`, body: caption || `Ha enviado un ${msgType}`, url: '/admin/whatsapp', tag: `wa-${from}` }).catch(() => {});

        // ── Kia response to media ─────────────────────────────────────
        const mediaSess  = await getOrCreateSession(admin, from, clientId);
        const docRef     = storedUrl ?? mediaId ?? null;
        const clientDisplay = mediaSess.name ?? senderName;

        if (!clientId && !mediaSess.name) {
          // Unknown number — ask for identification first, save pending doc
          await persistSessionUpdates(admin, from, {
            flow: 'identify_for_doc',
            step: 'awaiting_name',
            data: {
              ...mediaSess.data,
              pending_doc_url:      docRef ?? '',
              pending_doc_type:     msgType,
              pending_doc_caption:  caption,
              pending_doc_filename: rawFilename,
            },
          });
          const askMsg = `👋 ¡Hola! Hemos recibido tu ${mediaLabel} y lo hemos guardado de forma segura.\n\nPara vincularlo a tu ficha y darte seguimiento, necesito identificarte. ¿Cuál es tu nombre?`;
          const sentAsk = await sendWhatsAppMessage({ to: from, body: askMsg });
          if (sentAsk.success) {
            await logWhatsAppConversation({
              clientId: undefined, phoneNumber: from, direction: 'outbound',
              body: askMsg, whatsappMessageId: sentAsk.messageId, aiResponded: false, needsReview: false,
            });
          }
          continue;
        }

        // Known number — check open expedientes
        let openCases: Array<{ id: string; service: string }> = [];
        if (clientId) {
          const { data: casesData } = await admin
            .from('cases')
            .select('id, service')
            .eq('client_id', clientId)
            .neq('state', 'cerrado')
            .order('opened_at', { ascending: false })
            .limit(3);
          openCases = casesData ?? [];
        }

        let ackBody: string;

        if (openCases.length === 0) {
          ackBody = `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel} ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
        } else if (openCases.length === 1) {
          ackBody = `${mediaIcon} *${clientDisplay}*, hemos guardado tu ${mediaLabel} y lo hemos vinculado al expediente de *${openCases[0].service}* ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
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
        // Escalate so a human follows up
        await admin.from('whatsapp_conversations')
          .update({ needs_review: true })
          .eq('phone_number', from).eq('direction', 'inbound').is('read_at', null);
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
          if (!hasCheckout) {
            buttons.push({ id: 'btn_write_here', title: 'Tengo más dudas' });
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
            ? `🔐 *Contratación online — ${registrySvc.name}:*\n\n${url}\n\nAccede con tu email, confirma tus datos y paga de forma segura. Tu expediente se abre automáticamente. EXPERT 💼`
            : `🔐 *Contratación online — ${registrySvc.name}:*\n\n${url}\n\nAccede con tu email, confirma tus datos y paga de forma segura. Tu expediente se abre automáticamente. EXPERT 💼`;
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
        const { data: selectedCase } = await admin.from('cases').select('service').eq('id', caseId).single();
        const serviceName = selectedCase?.service ?? 'tu expediente';

        await persistSessionUpdates(admin, from, {
          flow: 'welcome',
          step: 'init',
          data: { ...docSess.data, pending_doc_url: '', pending_doc_type: '', pending_doc_caption: '', pending_doc_filename: '' },
        });

        const ack = `${mediaIcon} Perfecto. Tu ${mediaLabel} ha sido vinculado al expediente de *${serviceName}* ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
        const sentAck = await sendWhatsAppMessage({ to: from, body: ack });
        if (sentAck.success) {
          await logWhatsAppConversation({
            clientId, phoneNumber: from, direction: 'outbound',
            body: ack, whatsappMessageId: sentAck.messageId, aiResponded: false, needsReview: false,
          });
        }
        await admin.from('whatsapp_conversations')
          .update({ needs_review: true })
          .eq('phone_number', from).eq('direction', 'inbound').is('read_at', null);
        notifyAdmins({
          title: `📎 Doc vinculado — ${docSess.name ?? from}`,
          body:  `${mediaLabel}${docCaption ? ': ' + docCaption : ''} → ${serviceName}`,
          url: '/admin/whatsapp', tag: `wa-doc-${from}`,
        }).catch(() => {});
        continue;
      }

      // ── Kia session ────────────────────────────────────────────────────────
      const session  = await getOrCreateSession(admin, from, clientId);
      const clientName = clientId
        ? (profiles?.find((p) => p.id === clientId)?.full_name ?? null)
        : (session.name ?? null);

      // ── identify_for_doc flow — collect name + email for unknown doc sender ──
      if (session.flow === 'identify_for_doc') {
        if (session.step === 'awaiting_name') {
          const nameInput = msgBody.trim();
          await persistSessionUpdates(admin, from, { name: nameInput, step: 'awaiting_email' });
          const askEmail = `Gracias, *${nameInput}*. ¿Cuál es tu dirección de email? La necesitamos para enviarte actualizaciones sobre tu expediente.`;
          const sentAskEmail = await sendWhatsAppMessage({ to: from, body: askEmail });
          if (sentAskEmail.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: askEmail, whatsappMessageId: sentAskEmail.messageId, aiResponded: false, needsReview: false,
            });
          }
          continue;
        }

        if (session.step === 'awaiting_email') {
          const emailInput = msgBody.trim().toLowerCase();
          const emailValid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
          if (!emailValid) {
            const retry = `Ese email no parece válido. Por favor, escríbelo de nuevo (ej. nombre@ejemplo.com):`;
            const sentRetry = await sendWhatsAppMessage({ to: from, body: retry });
            if (sentRetry.success) {
              await logWhatsAppConversation({
                clientId, phoneNumber: from, direction: 'outbound',
                body: retry, whatsappMessageId: sentRetry.messageId, aiResponded: false, needsReview: false,
              });
            }
            continue;
          }

          await persistSessionUpdates(admin, from, {
            email: emailInput,
            flow:  'welcome',
            step:  'init',
            data:  { ...session.data, pending_doc_url: '', pending_doc_type: '', pending_doc_caption: '', pending_doc_filename: '' },
          });
          try {
            await admin.from('leads').upsert(
              {
                phone:        from,
                name:         session.name ?? from,
                email:        emailInput,
                client_type:  'particular',
                category:     'general',
                service:      'Consulta WhatsApp',
                source:       'whatsapp',
                notes:        'Identificado al enviar documento por WhatsApp',
                updated_at:   new Date().toISOString(),
              },
              { onConflict: 'phone' },
            );
          } catch (e) {
            console.error('[Kia identify_for_doc lead]', e);
          }

          const docType    = session.data?.pending_doc_type ?? 'document';
          const docCaption = session.data?.pending_doc_caption ?? '';
          const mediaIcon  = docType === 'image' ? '📷' : docType === 'audio' ? '🎤' : docType === 'video' ? '🎥' : '📄';
          const mediaLabel = docType === 'document' ? 'documento' : docType === 'image' ? 'imagen' : docType === 'audio' ? 'audio' : 'archivo';
          const ackDoc = `${mediaIcon} *${session.name ?? from}*, muchas gracias. Hemos guardado tu ${mediaLabel} y registrado tu ficha ✅\n\nNuestro equipo lo revisará y te responderemos en breve. EXPERT 💼`;
          const sentAckDoc = await sendWhatsAppMessage({ to: from, body: ackDoc });
          if (sentAckDoc.success) {
            await logWhatsAppConversation({
              clientId, phoneNumber: from, direction: 'outbound',
              body: ackDoc, whatsappMessageId: sentAckDoc.messageId, aiResponded: false, needsReview: false,
            });
          }
          await admin.from('whatsapp_conversations')
            .update({ needs_review: true })
            .eq('phone_number', from).eq('direction', 'inbound').is('read_at', null);
          notifyAdmins({
            title: `📎 Doc + ficha nueva — ${session.name ?? from}`,
            body:  `${mediaLabel}${docCaption ? ': ' + docCaption : ''} | email: ${emailInput}`,
            url: '/admin/whatsapp', tag: `wa-doc-${from}`,
          }).catch(() => {});
          continue;
        }
      }

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
