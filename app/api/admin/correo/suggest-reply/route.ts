import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { messages, subject } = await request.json() as {
    messages: Array<{ from: string; fromEmail: string; body: string; bodyType: string; date: string }>;
    subject?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
  }

  const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const conversationText = (messages ?? [])
    .map((m) => {
      const body = m.bodyType === 'html' ? strip(m.body) : m.body;
      return `De: ${m.from || m.fromEmail}\n${body.slice(0, 600)}`;
    })
    .join('\n\n---\n\n');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `Eres Ksenia, consultora de Expert Consulting (asesoría fiscal e inmigración en España).
Redactas respuestas de correo profesionales, cálidas y concisas en español.
Responde ÚNICAMENTE con el cuerpo del mensaje — sin saludo genérico tipo "Estimado/a", sin asunto, sin firma.
Máximo 120 palabras.`,
    messages: [{
      role: 'user',
      content: `Sugiere una respuesta para este hilo de correo:\n\nAsunto: ${subject ?? ''}\n\n${conversationText}`,
    }],
  });

  const suggestion = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  return NextResponse.json({ suggestion });
}
