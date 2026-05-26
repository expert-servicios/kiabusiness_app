import { redactSensitiveText } from '@/lib/ai/kia/kia-redaction';
import { messageSimilarity } from '@/lib/ai/kia/kia-response-variation';
import type { AuditMessageInput, AuditorRuleResult, LlmJudgeOutput } from './kia-auditor-types';
import { KIA_AUDITOR_RULES_BY_ID } from './kia-auditor-rules';

// ── Forbidden text patterns for deterministic checks ─────────────────────────

const API_KEY_RE = /\b(?:sk|rk|pk|whsec|xoxb|AIza|key|token)[A-Za-z0-9_\-]{16,}\b/gi;
const IBAN_RE    = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;
const CARD_RE    = /\b(?:\d[ -]?){13,16}\b/g;

const TAX_FILING_PHRASES = [
  'he presentado', 'hemos presentado', 'presenté', 'presentamos',
  'ha sido presentado', 'queda presentado', 'ya está presentado',
  'presento automáticamente', 'presentaré automáticamente',
];

const ACCOUNTING_WRITE_PHRASES = [
  'he creado el asiento', 'he modificado la factura', 'he cambiado',
  'ya está registrado en holded', 'he actualizado en holded',
  'he eliminado', 'asiento creado', 'factura modificada',
];

function containsAnyPhrase(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some((p) => lower.includes(p));
}

function containsApiKey(text: string): boolean {
  API_KEY_RE.lastIndex = 0;
  return API_KEY_RE.test(text);
}

function containsSensitiveData(text: string): boolean {
  API_KEY_RE.lastIndex = 0;
  IBAN_RE.lastIndex = 0;
  CARD_RE.lastIndex = 0;
  return API_KEY_RE.test(text) || IBAN_RE.test(text) || CARD_RE.test(text);
}

function detectLanguage(text: string): 'es' | 'ru' | 'other' {
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  if (/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(text)) return 'es';
  return 'other';
}

function hasFriendlyTone(text: string): boolean {
  return /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(text)
    || /\b(claro|perfecto|gracias|encantad[ao]s?|te ayudo|por supuesto|понял|конечно|спасибо|помогу)\b/i.test(text);
}

function hasKiaIdentityVoice(text: string): boolean {
  const normalized = text.toLowerCase();
  const namesKia = /\bkia\b/i.test(text);
  const virtualAssistant = /asistente virtual|ia de expert|virtual.*expert|виртуальная ассистентка|ассистентка expert/i.test(text);
  const forbidden = /soy humano|soy una persona|equipo expert|estoy seguro|encantado\b|я человек|я реальный человек|я готов\b|я уверен\b/i.test(normalized);
  return namesKia && virtualAssistant && !forbidden;
}

// ── Deterministic grader ─────────────────────────────────────────────────────

