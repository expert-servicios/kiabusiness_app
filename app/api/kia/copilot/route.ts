/**
 * POST /api/kia/copilot
 *
 * Dashboard-embedded Kia copilot endpoint.
 *
 * It is authenticated, uses the structured Kia Decision Engine, executes only a
 * safe dashboard tool allowlist, and returns UI artifacts for report links,
 * secure actions and compact tables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import type { KiaTaskType } from '@/lib/ai/kia/kia-output-schema';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';
import { generateCompanyReport } from '@/lib/reports/report-generator';
import { absoluteAppUrl } from '@/lib/utils/app-url';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  currentPage: z.string().max(200).optional(),
  currentTask: z.string().max(100).optional(),
  pageData: z.record(z.string(), z.unknown()).optional(),
  lang: z.enum(['es', 'ru']).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().max(1000),
  })).max(10).optional(),
});

const DASHBOARD_SAFE_TOOLS = [
  'get_holded_connection_status',
  'get_holded_invoices',
  'get_holded_contacts',
  'get_holded_bank_balance',
  'get_company_status_snapshot',
  'generate_company_report',
  'generate_holded_connection_link',
] as const;

type CopilotArtifact =
  | { type: 'report'; title: string; url: string; period?: string; cta: string }
  | { type: 'table'; title: string; columns: string[]; rows: Array<Record<string, unknown>> }
  | { type: 'link'; title: string; url: string; cta: string; tone?: 'warning' | 'info' };

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { message, currentPage, currentTask, pageData, lang, history } = parsed.data;
  const taskType = resolveCopilotTaskType(message, currentPage, currentTask);

  try {
    const result = await runKiaDecision({
      channel: 'dashboard',
      taskType,
      message,
      locale: lang,
      contextInput: {
        channel: 'dashboard',
        userId: user.id,
        clientId: user.id,
        currentPage,
        currentTask,
        pageData,
        syntheticRecentMessages: history?.map((item) => ({
          role: item.role === 'user' ? 'user' : 'assistant',
          text: item.text,
          createdAt: new Date().toISOString(),
        })),
      },
      allowTools: true,
      forceToolExecution: process.env.KIA_COPILOT_TOOLS_ENABLED?.toLowerCase() !== 'false',
      allowedToolNames: [...DASHBOARD_SAFE_TOOLS],
    });

    const toolArtifacts = buildArtifactsFromToolResults(result.toolResults);
    const artifacts = [
      ...toolArtifacts,
      ...await maybeGenerateReportArtifact({
        userId: user.id,
        message,
        currentPage,
        currentTask,
        nextAction: result.decision.nextAction,
        existingArtifacts: toolArtifacts,
        lang: lang ?? result.context.contact.language,
      }),
    ];

    const messageWithArtifacts = artifacts.some((artifact) => artifact.type === 'report') &&
      !/(informe|grafico|dashboard|estado de empresa)/i.test(normalizeSearchText(result.decision.userMessage))
      ? `${result.decision.userMessage}\n\nHe preparado un informe visual con los datos de Holded para que puedas verlo en el panel.`
      : result.decision.userMessage;

    // Stream the text word by word, then send a done event with metadata
    const encoder = new TextEncoder();
    const textToStream = messageWithArtifacts;
    const meta = {
      artifacts,
      quickReplies: result.decision.quickReplies ?? [],
      nextAction: result.decision.nextAction,
      warnings: result.decision.warnings,
    };

    const stream = new ReadableStream({
      async start(controller) {
        // Split into chunks preserving spaces (alternate: word, space, word...)
        const chunks = textToStream.split(/(\s+)/);
        for (const chunk of chunks) {
          if (!chunk) continue;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`));
          await new Promise<void>((r) => setTimeout(r, 18));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, ...meta })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[kia/copilot]', err instanceof Error ? err.message : err);
    return new Response(
      `data: ${JSON.stringify({ done: true, error: 'Error interno del copiloto', artifacts: [], quickReplies: [] })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }
    );
  }
}

function resolveCopilotTaskType(message: string, currentPage?: string, currentTask?: string): KiaTaskType {
  const text = normalizeSearchText(`${message} ${currentPage ?? ''} ${currentTask ?? ''}`);
  if (/(informe|report|dashboard|grafico|estado de empresa|ventas|gastos|iva|tesoreria|banco|holded)/.test(text)) {
    return /(anomalia|descuadre|duplicad|no cuadra|concili)/.test(text)
      ? 'accounting_anomaly_review'
      : 'company_status_summary';
  }
  if (/(expediente|documento|perfil|pagar|contratar|suscripcion)/.test(text)) {
    return 'lead_client_decision';
  }
  return 'company_status_summary';
}

function buildArtifactsFromToolResults(toolResults: KiaToolResult[]): CopilotArtifact[] {
  const artifacts: CopilotArtifact[] = [];

  for (const toolResult of toolResults) {
    if (!toolResult.ok || !toolResult.result) continue;
    const result = toolResult.result;

    if (toolResult.toolName === 'generate_company_report' && typeof result.reportUrl === 'string') {
      artifacts.push({
        type: 'report',
        title: typeof result.title === 'string' ? result.title : 'Informe visual de empresa',
        url: result.reportUrl,
        period: typeof result.period === 'string' ? result.period : undefined,
        cta: 'Abrir informe visual',
      });
    }

    if (toolResult.toolName === 'get_holded_bank_balance' && Array.isArray(result.accounts)) {
      artifacts.push({
        type: 'table',
        title: 'Saldos bancarios en Holded',
        columns: ['Cuenta', 'Saldo', 'Moneda'],
        rows: result.accounts.map((account) => ({
          Cuenta: safeText((account as Record<string, unknown>).name),
          Saldo: (account as Record<string, unknown>).balance ?? 0,
          Moneda: safeText((account as Record<string, unknown>).currency ?? 'EUR'),
        })),
      });
    }

    if (toolResult.toolName === 'get_holded_invoices' && Array.isArray(result.documents)) {
      artifacts.push({
        type: 'table',
        title: 'Documentos recientes en Holded',
        columns: ['Numero', 'Contacto', 'Total', 'Estado'],
        rows: result.documents.map((doc) => ({
          Numero: safeText((doc as Record<string, unknown>).number),
          Contacto: safeText((doc as Record<string, unknown>).contact),
          Total: (doc as Record<string, unknown>).total ?? 0,
          Estado: safeText((doc as Record<string, unknown>).status),
        })),
      });
    }
  }

  return artifacts;
}

async function maybeGenerateReportArtifact(params: {
  userId: string;
  message: string;
  currentPage?: string;
  currentTask?: string;
  nextAction: string;
  existingArtifacts: CopilotArtifact[];
  lang: 'es' | 'ru';
}): Promise<CopilotArtifact[]> {
  if (params.existingArtifacts.some((artifact) => artifact.type === 'report')) return [];

  const text = normalizeSearchText(`${params.message} ${params.currentPage ?? ''} ${params.currentTask ?? ''}`);
  const wantsVisualReport =
    params.nextAction === 'generate_report' ||
    params.nextAction === 'show_report_link' ||
    /\b(genera|crear|haz|prepara|quiero|ver)\b.*\b(informe|dashboard|grafico|estado de empresa|analisis)\b/.test(text) ||
    /\b(cuanto iva|iva sale|ventas.*gastos|gastos.*ventas|resumen.*holded)\b/.test(text);

  if (!wantsVisualReport) return [];

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('active_company_id')
    .eq('id', params.userId)
    .maybeSingle();
  const companyId = profile?.active_company_id ?? null;

  let query = admin
    .from('client_integrations')
    .select('id')
    .eq('provider', 'holded')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  query = companyId ? query.eq('company_id', companyId) : query.eq('client_id', params.userId);
  const { data: integration } = await query.maybeSingle();

  if (!integration?.id) {
    return [{
      type: 'link',
      title: 'Holded no esta conectado',
      url: absoluteAppUrl('/dashboard/integraciones/holded'),
      cta: 'Conectar Holded',
      tone: 'warning',
    }];
  }

  try {
    const report = await generateCompanyReport({
      clientId: params.userId,
      companyId,
      integrationId: integration.id,
      lang: params.lang,
      generatedBy: 'kia',
    });
    return [{
      type: 'report',
      title: report.title,
      url: report.reportUrl,
      period: report.period,
      cta: 'Abrir informe visual',
    }];
  } catch (err) {
    console.error('[kia/copilot] deterministic report artifact failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

function safeText(value: unknown): string {
  return String(value ?? '').slice(0, 80);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
