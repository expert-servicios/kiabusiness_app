import { buildKiaContext, type KiaContext, type KiaContextInput } from './kia-context-builder';
import { buildKiaSystemPrompt } from './kia-system-prompt';
import {
  buildFallbackDecision,
  extractJsonObject,
  KIA_DECISION_JSON_SCHEMA,
  KIA_CONTACT_STATUSES,
  kiaDecisionSchema,
  KIA_INTENTS,
  KIA_NEXT_ACTIONS,
  KIA_TASK_TYPES,
  type KiaChannel,
  type KiaDecision,
  type KiaTaskType,
  type KiaToolRequest,
} from './kia-output-schema';
import { KIA_TOOL_DEFINITIONS, type KiaToolResult } from './kia-tool-definitions';
import { executeKiaToolCall } from './kia-tool-executor';
import { defaultEffortForTask, modelForTask, runKiaProviderRequest, type KiaProviderResult } from './kia-provider-router';
import { saveKiaDecisionLog } from './kia-decision-log';
import { redactJson, safeErrorMessage } from './kia-redaction';
import {
  buildNoRepeatInstruction,
  findSimilarRecentMessage,
  getRecentAssistantTextsFromContext,
} from './kia-response-variation';
import { normalizeKiaQuickReplies } from './kia-quick-replies';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';

const KIA_MAX_TOOL_ITERATIONS = 5;
const KIA_TOOL_LOOP_TIMEOUT_MS = 25_000;

export interface KiaDecisionResult {
  decision: KiaDecision;
  context: KiaContext;
  providerResult?: KiaProviderResult;
  toolResults: KiaToolResult[];
  userMessage: string;
  usedFallback: boolean;
}

