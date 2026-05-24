import { getConfiguredWabaAiProviders } from '@/lib/integrations/waba-ai';
import { KIA_TASK_TYPES, KIA_INTENTS, type KiaTaskType, type KiaChannel } from './kia-output-schema';
import { safeErrorMessage } from './kia-redaction';

const HAIKU = 'claude-haiku-4-5-20251001';

export interface KiaIntentClassification {
  suggestedTaskType: KiaTaskType;
  detectedIntent: (typeof KIA_INTENTS)[number];
  ambiguityScore: number;
  needsClarify: boolean;
  clarifyQuestion: string;
  clarifyOptions: Array<{ id: string; title: string }>;
  detectedLanguage: 'es' | 'ru';
  confidence: number;
}

const CLASSIFIER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'suggestedTaskType',
    'detectedIntent',
    'ambiguityScore',
    'needsClarify',
    'clarifyQuestion',
    'clarifyOptions',
    'detectedLanguage',
    'confidence',
  ],
  properties: {
    suggestedTaskType: { enum: [...KIA_TASK_TYPES] },
    detectedIntent: { enum: [...KIA_INTENTS] },
    ambiguityScore: { type: 'number', minimum: 0, maximum: 1 },
    needsClarify: { type: 'boolean' },
    clarifyQuestion: { type: 'string' },
    clarifyOptions: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string', maxLength: 20 },
        },
      },
    },
    detectedLanguage: { enum: ['es', 'ru'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;

function buildClassifierSystemPrompt(): string {
  return [
    'Eres un clasificador ultra-rapido de intencion para Kia, asistente de EXPERT Asesoria (gestoría fiscal y juridica en España).',
    '',
    'Tu unica tarea: dado el mensaje del usuario y los ultimos mensajes, devolver un JSON de clasificacion.',
    '',
    '<task_type_guide>',
    '- waba_reply: saludo, estado expediente, pregunta general, respuesta a quickReply',
    '- viability_reasoning: servicios con filtro juridico (arraigo, nacionalidad, NIE, residencia, Beckham, patrimonio, modelo 720)',
    '- readiness_reasoning: servicios que requieren Holded (contabilidad, plan mensual, migracion Holded)',
    '- checkout_decision: usuario quiere contratar, pagar o preguntar precio',
    '- next_best_action: cliente pide accion operativa sobre su expediente',
    '- company_status_summary: resumen contable, IVA, IRPF, estado fiscal empresa',
    '- document_classification: usuario envia o menciona un documento especifico',
    '</task_type_guide>',
    '',
    '<ambiguity_guide>',
    '- ambiguityScore 0.0-0.3: mensaje claro, needsClarify=false',
    '- ambiguityScore 0.4-0.6: parcialmente ambiguo, needsClarify=false si puedes inferir',
    '- ambiguityScore 0.7-1.0: genuinamente ambiguo, needsClarify=true',
    '- needsClarify=true SOLO si no puedes determinar la tarea ni el servicio con confianza',
    '- saludos, presentaciones y "hola" son ambiguityScore=0.3, needsClarify=false',
    '- si el usuario ya eligio una opcion en quickReply, ambiguityScore=0.1',
    '</ambiguity_guide>',
    '',
    '<clarify_guide>',
    '- si needsClarify=true: clarifyQuestion debe ser UNA sola pregunta breve',
    '- clarifyOptions: 2-3 opciones <= 20 chars, ultima siempre { id: "btn_other", title: "Otro" } (ES) o "Другое" (RU)',
    '- si needsClarify=false: clarifyQuestion="" y clarifyOptions=[]',
    '</clarify_guide>',
    '',
    '<strict_json_schema>',
    JSON.stringify(CLASSIFIER_SCHEMA),
    '</strict_json_schema>',
    'Devuelve UNICAMENTE el JSON. Sin markdown ni texto adicional.',
  ].join('\n');
}

function buildClassifierUserPrompt(
  message: string,
  recentMessages: Array<{ role: string; text: string }>,
  contactStatus: 'lead' | 'client' | 'unknown',
  channel: KiaChannel,
): string {
  const context = recentMessages.slice(-3).map((m) => `[${m.role}]: ${m.text.slice(0, 200)}`).join('\n');
  return [
    `<contact_status>${contactStatus}</contact_status>`,
    `<channel>${channel}</channel>`,
    context ? `<recent_messages>\n${context}\n</recent_messages>` : '',
    `<current_message>${message}</current_message>`,
    'Clasifica la intencion del current_message.',
  ].filter(Boolean).join('\n');
}

function parseClassification(raw: string): KiaIntentClassification | null {
  try {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;

    const suggestedTaskType = KIA_TASK_TYPES.includes(parsed.suggestedTaskType as KiaTaskType)
      ? (parsed.suggestedTaskType as KiaTaskType)
      : 'waba_reply';
    const detectedIntent = KIA_INTENTS.includes(parsed.detectedIntent as (typeof KIA_INTENTS)[number])
      ? (parsed.detectedIntent as (typeof KIA_INTENTS)[number])
      : 'unknown';

    return {
      suggestedTaskType,
      detectedIntent,
      ambiguityScore: typeof parsed.ambiguityScore === 'number' ? Math.max(0, Math.min(1, parsed.ambiguityScore)) : 0.5,
      needsClarify: Boolean(parsed.needsClarify),
      clarifyQuestion: typeof parsed.clarifyQuestion === 'string' ? parsed.clarifyQuestion : '',
      clarifyOptions: Array.isArray(parsed.clarifyOptions)
        ? (parsed.clarifyOptions as Array<{ id?: string; title?: string }>)
            .filter((o) => typeof o?.id === 'string' && typeof o?.title === 'string')
            .slice(0, 3)
            .map((o) => ({ id: o.id as string, title: (o.title as string).slice(0, 20) }))
        : [],
      detectedLanguage: parsed.detectedLanguage === 'ru' ? 'ru' : 'es',
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    };
  } catch {
    return null;
  }
}

export async function classifyKiaIntent(params: {
  message: string;
  recentMessages: Array<{ role: string; text: string }>;
  contactStatus: 'lead' | 'client' | 'unknown';
  channel: KiaChannel;
}): Promise<KiaIntentClassification | null> {
  const providers = getConfiguredWabaAiProviders();
  if (!providers.length) return null;

  const systemPrompt = buildClassifierSystemPrompt();
  const userPrompt = buildClassifierUserPrompt(
    params.message,
    params.recentMessages,
    params.contactStatus,
    params.channel,
  );

  for (const provider of providers) {
    try {
      if (provider.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': provider.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: HAIKU,
            max_tokens: 300,
            temperature: 0,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        const data = await response.json() as { content?: Array<{ type: string; text?: string }> };
        const rawText = data?.content?.find((c) => c.type === 'text')?.text ?? '';
        const result = parseClassification(rawText);
        if (result) return result;
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${provider.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model,
            max_tokens: 300,
            temperature: 0,
            response_format: {
              type: 'json_schema',
              json_schema: { name: 'kia_intent_classification', strict: true, schema: CLASSIFIER_SCHEMA },
            },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });
        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const rawText = data?.choices?.[0]?.message?.content ?? '';
        const result = parseClassification(rawText);
        if (result) return result;
      }
    } catch (err) {
      console.warn('[KiaIntentClassifier] provider failed', { provider: provider.provider, error: safeErrorMessage(err) });
    }
  }

  return null;
}
