import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';
import { generateWabaAiText, getConfiguredWabaAiProviders } from '@/lib/integrations/waba-ai';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import { buildNoRepeatInstruction } from '@/lib/ai/kia/kia-response-variation';
import { normalizeKiaQuickReplies, quickRepliesToButtons } from '@/lib/ai/kia/kia-quick-replies';
import { KIA_CLARIFYING_POLICY_PROMPT } from '@/lib/ai/kia/prompts/kia-clarifying-policy';
import { formatChecklistForPrompt, getChecklistsByCategory, getServiceChecklist } from '@/lib/utils/service-checklists';
import { resolveKiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

const schema = z.object({
  clientId:  z.string().uuid().nullish(),
  phone:     z.string().min(1),
  history:   z.array(z.object({
    direction:    z.enum(['inbound','outbound']),
    body:         z.string(),
    ai_responded: z.boolean().optional(),
  })).max(40),
  intent:    z.string().max(2000).optional(),
  mode:      z.enum(['compose', 'edit']).default('compose'),
  serviceId: z.string().optional(),
  replyTo:   z.object({
    direction : z.enum(['inbound', 'outbound']),
    body      : z.string().max(500),
    created_at: z.string().optional(),
    media_type: z.string().nullable().optional(),
  }).optional(),
});

function cleanMarkdownForWhatsApp(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '*$1*')   // **bold** → *bold*
    .replace(/__(.+?)__/gs, '_$1_')         // __italic__ → _italic_
    .replace(/^#{1,6}\s+/gm, '')            // ## Heading → remove #
    .replace(/~~(.+?)~~/gs, '~$1~')         // ~~strike~~ → ~strike~
    .replace(/`([^`]+)`/g, '$1')            // `code` → code (plain)
    .replace(/\n{3,}/g, '\n\n')             // max 2 consecutive newlines
    .trim();
}

function detectLanguageInstruction(text: string): string {
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ruso. Redacta en ruso natural usando alfabeto cirilico.';
  }
  if (/[\u00C0-\u00FF¿¡]/.test(text) || /\b(hola|buenos|buenas|declaracion|declaracion|renta|autonomo|autonomo|empresa)\b/i.test(text)) {
    return 'espanol.';
  }
  return 'el mismo idioma del ultimo mensaje del cliente.';
}

function detectLocale(text: string): 'es' | 'ru' {
  return /[\u0400-\u04FF]/.test(text) ? 'ru' : 'es';
}

function featureFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function isStructuredAiEnabled(): boolean {
  return featureFlag('KIA_STRUCTURED_AI_ENABLED', true)
    && featureFlag('KIA_STRUCTURED_AI_ADMIN_ENABLED', true)
    && featureFlag('KIA_AI_PROVIDER_ROUTER_ENABLED', true);
}

function isKiaAuthoredHistoryMessage(message: { direction: 'inbound' | 'outbound'; body: string; ai_responded?: boolean }): boolean {
  if (message.direction !== 'outbound') return false;
  if (message.ai_responded === true) return true;
  return /^\[(Kia|Kia:AI|Kia:list|Kia:doc_select|Cat[aá]logo)/i.test(message.body.trim());
}

function historySpeakerLabel(message: { direction: 'inbound' | 'outbound'; body: string; ai_responded?: boolean }): string {
  if (message.direction === 'inbound') return 'Cliente';
  return isKiaAuthoredHistoryMessage(message) ? 'Kia' : 'Admin humano';
}

function cleanHistoryBodyForPrompt(body: string): string {
  const withoutInteractiveLog = body.match(/^\[(?:Admin:buttons|Kia(?::AI|:list)?|Cat[aá]logo)\]\s*([\s\S]*?)\s\|\s[^\n]+$/i)?.[1]
    ?? body.replace(/^\[(?:Kia(?::AI|:list)?|Cat[aá]logo)\]\s*/i, '');
  return withoutInteractiveLog.trim();
}

function recentOutboundTexts(history: Array<{ direction: 'inbound' | 'outbound'; body: string; ai_responded?: boolean }>): string[] {
  return history
    .filter((message) => message.direction === 'outbound')
    .map((message) => cleanHistoryBodyForPrompt(message.body))
    .filter(Boolean)
    .slice(-6);
}

function normalizeKiaCopilotDraft(text: string, locale: 'es' | 'ru'): string {
  const cleaned = cleanMarkdownForWhatsApp(text);
  if (!cleaned) return '';

  let draft = cleaned
    .replace(/\bAsesor[ií]a EXPERT 💼\b/gi, 'Kia · EXPERT 💼')
    .replace(/\bequipo EXPERT\b/gi, 'EXPERT')
    .replace(/\bencantado\b/gi, 'encantada')
    .replace(/\bestoy seguro\b/gi, 'estoy segura')
    .replace(/\bpreparado para ayudarte\b/gi, 'preparada para ayudarte');

  if (!/\bKia\b/i.test(draft)) {
    draft = locale === 'ru'
      ? `Я Kia, виртуальная ассистентка EXPERT 😊\n\n${draft}`
      : `Soy Kia, asistente virtual de EXPERT 😊\n\n${draft}`;
  }

  return draft.trim();
}

function fallbackQuickReplies(locale: 'es' | 'ru'): { id: string; title: string }[] {
  return quickRepliesToButtons(normalizeKiaQuickReplies([
    { id: 'btn_write_here', title: locale === 'ru' ? 'Написать' : 'Escribir aquí', kind: 'secondary' },
    { id: 'btn_other', title: locale === 'ru' ? 'Другое' : 'Otro', kind: 'other' },
  ], locale, { ensureOther: true }));
}

function normalizeDraftQuickReplies(
  replies: Array<{ id?: string; title?: string; kind?: 'primary' | 'secondary' | 'other' | 'call' | 'checkout' | 'profile' | 'holded' | 'viability' | 'readiness' }> | undefined,
  locale: 'es' | 'ru',
): { id: string; title: string }[] {
  const normalized = quickRepliesToButtons(normalizeKiaQuickReplies(replies, locale, { ensureOther: true }));
  return normalized.length >= 2 ? normalized : fallbackQuickReplies(locale);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    if (getConfiguredWabaAiProviders().length === 0) {
      return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { clientId, history, intent, mode, serviceId, replyTo } = parsed.data;
    const { phone } = parsed.data;

    // Resolve lead/client status
    const contactCtx = await resolveKiaContactContext(admin, phone);
    const isClient   = contactCtx.status === 'client';

    // ── Checklist context ─────────────────────────────────────────
    let checklistContext = '';
    if (serviceId) {
      const checklist = getServiceChecklist(serviceId);
      if (checklist) {
        checklistContext = `\nCHECKLIST DEL SERVICIO:\n${formatChecklistForPrompt(checklist)}`;
      }
    } else if (clientId) {
      // If no specific service, try to infer from client's open cases
      // (will be populated below after fetching cases)
    }

    let clientContext = 'No hay datos del cliente registrado con este número.';

    if (contactCtx) {
      const caseList = contactCtx.openCases
        .map((c) => `- ${c.service}: estado "${c.state}", abierto el ${new Date(c.opened_at).toLocaleDateString('es-ES')}`)
        .join('\n');
      const obList = contactCtx.pendingFiscalObligations
        .map((o) => `- M${o.modelo} ${o.description}: vence ${new Date(o.deadline).toLocaleDateString('es-ES')} (${o.status})`)
        .join('\n');

      clientContext = [
        `Tipo de contacto: ${contactCtx.status}`,
        `Nombre: ${contactCtx.name ?? 'desconocido'}`,
        `Email: ${contactCtx.email ?? 'no disponible'}`,
        `ClientId: ${contactCtx.clientId ?? clientId ?? 'no'}`,
        `LeadId: ${contactCtx.leadId ?? 'no'}`,
        `Perfil completado: ${contactCtx.profileCompleted ? 'sí' : 'no'}`,
        `Facturación lista: ${contactCtx.billingReady ? 'sí' : 'no'}`,
        `Último estado lead: ${contactCtx.lastLeadStatus ?? 'no aplica'}`,
        `Servicio lead/seleccionado: ${contactCtx.lastSelectedService ?? serviceId ?? 'no aplica'}`,
        `Expedientes:\n${caseList || 'Ninguno'}`,
        `Obligaciones fiscales:\n${obList || 'Ninguna'}`,
      ].join('\n');

      // Infer checklist from most recent case when no explicit serviceId given.
      if (!serviceId && contactCtx.openCases.length > 0) {
        const latestService = contactCtx.openCases[0].service;
        const inferred = getServiceChecklist(latestService) ?? getChecklistsByCategory(latestService)[0];
        if (inferred) {
          checklistContext = `\nCHECKLIST DEL SERVICIO (inferido del expediente más reciente):\n${formatChecklistForPrompt(inferred)}`;
        }
      }
    }

    const historyText = history.slice(-25)
      .map((m) => `${historySpeakerLabel(m)}: ${cleanHistoryBodyForPrompt(m.body)}`)
      .join('\n');
    const humanStyleExamples = history
      .filter((m) => m.direction === 'outbound' && !isKiaAuthoredHistoryMessage(m))
      .slice(-6)
      .map((m, index) => `${index + 1}. ${cleanHistoryBodyForPrompt(m.body).slice(0, 500)}`)
      .join('\n');
    const antiRepeatInstruction = buildNoRepeatInstruction(recentOutboundTexts(history));

    const lastInbound = [...history].reverse().find((m) => m.direction === 'inbound')?.body ?? '';
    const languageProbe = lastInbound || intent || '';
    const locale = detectLocale(languageProbe);
    const languageInstruction = detectLanguageInstruction(languageProbe);

    const replyToBlock = replyTo
      ? (() => {
          const who    = replyTo.direction === 'inbound' ? 'Cliente' : 'EXPERT';
          const mIcon  = replyTo.media_type === 'image' ? '📷 Imagen' : replyTo.media_type === 'audio' ? '🎤 Audio' : replyTo.media_type === 'video' ? '🎥 Vídeo' : replyTo.media_type ? '📎 Documento' : null;
          const snap   = (mIcon ?? replyTo.body.replace(/\n+/g, ' ').trim()).slice(0, 200);
          return `\nESTÁS RESPONDIENDO ESPECÍFICAMENTE A ESTE MENSAJE:\n${who}: «${snap}»\nRedacta una respuesta directa a ese punto concreto, sin ignorar el resto del historial.\n`;
        })()
      : '';

    // ── EDIT mode: improve + translate admin's draft ─────────────
    if (mode === 'edit' && intent?.trim()) {
      const editPrompt = `Eres un editor de mensajes de WhatsApp profesional para EXPERT Asesoría (gestoría española).

El asesor ha escrito este borrador en español:
---
${intent.trim()}
---

Tu tarea (sigue este orden exacto):
1. Corrige errores ortográficos y gramaticales.
2. Mejora la claridad y el tono: cercano, profesional, breve.
3. Traduce el mensaje COMPLETO al idioma del cliente: ${languageInstruction}
4. Si el borrador incluye enlaces, mantenlos tal cual.
5. Mantén la voz de Kia cuando el borrador sea una respuesta generada por Kia: asistente virtual de EXPERT, en femenino.
6. Usa las respuestas de Admin humano como referencia de tono y continuidad, sin copiarlas literalmente.
7. Devuelve ÚNICAMENTE el mensaje final listo para enviar. Sin explicaciones, sin prefijos, sin comillas.

FORMATO WHATSAPP OBLIGATORIO:
- Negrita: asterisco SIMPLE *texto* — NUNCA doble **texto**
- Cursiva: guión bajo _texto_
- Tachado: tilde ~texto~
- NO uses ##, ***, \`código\`, ni guiones de lista. Usa párrafos cortos.

CONVERSACIÓN RECIENTE (para contexto de idioma y tono):
${historyText || 'Sin historial previo.'}${replyToBlock}${checklistContext}

${humanStyleExamples ? `RESPUESTAS HUMANAS/ADMIN PREVIAS COMO REFERENCIA DE TONO, SIN COPIAR LITERALMENTE:\n${humanStyleExamples}\n` : ''}

${antiRepeatInstruction}`;

      const ai = await generateWabaAiText({
        systemPrompt: editPrompt,
        messages: [{ role: 'user', content: 'Edita y traduce el borrador.' }],
        maxTokens: 500,
      });
      const draft = normalizeKiaCopilotDraft(ai?.text?.trim() ?? '', locale);
      if (!draft) return NextResponse.json({ error: 'La IA no generó respuesta' }, { status: 500 });
      return NextResponse.json({ draft, quickReplies: fallbackQuickReplies(locale) });
    }

    // ── COMPOSE mode: generate fresh response ────────────────────
    const intentText = intent ? `\nInstrucción del asesor: ${intent}` : '';
    const officialSourceContext = await buildOfficialSourceContext(`${historyText}\n${intent ?? ''}`);

    if (isStructuredAiEnabled()) {
      try {
        const structuredMessage = [
          'Redacta un borrador breve de WhatsApp para que lo revise un asesor humano antes de enviarlo.',
          intentText.trim() ? intentText.trim() : 'No hay instruccion adicional del asesor.',
          replyTo
            ? 'Hay un mensaje seleccionado. Responde a ese mensaje concreto y usa el historial solo como contexto.'
            : 'No hay mensaje seleccionado. Responde al ultimo punto relevante del historial.',
          replyToBlock.trim(),
          officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.',
          antiRepeatInstruction,
          checklistContext.trim(),
          'CONTEXTO DEL CLIENTE:',
          clientContext,
          'CONVERSACION RECIENTE:',
          historyText || 'Sin historial previo.',
          'Reglas de identidad: redacta como Kia, asistente virtual de EXPERT, en femenino. No firmes como equipo EXPERT ni finjas ser humana.',
          humanStyleExamples ? `RESPUESTAS HUMANAS/ADMIN PREVIAS PARA APRENDER TONO Y CONTINUIDAD, SIN COPIAR LITERALMENTE:\n${humanStyleExamples}` : '',
          'Reglas de formato: WhatsApp breve, maximo 3 parrafos, sin markdown complejo, accion concreta.',
          'Si el borrador hace una pregunta o deja opcion al cliente, incluye quickReplies en KiaDecision. La ultima debe ser btn_other.',
        ].filter(Boolean).join('\n\n');

        const structured = await runKiaDecision({
          taskType: 'admin_ai_compose',
          channel: 'admin',
          message: structuredMessage,
          contextInput: {
            channel: 'admin',
            phone,
            clientId: contactCtx.clientId ?? clientId ?? undefined,
            leadId: contactCtx.leadId ?? undefined,
            serviceSlug: serviceId,
            latestMessage: lastInbound || intent || '',
          },
          locale,
          allowTools: false,
        });

        const draft = normalizeKiaCopilotDraft(structured.userMessage, locale);
        if (draft) {
          const quickReplies = normalizeDraftQuickReplies(structured.decision.quickReplies, locale);
          return NextResponse.json({
            draft,
            quickReplies,
            structured: true,
            decision: {
              intent: structured.decision.intent,
              nextAction: structured.decision.nextAction,
              confidence: structured.decision.confidence,
              requiresMeeting: structured.decision.requiresMeeting,
              requiresManualReview: structured.decision.requiresManualReview,
              decisionSummary: structured.decision.decisionSummary,
              rulesApplied: structured.decision.rulesApplied,
              warnings: structured.decision.warnings,
            },
          });
        }
      } catch (err) {
        console.error('[WA ai-compose structured fallback]', err);
      }
    }

    // Contact type instruction
    const contactTypeBlock = isClient
      ? `\nTIPO DE CONTACTO: CLIENTE\n- Tono de soporte/gestion profesional.\n- Usa contexto de expedientes si disponible.\n- No pidas datos que ya tiene.\n- No uses CTA generica si tiene expediente activo.\n- Si pide nuevo servicio, tratale como cliente existente.\n- Si hay dudas o complejidad, ofrece llamada/reunion; no plantees escalacion como salida normal.\n`
      : `\nTIPO DE CONTACTO: LEAD (aun no es cliente)\n- Tono comercial y orientativo.\n- Lleva a viabilidad, llamada 15 min o contratacion.\n- Pide solo datos minimos necesarios.\n- No hables de expedientes salvo que existan.\n- Cierra siempre con accion concreta.\n- Si hay riesgo, dudas o servicio complejo, recomienda llamada de 15 min antes de contratar.\n`;

    const systemPrompt = `Eres Kia, la asistente virtual de EXPERT Asesoría, gestoría española y Partner Oficial de Holded.
Hablas sobre ti misma en femenino. Ayudas al asesor humano a redactar mensajes profesionales y proactivos para enviar a clientes.
Nuestra web es https://expertconsulting.es

PÁGINAS CLAVE (incluye el enlace completo cuando sea relevante para el mensaje):
• Servicios → https://expertconsulting.es/servicios
• Planes y precios → https://expertconsulting.es/planes
• Solicitar presupuesto → https://expertconsulting.es/solicitar-presupuesto
• Reservar cita gratuita → https://expertconsulting.es/cita
• Holded con EXPERT → https://expertconsulting.es/holded
• Formación Holded → https://expertconsulting.es/holded#formacion

ACTITUD:
- Idioma obligatorio: ${languageInstruction}
- Si el cliente escribió en ruso/cirílico, redacta toda la respuesta en ruso/cirílico.
- Tono cercano y profesional.
- Usa emojis ocasionales (✅ 📋 👋 😊 💼 📅 🚀) para humanizar.
- Responde como Kia, asistente virtual de EXPERT. Si hablas de ti misma, usa femenino: "encantada", "estoy segura", "preparada".
- Usa las respuestas de "Admin humano" del historial como ejemplos de tono y continuidad, sin copiarlas literalmente.
- Si el contexto lo permite, termina con una CTA suave: reservar cita, ver planes, pedir presupuesto o ver Holded.
- Si el mensaje habla de Holded, menciona que EXPERT es Partner Oficial, ofrece demo gratuita y enlaza la página.
- Máximo 3 párrafos cortos. Firma como "Kia · EXPERT 💼" si es apropiado.
- FORMATO WHATSAPP: negrita con *asterisco simple*, NO con **doble asterisco**. Cursiva con _guión bajo_. NUNCA uses ##, ***, ni listas markdown.
- Si hay fuentes oficiales disponibles, usalas como apoyo y comparte 1 o 2 enlaces oficiales utiles.
- No digas que has comprobado informacion oficial si no aparece en FUENTES OFICIALES DISPONIBLES.
- Lee TODA LA CONVERSACIÓN RECIENTE antes de redactar. No repitas información ya dada. Muestra continuidad y memoria: si el cliente ya proporcionó un dato, no lo vuelvas a pedir.
- Evita repetir frases ya usadas por EXPERT/Kia en este hilo. Si el mensaje anterior ya ofrecio cita, portal o enlace, cambia el enfoque y aporta el siguiente dato util.
- Si haces una pregunta o dejas opciones al cliente, prepara respuestas rapidas; la ultima opcion siempre debe ser "Otro" o "Другое".

${KIA_CLARIFYING_POLICY_PROMPT}

${officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.'}
${antiRepeatInstruction}

${contactTypeBlock}${replyToBlock}
CONTEXTO DEL CLIENTE:
${clientContext}${intentText}
${checklistContext}
CONVERSACIÓN RECIENTE:
${historyText || 'Sin historial previo.'}`;

    const ai = await generateWabaAiText({
      systemPrompt,
      messages: [{ role: 'user', content: 'Redacta el siguiente mensaje para este cliente.' }],
      maxTokens: 350,
    });
    const draft = normalizeKiaCopilotDraft(ai?.text ?? '', locale);

    if (!draft) return NextResponse.json({ error: 'La IA no generó respuesta' }, { status: 500 });

    return NextResponse.json({ draft, quickReplies: fallbackQuickReplies(locale) });
  } catch (err) {
    console.error('[WA ai-compose]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