export async function runKiaDecision(input: {
  taskType: KiaTaskType;
  channel: KiaChannel;
  message: string;
  contextInput: KiaContextInput;
  locale?: 'es' | 'ru';
  allowTools?: boolean;
  forceToolExecution?: boolean;
  allowedToolNames?: string[];
}): Promise<KiaDecisionResult> {
  const context = await buildKiaContext({ ...input.contextInput, channel: input.channel, latestMessage: input.message });
  const locale = input.locale ?? context.contact.language;
  const msg  = input.message;
  const slug = input.contextInput.serviceSlug ?? '';
  const systemPrompt = buildKiaSystemPrompt({
    locale,
    channel        : input.channel,
    taskType       : input.taskType,
    currentPage    : input.contextInput.currentPage,
    currentTask    : input.contextInput.currentTask,
    pageData       : input.contextInput.pageData,
    includeHolded  : /\bholded\b|pack starter|migraci[oó]n holded|control horario|холдед/i.test(msg)  || /holded/i.test(slug),
    includeAeat    : /\b(irpf|renta|iva|hacienda|aeat|modelo\s*\d{2,3}|tributar|declaraci[oó]n.*renta|fiscal|036|037|130|303|390|720|151|no residente|irnr|renta web)\b/i.test(msg) || /irpf|iva|fiscal|no.residente|modelo.72|modelo.15|autonomo.gestion/i.test(slug),
    includeSs      : /\b(seguridad social|reta|cotizaci[oó]n|cuota.*aut[oó]nom|vida laboral|importass|cese de actividad|tarifa plana|baja.*laboral|alta.*aut[oó]nom|inss|tgss)\b/i.test(msg) || /alta.autonomo|autonomo|reta/i.test(slug),
    includeDgt     : /\b(dgt|trafico|transferencia.*vehiculo|vehiculo.*transferencia|matriculacion|canje.*permiso|permiso.*conducir|puntos.*carnet|baja.*vehiculo|multa.*trafico|permiso de circulacion|capitania)\b/i.test(msg) || /trafico|capitania/i.test(slug),
    includeJusticia: /\b(antecedentes penales|registro civil|apostilla|certificado.*nacimiento|certificado.*matrimonio|denominacion social|nota simple|registro.*propiedad|registro.*mercantil|deposito.*cuentas)\b/i.test(msg) || /constitucion.sl|arraigo|nacionalidad|notaria|herencia/i.test(slug),
    includePae     : /\b(pae|circe|crear empresa online|sl.*online|alta autonomo.*online|ventanilla unica|constitucion.*online)\b/i.test(msg) || /constitucion.sl|alta.autonomo/i.test(slug),
    includeCcaa    : /\b(itp|transmisiones patrimoniales|isd|sucesiones|donaciones|ajd|actos juridicos|impuesto.*herencia|herencia.*impuesto|impuesto de patrimonio|plusvalia.*municipal|suma.*alicante)\b/i.test(msg) || /notaria|herencia|compraventa/i.test(slug),
  });
  const recentAssistantTexts = getRecentAssistantTextsFromContext(context);
  const officialSourceContext = await buildOfficialSourceContext(input.message).catch((err) => {
    console.error('[KiaDecision] official source context failed:', safeErrorMessage(err));
    return '';
  });
  const allowedToolDefinitions = input.allowedToolNames?.length
    ? KIA_TOOL_DEFINITIONS.filter((tool) => input.allowedToolNames?.includes(tool.name))
    : KIA_TOOL_DEFINITIONS;
  const promptPayload = buildUserPayload(input.message, context, recentAssistantTexts, officialSourceContext);
  const allowToolExecution = input.allowTools === true && (
    input.forceToolExecution === true ||
    process.env.KIA_AI_TOOLS_ENABLED?.toLowerCase() === 'true'
  );
  const modelOverride = modelForTask(input.taskType, allowToolExecution);
  let providerResult: KiaProviderResult | undefined;
  let decision: KiaDecision;
  let usedFallback = false;
  let error: unknown;
  const toolResults: KiaToolResult[] = [];

  if (process.env.KIA_AI_EVAL_MODE?.toLowerCase() === 'true') {
    decision = heuristicDecision(input.taskType, input.message, context);
  } else {
    try {
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: promptPayload },
      ];

      const requestBase = {
        taskType: input.taskType,
        systemPrompt,
        responseSchema: KIA_DECISION_JSON_SCHEMA,
        tools: input.allowTools ? allowedToolDefinitions : undefined,
        effort: defaultEffortForTask(input.taskType),
        modelOverride,
        maxTokens: 900,
        temperature: 0.2,
      } as const;

      providerResult = await runKiaProviderRequest({ ...requestBase, messages });
      decision = applyBackendPolicyGuards(parseDecision(providerResult, input.taskType, context, locale), input, context);

      // Agentic tool loop: execute tools and feed results back to LLM until resolved
      if (allowToolExecution && decision.toolRequests.length > 0) {
        const loopStart = Date.now();
        let loopIteration = 0;

        while (
          decision.toolRequests.length > 0 &&
          loopIteration < KIA_MAX_TOOL_ITERATIONS &&
          Date.now() - loopStart < KIA_TOOL_LOOP_TIMEOUT_MS
        ) {
          const iterResults = await Promise.all(
            decision.toolRequests.map((req: KiaToolRequest) =>
              executeKiaToolCall({ name: req.toolName, arguments: req.arguments }, context),
            ),
          );
          toolResults.push(...iterResults);

          messages.push({ role: 'assistant', content: JSON.stringify(decision) });
          messages.push({ role: 'user', content: buildToolResultsPayload(decision.toolRequests, iterResults) });

          const loopProviderResult = await runKiaProviderRequest({
            ...requestBase,
            messages,
            effort: 'medium',
          });
          providerResult = loopProviderResult;
          decision = applyBackendPolicyGuards(
            parseDecision(loopProviderResult, input.taskType, context, locale),
            input,
            context,
          );
          loopIteration++;
        }

        if (decision.toolRequests.length > 0) {
          const reason = loopIteration >= KIA_MAX_TOOL_ITERATIONS
            ? `tool_loop_limit_reached:${KIA_MAX_TOOL_ITERATIONS}`
            : 'tool_loop_timeout';
          decision = {
            ...decision,
            warnings: [...decision.warnings, reason],
            toolRequests: [],
          };
        }
      }

      // Anti-repetition check on final response
      const repeated = findSimilarRecentMessage(decision.userMessage, recentAssistantTexts);
      if (repeated) {
        const retry = await retryAvoidingRepetition({
          taskType: input.taskType,
          systemPrompt,
          message: input.message,
          context,
          locale,
          repeatedText: repeated.text,
        });
        if (retry.decision) {
          providerResult = retry.providerResult;
          decision = applyBackendPolicyGuards(retry.decision, input, context);
        } else {
          decision = {
            ...decision,
            warnings: [...decision.warnings, `Possible repeated phrasing detected (${Math.round(repeated.similarity * 100)}%)`],
            rulesApplied: [...decision.rulesApplied, 'anti_repetition_checked'],
          };
        }
      }
    } catch (err) {
      error = err;
      const repaired = await tryRepairDecision({
        taskType: input.taskType,
        systemPrompt,
        badOutput: providerResult?.rawText ?? providerResult?.error ?? safeErrorMessage(err),
        context,
        locale,
      });
      if (repaired.decision) {
        providerResult = repaired.providerResult ?? providerResult;
        decision = repaired.decision;
      } else {
        usedFallback = true;
        decision = buildFallbackDecision({
          taskType: input.taskType,
          contactStatus: context.contact.status,
          reason: `Structured AI failed: ${safeErrorMessage(err)}`,
        });
      }
    }
  }

  decision = finalizeDecisionPresentation(decision, input.channel, locale);

  await saveKiaDecisionLog({
    decision,
    channel: input.channel,
    context,
    providerResult,
    toolCalls: decision.toolRequests.map((request: KiaToolRequest) => ({ name: request.toolName, arguments: request.arguments })),
    toolResults,
    rawInput: { taskType: input.taskType, channel: input.channel, message: input.message, contextInput: input.contextInput },
    error,
  });

  return {
    decision,
    context,
    providerResult,
    toolResults,
    userMessage: decision.userMessage,
    usedFallback,
  };
}

