import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';
import { generateWabaAiText, getConfiguredWabaAiProviders } from '@/lib/integrations/waba-ai';
import { formatChecklistForPrompt, getChecklistsByCategory, getServiceChecklist } from '@/lib/utils/service-checklists';
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

    const { clientId, history, intent, mode, serviceId } = parsed.data;

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

    if (clientId) {
      const [{ data: profile }, { data: cases }] = await Promise.all([
        admin.from('profiles').select('full_name, email').eq('id', clientId).single(),
        admin.from('cases').select('service, state, opened_at').eq('client_id', clientId).order('opened_at', { ascending: false }).limit(3),
      ]);

      const name = profile?.full_name ?? 'el cliente';
      const caseList = (cases ?? [])
        .map((c: { service: string; state: string; opened_at: string }) =>
          `- ${c.service}: estado "${c.state}"`)
        .join('\n');

      clientContext = `Cliente: ${name}\nExpedientes:\n${caseList || 'Ninguno'}`;

      // Infer checklist from most recent case when no explicit serviceId given
      if (!serviceId && cases && cases.length > 0) {
        const latestService = cases[0].service as string;
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
${historyText || 'Sin historial previo.'}${checklistContext}`;

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

    const systemPrompt = `Eres el asistente de redacción de mensajes de WhatsApp de EXPERT Asesoría, gestoría española y Partner Oficial de Holded.
Ayudas al asesor humano a redactar mensajes profesionales y proactivos para enviar a clientes.
Nuestra web es https://expertconsulting.es

PÁGINAS CLAVE (incluye el enlace completo cuando sea relevante para el mensaje):
• Servicios → https://expertconsulting.es/servicios
• Planes y precios → https://expertconsulting.es/planes
• Solicitar presupuesto → https://expertconsulting.es/solicitar-presupuesto
• Reservar cita gratuita → https://expertconsulting.es/cita
• Holded con EXPERT → https://expertconsulting.es/holded
• Formación Holded → https://expertconsulting.es/servicios/formacion

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
