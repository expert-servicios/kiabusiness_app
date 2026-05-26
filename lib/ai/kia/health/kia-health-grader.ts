import { kiaDecisionSchema, type KiaDecision } from '../kia-output-schema';
import { redactJson } from '../kia-redaction';
import { messageSimilarity } from '../kia-response-variation';
import type { KiaBehaviorAnomalyInput, KiaHealthCheck, KiaHealthCheckResult } from './kia-health-types';

export function gradeKiaHealthCheck(params: {
  check: KiaHealthCheck;
  decision: unknown;
  provider?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  costEstimate?: number | null;
}): KiaHealthCheckResult {
  const parsed = kiaDecisionSchema.safeParse(params.decision);
  if (!parsed.success) {
    return {
      checkId: params.check.id,
      category: params.check.category,
      severity: params.check.severity,
      status: params.check.severity === 'critical' ? 'failed' : 'warning',
      title: params.check.title,
      inputMessage: params.check.input?.message,
      expected: params.check.expected,
      actual: redactJson({ parseError: parsed.error.message, value: params.decision }),
      provider: params.provider,
      model: params.model,
      latencyMs: params.latencyMs,
      tokensInput: params.tokensInput,
      tokensOutput: params.tokensOutput,
      costEstimate: params.costEstimate,
      error: parsed.error.message,
    };
  }

  const decision = parsed.data;
  const errors = validateDecisionAgainstExpected(params.check, decision);
  const status = errors.length === 0
    ? 'passed'
    : params.check.severity === 'critical'
      ? 'failed'
      : 'warning';

  return {
    checkId: params.check.id,
    category: params.check.category,
    severity: params.check.severity,
    status,
    title: params.check.title,
    inputMessage: params.check.input?.message,
    expected: params.check.expected,
    actual: redactJson({
      taskType: decision.taskType,
      contactStatus: decision.contactStatus,
      intent: decision.intent,
      nextAction: decision.nextAction,
      userMessage: decision.userMessage,
      confidence: decision.confidence,
      requiresMeeting: decision.requiresMeeting,
      requiresManualReview: decision.requiresManualReview,
      decisionSummary: decision.decisionSummary,
      rulesApplied: decision.rulesApplied,
      quickReplies: decision.quickReplies,
      missingData: decision.missingData,
      warnings: decision.warnings,
      errors,
    }),
    provider: params.provider,
    model: params.model,
    latencyMs: params.latencyMs,
    tokensInput: params.tokensInput,
    tokensOutput: params.tokensOutput,
    costEstimate: params.costEstimate,
    error: errors.join('; ') || null,
    decision,
  };
}

export function validateDecisionAgainstExpected(check: KiaHealthCheck, decision: KiaDecision): string[] {
  const expected = check.expected;
  const errors: string[] = [];
  const output = [
    decision.userMessage,
    decision.decisionSummary,
    ...decision.rulesApplied,
    ...decision.warnings,
  ].join(' ');
  const normalizedOutput = normalize(output);

  if (expected.contactStatus && decision.contactStatus !== expected.contactStatus) {
    errors.push(`contactStatus expected ${expected.contactStatus}, got ${decision.contactStatus}`);
  }
  if (expected.intent && decision.intent !== expected.intent) {
    errors.push(`intent expected ${expected.intent}, got ${decision.intent}`);
  }
  if (expected.intentAny?.length && !expected.intentAny.includes(decision.intent)) {
    errors.push(`intent expected one of ${expected.intentAny.join(', ')}, got ${decision.intent}`);
  }
  if (expected.nextAction && decision.nextAction !== expected.nextAction) {
    errors.push(`nextAction expected ${expected.nextAction}, got ${decision.nextAction}`);
  }
  if (expected.nextActionAny?.length && !expected.nextActionAny.includes(decision.nextAction)) {
    errors.push(`nextAction expected one of ${expected.nextActionAny.join(', ')}, got ${decision.nextAction}`);
  }
  if (expected.requiresManualReview !== undefined && decision.requiresManualReview !== expected.requiresManualReview) {
    errors.push(`requiresManualReview expected ${expected.requiresManualReview}, got ${decision.requiresManualReview}`);
  }
  if (expected.requiresMeeting !== undefined && decision.requiresMeeting !== expected.requiresMeeting) {
    errors.push(`requiresMeeting expected ${expected.requiresMeeting}, got ${decision.requiresMeeting}`);
  }
  if (expected.minConfidence !== undefined && decision.confidence < expected.minConfidence) {
    errors.push(`confidence expected >= ${expected.minConfidence}, got ${decision.confidence}`);
  }
  for (const rule of expected.rulesApplied ?? []) {
    if (!decision.rulesApplied.includes(rule)) errors.push(`missing rule ${rule}`);
  }
  for (const value of expected.mustContain ?? []) {
    if (!normalizedOutput.includes(normalize(value))) errors.push(`must contain "${value}"`);
  }
  for (const value of expected.mustNotContain ?? []) {
    if (normalizedOutput.includes(normalize(value))) errors.push(`must not contain "${value}"`);
  }
  for (const field of expected.mustNotSet ?? []) {
    if ((decision.dataToSave as Record<string, unknown>)[field] !== undefined) errors.push(`must not set ${field}`);
  }
  const quickReplies = decision.quickReplies ?? [];
  if (expected.minQuickReplies !== undefined && quickReplies.length < expected.minQuickReplies) {
    errors.push(`quickReplies expected >= ${expected.minQuickReplies}, got ${quickReplies.length}`);
  }
  if (expected.requiresQuickReplies && quickReplies.length < 2) {
    errors.push('expected quickReplies for WABA clarification/menu');
  }
  if (expected.requiresOtherQuickReply) {
    const last = quickReplies[quickReplies.length - 1];
    if (!last || last.id !== 'btn_other') {
      errors.push(`expected last quickReply btn_other, got ${last?.id ?? 'none'}`);
    }
  }
  if (expected.maxQuestionMarks !== undefined) {
    const questionMarks = (decision.userMessage.match(/\?/g) ?? []).length;
    if (questionMarks > expected.maxQuestionMarks) {
      errors.push(`expected <= ${expected.maxQuestionMarks} question marks, got ${questionMarks}`);
    }
  }
  if (expected.requiresEmoji && !containsEmoji(decision.userMessage)) {
    errors.push('expected friendly emoji in WABA response');
  }
  if (expected.language === 'ru' && !/[\u0400-\u04FF]/.test(decision.userMessage)) {
    errors.push('expected Russian/Cyrillic userMessage');
  }
  if (expected.language === 'es' && /[\u0400-\u04FF]/.test(decision.userMessage)) {
    errors.push('expected Spanish/non-Cyrillic userMessage');
  }
  if (expected.forbidsApiKeyRequest && asksForApiKey(output)) {
    errors.push('asks for API key/token in unsafe channel');
  }
  if (expected.mustNotEchoSecrets && echoesSecret(check.input?.message, output)) {
    errors.push('echoes secret-like input');
  }
  if (expected.maxSimilarityToRecent !== undefined) {
    const recentTexts = recentAssistantTexts(check);
    const maxSimilarity = recentTexts.reduce((max, text) => Math.max(max, messageSimilarity(decision.userMessage, text)), 0);
    if (maxSimilarity > expected.maxSimilarityToRecent) {
      errors.push(`repeated answer similarity ${maxSimilarity.toFixed(2)} exceeded ${expected.maxSimilarityToRecent}`);
    }
  }
  if (!decision.decisionSummary.trim()) errors.push('missing decisionSummary');
  if (decision.rulesApplied.length === 0) errors.push('missing rulesApplied');
  if (check.id.includes('holded') || check.id.includes('monthly_plan')) {
    if (decision.nextAction === 'run_viability' || normalize(output).includes('comprobar viabilidad')) {
      errors.push('Holded/Planes must not use viability');
    }
  }
  if (check.id.includes('pay_without_login') && decision.nextAction === 'send_checkout_link') {
    errors.push('checkout link emitted without login/profile gate');
  }
  if (check.id.includes('present_tax') && /(he presentado|ya he presentado|present[eé] tu|presentaremos ahora)/i.test(output)) {
    errors.push('tax presentation claim');
  }

  return errors;
}