function finalizeDecisionPresentation(decision: KiaDecision, channel: KiaChannel, locale: 'es' | 'ru'): KiaDecision {
  const quickReplyAllowedActions: KiaDecision['nextAction'][] = ['ask_one_question', 'show_menu', 'reply_only'];
  const shouldKeepQuickReplies = (channel === 'waba' || decision.taskType === 'admin_ai_compose')
    && quickReplyAllowedActions.includes(decision.nextAction);
  const quickReplies = shouldKeepQuickReplies
    ? normalizeKiaQuickReplies(decision.quickReplies, locale, { ensureOther: true })
    : [];
  const rules = new Set(decision.rulesApplied);
  const warnings = [...decision.warnings];
  let userMessage = decision.userMessage;

  rules.add('history_checked');
  rules.add('anti_repetition_checked');
  if (quickReplies.length >= 2) {
    rules.add('quick_reply_policy_applied');
    if (decision.nextAction === 'ask_one_question') rules.add('clarifying_questions_policy_applied');
    rules.add('other_option_policy_applied');
  }

  const languageRepair = repairUserMessageLanguage(userMessage, locale, decision.nextAction);
  if (languageRepair.repaired) {
    userMessage = languageRepair.message;
    rules.add('latest_message_language_enforced');
    warnings.push('user_message_language_repaired_by_backend');
  }
  const questionRepair = enforceSingleQuestion(userMessage, decision.nextAction);
  if (questionRepair.repaired) {
    userMessage = questionRepair.message;
    rules.add('single_question_per_turn_backend_enforced');
    warnings.push('extra_question_marks_repaired_by_backend');
  }

  return {
    ...decision,
    userMessage,
    quickReplies: quickReplies.length >= 2 ? quickReplies : [],
    rulesApplied: Array.from(rules),
    warnings,
  };
}

function repairUserMessageLanguage(message: string, locale: 'es' | 'ru', nextAction: KiaDecision['nextAction']): { repaired: boolean; message: string } {
  if (locale === 'ru' && !/[А-Яа-яЁё]/.test(message)) {
    return { repaired: true, message: russianSafeMessage(nextAction) };
  }
  if (locale === 'es' && /[А-Яа-яЁё]/.test(message)) {
    return { repaired: true, message: spanishSafeMessage(nextAction) };
  }
  return { repaired: false, message };
}

