import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'owner') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json() as {
    messages?: Array<{ from: string; fromEmail: string; body: string; bodyType: string; date: string }>;
    subject?: string;
    // Compose mode: draft a new email instead of replying
    compose?: boolean;
    composeTo?: string;
    composeTopic?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (body.compose) {
    // ── Draft a brand-new email ─────────────────────────────────────
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `Eres Ksenia, consultora de Expert Consulting (asesoría fiscal e inmigración en España).
Redactas correos profesionales, cálidos y concisos en español.
Devuelve un JSON con dos campos:
- "subject": asunto del correo (max 10 palabras)
- "body": cuerpo del correo (sin saludo genérico, sin firma, max 150 palabras)
Responde SOLO con JSON válido, sin markdown ni texto extra.`,
      messages: [{
        role: 'user',
        content: `Redacta un correo${body.composeTo ? ` para ${body.composeTo}` : ''} sobre: ${body.composeTopic ?? 'información general de nuestros servicios'}.`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ subject: parsed.subject ?? '', suggestion: parsed.body ?? '' });
    } catch {
      return NextResponse.json({ subject: '', suggestion: raw });
    }
  }

  // ── Suggest reply to existing thread ──────────────────────────────
  const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const conversationText = (body.messages ?? [])
    .map((m) => {
      const bodyText = m.bodyType === 'html' ? strip(m.body) : m.body;
      return `De: ${m.from || m.fromEmail}\n${bodyText.slice(0, 600)}`;
    })
    .join('\n\n---\n\n');

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `Eres Ksenia, consultora de Expert Consulting (asesoría fiscal e inmigración en España).
Redactas respuestas de correo profesionales, cálidas y concisas en español.
Responde ÚNICAMENTE con el cuerpo del mensaje — sin saludo genérico tipo "Estimado/a", sin asunto, sin firma.
Máximo 120 palabras.`,
    messages: [{
      role: 'user',
      content: `Sugiere una respuesta para este hilo de correo:\n\nAsunto: ${body.subject ?? ''}\n\n${conversationText}`,
    }],
  });

  const suggestion = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  return NextResponse.json({ suggestion });
}
