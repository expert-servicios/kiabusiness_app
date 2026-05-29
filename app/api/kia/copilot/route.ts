/**
 * POST /api/kia/copilot
 *
 * Dashboard-embedded Kia copilot endpoint.
 * Receives the user's message + current page context and runs a Kia decision.
 *
 * Unlike the WABA endpoint, this one:
 * - Is authenticated (requires Supabase session)
 * - Passes currentPage, currentTask, pageData to KIA for proactive support
 * - Always uses channel='dashboard' taskType='company_status_summary'
 * - Never executes write tools — read-only copilot mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';

const bodySchema = z.object({
  message    : z.string().min(1).max(2000),
  currentPage: z.string().max(200).optional(),
  currentTask: z.string().max(100).optional(),
  pageData   : z.record(z.string(), z.unknown()).optional(),
  lang       : z.enum(['es', 'ru']).optional(),
  history    : z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().max(1000),
  })).max(10).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { message, currentPage, currentTask, pageData, lang, history } = parsed.data;

  try {
    const result = await runKiaDecision({
      channel     : 'dashboard',
      taskType    : 'company_status_summary',
      message,
      locale      : lang,
      contextInput: {
        channel     : 'dashboard',
        userId      : user.id,
        clientId    : user.id,
        currentPage,
        currentTask,
        pageData,
        syntheticRecentMessages: history?.map((h) => ({
          role     : h.role === 'user' ? 'user' : 'assistant',
          text     : h.text,
          createdAt: new Date().toISOString(),
        })),
      },
      allowTools: true,
    });

    return NextResponse.json({
      ok         : true,
      message    : result.decision.userMessage,
      nextAction : result.decision.nextAction,
      quickReplies: result.decision.quickReplies,
      toolResults: result.toolResults,
      warnings   : result.decision.warnings,
    });
  } catch (err) {
    console.error('[kia/copilot]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno del copiloto' }, { status: 500 });
  }
}