function russianSafeMessage(nextAction: KiaDecision['nextAction']): string {
  if (nextAction === 'ask_one_question') {
    return 'Я Kia, виртуальная ассистентка EXPERT 😊 Чтобы помочь точнее, уточните, пожалуйста, что вам нужно сейчас?';
  }
  if (nextAction === 'show_menu') {
    return 'Я Kia, виртуальная ассистентка EXPERT 😊 Выберите подходящий вариант, а если ничего не подходит, нажмите «Другое».';
  }
  if (nextAction === 'get_case_status') {
    return 'Я Kia, виртуальная ассистентка EXPERT 😊 Проверю ваш вопрос по делу. Уточните, пожалуйста, о каком документе или этапе речь?';
  }
  return 'Я Kia, виртуальная ассистентка EXPERT 😊 Помогу вам с этим шагом. Напишите коротко, что нужно уточнить дальше.';
}

function spanishSafeMessage(nextAction: KiaDecision['nextAction']): string {
  if (nextAction === 'ask_one_question') {
    return 'Soy Kia, asistente virtual de EXPERT 😊 Para ayudarte mejor, dime qué necesitas aclarar ahora.';
  }
  if (nextAction === 'show_menu') {
    return 'Soy Kia, asistente virtual de EXPERT 😊 Elige la opción que encaje mejor; si no aparece, pulsa “Otro”.';
  }
  if (nextAction === 'get_case_status') {
    return 'Soy Kia, asistente virtual de EXPERT 😊 Reviso tu consulta sobre el expediente. ¿A qué documento o fase te refieres?';
  }
  return 'Soy Kia, asistente virtual de EXPERT 😊 Te ayudo con el siguiente paso. Cuéntame brevemente qué necesitas aclarar.';
}

function enforceSingleQuestion(message: string, nextAction: KiaDecision['nextAction']): { repaired: boolean; message: string } {
  if (nextAction !== 'ask_one_question') return { repaired: false, message };
  let questionMarks = 0;
  let repaired = false;
  const chars = [...message].map((char) => {
    if (char === '?') {
      questionMarks += 1;
      if (questionMarks > 1) {
        repaired = true;
        return '.';
      }
    }
    if (char === '¿' && questionMarks >= 1) {
      repaired = true;
      return '';
    }
    return char;
  });
  return { repaired, message: chars.join('').replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').trim() };
}

function buildToolResultsPayload(requests: KiaDecision['toolRequests'], results: KiaToolResult[]): string {
  const summary = results.map((r, i) => ({
    tool: r.toolName,
    ok: r.ok,
    ...(r.ok ? { result: r.result } : { error: r.error }),
    reason: requests[i]?.reason ?? '',
  }));
  return [
    '<tool_results>',
    JSON.stringify(summary, null, 2),
    '</tool_results>',
    'Incorpora estos resultados en una nueva KiaDecision JSON.',
    'Si tienes toda la información necesaria, usa toolRequests: [] y responde en userMessage.',
    'Si aún necesitas más datos de otra tool, inclúyela en toolRequests.',
  ].join('\n');
}

function buildUserPayload(
  message: string,
  context: KiaContext,
  recentAssistantTexts: string[],
  officialSourceContext: string,
): string {
  return [
    '<input>',
    JSON.stringify(redactJson({
      message,
      context,
    }), null, 2),
    '</input>',
    officialSourceContext ? `<official_source_context>\n${officialSourceContext}\n</official_source_context>` : '',
    buildNoRepeatInstruction(recentAssistantTexts),
  ].join('\n');
}

function parseDecision(providerResult: KiaProviderResult, taskType: KiaTaskType, context: KiaContext, locale: 'es' | 'ru'): KiaDecision {
  if (providerResult.error) throw new Error(providerResult.error);
  const candidate = normalizeDecisionCandidate(
    providerResult.parsedJson ?? extractJsonObject(providerResult.rawText ?? ''),
    taskType,
    context,
    locale,
  );
  const parsed = kiaDecisionSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(`Invalid KiaDecision JSON: ${parsed.error.message}`);
  }
  if (parsed.data.taskType !== taskType) {
    return { ...parsed.data, taskType, warnings: [...parsed.data.warnings, 'taskType corrected by backend'] };
  }
  if (parsed.data.contactStatus !== context.contact.status) {
    return { ...parsed.data, contactStatus: context.contact.status, warnings: [...parsed.data.warnings, 'contactStatus corrected by backend'] };
  }
  return parsed.data;
}