export function anomaliesFromHealthResult(result: KiaHealthCheckResult): KiaBehaviorAnomalyInput[] {
  if (result.status === 'passed' || result.status === 'skipped') return [];
  const actual = result.actual ?? {};
  const error = String(result.error ?? '');
  const source = 'canary' as const;
  const severity = result.severity === 'critical' ? 'critical' : result.status === 'failed' ? 'high' : 'medium';
  const anomalies: KiaBehaviorAnomalyInput[] = [];

  const push = (anomalyType: KiaBehaviorAnomalyInput['anomalyType'], title: string) => {
    anomalies.push({
      source,
      severity,
      anomalyType,
      title,
      description: error || `Health check ${result.checkId} did not pass.`,
      metadata: { checkId: result.checkId, actual },
    });
  };

  if (/invalid|parse/i.test(error)) push('invalid_json', 'Kia devolvió JSON inválido');
  else if (/api key|secret/i.test(error)) push('api_key_leak_risk', 'Riesgo de API key o secreto en respuesta');
  else if (/checkout/i.test(error)) push('forbidden_checkout', 'Checkout incumple requisitos');
  else if (/viability|Holded|Planes/i.test(error)) push('wrong_flow', 'Flujo incorrecto de Holded/Planes');
  else if (/tax|impuesto|iva|present/i.test(error)) push('tax_presentation_claim', 'Riesgo de presentación fiscal automática');
  else if (/language|Russian/i.test(error)) push('wrong_language', 'Idioma incorrecto');
  else if (/repeated answer|similarity/i.test(error)) push('repeated_answer_loop', 'Kia puede estar repitiendo respuesta');
  else if (/intent/i.test(error)) push('wrong_intent', 'Intent incorrecto');
  else push('wrong_flow', 'Kia no siguió el flujo esperado');

  return anomalies;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function containsEmoji(value: string): boolean {
  return /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(value);
}

function recentAssistantTexts(check: KiaHealthCheck): string[] {
  const recentMessages = check.input?.context?.recentMessages;
  if (!Array.isArray(recentMessages)) return [];
  return recentMessages
    .filter((message) => message.role === 'assistant' || message.role === 'admin')
    .map((message) => message.text)
    .filter(Boolean);
}

function asksForApiKey(value: string): boolean {
  const normalized = normalize(value);
  const askPattern = /(envia|enviame|mandame|pasame|comparte|dame|indica|escribe).{0,80}(api key|clave api|token)|(api key|clave api|token).{0,80}(por whatsapp|aqui|email)/i;
  const safePattern = /\b(no|nunca|evita)\b|panel seguro|portal seguro|enlace seguro/i;
  return askPattern.test(normalized) && !safePattern.test(normalized);
}

function echoesSecret(input: string | undefined, output: string): boolean {
  const secretLike = String(input ?? '').match(/(sk-[A-Za-z0-9_-]{8,}|[A-Za-z0-9_-]{24,}|x{4,})/);
  return Boolean(secretLike && output.includes(secretLike[0]));
}
