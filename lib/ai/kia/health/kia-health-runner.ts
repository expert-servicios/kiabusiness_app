import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { runKiaDecision } from '../kia-decision-engine';
import type { KiaContextInput } from '../kia-context-builder';
import { redactJson, redactSensitiveText, safeErrorMessage } from '../kia-redaction';
import type { KiaTaskType } from '../kia-output-schema';
import { KIA_HEALTH_CANARY_TESTS } from './kia-canary-tests';
import { runKiaBusinessChecks, runKiaTechnicalChecks } from './kia-health-checks';
import { anomaliesFromHealthResult, gradeKiaHealthCheck } from './kia-health-grader';
import { maybeAutoDisableStructuredAi, saveKiaBehaviorAnomalies } from './kia-health-alerts';
import type {
  KiaHealthCheck,
  KiaHealthCheckResult,
  KiaHealthRunResult,
  KiaHealthRunStatus,
  KiaHealthRunType,
} from './kia-health-types';

const SYNTHETIC_LEAD_ID = '00000000-0000-4000-8000-000000000101';
const SYNTHETIC_CLIENT_ID = '00000000-0000-4000-8000-000000000202';

export async function runKiaHealthChecks(input: {
  runType: KiaHealthRunType;
  createdBy?: string | null;
  includeTechnical?: boolean;
  includeCanary?: boolean;
  persist?: boolean;
}): Promise<KiaHealthRunResult> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const persist = input.persist !== false;
  const includeTechnical = input.includeTechnical ?? true;
  const includeCanary = input.includeCanary ?? process.env.KIA_HEALTH_CANARY_ENABLED?.toLowerCase() !== 'false';

  if (process.env.KIA_HEALTH_ENABLED?.toLowerCase() === 'false') {
    return {
      runType: input.runType,
      status: 'warning',
      score: 0,
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      warningChecks: 1,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      summary: 'Kia Health está desactivado por KIA_HEALTH_ENABLED=false.',
      results: [],
    };
  }

  const results: KiaHealthCheckResult[] = [];
  if (includeTechnical) {
    results.push(...await runKiaTechnicalChecks());
    results.push(...await runKiaBusinessChecks());
  }
  if (includeCanary) {
    for (const check of KIA_HEALTH_CANARY_TESTS) {
      results.push(await runCanaryCheck(check));
    }
  }

  const finishedAtDate = new Date();
  const finishedAt = finishedAtDate.toISOString();
  const durationMs = finishedAtDate.getTime() - startedAtDate.getTime();
  const totalChecks = results.length;
  const passedChecks = results.filter((result) => result.status === 'passed').length;
  const failedChecks = results.filter((result) => result.status === 'failed').length;
  const warningChecks = results.filter((result) => result.status === 'warning').length;
  const criticalFailed = results.some((result) => result.severity === 'critical' && result.status === 'failed');
  const status: KiaHealthRunStatus = criticalFailed ? 'failed' : warningChecks || failedChecks ? 'warning' : 'success';
  const score = totalChecks > 0 ? Math.round(((passedChecks + warningChecks * 0.5) / totalChecks) * 100) / 100 : 0;
  const provider = results.find((result) => result.provider)?.provider ?? null;
  const model = results.find((result) => result.model)?.model ?? null;
  const summary = buildSummary(status, totalChecks, passedChecks, failedChecks, warningChecks);

  const run: KiaHealthRunResult = {
    runType: input.runType,
    status,
    score,
    totalChecks,
    passedChecks,
    failedChecks,
    warningChecks,
    provider,
    model,
    startedAt,
    finishedAt,
    durationMs,
    summary,
    results,
    metadata: {
      includeTechnical,
      includeCanary,
      canaryCount: includeCanary ? KIA_HEALTH_CANARY_TESTS.length : 0,
    },
  };

  if (persist) {
    run.id = await saveHealthRun(run, input.createdBy ?? null);
    await saveHealthResults(run);
  }

  const anomalies = results.flatMap(anomaliesFromHealthResult);
  await saveKiaBehaviorAnomalies(anomalies);
  await maybeAutoDisableStructuredAi(run);

  return run;
}

async function runCanaryCheck(check: KiaHealthCheck): Promise<KiaHealthCheckResult> {
  if (!check.input) {
    return {
      checkId: check.id,
      category: check.category,
      severity: check.severity,
      status: 'skipped',
      title: check.title,
      expected: check.expected,
      error: 'No input for canary check',
    };
  }

  const started = Date.now();
  try {
    const decision = await runKiaDecision({
      taskType: taskTypeForCheck(check),
      channel: check.input.channel,
      message: check.input.message,
      contextInput: contextInputForCheck(check),
      locale: /[А-Яа-яЁё]/.test(check.input.message) ? 'ru' : 'es',
      allowTools: false,
    });
    const latencyMs = Date.now() - started;
    const usage = extractUsage(decision.providerResult?.usage);
    const result = gradeKiaHealthCheck({
      check,
      decision: decision.decision,
      provider: decision.providerResult?.provider ?? null,
      model: decision.providerResult?.model ?? null,
      latencyMs,
      tokensInput: usage.tokensInput,
      tokensOutput: usage.tokensOutput,
      costEstimate: estimateCost(decision.providerResult?.provider, usage.tokensInput, usage.tokensOutput),
    });

    const maxLatencyMs = Number(process.env.KIA_HEALTH_MAX_LATENCY_MS ?? '10000');
    if (latencyMs > maxLatencyMs && result.status === 'passed') {
      return { ...result, status: 'warning', error: `Latency ${latencyMs}ms exceeded ${maxLatencyMs}ms` };
    }
    return result;
  } catch (error) {
    return {
      checkId: check.id,
      category: check.category,
      severity: check.severity,
      status: check.severity === 'critical' ? 'failed' : 'warning',
      title: check.title,
      inputMessage: redactSensitiveText(check.input.message),
      expected: check.expected,
      actual: {},
      latencyMs: Date.now() - started,
      error: safeErrorMessage(error),
    };
  }
}

