/**
 * POST /api/kia/copilot
 *
 * Dashboard-embedded Kia copilot endpoint.
 *
 * Supports two response modes:
 * - JSON (default): returns structured decision with artifacts (used as fallback)
 * - SSE streaming: returns text/event-stream with chunk/done events when
 *   client sends Accept: text/event-stream. Streams text live; tools run as
 *   pre-flight and their results are injected into the system prompt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import { buildKiaContext, type KiaContext } from '@/lib/ai/kia/kia-context-builder';
import { executeKiaToolCall } from '@/lib/ai/kia/kia-tool-executor';
import { streamAnthropicText } from '@/lib/ai/kia/kia-provider-router';
import type { KiaTaskType } from '@/lib/ai/kia/kia-output-schema';
import type { KiaToolCall, KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';
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
  // User data tools (requires authenticated user context)
  'get_user_expedientes',
  'get_user_companies',
  'get_user_pending_docs',
  'get_case_status',
  // Holded integration tools
  'get_holded_connection_status',
  'get_holded_invoices',
  'get_holded_contacts',
  'get_holded_bank_balance',
  'get_company_status_snapshot',
  'generate_company_report',
  'generate_holded_connection_link',
  // Navigation links
  'generate_profile_link',
  'generate_checkout_gate_link',
] as const;

type CopilotArtifact =
  | { type: 'report'; title: string; url: string; period?: string; cta: string }
  | { type: 'table'; title: string; columns: string[]; rows: Array<Record<string, unknown>> }
  | { type: 'link'; title: string; url: string; cta: string; tone?: 'warning' | 'info' };

export const maxDuration = 60;

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

  const wantsStream = request.headers.get('accept')?.includes('text/event-stream') ?? false;
  if (wantsStream) {
    return streamingCopilotResponse(request, user.id, parsed.data);
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

    return NextResponse.json({
      ok: true,
      message: messageWithArtifacts,
      nextAction: result.decision.nextAction,
      quickReplies: result.decision.quickReplies,
      toolResults: result.toolResults,
      artifacts,
      warnings: result.decision.warnings,
    });
  } catch (err) {
    console.error('[kia/copilot]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno del copiloto' }, { status: 500 });
  }
}

// ── SSE streaming handler ─────────────────────────────────────────────────────

type ParsedBody = z.infer<typeof bodySchema>;

function sseEvent(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function streamingCopilotResponse(
  _request: NextRequest,
  userId: string,
  { message, currentPage, currentTask, pageData, lang, history }: ParsedBody,
): Promise<Response> {
  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(sseEvent(data));

      try {
        // 1. Build context with direct DB lookup for this user
        const context = await buildKiaContext({
          channel: 'dashboard',
          userId,
          clientId: userId,
          currentPage,
          currentTask,
          pageData,
          latestMessage: message,
          syntheticRecentMessages: history?.map((item) => ({
            role: item.role as 'user' | 'assistant',
            text: item.text,
            createdAt: new Date().toISOString(),
          })),
        });

        const locale = lang ?? context.contact.language;

        // 2. Pre-flight tool execution based on message intent
        const toolsToRun = resolvePreflightTools(message, currentPage, currentTask);
        const toolResults: KiaToolResult[] = [];
        for (const toolName of toolsToRun) {
          const toolCall: KiaToolCall = { name: toolName, arguments: {} };
          const result = await executeKiaToolCall(toolCall, context).catch(() => null);
          if (result) toolResults.push(result);
        }

        // 3. Build artifacts from tool results
        const artifacts = buildArtifactsFromToolResults(toolResults);

        // 4. Build streaming system prompt with context + tool results
        const systemPrompt = buildStreamingSystemPrompt(context, toolResults, locale);

        // 5. Build conversation messages
        const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = (history ?? [])
          .slice(-6)
          .map((item) => ({ role: item.role, content: item.text }));
        const messages = [...historyMessages, { role: 'user' as const, content: message }];

        // 6. Stream text response from Anthropic
        for await (const chunk of streamAnthropicText(systemPrompt, messages, { maxTokens: 500, temperature: 0.3 })) {
          send({ type: 'chunk', text: chunk });
        }

        // 7. Send completion event
        send({
          type: 'done',
          artifacts,
          quickReplies: buildContextualQuickReplies(context, message),
        });

      } catch (err) {
        console.error('[kia/copilot/stream]', err instanceof Error ? err.message : err);
        send({ type: 'error', error: 'Error interno del copiloto' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/** Selects which tools to pre-execute based on the user's message. */
