import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';
import { generateWabaAiText, getConfiguredWabaAiProviders } from '@/lib/integrations/waba-ai';
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
  history:   z.array(z.object({ direction: z.enum(['inbound','outbound']), body: z.string() })).max(40),
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
  if (/[А-Яа-яЁё]/.test(text)) {
    return 'ruso. Redacta en ruso natural usando alfabeto cirilico.';
  }
  if (/[À-ÿ¿¡]/.test(text) || /\b(hola|buenos|buenas|declaracion|declaración|renta|autonomo|autónomo|empresa)\b/i.test(text)) {
    return 'espanol.';
  }
  return 'el mismo idioma del ultimo mensaje del cliente.';
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
      .map((m) => `${m.direction === 'inbound' ? 'Cliente' : 'EXPERT'}: ${m.body}`)
      .join('\n');

    const lastInbound = [...history].reverse().find((m) => m.direction === 'inbound')?.body ?? '';
    const languageInstruction = detectLanguageInstruction(`${lastInbound}\n${intent ?? ''}`);

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
5. Devuelve ÚNICAMENTE el mensaje final listo para enviar. Sin explicaciones, sin prefijos, sin comillas.

FORMATO WHATSAPP OBLIGATORIO:
- Negrita: asterisco SIMPLE *texto* — NUNCA doble **texto**
- Cursiva: guión bajo _texto_
- Tachado: tilde ~texto~
- NO uses ##, ***, \`código\`, ni guiones de lista. Usa párrafos cortos.

CONVERSACIÓN RECIENTE (para contexto de idioma y tono):
${historyText || 'Sin historial previo.'}${replyToBlock}${checklistContext}`;

      const ai = await generateWabaAiText({
        systemPrompt: editPrompt,
        messages: [{ role: 'user', content: 'Edita y traduce el borrador.' }],
        maxTokens: 500,
      });
      const draft = cleanMarkdownForWhatsApp(ai?.text?.trim() ?? '');
      if (!draft) return NextResponse.json({ error: 'La IA no generó respuesta' }, { status: 500 });
      return NextResponse.json({ draft });
    }

    // ── COMPOSE mode: generate fresh response ────────────────────
    const intentText = intent ? `\nInstrucción del asesor: ${intent}` : '';
    const officialSourceContext = await buildOfficialSourceContext(`${historyText}\n${intent ?? ''}`);

    // Contact type instruction
    const contactTypeBlock = isClient
      ? `\nTIPO DE CONTACTO: CLIENTE\n- Tono de soporte/gestion profesional.\n- Usa contexto de expedientes si disponible.\n- No pidas datos que ya tiene.\n- No uses CTA generica si tiene expediente activo.\n- Si pide nuevo servicio, tratale como cliente existente.\n- Si hay dudas o complejidad, ofrece llamada/reunion; no plantees escalacion como salida normal.\n`
      : `\nTIPO DE CONTACTO: LEAD (aun no es cliente)\n- Tono comercial y orientativo.\n- Lleva a viabilidad, llamada 15 min o contratacion.\n- Pide solo datos minimos necesarios.\n- No hables de expedientes salvo que existan.\n- Cierra siempre con accion concreta.\n- Si hay riesgo, dudas o servicio complejo, recomienda llamada de 15 min antes de contratar.\n`;

    const systemPrompt = `Eres el asistente de redacción de mensajes de WhatsApp de EXPERT Asesoría, gestoría española y Partner Oficial de Holded.
Ayudas al asesor humano a redactar mensajes profesionales y proactivos para enviar a clientes.
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
- Si el contexto lo permite, termina con una CTA suave: reservar cita, ver planes, pedir presupuesto o ver Holded.
- Si el mensaje habla de Holded, menciona que EXPERT es Partner Oficial, ofrece demo gratuita y enlaza la página.
- Máximo 3 párrafos cortos. Firma como "Asesoría EXPERT 💼" si es apropiado.
- FORMATO WHATSAPP: negrita con *asterisco simple*, NO con **doble asterisco**. Cursiva con _guión bajo_. NUNCA uses ##, ***, ni listas markdown.
- Si hay fuentes oficiales disponibles, usalas como apoyo y comparte 1 o 2 enlaces oficiales utiles.
- No digas que has comprobado informacion oficial si no aparece en FUENTES OFICIALES DISPONIBLES.
- Lee TODA LA CONVERSACIÓN RECIENTE antes de redactar. No repitas información ya dada. Muestra continuidad y memoria: si el cliente ya proporcionó un dato, no lo vuelvas a pedir.

${officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.'}

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
    const draft = cleanMarkdownForWhatsApp(ai?.text ?? '');

    if (!draft) return NextResponse.json({ error: 'La IA no generó respuesta' }, { status: 500 });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error('[WA ai-compose]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
