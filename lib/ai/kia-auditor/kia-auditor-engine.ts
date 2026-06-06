import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { redactJson, redactSensitiveText, safeErrorMessage } from '@/lib/ai/kia/kia-redaction';
import { saveKiaBehaviorAnomalies } from '@/lib/ai/kia/health/kia-health-alerts';
import { createNba } from '@/lib/nba/create-nba';
import { buildAuditorSystemPrompt, buildAuditorUserPrompt } from './kia-auditor-prompt';
import { runDeterministicGrader, mergeResults, scoreFromRuleResults } from './kia-auditor-grader';
import { KIA_AUDITOR_RULES } from './kia-auditor-rules';
import type {
  AuditMessageInput,
  AuditorOverallStatus,
  AuditorRuleResult,
  KiaAuditorReview,
  LlmJudgeOutput,
} from './kia-auditor-types';

const AUDITOR_MODEL = 'claude-haiku-4-5-20251001';

// ── LLM Judge ────────────────────────────────────────────────────────────────

async function callLlmJudge(input: AuditMessageInput): Promise<LlmJudgeOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (process.env.KIA_AUDITOR_LLM_ENABLED?.toLowerCase() === 'false') return null;

  const client = new Anthropic({ apiKey });

  try {
    const msg = await client.messages.create({
      model:      AUDITOR_MODEL,
      max_tokens: 512,
      system:     buildAuditorSystemPrompt(),
      messages:   [{ role: 'user', content: buildAuditorUserPrompt(input) }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;

    const parsed = JSON.parse(json) as LlmJudgeOutput;
    return {
      status:          parsed.status ?? 'warning',
      score:           typeof parsed.score === 'number' ? parsed.score : 50,
      summary:         redactSensitiveText(parsed.summary ?? ''),
      findings:        (parsed.findings ?? []).map((f) => ({
        ruleId:      f.ruleId ?? 'unknown',
        severity:    f.severity ?? 'info',
        explanation: redactSensitiveText(f.explanation ?? ''),
      })),
      recommendations: (parsed.recommendations ?? []).map(redactSensitiveText),
    };
  } catch (err) {
    console.error('[KiaAuditor LLM judge]', safeErrorMessage(err));
    return null;
  }
}

// ── Determine overall status ──────────────────────────────────────────────────

function overallStatus(score: number, hasCriticalFailure: boolean, llmStatus: AuditorOverallStatus | null): AuditorOverallStatus {
  if (hasCriticalFailure) return 'fail';
  if (llmStatus === 'fail') return 'fail';
  if (score < 60 || llmStatus === 'warning') return 'warning';
  return 'pass';
}

// ── Persist review ────────────────────────────────────────────────────────────

async function persistReview(review: KiaAuditorReview, ruleResults: AuditorRuleResult[]): Promise<string | undefined> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('kia_auditor_reviews')
    .insert({
      source_type:       review.sourceType,
      source_id:         review.sourceId ?? null,
      conversation_id:   review.conversationId ?? null,
      decision_log_id:   review.decisionLogId ?? null,
      client_id:         review.clientId ?? null,
      lead_id:           review.leadId ?? null,
      case_id:           review.caseId ?? null,
      channel:           review.channel ?? null,
      overall_status:    review.overallStatus,
      score:             review.score,
      summary:           review.summary,
      findings:          redactJson(review.findings),
      rules_passed:      review.rulesPassed,
      rules_failed:      review.rulesFailed,
      recommendations:   review.recommendations,
      reviewer_provider: review.reviewerProvider ?? null,
      reviewer_model:    review.reviewerModel ?? null,
    })
    .select('id')
    .single();

  if (error) { console.error('[KiaAuditor persist]', error.message); return undefined; }

  const reviewId = data?.id as string;

  // Persist per-rule results
  if (ruleResults.length > 0) {
    const rows = ruleResults.map((r) => ({
      review_id:   reviewId,
      rule_id:     r.ruleId,
      category:    r.category,
      severity:    r.severity,
      status:      r.status,
      expected:    r.expected ?? null,
      actual:      r.actual ?? null,
      explanation: r.explanation ?? null,
    }));
    await admin.from('kia_auditor_rule_results').insert(rows);
  }

  return reviewId;
}

// ── Side effects on critical fail ─────────────────────────────────────────────

async function handleCriticalFailSideEffects(review: KiaAuditorReview, ruleResults: AuditorRuleResult[]): Promise<void> {
  if (review.overallStatus !== 'fail') return;

  const criticalFailed = ruleResults.filter((r) => r.severity === 'critical' && r.status === 'failed');
  if (criticalFailed.length === 0) return;

  await saveKiaBehaviorAnomalies(criticalFailed.map((r) => ({
    source:      'admin_review' as const,
    severity:    'critical' as const,
    anomalyType: 'auditor_rule_failure' as const,
    title:       `Auditoría Kia: fallo crítico — ${r.ruleId}`,
    description: r.explanation ?? `La regla ${r.ruleId} ha fallado en auditoría`,
    relatedDecisionLogId: review.decisionLogId ?? null,
    relatedConversationId: review.conversationId ?? null,
    metadata:    redactJson({ review_id: review.id, rule_id: r.ruleId }),
  })));

  await createNba({
    action_type: 'kia_health_critical_anomaly',
    priority:    'critica',
    title:       `Kia Auditor: fallo crítico detectado (score ${review.score})`,
    description: `${criticalFailed.length} regla(s) crítica(s) fallada(s): ${criticalFailed.map((r) => r.ruleId).join(', ')}`,
    metadata:    { review_id: review.id, source_type: review.sourceType },
  });
}

// ── Core audit function ───────────────────────────────────────────────────────

async function runAudit(input: AuditMessageInput & {
  sourceType:       KiaAuditorReview['sourceType'];
  sourceId?:        string;
  conversationId?:  string;
  decisionLogId?:   string;
  clientId?:        string;
  leadId?:          string;
  caseId?:          string;
  skipLlm?:         boolean;
}): Promise<KiaAuditorReview> {
  const deterministicResults = runDeterministicGrader(input);
  const { hasCriticalFailure } = scoreFromRuleResults(deterministicResults);

  // Only call LLM judge if: no critical failure already found (avoid wasting tokens)
  // AND there are qualitative rules to evaluate
  const skipLlm = input.skipLlm || hasCriticalFailure;
  const llmOutput = skipLlm ? null : await callLlmJudge(input);

  const merged = mergeResults(deterministicResults, llmOutput);
  const finalScore   = merged.score;
  const finalStatus  = overallStatus(finalScore, hasCriticalFailure, llmOutput?.status ?? null);

  const summary = llmOutput?.summary ??
    (hasCriticalFailure
      ? `Fallo crítico detectado: ${deterministicResults.filter(r => r.status === 'failed').map(r => r.ruleId).join(', ')}.`
      : finalStatus === 'warning'
        ? `Advertencias en: ${merged.rulesFailed.join(', ')}.`
        : `Kia pasó todas las reglas evaluadas (score ${finalScore}).`);

  const review: KiaAuditorReview = {
    sourceType:       input.sourceType,
    sourceId:         input.sourceId,
    conversationId:   input.conversationId,
    decisionLogId:    input.decisionLogId,
    clientId:         input.clientId,
    leadId:           input.leadId,
    caseId:           input.caseId,
    channel:          input.channel,
    overallStatus:    finalStatus,
    score:            finalScore,
    summary:          redactSensitiveText(summary),
    findings:         merged.findings.map((f) => ({
      ruleId:      f.ruleId,
      severity:    f.severity as 'info' | 'warning' | 'critical',
      explanation: f.explanation,
    })),
    rulesPassed:      merged.rulesPassed,
    rulesFailed:      merged.rulesFailed,
    recommendations:  merged.recommendations,
    reviewerProvider: llmOutput ? 'anthropic' : undefined,
    reviewerModel:    llmOutput ? AUDITOR_MODEL : undefined,
  };

  review.id = await persistReview(review, deterministicResults);
  await handleCriticalFailSideEffects(review, deterministicResults);

  return review;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function auditKiaDecision(decisionLogId: string): Promise<KiaAuditorReview> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('kia_decision_logs')
    .select('*')
    .eq('id', decisionLogId)
    .single();

  if (error || !data) {
    throw new Error(`Decision log ${decisionLogId} not found`);
  }

  const outputJson = (data.output_json ?? {}) as Record<string, unknown>;

  return runAudit({
    sourceType:    'decision_log',
    sourceId:      decisionLogId,
    decisionLogId,
    clientId:      data.client_id ?? undefined,
    leadId:        data.lead_id ?? undefined,
    channel:       data.channel ?? undefined,
    message:       redactSensitiveText(String(outputJson.userMessage ?? '')),
    kiaResponse:   redactSensitiveText(String(outputJson.decisionSummary ?? '')),
    decisionJson:  redactJson(outputJson) as Record<string, unknown>,
    contactStatus: (data.contact_status as 'lead' | 'client' | 'unknown') ?? 'unknown',
  });
}

export async function auditConversation(conversationId: string): Promise<KiaAuditorReview> {
  const admin = getSupabaseAdmin();

  // Get the last decision log for this conversation (via session or direct link)
  const { data } = await admin
    .from('kia_decision_logs')
    .select('*')
    .eq('case_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return runAudit({
      sourceType:     'conversation',
      conversationId,
      message:        '(sin mensajes)',
      kiaResponse:    '(sin respuesta)',
      skipLlm:        true,
    });
  }

  const outputJson = (data.output_json ?? {}) as Record<string, unknown>;

  return runAudit({
    sourceType:    'conversation',
    sourceId:      conversationId,
    conversationId,
    decisionLogId: data.id,
    clientId:      data.client_id ?? undefined,
    leadId:        data.lead_id ?? undefined,
    channel:       data.channel ?? undefined,
    message:       redactSensitiveText(String(outputJson.userMessage ?? '')),
    kiaResponse:   redactSensitiveText(String(outputJson.decisionSummary ?? '')),
    decisionJson:  redactJson(outputJson) as Record<string, unknown>,
    contactStatus: (data.contact_status as 'lead' | 'client' | 'unknown') ?? 'unknown',
  });
}

