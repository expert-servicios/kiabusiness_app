import { NextRequest, NextResponse } from 'next/server';
import {
  logWhatsAppConversation,
  mapWhatsAppMessageToClient,
  sendWhatsAppMessage,
  sendWhatsAppInteractive,
} from '@/lib/integrations/whatsapp';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';

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

function extractMessageText(msg: Record<string, unknown>): string | null {
  const type = msg.type as string;

  if (type === 'text') {
    return (msg.text as { body?: string })?.body?.trim() || null;
  }

  if (type === 'interactive') {
    const interactive = msg.interactive as Record<string, unknown>;
    const iType = interactive?.type as string;
    if (iType === 'button_reply') {
      return (interactive.button_reply as { title?: string })?.title?.trim() || null;
    }
    if (iType === 'list_reply') {
      return (interactive.list_reply as { title?: string })?.title?.trim() || null;
    }
  }

  return null;
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
      const msgType = msg.type as string;
      if (!['text', 'interactive'].includes(msgType)) continue;

      const from: string = msg.from;
      const msgBody = extractMessageText(msg as Record<string, unknown>);
      if (!msgBody) continue;

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

      // Push notification to admins (non-blocking)
      const senderName = profiles?.find((p) => p.id === clientId)?.full_name ?? from;
      notifyAdmins({
        title: `WhatsApp de ${senderName}`,
        body: msgBody.length > 100 ? msgBody.slice(0, 97) + '…' : msgBody,
        url: '/admin/whatsapp',
        tag: `wa-${from}`,
      }).catch(() => {});

      // Fetch conversation history for context (last 8 turns, oldest first)
      const { data: history } = await admin
        .from('whatsapp_conversations')
        .select('direction, body, created_at')
        .eq('phone_number', from)
        .neq('whatsapp_message_id', messageId)
        .order('created_at', { ascending: false })
        .limit(8);

      const conversationHistory = (history ?? []).reverse() as { direction: string; body: string }[];

      // Generate AI response
      const aiResult = await generateAiResponse({ clientId, from, msgBody, admin, conversationHistory });

      if (aiResult.interactive) {
        const { body: interactiveBody, buttons } = aiResult.interactive;
        const waButtons = buttons.map((title, i) => ({ id: `opt_${i}`, title }));

        const sent = await sendWhatsAppInteractive({
          to: from,
          body: interactiveBody,
          footer: 'Asesoría EXPERT 💼',
          buttons: waButtons,
        });

        if (sent.success) {
          const loggedBody = `[Botones] ${interactiveBody} | ${waButtons.map((b) => b.title).join(' / ')}`;
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: loggedBody,
            whatsappMessageId: sent.messageId,
            aiResponded: true,
            needsReview: false,
          });
        }
      } else if (aiResult.reply) {
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
        // AI couldn't answer — mark conversation as needs_review
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
  conversationHistory: { direction: string; body: string }[];
}

interface AiResult {
  reply: string | null;
  interactive?: { body: string; buttons: string[] };
}

