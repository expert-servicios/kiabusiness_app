/**
 * IMP-022: Kia copiloto in-app — endpoint de chat para el widget flotante.
 *
 * POST /api/ai/kia
 * Body: { message, sessionId?, currentPage?, currentTask?, pageData?, companyId? }
 * Auth: usuario autenticado (cookie de sesión Supabase SSR).
 *
 * El canal es siempre 'dashboard'. La tarea es 'waba_reply' para respuestas
 * conversacionales directas (low effort, rápido).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';

export const maxDuration = 60; // Anthropic calls can exceed the 30s Vercel default

const requestSchema = z.object({
  message     : z.string().min(1).max(4000),
  sessionId   : z.string().uuid().optional(),
  currentPage : z.string().max(200).optional(),
  currentTask : z.string().max(200).optional(),
  pageData    : z.record(z.string(), z.unknown()).optional(),
  companyId   : z.string().uuid().optional(),
}).strict();

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { message, sessionId, currentPage, currentTask, pageData, companyId } = parsed.data;

  // ── Resolver tenant para contexto ─────────────────────────────────────────
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id, active_company_id')
    .eq('id', user.id)
    .maybeSingle();

  const resolvedCompanyId = companyId ?? profile?.active_company_id ?? undefined;

  // ── Ejecutar decisión Kia ─────────────────────────────────────────────────
  let result;
  try {
    result = await runKiaDecision({
      taskType   : 'waba_reply',
      channel    : 'dashboard',
      message,
      locale     : 'es',
      allowTools : true,
      contextInput: {
        channel     : 'dashboard',
        userId      : user.id,
        clientId    : user.id,
        companyId   : resolvedCompanyId,
        currentPage : currentPage ?? '/',
        currentTask : currentTask,
        pageData    : pageData,
        latestMessage: message,
      },
    });
  } catch (err) {
    console.error('[KiaCopilot] runKiaDecision failed:', err);
    return NextResponse.json(
      { error: 'kia_error', reply: 'Lo siento, tengo un problema técnico en este momento. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }

  // ── Guardar sesión en kia_sessions ────────────────────────────────────────
  let effectiveSessionId = sessionId;
  try {
    const sessionData = {
      last_message: message,
      last_reply  : result.userMessage,
      intent      : result.decision.intent,
      next_action : result.decision.nextAction,
    };

    if (sessionId) {
      await admin
        .from('kia_sessions')
        .update({ data: sessionData, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);
    } else {
      const { data: createdSession } = await admin
        .from('kia_sessions')
        .insert({
          channel  : 'dashboard',
          user_id  : user.id,
          phone    : null,
          data     : sessionData,
        })
        .select('id')
        .single();
      effectiveSessionId = createdSession?.id ?? undefined;
    }
  } catch (err) {
    // No-fatal: el chat sigue funcionando aunque no se guarde la sesión
    console.warn('[KiaCopilot] session save failed:', err);
  }

  // ── Persistir decision log (no-fatal) ─────────────────────────────────────
  const response = NextResponse.json({
    reply      : result.userMessage,
    quickReplies: (result.decision.quickReplies ?? []).map((reply) => reply.title),
    intent     : result.decision.intent,
    nextAction : result.decision.nextAction,
  });
  if (effectiveSessionId) response.headers.set('x-kia-session-id', effectiveSessionId);
  return response;
}