export async function auditMessage(input: AuditMessageInput): Promise<KiaAuditorReview> {
  return runAudit({
    sourceType: 'message',
    ...input,
  });
}

export async function auditHealthRun(runId: string): Promise<KiaAuditorReview> {
  const admin = getSupabaseAdmin();
  const { data: run } = await admin
    .from('kia_health_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (!run) throw new Error(`Health run ${runId} not found`);

  const { data: results } = await admin
    .from('kia_health_check_results')
    .select('*')
    .eq('run_id', runId)
    .eq('status', 'failed');

  const failedChecks = results ?? [];
  const score = Math.round(Number(run.score ?? 0) * 100);
  const status: AuditorOverallStatus = run.status === 'failed' ? 'fail' : run.status === 'warning' ? 'warning' : 'pass';

  const review: KiaAuditorReview = {
    sourceType:    'health_check',
    sourceId:      runId,
    overallStatus: status,
    score,
    summary:       redactSensitiveText(String(run.summary ?? '')),
    findings:      failedChecks.map((r) => ({
      ruleId:      r.check_id as string,
      severity:    r.severity as 'info' | 'warning' | 'critical',
      explanation: redactSensitiveText(String(r.error ?? `Check ${r.check_id} falló`)),
    })),
    rulesPassed:     [],
    rulesFailed:     failedChecks.map((r) => r.check_id as string),
    recommendations: score < 80
      ? ['Revisar los checks fallados en /admin/kia-health', 'Considerar ejecutar auditoría manual de los últimos mensajes']
      : [],
  };

  review.id = await persistReview(review, []);
  await handleCriticalFailSideEffects(review, []);

  return review;
}

// ── Fetch summary for dashboard ───────────────────────────────────────────────

export async function fetchAuditorSummary(): Promise<{
  avgScore: number;
  totalReviews: number;
  criticalFails: number;
  topFailedRules: Array<{ ruleId: string; count: number }>;
  recentReviews: KiaAuditorReview[];
}> {
  const admin = getSupabaseAdmin();

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [reviewsRes, ruleResultsRes] = await Promise.all([
    admin
      .from('kia_auditor_reviews')
      .select('id,overall_status,score,summary,source_type,channel,created_at,findings,recommendations,rules_passed,rules_failed')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('kia_auditor_rule_results')
      .select('rule_id, status')
      .gte('created_at', since)
      .in('status', ['failed', 'warning']),
  ]);

  const reviews = reviewsRes.data ?? [];
  const ruleResults = ruleResultsRes.data ?? [];

  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + Number(r.score ?? 0), 0) / reviews.length)
    : 100;

  const criticalFails = reviews.filter((r) => r.overall_status === 'fail').length;

  // Top failed rules
  const ruleCounts = new Map<string, number>();
  for (const r of ruleResults) {
    ruleCounts.set(r.rule_id as string, (ruleCounts.get(r.rule_id as string) ?? 0) + 1);
  }
  const topFailedRules = Array.from(ruleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ruleId, count]) => ({ ruleId, count }));

  const recentReviews = reviews.slice(0, 10).map((r) => ({
    id:            r.id as string,
    sourceType:    r.source_type as KiaAuditorReview['sourceType'],
    channel:       r.channel as string | undefined,
    overallStatus: r.overall_status as AuditorOverallStatus,
    score:         Number(r.score ?? 0),
    summary:       r.summary as string,
    rulesPassed:   r.rules_passed as string[] ?? [],
    rulesFailed:   r.rules_failed as string[] ?? [],
    findings:      r.findings as KiaAuditorReview['findings'] ?? [],
    recommendations: r.recommendations as string[] ?? [],
  }));

  return { avgScore, totalReviews: reviews.length, criticalFails, topFailedRules, recentReviews };
}

export { KIA_AUDITOR_RULES };