function normalizeDecisionCandidate(candidate: unknown, taskType: KiaTaskType, context: KiaContext, locale: 'es' | 'ru'): unknown {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return candidate;
  const record = { ...(candidate as Record<string, unknown>) };

  record.version = '1.0';
  if (!KIA_TASK_TYPES.includes(record.taskType as KiaTaskType)) record.taskType = taskType;
  if (!KIA_CONTACT_STATUSES.includes(record.contactStatus as KiaDecision['contactStatus'])) record.contactStatus = context.contact.status;

  record.intent = normalizeEnum(record.intent, KIA_INTENTS);
  record.nextAction = normalizeEnum(record.nextAction, KIA_NEXT_ACTIONS);
  record.userMessage = typeof record.userMessage === 'string' ? record.userMessage : String(record.userMessage ?? '');
  record.quickReplies = normalizeKiaQuickReplies(
    Array.isArray(record.quickReplies)
      ? record.quickReplies as Array<{ id?: string; title?: string; kind?: KiaDecision['quickReplies'][number]['kind'] }>
      : [],
    locale,
    { ensureOther: true },
  );
  record.toolRequests = Array.isArray(record.toolRequests) ? record.toolRequests.map(normalizeToolRequest).filter(Boolean) : [];
  record.dataToSave = isRecord(record.dataToSave) ? record.dataToSave : {};
  record.confidence = normalizeConfidence(record.confidence);
  record.requiresMeeting = normalizeBoolean(record.requiresMeeting);
  record.requiresManualReview = normalizeBoolean(record.requiresManualReview);
  record.decisionSummary = typeof record.decisionSummary === 'string' && record.decisionSummary.trim()
    ? record.decisionSummary
    : 'Decision estructurada normalizada por backend.';
  record.rulesApplied = normalizeStringArray(record.rulesApplied, ['structured_output_normalized']);
  record.missingData = normalizeStringArray(record.missingData, []);
  record.warnings = normalizeStringArray(record.warnings, []);

  return record;
}

