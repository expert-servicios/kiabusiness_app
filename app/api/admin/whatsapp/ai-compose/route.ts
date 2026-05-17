import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
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
  clientId:  z.string().uuid().optional(),
  phone:     z.string().min(1),
  history:   z.array(z.object({ direction: z.enum(['inbound','outbound']), body: z.string() })).max(20),
  intent:    z.string().max(500).optional(), // admin hint: "ask for DNI", "confirm appointment", etc.
});

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { clientId, history, intent } = parsed.data;

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
    }

    const historyText = history.slice(-10)
      .map((m) => `${m.direction === 'inbound' ? 'Cliente' : 'EXPERT'}: ${m.body}`)
      .join('\n');

    const intentText = intent ? `\nInstrucción del asesor: ${intent}` : '';
    const lastInbound = [...history].reverse().find((m) => m.direction === 'inbound')?.body ?? '';
    const languageInstruction = detectLanguageInstruction(`${lastInbound}\n${intent ?? ''}`);

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
- Máximo 3 párrafos cortos. No uses markdown ni listas con guiones. Firma como "Asesoría EXPERT 💼" si es apropiado.

CONTEXTO DEL CLIENTE:
${clientContext}${intentText}

CONVERSACIÓN RECIENTE:
${historyText || 'Sin historial previo.'}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Redacta el siguiente mensaje para este cliente.' }],
      }),
    });

    const data = await res.json();
    const draft: string = data?.content?.[0]?.text ?? '';

    if (!draft) return NextResponse.json({ error: 'La IA no generó respuesta' }, { status: 500 });

    return NextResponse.json({ draft: draft.trim() });
  } catch (err) {
    console.error('[WA ai-compose]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
