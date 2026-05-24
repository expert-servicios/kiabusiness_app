import { buildKiaContext, type KiaContext, type KiaContextInput } from './kia-context-builder';
import { buildKiaSystemPrompt } from './kia-system-prompt';
import {
  buildFallbackDecision,
  extractJsonObject,
  KIA_DECISION_JSON_SCHEMA,
  kiaDecisionSchema,
  type KiaChannel,
  type KiaDecision,
  type KiaTaskType,
} from './kia-output-schema';
import { KIA_TOOL_DEFINITIONS, type KiaToolResult } from './kia-tool-definitions';
import { executeKiaToolCall } from './kia-tool-executor';
import { defaultEffortForTask, runKiaProviderRequest, type KiaProviderResult } from './kia-provider-router';
import { saveKiaDecisionLog } from './kia-decision-log';
import { redactJson, safeErrorMessage } from './kia-redaction';
import {
  buildNoRepeatInstruction,
  findSimilarRecentMessage,
  getRecentAssistantTextsFromContext,
} from './kia-response-variation';

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
}): Promise<KiaDecisionResult> {
  const context = await buildKiaContext({ ...input.contextInput, channel: input.channel, latestMessage: input.message });
  const locale = input.locale ?? context.contact.language;
  const systemPrompt = buildKiaSystemPrompt({ locale, channel: input.channel, taskType: input.taskType });
  const recentAssistantTexts = getRecentAssistantTextsFromContext(context);
  const promptPayload = buildUserPayload(input.message, context, recentAssistantTexts);
  let providerResult: KiaProviderResult | undefined;
  let decision: KiaDecision;
  let usedFallback = false;
  let error: unknown;

  if (process.env.KIA_AI_EVAL_MODE?.toLowerCase() === 'true') {
    decision = heuristicDecision(input.taskType, input.message, context);
  } else {
    try {
      providerResult = await runKiaProviderRequest({
        taskType: input.taskType,
        systemPrompt,
        messages: [{ role: 'user', content: promptPayload }],
        responseSchema: KIA_DECISION_JSON_SCHEMA,
        tools: input.allowTools ? KIA_TOOL_DEFINITIONS : undefined,
        effort: defaultEffortForTask(input.taskType),
        maxTokens: 900,
        temperature: 0.2,
      });

      decision = parseDecision(providerResult, input.taskType, context);
      const repeated = findSimilarRecentMessage(decision.userMessage, recentAssistantTexts);
      if (repeated) {
        const retry = await retryAvoidingRepetition({
          taskType: input.taskType,
          systemPrompt,
          message: input.message,
          context,
          repeatedText: repeated.text,
        });
        if (retry.decision) {
          providerResult = retry.providerResult;
          decision = retry.decision;
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

  const toolResults: KiaToolResult[] = [];
  const allowToolExecution = input.allowTools === true && process.env.KIA_AI_TOOLS_ENABLED?.toLowerCase() === 'true';
  if (allowToolExecution) {
    for (const request of decision.toolRequests) {
      toolResults.push(await executeKiaToolCall({ name: request.toolName, arguments: request.arguments }, context));
    }
  }

  await saveKiaDecisionLog({
    decision,
    channel: input.channel,
    context,
    providerResult,
    toolCalls: decision.toolRequests.map((request) => ({ name: request.toolName, arguments: request.arguments })),
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

function buildUserPayload(message: string, context: KiaContext, recentAssistantTexts: string[]): string {
  return [
    '<input>',
    JSON.stringify(redactJson({
      message,
      context,
    }), null, 2),
    '</input>',
    buildNoRepeatInstruction(recentAssistantTexts),
  ].join('\n');
}

function parseDecision(providerResult: KiaProviderResult, taskType: KiaTaskType, context: KiaContext): KiaDecision {
  if (providerResult.error) throw new Error(providerResult.error);
  const candidate = providerResult.parsedJson ?? extractJsonObject(providerResult.rawText ?? '');
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

async function tryRepairDecision(input: {
  taskType: KiaTaskType;
  systemPrompt: string;
  badOutput: string;
  context: KiaContext;
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
    return { decision: parseDecision(repair, input.taskType, input.context), providerResult: repair };
  } catch {
    return { decision: null };
  }
}

async function retryAvoidingRepetition(input: {
  taskType: KiaTaskType;
  systemPrompt: string;
  message: string;
  context: KiaContext;
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
    return { decision: parseDecision(providerResult, input.taskType, input.context), providerResult };
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