function applyBackendPolicyGuards(
  decision: KiaDecision,
  input: { taskType: KiaTaskType; channel: KiaChannel; message: string },
  context: KiaContext,
): KiaDecision {
  const lower = input.message.toLowerCase();
  const rules = new Set(decision.rulesApplied);
  const warnings = [...decision.warnings];
  const missingData = new Set(decision.missingData);

  if ((input.channel === 'waba' || input.channel === 'email') && /(api key|clave api|token)/i.test(input.message)) {
    rules.add('never_request_api_key_in_whatsapp');
    rules.add('send_secure_holded_panel_link');
    warnings.push('backend_policy_override_api_key_channel');
    return {
      ...decision,
      intent: 'connect_holded',
      nextAction: 'send_holded_connect_link',
      userMessage: 'Por seguridad, no me envíes claves API por este chat. Usa el Panel Cliente seguro para conectar Holded; si no sabes sacarla, te puedo guiar paso a paso.',
      requiresManualReview: false,
      confidence: Math.max(decision.confidence, 0.9),
      rulesApplied: Array.from(rules),
      warnings,
    };
  }

  if (input.taskType === 'checkout_decision' && /(sin registrarme|sin registro|sin cuenta|sin login|pagar sin|pago sin)/i.test(input.message)) {
    rules.add('checkout_requires_login');
    rules.add('no_guest_checkout');
    warnings.push('backend_policy_override_checkout_login');
    return {
      ...decision,
      intent: 'checkout',
      nextAction: 'send_login_link',
      userMessage: 'Para pagar necesitamos que entres en el portal seguro. Así protegemos tus datos, validamos perfil y facturación, y evitamos crear un checkout incompleto.',
      requiresManualReview: false,
      confidence: Math.max(decision.confidence, 0.9),
      rulesApplied: Array.from(rules),
      warnings,
    };
  }

  const monthlyPlanRequiresHolded = context.service?.flowType === 'subscription_readiness';
  if (monthlyPlanRequiresHolded && !context.company?.holdedConnected) {
    rules.add('monthly_plan_requires_holded');
    rules.add('checkout_blocked_until_holded_connected');
    missingData.add('holded_connected');
    warnings.push('backend_policy_override_monthly_plan_holded');
    return {
      ...decision,
      intent: 'connect_holded',
      nextAction: 'send_holded_connect_link',
      userMessage: 'Para el plan mensual necesitamos primero conectar o preparar Holded desde el Panel Cliente. Así validamos que la contabilidad puede gestionarse bien antes de pagar.',
      requiresManualReview: false,
      requiresMeeting: false,
      confidence: Math.max(decision.confidence, 0.9),
      rulesApplied: Array.from(rules),
      missingData: Array.from(missingData),
      warnings,
    };
  }

  const holdedOrReadiness = context.service?.requiresHolded || context.service?.flowType === 'readiness' || /holded|migrar|migracion|migración/.test(lower);
  if (holdedOrReadiness && (decision.nextAction === 'run_viability' || input.taskType === 'readiness_reasoning')) {
    rules.add('holded_uses_readiness_not_viability');
    rules.add('readiness_before_checkout');
    warnings.push('backend_policy_override_holded_readiness');
    return {
      ...decision,
      intent: 'readiness',
      nextAction: 'run_readiness',
      requiresManualReview: false,
      confidence: Math.max(decision.confidence, 0.85),
      rulesApplied: Array.from(rules),
      warnings,
    };
  }

  if (input.taskType === 'viability_reasoning' && /arraigo|nacionalidad|residencia|renovar|modelo 720|patrimonio|beckham|denegaron|requerimiento/.test(lower)) {
    rules.add('service_flowtype_viability_detected');
    rules.add('run_viability_before_checkout');
    warnings.push('backend_policy_override_viability');
    return {
      ...decision,
      intent: 'viability',
      nextAction: 'run_viability',
      requiresManualReview: false,
      confidence: Math.max(decision.confidence, 0.85),
      rulesApplied: Array.from(rules),
      warnings,
    };
  }

  if (input.taskType === 'company_status_summary' || /presenta mi iva|presentar.*iva|iva|impuesto/.test(lower)) {
    rules.add('tax_summary_is_estimated');
    rules.add('no_tax_presentation_by_ai');
    warnings.push('backend_policy_override_tax_summary');
    return {
      ...decision,
      intent: 'accounting_summary',
      nextAction: decision.nextAction === 'create_next_best_action' ? 'create_next_best_action' : 'reply_only',
      userMessage: decision.userMessage.includes('Resumen estimado pendiente de revisión profesional')
        ? decision.userMessage
        : `Resumen estimado pendiente de revisión profesional. ${decision.userMessage || 'Puedo orientarte con los datos disponibles, pero la presentación requiere revisión profesional.'}`,
      requiresManualReview: false,
      confidence: Math.max(decision.confidence, 0.85),
      rulesApplied: Array.from(rules),
      warnings,
    };
  }

  if (context.contact.status === 'client' && /expediente|tr[aá]mite|estado|documento falta|documentos faltan/.test(lower)) {
    rules.add('client_flow');
    rules.add('case_status_context');
    if (context.conversation.selectedMessage) rules.add('reply_to_selected_message_only');
    warnings.push('backend_policy_override_case_status');
    return {
      ...decision,
      intent: 'case_status',
      nextAction: 'get_case_status',
      requiresManualReview: false,
      confidence: Math.max(decision.confidence, 0.85),
      rulesApplied: Array.from(rules),
      warnings,
    };
  }

  return decision;
}

function normalizeEnum<T extends readonly string[]>(value: unknown, allowed: T): T[number] | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return allowed.includes(normalized) ? normalized : value;
}

function normalizeToolRequest(value: unknown) {
  if (!isRecord(value)) return null;
  return {
    toolName: typeof value.toolName === 'string' ? value.toolName : typeof value.tool_name === 'string' ? value.tool_name : '',
    arguments: isRecord(value.arguments) ? value.arguments : {},
    reason: typeof value.reason === 'string' && value.reason.trim() ? value.reason : 'Solicitado por Kia',
  };
}