async function generateAiResponse({ clientId, msgBody, admin, conversationHistory }: AiContext): Promise<AiResult> {
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
    const caseList = (cases ?? [])
      .map(
        (c: { service: string; category: string; state: string; opened_at: string }) =>
          `- ${c.service} (${c.category}): estado "${c.state}", abierto el ${new Date(c.opened_at).toLocaleDateString('es-ES')}`
      )
      .join('\n');
    const obList = (obligations ?? [])
      .map(
        (o: { modelo: string; description: string; deadline: string }) =>
          `- M${o.modelo} ${o.description}: vence ${new Date(o.deadline).toLocaleDateString('es-ES')}`
      )
      .join('\n');

    clientContext = `Cliente: ${name}
Expedientes activos:
${caseList || 'Ninguno'}
Obligaciones fiscales pendientes:
${obList || 'Ninguna'}`;
  } else {
    clientContext = 'Número desconocido — no hay cliente registrado con este teléfono.';
  }

  const systemPrompt = `Eres el asistente virtual de EXPERT Asesoría, gestoría española y Partner Oficial de Holded (ERP/CRM líder para pymes en España).
Nuestra web: https://expertconsulting.es

SERVICIOS:
• Fiscal: IRPF, IVA (Mod. 303/390), Sociedades (Mod. 200), RETA, altas/bajas censales
• Extranjería: NIE, permisos de residencia, arraigo, nacionalidad, reagrupación familiar
• Empresa: constitución SL, autónomo, cambios estatutarios, ampliaciones de capital
• Laboral: contratos, nóminas, Seguridad Social, despidos, ERTEs
• Contabilidad: libros oficiales, cuentas anuales
• Holded (Partner Oficial): implantación ERP, formación, módulos (facturación, contabilidad, inventario, proyectos, RRHH, CRM), integraciones, demo gratuita

PÁGINAS CLAVE (comparte el enlace completo cuando sea relevante):
• Servicios → https://expertconsulting.es/servicios
• Planes y precios → https://expertconsulting.es/planes
• Presupuesto → https://expertconsulting.es/solicitar-presupuesto
• Cita gratuita → https://expertconsulting.es/cita
• Holded → https://expertconsulting.es/holded
• Formación Holded → https://expertconsulting.es/servicios/formacion

═══════════════════════════════════════
FORMATO DE RESPUESTA — ELIGE UNO:
═══════════════════════════════════════

OPCIÓN A — TEXTO (la mayoría de casos):
Responde directamente con texto claro y conciso. Máximo 3 párrafos cortos.
Termina siempre con una CTA natural con enlace. Firma: "Asesoría EXPERT 💼"

OPCIÓN B — BOTONES INTERACTIVOS (solo cuando la consulta es demasiado vaga para responder):
Responde ÚNICAMENTE con este JSON exacto, sin texto antes ni después:
{"type":"btns","body":"Tu mensaje introductorio aquí","buttons":["Botón 1","Botón 2","Botón 3"]}

Reglas de botones:
- Mínimo 2, máximo 3 botones
- Cada botón: máximo 20 caracteres, sin emojis ni puntuación especial
- El campo "body" puede tener hasta 1024 caracteres

CUÁNDO usar botones (consulta muy genérica, sin contexto):
✓ "Hola" / "Buenos días" / "Buenas"
✓ "Necesito ayuda" / "Tengo una pregunta"
✓ "¿Cuánto cuesta?" sin especificar qué
✓ "¿Qué servicios tenéis?"

CUÁNDO NO usar botones (responde con texto directamente):
✗ "¿Cuánto cuesta montar una SL?" → responde sobre constitución de empresa
✗ "Soy autónomo y quiero llevar mi contabilidad" → responde directamente
✗ "¿Qué es Holded?" → responde sobre Holded
✗ Si el usuario YA eligió un botón en el turno anterior → responde con texto, no pongas más botones
✗ Si hay historial de conversación y ya sabes qué quiere → responde con texto

ACTITUD PROACTIVA:
- Termina cada respuesta de texto con una CTA clara pero natural
- Varía la CTA: reservar cita, pedir presupuesto, ver planes, ver Holded...
- Si preguntan por Holded → menciona "Partner Oficial" y ofrece demo gratuita
- Adapta el tono: cercano pero profesional

REGLAS GENERALES:
- Responde siempre en el idioma del cliente (español u otro)
- Emojis con moderación: ✅ 👋 📋 📅 💼 🚀 😊
- Si requiere decisión profesional compleja o documentación específica → responde EXACTAMENTE: [NEEDS_REVIEW]
- Nunca inventes plazos, precios exactos ni documentos

CONTEXTO DEL CLIENTE:
${clientContext}`;

  // Build messages array with conversation history
  const messages: { role: 'user' | 'assistant'; content: string }[] = conversationHistory.map((h) => ({
    role: h.direction === 'inbound' ? 'user' : 'assistant',
    content: h.body,
  }));
  messages.push({ role: 'user', content: msgBody });

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
        max_tokens: 500,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await res.json();
    const text: string = data?.content?.[0]?.text?.trim() ?? '';

    if (!text || text.includes('[NEEDS_REVIEW]')) return { reply: null };

    // Detect interactive button response (starts with { "type": "btns" ... })
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text) as { type?: string; body?: string; buttons?: unknown[] };
        if (
          parsed.type === 'btns' &&
          typeof parsed.body === 'string' &&
          Array.isArray(parsed.buttons) &&
          parsed.buttons.length >= 2
        ) {
          const buttons = (parsed.buttons as unknown[])
            .filter((b): b is string => typeof b === 'string')
            .slice(0, 3)
            .map((b) => b.slice(0, 20));

          if (buttons.length >= 2) {
            return { reply: null, interactive: { body: parsed.body, buttons } };
          }
        }
      } catch {
        // Not valid JSON — fall through to text response
      }
    }

    return { reply: text };
  } catch (err) {
    console.error('[WhatsApp AI] error:', err);
    return { reply: null };
  }
}
