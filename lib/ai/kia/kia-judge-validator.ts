import type { KiaDecision } from './kia-output-schema';
import { KIA_NEXT_ACTIONS } from './kia-output-schema';
import type { KiaContext } from './kia-context-builder';
import { redactJson } from './kia-redaction';

const GPT4O_JUDGE_MODEL = 'gpt-4o';
const JUDGE_TIMEOUT_MS = 8_000;

export const JUDGE_REQUIRED_ACTIONS = new Set<KiaDecision['nextAction']>([
  'send_checkout_link',
  'create_next_best_action',
  'create_task',
  'update_case',
]);

export interface KiaJudgeResult {
  approved: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedNextAction: string;
  suggestedUserMessage: string;
}

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['approved', 'reason', 'riskLevel', 'suggestedNextAction', 'suggestedUserMessage'],
  properties: {
    approved:             { type: 'boolean' },
    reason:               { type: 'string' },
    riskLevel:            { enum: ['low', 'medium', 'high'] },
    suggestedNextAction:  { type: 'string' },
    suggestedUserMessage: { type: 'string' },
  },
} as const;

const JUDGE_SYSTEM_PROMPT = `
Eres el validador de seguridad de Kia (EXPERT Asesoria, gestoría fiscal y jurídica).
Tu tarea: revisar si una decision generada por el modelo principal es correcta, conservadora y segura.

Evalúa:
1. nextAction: ¿es la accion mas apropiada para el contexto y el mensaje?
2. userMessage: ¿es claro, correcto y no engañoso?
3. ¿Hay datos criticos faltantes que impidan esta accion con seguridad?
4. ¿Existe riesgo de accion prematura (enviar checkout sin readiness, crear tarea sin datos suficientes)?

Reglas de aprobacion:
- APRUEBA (approved=true) si la decision es correcta y no hay riesgo alto.
- RECHAZA (approved=false) si: datos inventados, accion muy prematura, riesgo alto para el usuario o el negocio.
- En caso de duda con riesgo MEDIO: aprueba pero indica el riesgo en reason.
- Si rechazas, proporciona suggestedNextAction (de la lista valida) y suggestedUserMessage alternativos.
- Si no tienes override, deja suggestedNextAction="" y suggestedUserMessage="".
- El campo reason debe ser conciso (max 150 chars).
`.trim();

function buildJudgeUserPrompt(params: {
  decision: KiaDecision;
  context: KiaContext;
  originalMessage: string;
}): string {
  const safeContext = redactJson({
    contactStatus: params.context.contact.status,
    profileCompleted: params.context.profile?.profileCompleted,
    billingReady: params.context.profile?.billingReady,
    holdedConnected: params.context.company?.holdedConnected,
    serviceFlowType: params.context.service?.flowType,
    openCasesCount: params.context.cases.length,
  });

  return [
    `<original_message>${params.originalMessage.slice(0, 500)}</original_message>`,
    '<context>',
    JSON.stringify(safeContext, null, 2),
    '</context>',
    '<decision_to_validate>',
    JSON.stringify({
      nextAction: params.decision.nextAction,
      intent: params.decision.intent,
      confidence: params.decision.confidence,
      userMessage: params.decision.userMessage.slice(0, 400),
      missingData: params.decision.missingData,
      warnings: params.decision.warnings,
    }, null, 2),
    '</decision_to_validate>',
    `Acciones validas para suggestedNextAction: ${KIA_NEXT_ACTIONS.join(', ')}`,
    'Valida la decision y devuelve SOLO el JSON.',
  ].join('\n');
}

export async function judgeKiaDecision(params: {
  decision: KiaDecision;
  context: KiaContext;
  originalMessage: string;
  openAiApiKey: string;
}): Promise<KiaJudgeResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JUDGE_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${params.openAiApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: GPT4O_JUDGE_MODEL,
        max_tokens: 300,
        temperature: 0,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'kia_judge_result', strict: true, schema: JUDGE_SCHEMA },
        },
        messages: [
          { role: 'system', content: JUDGE_SYSTEM_PROMPT },
          { role: 'user', content: buildJudgeUserPrompt(params) },
        ],
      }),
    });

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data?.choices?.[0]?.message?.content ?? '';
    if (!raw) return null;

    const parsed = JSON.parse(raw) as KiaJudgeResult;
    return {
      approved:             Boolean(parsed.approved),
      reason:               typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : '',
      riskLevel:            ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
      suggestedNextAction:  typeof parsed.suggestedNextAction === 'string' ? parsed.suggestedNextAction : '',
      suggestedUserMessage: typeof parsed.suggestedUserMessage === 'string' ? parsed.suggestedUserMessage : '',
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
