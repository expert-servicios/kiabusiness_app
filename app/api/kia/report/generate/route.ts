import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { generateWabaAiText, type WabaAiMessage } from '@/lib/integrations/waba-ai';
import { SERVICES } from '@/lib/integrations/kia-engine';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';

const bodySchema = z.object({
  phone_number: z.string().min(1),
  service_id  : z.string().min(1),
  lang        : z.enum(['es', 'ru']).default('es'),
  precal_data : z.record(z.string(), z.string()).default({}),
  client_id   : z.string().uuid().nullable().optional(),
  generated_by: z.enum(['kia', 'admin', 'system']).default('kia'),
});

function verifyInternalSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error('[kia/report/generate] INTERNAL_API_SECRET not configured');
    return false;
  }
  return request.headers.get('x-internal-secret') === secret;
}

export async function POST(request: NextRequest) {
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { phone_number, service_id, lang, precal_data, client_id, generated_by } = parsed.data;
    const svc = SERVICES[service_id];

    if (!svc) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const admin = getSupabaseAdmin();

    // Look up lead_id if available
    const { data: lead } = await admin
      .from('leads')
      .select('id')
      .eq('phone', phone_number)
      .maybeSingle();

    // Build AI prompt for viability report
    const svcLabel = svc.label[lang];
    const dataLines = Object.entries(precal_data)
      .filter(([k]) => !k.startsWith('_') && !k.startsWith('kia_'))
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    const systemPrompt = `Eres un asesor experto de EXPERT Asesoría. Genera un informe de viabilidad estructurado en JSON para el servicio *${svcLabel}*, basado en los datos recopilados en el chat de WhatsApp.

Responde ÚNICAMENTE con JSON válido, sin texto antes ni después:
{
  "viabilidad": "alta" | "media" | "baja" | "no_viable",
  "riesgo": "string breve (1-2 frases) describiendo el principal riesgo o dificultad",
  "siguientes_pasos": "string con los 2-3 pasos más importantes a tomar",
  "documentos_extra": ["doc1", "doc2"] // documentos adicionales según respuestas del lead (puede estar vacío)
}

Reglas:
- viabilidad ALTA: el caso encaja bien, sin bloqueadores conocidos.
- viabilidad MEDIA: viable pero hay puntos a confirmar o documentar mejor.
- viabilidad BAJA: posibles bloqueadores, conviene revisión antes de pagar.
- no_viable: el caso claramente no encaja con este servicio.
- Usa el idioma: ${lang === 'ru' ? 'ruso' : 'español'}.
- Sé conciso y práctico. No inventes datos que no aparecen en las respuestas.`;

    const messages: WabaAiMessage[] = [
      {
        role: 'user',
        content: `Servicio solicitado: ${svcLabel}\n\nDatos del lead:\n${dataLines || '(sin datos)'}`,
      },
    ];

    let viabilidad: string = 'media';
    let riesgo = '';
    let siguientesPasos = '';
    let documentosExtra: string[] = [];

    try {
      const aiResult = await generateWabaAiText({ systemPrompt, messages, maxTokens: 600 });
      const text = aiResult?.text.trim() ?? '';
      if (text.startsWith('{')) {
        const parsed2 = JSON.parse(text) as {
          viabilidad?: string;
          riesgo?: string;
          siguientes_pasos?: string;
          documentos_extra?: string[];
        };
        if (['alta', 'media', 'baja', 'no_viable'].includes(parsed2.viabilidad ?? '')) {
          viabilidad = parsed2.viabilidad!;
        }
        riesgo          = parsed2.riesgo ?? '';
        siguientesPasos = parsed2.siguientes_pasos ?? '';
        documentosExtra = Array.isArray(parsed2.documentos_extra) ? parsed2.documentos_extra : [];
      }
    } catch (e) {
      console.error('[kia/report/generate] AI error:', e);
    }

    // Merge base docs with any extras from AI
    const allDocs = [...new Set([...svc.docs, ...documentosExtra])];

    const { data: report, error: insertError } = await admin
      .from('kia_reports')
      .insert({
        phone_number,
        lead_id         : lead?.id ?? null,
        client_id       : client_id ?? null,
        service_id,
        service_label   : svc.label.es,
        service_area    : svc.area,
        viabilidad,
        documentos      : allDocs,
        riesgo,
        precio_catalogo : null,
        siguientes_pasos: siguientesPasos,
        precal_data,
        perfil_data     : {},
        generated_by,
        lang,
      })
      .select('id')
      .single();

    if (insertError || !report) {
      console.error('[kia/report/generate] insert error:', insertError?.message);
      return NextResponse.json({ error: 'Error guardando informe' }, { status: 500 });
    }

    // Send WhatsApp notification to the user with portal link
    const reportUrl = absoluteAppUrl(`/dashboard/informe/${report.id}`);
    const viabilidadEmoji = { alta: '🟢', media: '🟡', baja: '🔴', no_viable: '⛔' }[viabilidad] ?? '📋';
    const notifyBody = lang === 'ru'
      ? `${viabilidadEmoji} Ваш отчёт о виabilidad *${svc.label.ru}* готов.\n\nПросмотреть отчёт:\n${reportUrl}\n\nEXPERT 💼`
      : `${viabilidadEmoji} Tu informe de viabilidad para *${svc.label.es}* está listo.\n\nConsúltalo aquí:\n${reportUrl}\n\nEXPERT 💼`;

    void sendWhatsAppMessage({ to: phone_number, body: notifyBody }).catch(
      (e: unknown) => console.error('[kia/report/generate] WA notify error:', e),
    );

    return NextResponse.json({ ok: true, reportId: report.id, reportUrl, viabilidad });
  } catch (err) {
    console.error('[kia/report/generate] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