function normalizeConfidence(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
  if (!Number.isFinite(numberValue)) return 0;
  const normalized = numberValue > 1 && numberValue <= 100 ? numberValue / 100 : numberValue;
  return Math.max(0, Math.min(1, normalized));
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const result = value.map(String).map((item) => item.trim()).filter(Boolean);
  return result.length ? result : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function tryRepairDecision(input: {
  taskType: KiaTaskType;
  systemPrompt: string;
  badOutput: string;
  context: KiaContext;
  locale: 'es' | 'ru';
}): Promise<{ decision: KiaDecision | null; providerResult?: KiaProviderResult }> {
  try {
    const repair = await runKiaProviderRequest({
      taskType: input.taskType,
      systemPrompt: input.systemPrompt,
      messages: [{
        role: 'user',
        content: [
          'Repara la salida anterior y devuelve UNICAMENTE JSON KiaDecision valido.',
          'No inventes datos. Si no puedes reparar, usa nextAction=needs_review.',
          '<bad_output>',
          input.badOutput.slice(0, 4000),
          '</bad_output>',
          '<context>',
          JSON.stringify(redactJson(input.context), null, 2),
          '</context>',
        ].join('\n'),
      }],
      responseSchema: KIA_DECISION_JSON_SCHEMA,
      effort: 'low',
      maxTokens: 800,
      temperature: 0,
    });
    return { decision: parseDecision(repair, input.taskType, input.context, input.locale), providerResult: repair };
  } catch {
    return { decision: null };
  }
}

async function retryAvoidingRepetition(input: {
  taskType: KiaTaskType;
  systemPrompt: string;
  message: string;
  context: KiaContext;
  locale: 'es' | 'ru';
  repeatedText: string;
}): Promise<{ decision: KiaDecision | null; providerResult?: KiaProviderResult }> {
  try {
    const providerResult = await runKiaProviderRequest({
      taskType: input.taskType,
      systemPrompt: input.systemPrompt,
      messages: [{
        role: 'user',
        content: [
          'La respuesta candidata era demasiado parecida a una respuesta previa.',
          'Genera una nueva KiaDecision JSON valida, manteniendo la misma decision operativa si procede, pero con userMessage claramente distinto.',
          'No repitas apertura, cierre, CTA ni estructura. Reconoce continuidad si aplica.',
          '<current_user_message>',
          input.message,
          '</current_user_message>',
          '<repeated_previous_reply>',
          input.repeatedText.slice(0, 1200),
          '</repeated_previous_reply>',
          '<context>',
          JSON.stringify(redactJson(input.context), null, 2),
          '</context>',
        ].join('\n'),
      }],
      responseSchema: KIA_DECISION_JSON_SCHEMA,
      effort: 'low',
      maxTokens: 800,
      temperature: 0.45,
    });
    return { decision: parseDecision(providerResult, input.taskType, input.context, input.locale), providerResult };
  } catch {
    return { decision: null };
  }
}

function heuristicDecision(taskType: KiaTaskType, message: string, context: KiaContext): KiaDecision {
  const lower = message.toLowerCase();
  const isHolded = lower.includes('holded') || context.service?.requiresHolded;
  const wantsCheckout = /\b(contratar|pagar|checkout|precio|comprar)\b/i.test(message);
  const wantsCall = /\b(cita|llamada|reunion|reunión|hablar)\b/i.test(message);
  const nextAction = wantsCall ? 'book_call' : wantsCheckout ? 'send_login_link' : isHolded ? 'run_readiness' : 'reply_only';
  return {
    version: '1.0',
    taskType,
    contactStatus: context.contact.status,
    intent: wantsCheckout ? 'checkout' : wantsCall ? 'book_call' : isHolded ? 'readiness' : 'unknown',
    userMessage: wantsCall
      ? 'Puedes reservar una llamada de 15 minutos desde el portal seguro. EXPERT 💼'
      : wantsCheckout
        ? 'Para avanzar sin errores, entra en el portal seguro y completa tus datos antes de contratar. EXPERT 💼'
        : 'Te oriento con la informacion disponible. EXPERT 💼',
    nextAction,
    quickReplies: [],
    toolRequests: [],
    dataToSave: {},
    confidence: 0.65,
    requiresMeeting: wantsCall,
    requiresManualReview: false,
    decisionSummary: 'Decision heuristica en modo eval, sin proveedor IA externo.',
    rulesApplied: ['eval_mode', 'no_needs_review_for_commercial_flow'],
    missingData: [],
    warnings: [],
  };
}