function resolvePreflightTools(message: string, currentPage?: string, currentTask?: string): string[] {
  const text = normalizeSearchText(`${message} ${currentPage ?? ''} ${currentTask ?? ''}`);
  const tools: string[] = [];

  if (/(expediente|tramite|caso|gestion|pendiente|mis expediente|mis tramite|que tengo)/.test(text)) {
    tools.push('get_user_expedientes');
  }
  if (/(empresa|sociedad|compan|mis empresa|mis sociedad|cif|nif)/.test(text)) {
    tools.push('get_user_companies');
  }
  if (/(documento|falta|necesito subir|que documento|documentacion pendiente)/.test(text)) {
    tools.push('get_user_pending_docs');
  }
  if (/(holded|factura|banco|saldo|tesoreria|contabilidad|informe|ventas|gastos|iva)/.test(text)) {
    tools.push('get_holded_connection_status');
  }

  return tools;
}

/** Builds a concise streaming system prompt with live context. */
function buildStreamingSystemPrompt(
  context: KiaContext,
  toolResults: KiaToolResult[],
  locale: 'es' | 'ru',
): string {
  const isRu = locale === 'ru';
  const lines: string[] = [
    isRu
      ? 'Ты — Киа, виртуальный помощник EXPERT Consulting (испанская налогово-юридическая компания). Отвечай кратко, по делу, на русском языке. Максимум 3 абзаца.'
      : 'Eres Kia, asistente virtual de EXPERT Consulting (gestoría y asesoría española). Responde de forma directa y útil en español. Máximo 3 párrafos.',
    '',
    '## Contexto del usuario',
    `Estado: ${context.contact.status === 'client' ? (isRu ? 'клиент' : 'cliente registrado') : isRu ? 'лид' : 'contacto'}`,
  ];

  if (context.cases.length > 0) {
    lines.push(isRu ? 'Активные экспедиенты:' : 'Expedientes activos:');
    for (const c of context.cases.slice(0, 5)) {
      lines.push(`  - ${c.serviceName} | ${c.status}`);
    }
  }

  if (context.company) {
    lines.push(isRu
      ? `Empresa: ${context.company.name ?? '—'}, Holded: ${context.company.holdedConnected ? 'подключён' : 'не подключён'}`
      : `Empresa: ${context.company.name ?? '—'}, Holded: ${context.company.holdedConnected ? 'conectado' : 'no conectado'}`
    );
  }

  if (context.documents.pendingCount > 0) {
    lines.push(isRu
      ? `Документов ожидают загрузки: ${context.documents.pendingCount}`
      : `Documentos pendientes de subir: ${context.documents.pendingCount}`
    );
  }

  // Inject tool results as readable context
  for (const tr of toolResults) {
    if (!tr.ok || !tr.result) continue;

    if (tr.toolName === 'get_user_expedientes' && Array.isArray(tr.result.expedientes)) {
      const exps = tr.result.expedientes as Array<Record<string, unknown>>;
      if (exps.length === 0) {
        lines.push(isRu ? 'Открытых экспедиентов нет.' : 'No hay expedientes activos.');
      } else {
        lines.push('');
        lines.push(isRu ? '### Экспедиенты пользователя' : '### Expedientes del usuario');
        for (const exp of exps) {
          lines.push(`- ${exp.servicio} | ${isRu ? 'состояние' : 'estado'}: ${exp.estado} | URL: ${exp.url}`);
        }
      }
    }

    if (tr.toolName === 'get_user_companies' && Array.isArray(tr.result.empresas)) {
      const emps = tr.result.empresas as Array<Record<string, unknown>>;
      if (emps.length > 0) {
        lines.push('');
        lines.push(isRu ? '### Компании пользователя' : '### Empresas del usuario');
        for (const emp of emps) {
          lines.push(`- ${emp.nombre ?? '—'} (${emp.cif_nif ?? 'sin CIF'}), ${emp.forma_juridica ?? '—'}`);
        }
      }
    }

    if (tr.toolName === 'get_user_pending_docs' && typeof tr.result.pending_count === 'number') {
      lines.push(isRu
        ? `Ожидающих документов: ${tr.result.pending_count}`
        : `Documentos pendientes de subir: ${tr.result.pending_count}`
      );
    }

    if (tr.toolName === 'get_holded_connection_status') {
      const status = tr.result.status as string | undefined;
      lines.push(isRu
        ? `Holded: ${status === 'active' ? 'подключён' : 'не подключён'}`
        : `Holded: ${status === 'active' ? 'conectado' : 'no conectado'}`
      );
    }
  }

  lines.push('');
  lines.push(isRu
    ? '## Правила\n- Отвечай только на русском.\n- Используй данные контекста выше, не выдумывай.\n- Для формальных действий направляй на портал: https://expertconsulting.es\n- Не раскрывай ID, технические детали или внутренние данные системы.'
    : '## Reglas\n- Responde solo en español.\n- Usa los datos del contexto de arriba; no inventes.\n- Para acciones formales (contratar, subir docs) dirige al portal: https://expertconsulting.es\n- No reveles IDs, detalles técnicos ni datos internos del sistema.'
  );

  return lines.join('\n');
}

