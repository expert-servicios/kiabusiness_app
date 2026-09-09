/**
 * IMP-022: Kia copiloto in-app — endpoint de chat para el widget flotante.
 *
 * POST /api/ai/kia
 * Body: { message, sessionId?, currentPage?, currentTask?, pageData?, companyId?, history? }
 * Auth: usuario autenticado (cookie de sesión Supabase SSR).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import { checkKiaDailyCostCap, checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { resolveKiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import { buildKiaCopilotArtifacts } from '@/lib/ai/kia/kia-copilot-artifacts';
import { buildKiaPresentationContext } from '@/lib/ai/kia/kia-presentation-context-builder';

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(1200),
}).strict();

const requestSchema = z.object({
  message     : z.string().min(1).max(4000),
  sessionId   : z.string().uuid().optional(),
  currentPage : z.string().max(200).optional(),
  currentTask : z.string().max(200).optional(),
  pageData    : z.record(z.string(), z.unknown()).optional(),
  companyId   : z.string().uuid().optional(),
  history     : z.array(historyItemSchema).max(8).optional(),
}).strict();

const LEGACY_DASHBOARD_SAFE_TOOLS = [
  'get_user_expedientes',
  'get_user_companies',
  'get_user_pending_docs',
  'get_case_status',
  'get_holded_connection_status',
  'get_holded_invoices',
  'get_holded_contacts',
  'get_holded_bank_balance',
  'get_company_status_snapshot',
  'generate_company_report',
  'generate_holded_connection_link',
  'generate_profile_link',
  'generate_checkout_gate_link',
] as const;

function sessionCompanyId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const value = (data as Record<string, unknown>).company_id;
  return typeof value === 'string' ? value : null;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!checkKiaMessageRateLimit(user.id)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const costCap = await checkKiaDailyCostCap(user.id);
  if (!costCap.ok) {
    return NextResponse.json({ error: 'daily_cost_cap_reached' }, { status: 429 });
  }

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
  const { message, sessionId, currentPage, currentTask, pageData, companyId, history = [] } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('tenant_id, active_company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[KiaCopilot] profile lookup failed:', profileError.message);
    return NextResponse.json({ error: 'profile_lookup_failed' }, { status: 500 });
  }

  const resolvedCompanyId = companyId ?? profile?.active_company_id ?? undefined;

  if (resolvedCompanyId) {
    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', user.id)
      .eq('company_id', resolvedCompanyId)
      .maybeSingle();

    if (membershipError) {
      console.error('[KiaCopilot] company membership lookup failed:', membershipError.message);
      return NextResponse.json({ error: 'company_membership_check_failed' }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json(
        {
          error: companyId ? 'company_forbidden' : 'active_company_invalid',
          reply: companyId
            ? 'La entidad seleccionada no pertenece a tu cuenta.'
            : 'La entidad activa ya no está disponible. Selecciona una de tus empresas antes de usar KIA.',
          avatarState: 'aviso',
          artifacts: [],
        },
        { status: companyId ? 403 : 409 },
      );
    }
  }

  const companyScope = resolvedCompanyId ?? null;
  let effectiveSessionId = sessionId;
  let effectiveHistory = history;

  // A client component can survive router.refresh() when the active company is
  // switched. Bind each KIA session to the company scope server-side so stale
  // history from another entity can never enter the new company's context.
  if (sessionId) {
    const { data: existingSession, error: sessionError } = await admin
      .from('kia_sessions')
      .select('id, data')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (sessionError) {
      console.error('[KiaCopilot] session scope lookup failed:', sessionError.message);
      return NextResponse.json({ error: 'session_scope_check_failed' }, { status: 500 });
    }

    if (!existingSession || sessionCompanyId(existingSession.data) !== companyScope) {
      effectiveSessionId = undefined;
      effectiveHistory = [];
    }
  }

  const historyTimestamp = new Date().toISOString();
  const syntheticRecentMessages = effectiveHistory.map((item) => ({
    role: item.role,
    text: item.text,
    createdAt: historyTimestamp,
  }));

  let result;
  try {
    result = await runKiaDecision({
      taskType   : 'waba_reply',
      channel    : 'dashboard',
      message,
      locale     : 'es',
      allowTools : true,
      forceToolExecution: process.env.KIA_COPILOT_TOOLS_ENABLED?.toLowerCase() !== 'false',
      allowedToolNames: [...LEGACY_DASHBOARD_SAFE_TOOLS],
      contextInput: {
        channel     : 'dashboard',
        userId      : user.id,
        clientId    : user.id,
        companyId   : resolvedCompanyId,
        currentPage : currentPage ?? '/',
        currentTask : currentTask,
        pageData    : pageData,
        latestMessage: message,
        syntheticRecentMessages,
      },
    });
  } catch (err) {
    console.error('[KiaCopilot] runKiaDecision failed:', err);
    return NextResponse.json(
      {
        error: 'kia_error',
        reply: 'Lo siento, tengo un problema técnico en este momento. Inténtalo de nuevo.',
        avatarState: 'aviso',
        artifacts: [],
      },
      { status: 500 }
    );
  }

  const presentationContext = buildKiaPresentationContext(result.toolResults);
  const avatarState = resolveKiaAvatarState({
    decision: result.decision,
    userMessage: message,
    presentationContext,
  });
  const artifacts = buildKiaCopilotArtifacts(result.toolResults, result.decision);

  try {
    const sessionData = {
      last_message: message,
      last_reply  : result.userMessage,
      intent      : result.decision.intent,
      next_action : result.decision.nextAction,
      avatar_state: avatarState,
      company_id  : companyScope,
    };

    if (effectiveSessionId) {
      await admin
        .from('kia_sessions')
        .update({ data: sessionData, updated_at: new Date().toISOString() })
        .eq('id', effectiveSessionId)
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
    console.warn('[KiaCopilot] session save failed:', err);
  }

  const response = NextResponse.json({
    reply      : result.userMessage,
    quickReplies: (result.decision.quickReplies ?? []).map((reply) => reply.title),
    intent     : result.decision.intent,
    nextAction : result.decision.nextAction,
    avatarState,
    artifacts,
  });
  if (effectiveSessionId) response.headers.set('x-kia-session-id', effectiveSessionId);
  return response;
}