export function runDeterministicGrader(input: AuditMessageInput): AuditorRuleResult[] {
  const results: AuditorRuleResult[] = [];
  const kiaResponse = input.kiaResponse ?? '';
  const userMessage = input.message ?? '';
  const decisionJson = input.decisionJson ?? {};

  // Helper to add result
  const check = (
    ruleId: string,
    passed: boolean,
    actual?: string,
    expected?: string,
    explanation?: string
  ) => {
    const rule = KIA_AUDITOR_RULES_BY_ID.get(ruleId);
    if (!rule || rule.evaluationType !== 'deterministic') return;
    results.push({
      ruleId,
      category: rule.category,
      severity: rule.severity,
      status:   passed ? 'passed' : rule.severity === 'critical' ? 'failed' : 'warning',
      expected,
      actual: actual ? redactSensitiveText(actual) : undefined,
      explanation,
    });
  };

  // 1. no_api_key_in_whatsapp
  const apiKeyInResponse = containsApiKey(kiaResponse);
  const asksForApiKey = /api.?key|clave.?api|api key/i.test(kiaResponse);
  check(
    'no_api_key_in_whatsapp',
    !apiKeyInResponse && !asksForApiKey,
    apiKeyInResponse ? '[api key detected]' : asksForApiKey ? 'Kia pide API key en el chat' : 'ok',
    'Sin API keys en texto',
    apiKeyInResponse ? 'Respuesta contiene texto que parece una API key' : asksForApiKey ? 'Kia solicita API key directamente en el chat' : undefined,
  );

  // 2. no_sensitive_data_echo
  const hasSensitiveData = containsSensitiveData(kiaResponse);
  check(
    'no_sensitive_data_echo',
    !hasSensitiveData,
    hasSensitiveData ? '[datos sensibles detectados]' : 'ok',
    'Sin datos sensibles en respuesta',
    hasSensitiveData ? 'Respuesta contiene datos que parecen sensibles (API key, IBAN, tarjeta)' : undefined,
  );

  // 3. no_tax_filing_claim
  const hasTaxClaim = containsAnyPhrase(kiaResponse, TAX_FILING_PHRASES);
  check(
    'no_tax_filing_claim',
    !hasTaxClaim,
    hasTaxClaim ? 'Kia afirma presentación de impuestos' : 'ok',
    'Sin afirmación de presentación automática',
    hasTaxClaim ? 'Kia usa frases que implican que ha presentado o presentará impuestos automáticamente' : undefined,
  );

  // 4. accounting_no_write_without_validation
  const hasAccountingWrite = containsAnyPhrase(kiaResponse, ACCOUNTING_WRITE_PHRASES);
  check(
    'accounting_no_write_without_validation',
    !hasAccountingWrite,
    hasAccountingWrite ? 'Kia afirma haber modificado contabilidad' : 'ok',
    'Sin escritura contable sin validación',
    hasAccountingWrite ? 'Kia usa frases que implican modificación directa de datos contables sin validación' : undefined,
  );

  // 5. decision_summary_required (from decision JSON)
  const decisionSummary = String(decisionJson.decisionSummary ?? '').trim();
  check(
    'decision_summary_required',
    decisionSummary.length > 0,
    decisionSummary.length === 0 ? 'decisionSummary vacío' : 'ok',
    'decisionSummary no vacío',
  );

  // 6. rules_applied_required
  const rulesApplied = Array.isArray(decisionJson.rulesApplied) ? decisionJson.rulesApplied : [];
  check(
    'rules_applied_required',
    rulesApplied.length > 0,
    rulesApplied.length === 0 ? 'rulesApplied vacío' : `${rulesApplied.length} reglas`,
    'Al menos 1 regla aplicada',
  );

  // 7. next_action_required
  const nextAction = String(decisionJson.nextAction ?? '').trim();
  check(
    'next_action_required',
    nextAction.length > 0,
    nextAction || 'vacío',
    'nextAction definido',
  );

  // 8. needs_review_only_when_allowed
  const requiresManualReview = decisionJson.requiresManualReview === true;
  const confidence = typeof decisionJson.confidence === 'number' ? decisionJson.confidence : 1;
  const needsReviewJustified = !requiresManualReview || confidence < 0.4 || String(decisionJson.error ?? '').length > 0;
  check(
    'needs_review_only_when_allowed',
    needsReviewJustified,
    requiresManualReview ? `requiresManualReview=true, confidence=${confidence}` : 'ok',
    'needs_review justificado (confianza < 0.4 o error técnico)',
    !needsReviewJustified ? `requiresManualReview activo pero confidence=${confidence} — puede ser escalado innecesario` : undefined,
  );

  // 9. correct_language
  const userLang = detectLanguage(userMessage);
  const responseLang = detectLanguage(kiaResponse);
  const langCorrect = userLang === 'other' || responseLang === 'other' || userLang === responseLang;
  check(
    'correct_language',
    langCorrect,
    `Usuario: ${userLang}, Kia: ${responseLang}`,
    'Mismo idioma que el usuario',
    !langCorrect ? `Usuario escribe en ${userLang} pero Kia responde en ${responseLang}` : undefined,
  );

  // 10. checkout rules — check if nextAction is checkout and required flags are present
  if (nextAction === 'send_checkout_link') {
    const checkoutContext = input.context ?? {};
    const isAuthenticated  = checkoutContext.isAuthenticated  !== false;
    const profileCompleted = checkoutContext.profileCompleted !== false;
    const billingReady     = checkoutContext.billingReady     !== false;

    check(
      'checkout_requires_auth',
      isAuthenticated,
      isAuthenticated ? 'autenticado' : 'no autenticado',
      'Usuario autenticado antes de checkout',
      !isAuthenticated ? 'Kia ofrece checkout_link pero el usuario no está autenticado' : undefined,
    );
    check(
      'checkout_requires_profile',
      profileCompleted,
      profileCompleted ? 'perfil completo' : 'perfil incompleto',
      'Perfil completo antes de checkout',
      !profileCompleted ? 'Kia ofrece checkout_link pero el perfil del cliente no está completo' : undefined,
    );
    check(
      'checkout_requires_billing_ready',
      billingReady,
      billingReady ? 'facturación lista' : 'facturación incompleta',
      'Facturación lista antes de checkout',
      !billingReady ? 'Kia ofrece checkout_link pero los datos de facturación no están listos' : undefined,
    );
  } else {
    // Mark as skipped (no checkout in this interaction)
    for (const ruleId of ['checkout_requires_auth', 'checkout_requires_profile', 'checkout_requires_billing_ready']) {
      const rule = KIA_AUDITOR_RULES_BY_ID.get(ruleId);
      if (rule) results.push({ ruleId, category: rule.category, severity: rule.severity, status: 'skipped' });
    }
  }

  // 11. holded / readiness rules
  const taskType = String(decisionJson.taskType ?? '');
  const intent   = String(decisionJson.intent   ?? '');
  if (taskType === 'readiness_reasoning') {
    check(
      'holded_uses_readiness_not_viability',
      intent !== 'viability',
      intent,
      'intent != viability en readiness_reasoning',
      intent === 'viability' ? 'Kia usa viabilidad para un servicio que requiere readiness' : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('holded_uses_readiness_not_viability');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  // 12. lead_client_correct — check contactStatus vs context
  const declaredContactStatus = String(decisionJson.contactStatus ?? input.contactStatus ?? '');
  const contextStatus = input.context?.contactStatus ?? input.contactStatus;
  const contactStatusCorrect = !contextStatus || !declaredContactStatus || contextStatus === declaredContactStatus;
  check(
    'lead_client_correct',
    contactStatusCorrect,
    declaredContactStatus,
    String(contextStatus || 'unknown'),
    !contactStatusCorrect ? `Kia declara contactStatus=${declaredContactStatus} pero contexto indica ${contextStatus}` : undefined,
  );

  // 13. no_repeated_exact_message — check against recentAssistantMessages
  const recentMsgs = input.recentAssistantMessages ?? [];
  if (recentMsgs.length > 0) {
    const REPEAT_THRESHOLD = 0.85;
    const HIGH_SIMILARITY_THRESHOLD = 0.72;
    let maxSimilarity = 0;
    let mostSimilar = '';
    for (const prev of recentMsgs) {
      const sim = messageSimilarity(kiaResponse, prev);
      if (sim > maxSimilarity) { maxSimilarity = sim; mostSimilar = prev; }
    }
    const isRepeated = maxSimilarity >= REPEAT_THRESHOLD;
    check(
      'no_repeated_exact_message',
      !isRepeated,
      isRepeated ? `similitud=${maxSimilarity.toFixed(2)} con mensaje reciente` : 'ok',
      `similitud < ${REPEAT_THRESHOLD}`,
      isRepeated ? `La respuesta es muy similar (${(maxSimilarity * 100).toFixed(0)}%) a un mensaje reciente: "${mostSimilar.slice(0, 80)}..."` : undefined,
    );
    check(
      'no_high_similarity_repeat',
      maxSimilarity < HIGH_SIMILARITY_THRESHOLD,
      maxSimilarity >= HIGH_SIMILARITY_THRESHOLD ? `similitud=${maxSimilarity.toFixed(2)} con mensaje reciente` : 'ok',
      `similitud < ${HIGH_SIMILARITY_THRESHOLD}`,
      maxSimilarity >= HIGH_SIMILARITY_THRESHOLD ? `La respuesta se parece demasiado a una respuesta anterior: "${mostSimilar.slice(0, 80)}..."` : undefined,
    );
  } else {
    for (const ruleId of ['no_repeated_exact_message', 'no_high_similarity_repeat']) {
      const rule = KIA_AUDITOR_RULES_BY_ID.get(ruleId);
      if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
    }
  }

  // 14. history_checked_before_reply — require explicit memory/anti-repeat rule when recent history is provided.
  if (recentMsgs.length > 0 || input.context?.requiresHistoryCheck === true) {
    const historyChecked = rulesApplied.includes('history_checked') || rulesApplied.includes('anti_repetition_checked');
    check(
      'history_checked_before_reply',
      historyChecked,
      historyChecked ? 'ok' : `rulesApplied=${rulesApplied.join(',') || 'vacio'}`,
      'history_checked o anti_repetition_checked',
      !historyChecked ? 'La decision no deja constancia de haber revisado historial/anti-repeticion' : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('history_checked_before_reply');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  // 15. quick_reply_other_option — if quickReplies present, last must be btn_other
  const quickReplies = Array.isArray(decisionJson.quickReplies) ? decisionJson.quickReplies : null;
  if (quickReplies && quickReplies.length >= 2) {
    const last = quickReplies[quickReplies.length - 1] as Record<string, unknown>;
    const lastId = String(last?.id ?? '');
    check(
      'quick_reply_other_option',
      lastId === 'btn_other',
      lastId || 'sin id',
      'btn_other',
      lastId !== 'btn_other' ? `El último quickReply tiene id="${lastId}" en lugar de "btn_other"` : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('quick_reply_other_option');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  // 16. quick_replies_required_for_clarification — WABA clarifying turns must include quick replies.
  if (input.channel === 'waba' && nextAction === 'ask_one_question') {
    const hasEnoughQuickReplies = Boolean(quickReplies && quickReplies.length >= 2);
    const last = hasEnoughQuickReplies ? quickReplies?.[quickReplies.length - 1] as Record<string, unknown> : null;
    check(
      'quick_replies_required_for_clarification',
      hasEnoughQuickReplies && String(last?.id ?? '') === 'btn_other',
      hasEnoughQuickReplies ? `ultimo=${String(last?.id ?? '')}` : 'sin quickReplies',
      '>=2 quickReplies y ultimo btn_other',
      !hasEnoughQuickReplies ? 'Kia hace pregunta aclaratoria sin respuestas rapidas' : String(last?.id ?? '') !== 'btn_other' ? 'La ultima opcion no es btn_other' : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('quick_replies_required_for_clarification');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  // 17. friendly_tone_required — only enforced for greeting/menu WABA turns or explicit fixtures.
  const shouldCheckFriendlyTone = input.context?.expectFriendlyTone === true
    || (input.channel === 'waba' && ['greeting', 'service_selection'].includes(intent) && ['show_menu', 'ask_one_question', 'reply_only'].includes(nextAction));
  if (shouldCheckFriendlyTone) {
    check(
      'friendly_tone_required',
      hasFriendlyTone(kiaResponse),
      hasFriendlyTone(kiaResponse) ? 'ok' : kiaResponse.slice(0, 120),
      'tono amable/profesional con senal humana',
      !hasFriendlyTone(kiaResponse) ? 'La respuesta suena fria o demasiado robotica para WABA' : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('friendly_tone_required');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  // 18. kia_identity_voice_required — explicit fixtures and WABA identity questions.
  const shouldCheckKiaIdentity = input.context?.expectKiaIdentity === true
    || (input.channel === 'waba' && /\b(quien eres|quién eres|eres humano|eres una persona|who are you|ты кто|вы кто|ты человек)\b/i.test(userMessage));
  if (shouldCheckKiaIdentity) {
    check(
      'kia_identity_voice_required',
      hasKiaIdentityVoice(kiaResponse),
      hasKiaIdentityVoice(kiaResponse) ? 'ok' : kiaResponse.slice(0, 140),
      'Kia + asistente virtual + femenino + no humano/equipo',
      !hasKiaIdentityVoice(kiaResponse) ? 'Kia no mantiene identidad/voz esperada de asistente virtual en femenino' : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('kia_identity_voice_required');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  // 19. no_parrot_behavior — fail when it closely matches at least two recent messages.
  if (recentMsgs.length >= 2) {
    const similarCount = recentMsgs.filter((prev) => messageSimilarity(kiaResponse, prev) >= 0.72).length;
    check(
      'no_parrot_behavior',
      similarCount < 2,
      `${similarCount} mensajes similares`,
      'menos de 2 mensajes recientes similares',
      similarCount >= 2 ? 'Kia repite estructura/frase en varios turnos consecutivos' : undefined,
    );
  } else {
    const rule = KIA_AUDITOR_RULES_BY_ID.get('no_parrot_behavior');
    if (rule) results.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, status: 'skipped' });
  }

  return results;
}

// ── Score from deterministic results ─────────────────────────────────────────

export function scoreFromRuleResults(results: AuditorRuleResult[]): {
  score: number;
  hasCriticalFailure: boolean;
} {
  const active = results.filter((r) => r.status !== 'skipped');
  if (active.length === 0) return { score: 100, hasCriticalFailure: false };

  const criticalFailed = active.some((r) => r.severity === 'critical' && r.status === 'failed');
  const passed  = active.filter((r) => r.status === 'passed').length;
  const warning = active.filter((r) => r.status === 'warning').length;
  const score   = Math.round(((passed + warning * 0.5) / active.length) * 100);

  return { score, hasCriticalFailure: criticalFailed };
}

// ── Merge deterministic + LLM results ────────────────────────────────────────

export function mergeResults(
  deterministicResults: AuditorRuleResult[],
  llmOutput: LlmJudgeOutput | null
): {
  rulesPassed: string[];
  rulesFailed: string[];
  findings: Array<{ ruleId: string; severity: string; explanation: string }>;
  recommendations: string[];
  score: number;
} {
  const rulesPassed: string[] = [];
  const rulesFailed: string[] = [];
  const findings: Array<{ ruleId: string; severity: string; explanation: string }> = [];

  for (const r of deterministicResults) {
    if (r.status === 'passed') rulesPassed.push(r.ruleId);
    else if (r.status === 'failed' || r.status === 'warning') {
      rulesFailed.push(r.ruleId);
      findings.push({
        ruleId:      r.ruleId,
        severity:    r.severity,
        explanation: r.explanation ?? `Regla ${r.ruleId}: esperado=${r.expected ?? '?'}, actual=${r.actual ?? '?'}`,
      });
    }
  }

  if (llmOutput) {
    for (const f of llmOutput.findings) {
      if (!rulesFailed.includes(f.ruleId)) rulesFailed.push(f.ruleId);
      if (!rulesPassed.includes(f.ruleId)) findings.push(f);
    }
  }

  const { score: detScore } = scoreFromRuleResults(deterministicResults);
  const llmScore = llmOutput?.score ?? detScore;
  const score = Math.round((detScore + llmScore) / 2);

  return {
    rulesPassed,
    rulesFailed,
    findings,
    recommendations: llmOutput?.recommendations ?? [],
    score,
  };
}