/** Quick replies based on user context — no AI call needed. */
function buildContextualQuickReplies(
  context: KiaContext,
  _message: string,
): Array<{ id: string; title: string }> {
  const replies: Array<{ id: string; title: string }> = [];
  const lang = context.contact.language;

  if (context.cases.length > 0) {
    replies.push({ id: 'ver-expedientes', title: lang === 'ru' ? 'Мои экспедиенты' : 'Ver mis expedientes' });
  }
  if (context.company && !context.company.holdedConnected) {
    replies.push({ id: 'conectar-holded', title: lang === 'ru' ? 'Подключить Holded' : 'Conectar Holded' });
  }
  if (context.documents.pendingCount > 0) {
    replies.push({ id: 'docs-pendientes', title: lang === 'ru' ? 'Документы ожидают' : 'Documentos pendientes' });
  }
  if (context.company?.holdedConnected) {
    replies.push({ id: 'informe', title: lang === 'ru' ? 'Генерировать отчёт' : 'Generar informe' });
  }
  replies.push({ id: 'cita', title: lang === 'ru' ? 'Записаться' : 'Reservar cita' });

  return replies.slice(0, 4);
}

function resolveCopilotTaskType(message: string, currentPage?: string, currentTask?: string): KiaTaskType {
  const text = normalizeSearchText(`${message} ${currentPage ?? ''} ${currentTask ?? ''}`);
  if (/(informe|report|dashboard|grafico|estado de empresa|ventas|gastos|iva|tesoreria|banco|holded)/.test(text)) {
    return /(anomalia|descuadre|duplicad|no cuadra|concili)/.test(text)
      ? 'accounting_anomaly_review'
      : 'company_status_summary';
  }
  if (/(expediente|tramite|caso|gestion|proceso|mis expediente|estado de mi|mis tramite)/.test(text)) {
    return 'lead_client_decision';
  }
  if (/(empresa|sociedad|compan|mis empresa|mis sociedad|cif|nif|forma juridica)/.test(text)) {
    return 'lead_client_decision';
  }
  if (/(documento|pendiente|falta|necesito subir|papers|documentacion)/.test(text)) {
    return 'lead_client_decision';
  }
  if (/(pagar|contratar|suscripcion|precio|presupuesto|servicio)/.test(text)) {
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

    if (toolResult.toolName === 'get_user_expedientes' && Array.isArray(result.expedientes) && result.expedientes.length > 0) {
      const rows = result.expedientes as Array<Record<string, unknown>>;
      artifacts.push({
        type: 'table',
        title: `Expedientes activos (${rows.length})`,
        columns: ['Servicio', 'Estado'],
        rows: rows.map((exp) => ({
          Servicio: safeText(exp.servicio),
          Estado: safeText(exp.estado),
        })),
      });
    }

    if (toolResult.toolName === 'get_user_companies' && Array.isArray(result.empresas) && result.empresas.length > 0) {
      const rows = result.empresas as Array<Record<string, unknown>>;
      artifacts.push({
        type: 'table',
        title: `Mis empresas (${rows.length})`,
        columns: ['Nombre', 'CIF/NIF', 'Forma'],
        rows: rows.map((emp) => ({
          Nombre: safeText(emp.nombre),
          'CIF/NIF': safeText(emp.cif_nif ?? '—'),
          Forma: safeText(emp.forma_juridica ?? '—'),
        })),
      });
    }

    if (toolResult.toolName === 'generate_holded_connection_link' && typeof result.url === 'string') {
      artifacts.push({
        type: 'link',
        title: 'Conectar con Holded',
        url: result.url,
        cta: 'Ir a integraciones',
        tone: 'info' as const,
      });
    }

    if (toolResult.toolName === 'generate_profile_link' && typeof result.url === 'string') {
      artifacts.push({
        type: 'link',
        title: 'Completar perfil',
        url: result.url,
        cta: 'Ir a mi perfil',
        tone: 'info' as const,
      });
    }

    if (toolResult.toolName === 'generate_checkout_gate_link' && typeof result.url === 'string') {
      artifacts.push({
        type: 'link',
        title: 'Contratar servicio',
        url: result.url,
        cta: 'Ver opciones',
        tone: 'info' as const,
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
