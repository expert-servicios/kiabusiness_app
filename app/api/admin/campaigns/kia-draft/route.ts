import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import Anthropic from '@anthropic-ai/sdk';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' || p?.role === 'owner';
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
  }

  const { topic, audience, tone, extraContext } = await request.json() as {
    topic?: string;
    audience?: string;
    tone?: 'profesional' | 'cercano' | 'urgente' | 'informativo';
    extraContext?: string;
  };

  if (!topic) return NextResponse.json({ error: 'topic es obligatorio' }, { status: 400 });

  const toneDesc = {
    profesional: 'formal y profesional, uso del usted',
    cercano: 'cálido y cercano, uso del tuteo',
    urgente: 'directo y urgente, enfocado en la llamada a la acción',
    informativo: 'educativo e informativo, sin presión',
  }[tone ?? 'cercano'] ?? 'cálido y cercano';

  const audienceDesc = audience ?? 'clientes de una asesoría fiscal e inmigración en España';

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    system: `Eres Ksenia, consultora senior de Expert Consulting (asesoría fiscal, contable e inmigración en España).
Redactas emails de marketing profesionales en español para la empresa.
Devuelve ÚNICAMENTE un JSON con estos campos:
{
  "subject": "asunto del email (máx 70 chars, persuasivo)",
  "preview": "texto de preview que ve el cliente en el inbox (máx 100 chars)",
  "html": "cuerpo del email en HTML simple (usa párrafos, negritas, 1 llamada a la acción; máx 400 palabras; NO incluir head, body, footer ni unsubscribe)"
}
El HTML debe ser simple, limpio, compatible con email clients. Usa colores corporativos: fondo blanco, texto #07111d, acento #D4A017 (dorado), sin imágenes.
No incluyas saludo genérico de apertura ("Estimado/a cliente") — empieza con el gancho directamente.`,
    messages: [{
      role: 'user',
      content: `Redacta un email de marketing sobre: "${topic}"
Audiencia: ${audienceDesc}
Tono: ${toneDesc}
${extraContext ? `Contexto adicional: ${extraContext}` : ''}`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';

  try {
    // Extract JSON (sometimes Claude wraps in markdown code block)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? raw);
    return NextResponse.json({
      subject: parsed.subject ?? '',
      preview: parsed.preview ?? '',
      html: parsed.html ?? '',
    });
  } catch {
    return NextResponse.json({ subject: '', preview: '', html: raw });
  }
}