function contextInputForCheck(check: KiaHealthCheck): KiaContextInput {
  const context = check.input?.context ?? {};
  const contactStatus = check.input?.contactStatus ?? 'unknown';
  return {
    channel: check.input?.channel ?? 'waba',
    clientId: contactStatus === 'client' ? SYNTHETIC_CLIENT_ID : undefined,
    leadId: contactStatus === 'lead' ? SYNTHETIC_LEAD_ID : undefined,
    serviceSlug: typeof context.serviceSlug === 'string' ? context.serviceSlug : undefined,
    latestMessage: check.input?.message,
  };
}

function taskTypeForCheck(check: KiaHealthCheck): KiaTaskType {
  if (check.input?.channel === 'admin') return 'admin_ai_compose';
  if (check.input?.channel === 'dashboard') return check.id === 'present_tax' ? 'company_status_summary' : 'next_best_action';
  if (check.id.includes('pay') || check.id.includes('monthly_plan')) return 'checkout_decision';
  if (check.id.includes('holded')) return 'readiness_reasoning';
  if (check.id.includes('social_roots')) return 'viability_reasoning';
  return 'waba_reply';
}

function extractUsage(usage: unknown): { tokensInput: number | null; tokensOutput: number | null } {
  if (!usage || typeof usage !== 'object') return { tokensInput: null, tokensOutput: null };
  const record = usage as Record<string, unknown>;
  const input = numberOrNull(record.input_tokens) ?? numberOrNull(record.prompt_tokens);
  const output = numberOrNull(record.output_tokens) ?? numberOrNull(record.completion_tokens);
  return { tokensInput: input, tokensOutput: output };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function estimateCost(provider: string | undefined, inputTokens: number | null, outputTokens: number | null): number | null {
  if (inputTokens === null && outputTokens === null) return null;
  const inTokens = inputTokens ?? 0;
  const outTokens = outputTokens ?? 0;
  if (provider === 'anthropic') return roundCost((inTokens * 0.0000008) + (outTokens * 0.000004));
  if (provider === 'openai') return roundCost((inTokens * 0.0000004) + (outTokens * 0.0000016));
  return null;
}

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

async function saveHealthRun(run: KiaHealthRunResult, createdBy: string | null): Promise<string | undefined> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('kia_health_runs')
    .insert({
      run_type: run.runType,
      status: run.status,
      score: run.score,
      total_checks: run.totalChecks,
      passed_checks: run.passedChecks,
      failed_checks: run.failedChecks,
      warning_checks: run.warningChecks,
      provider: run.provider,
      model: run.model,
      started_at: run.startedAt,
      finished_at: run.finishedAt,
      duration_ms: run.durationMs,
      summary: run.summary,
      created_by: createdBy,
      metadata: redactJson(run.metadata ?? {}),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Kia health run save]', error.message);
    return undefined;
  }
  return data?.id as string | undefined;
}

async function saveHealthResults(run: KiaHealthRunResult): Promise<void> {
  if (!run.id || run.results.length === 0) return;
  const admin = getSupabaseAdmin();
  const rows = run.results.map((result) => ({
    run_id: run.id,
    check_id: result.checkId,
    category: result.category,
    severity: result.severity,
    status: result.status,
    input_message: result.inputMessage ? redactSensitiveText(result.inputMessage) : null,
    expected: redactJson(result.expected ?? {}),
    actual: redactJson(result.actual ?? {}),
    provider: result.provider ?? null,
    model: result.model ?? null,
    latency_ms: result.latencyMs ?? null,
    tokens_input: result.tokensInput ?? null,
    tokens_output: result.tokensOutput ?? null,
    cost_estimate: result.costEstimate ?? null,
    error: result.error ? redactSensitiveText(result.error) : null,
  }));

  const { error } = await admin.from('kia_health_check_results').insert(rows);
  if (error) console.error('[Kia health result save]', error.message);
}

function buildSummary(status: KiaHealthRunStatus, total: number, passed: number, failed: number, warnings: number): string {
  if (total === 0) return 'No se ejecutaron checks.';
  if (status === 'success') return `Kia Health verde: ${passed}/${total} checks OK.`;
  if (status === 'warning') return `Kia Health amarillo: ${passed}/${total} OK, ${warnings} warnings, ${failed} fallos.`;
  return `Kia Health rojo: ${failed} fallos, ${warnings} warnings, ${passed}/${total} OK.`;
}
