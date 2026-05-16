import { NextRequest, NextResponse } from 'next/server';
import { logWhatsAppConversation, mapWhatsAppMessageToClient, sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

// Meta webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ received: true });
    }

    const admin = getSupabaseAdmin();
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, phone, full_name')
      .not('phone', 'is', null);

    for (const msg of messages) {
      if (msg.type !== 'text') continue;

      const from: string = msg.from;
      const msgBody: string = msg.text?.body ?? '';
      const messageId: string = msg.id;
      const clientId = mapWhatsAppMessageToClient(from, profiles ?? []) ?? undefined;

      // Log inbound message
      await logWhatsAppConversation({
        clientId,
        phoneNumber: from,
        direction: 'inbound',
        body: msgBody,
        whatsappMessageId: messageId,
      });

      // Try AI response
      const aiResult = await generateAiResponse({ clientId, from, msgBody, admin });

      if (aiResult.reply) {
        const sent = await sendWhatsAppMessage({ to: from, body: aiResult.reply });
        if (sent.success) {
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: aiResult.reply,
            whatsappMessageId: sent.messageId,
            aiResponded: true,
            needsReview: false,
          });
        }
      } else {
        // AI couldn't answer — mark inbound as needs_review
        await admin
          .from('whatsapp_conversations')
          .update({ needs_review: true })
          .eq('phone_number', from)
          .eq('direction', 'inbound')
          .is('read_at', null);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp webhook] error:', error);
    return NextResponse.json({ received: true });
  }
}

interface AiContext {
  clientId?: string;
  from: string;
  msgBody: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any;
}

async function generateAiResponse({ clientId, msgBody, admin }: AiContext): Promise<{ reply: string | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { reply: null };

  let clientContext = '';

  if (clientId) {
    const [{ data: profile }, { data: cases }, { data: obligations }] = await Promise.all([
      admin.from('profiles').select('full_name, email, phone').eq('id', clientId).single(),
      admin.from('cases').select('service, category, state, opened_at').eq('client_id', clientId).order('opened_at', { ascending: false }).limit(5),
      admin.from('fiscal_obligations').select('modelo, description, deadline, status').eq('user_id', clientId).eq('status', 'pending').order('deadline').limit(5),
    ]);

    const name = profile?.full_name ?? 'el cliente';
    const caseList = (cases ?? []).map((c: { service: string; category: string; state: string; opened_at: string }) =>
      `- ${c.service} (${c.category}): estado "${c.state}", abierto el ${new Date(c.opened_at).toLocaleDateString('es-ES')}`
    ).join('\n');
    const obList = (obligations ?? []).map((o: { modelo: string; description: string; deadline: string }) =>
      `- M${o.modelo} ${o.description}: vence ${new Date(o.deadline).toLocaleDateString('es-ES')}`
    ).join('\n');

    clientContext = `
Cliente: ${name}
Expedientes activos:
${caseList || 'Ninguno'}
Obligaciones fiscales pendientes:
${obList || 'Ninguna'}
`;
  } else {
    clientContext = 'Número desconocido — no hay cliente registrado con este teléfono.';
  }

  const systemPrompt = `Eres el asistente virtual de EXPERT Asesoría, gestoría española y Partner Oficial de Holded (solución ERP/CRM líder para pymes en España).
Nuestra web es https://expertconsulting.es

SERVICIOS QUE OFRECEMOS:
• Fiscal: declaraciones IRPF, IVA (Mod. 303/390), Impuesto de Sociedades (Mod. 200), RETA, altas/bajas censales.
• Extranjería y residencia: NIE, permiso de residencia inicial y renovación, arraigo, nacionalidad, reagrupación familiar.
• Constitución de empresa: SL, autónomo, cambios estatutarios, ampliaciones de capital.
• Laboral y nóminas: contratos, nóminas, Seguridad Social, despidos, ERTEs.
• Gestión contable y administrativa: contabilidad, libros oficiales, cuentas anuales.
• Holded (Partner Oficial): implantación ERP, formación, configuración de módulos (facturación, contabilidad, inventario, proyectos, RRHH, CRM), soporte continuo, integraciones Shopify/Amazon/bancos, migración desde otros sistemas. Demo gratuita disponible.

PÁGINAS CLAVE PARA COMPARTIR CON EL CLIENTE (usa el enlace completo, siempre que sea relevante):
• Ver todos los servicios → https://expertconsulting.es/servicios
• Planes y precios → https://expertconsulting.es/planes
• Solicitar presupuesto personalizado → https://expertconsulting.es/solicitar-presupuesto
• Reservar cita gratuita → https://expertconsulting.es/cita
• Holded con EXPERT → https://expertconsulting.es/holded
• Formación Holded → https://expertconsulting.es/servicios/formacion
• Contacto → https://expertconsulting.es/contacto

ACTITUD PROACTIVA — MUY IMPORTANTE:
- Cuando el cliente pregunte por algo genérico (precio, trámite, plazo...) responde brevemente Y ofrece de forma natural el siguiente paso concreto: reservar cita, solicitar presupuesto o ver planes.
- Si el cliente dice que es autónomo, empresa, o tiene necesidad concreta → sugiere el servicio o plan más adecuado e incluye el enlace.
- Si el cliente pregunta por Holded → explica que somos Partner Oficial, ofrece una demo gratuita y enlaza https://expertconsulting.es/holded
- Termina cada respuesta con una CTA suave pero clara: p.ej. "¿Te apetece que concretemos? Puedes reservar una llamada gratuita en https://expertconsulting.es/cita 📅" o "Puedes ver nuestros planes en https://expertconsulting.es/planes ✅".
- Adapta la CTA al contexto: no siempre la misma. Varía entre: reservar cita, pedir presupuesto, ver planes, ver servicios, ver Holded.

REGLAS:
- Responde siempre en el idioma del cliente (español o cualquier otro).
- Sé cercano, usa algún emoji ocasional para humanizar (✅ 👋 😊 📋 📅 💼 🚀 etc.).
- Si la pregunta requiere una decisión profesional, documentación específica o está fuera del contexto, responde EXACTAMENTE con: [NEEDS_REVIEW]
- No inventes plazos, precios ni documentos.
- Máximo 3 párrafos cortos. Firma como "Asesoría EXPERT 💼".

CONTEXTO DEL CLIENTE:
${clientContext}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: msgBody }],
      }),
    });

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';

    if (!text || text.includes('[NEEDS_REVIEW]')) return { reply: null };
    return { reply: text.trim() };
  } catch (err) {
    console.error('[WhatsApp AI] error:', err);
    return { reply: null };
  }
}
