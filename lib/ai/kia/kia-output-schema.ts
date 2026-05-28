import { z } from 'zod';

export const KIA_TASK_TYPES = [
  'waba_reply',
  'admin_ai_compose',
  'document_classification',
  'document_extraction',
  'lead_client_decision',
  'viability_reasoning',
  'readiness_reasoning',
  'accounting_anomaly_review',
  'company_status_summary',
  'next_best_action',
  'checkout_decision',
] as const;

export type KiaTaskType = (typeof KIA_TASK_TYPES)[number];

export const KIA_CHANNELS = ['waba', 'admin', 'email', 'dashboard', 'document'] as const;
export type KiaChannel = (typeof KIA_CHANNELS)[number];

export const KIA_CONTACT_STATUSES = ['lead', 'client', 'unknown'] as const;
export type KiaDecisionContactStatus = (typeof KIA_CONTACT_STATUSES)[number];

export const KIA_INTENTS = [
  'greeting',
  'service_selection',
  'viability',
  'readiness',
  'checkout',
  'book_call',
  'complete_profile',
  'connect_holded',
  'send_documents',
  'case_status',
  'accounting_summary',
  'document_classification',
  'anomaly_review',
  'company_data_resolve',
  'company_data_confirm',
  'company_data_reject',
  'company_data_edit',
  'unknown',
] as const;

export const KIA_NEXT_ACTIONS = [
  'reply_only',
  'ask_one_question',
  'show_menu',
  'run_viability',
  'run_readiness',
  'send_checkout_link',
  'send_login_link',
  'send_profile_link',
  'send_holded_connect_link',
  'book_call',
  'classify_document',
  'get_case_status',
  'create_next_best_action',
  'update_case',
  'create_task',
  'needs_review',
  'send_company_lookup_link',
  'show_company_suggestion',
] as const;

export const KIA_QUICK_REPLY_KINDS = [
  'primary',
  'secondary',
  'other',
  'call',
  'checkout',
  'profile',
  'holded',
  'viability',
  'readiness',
] as const;

export const kiaToolRequestSchema = z.object({
  toolName: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
  reason: z.string().min(1),
});

export const kiaQuickReplySchema = z.object({
  id:    z.string().min(1).max(256),
  title: z.string().min(1).max(20),
  kind:  z.enum(KIA_QUICK_REPLY_KINDS).default('secondary'),
});

export const kiaDecisionSchema = z.object({
  version: z.literal('1.0'),
  taskType: z.enum(KIA_TASK_TYPES),
  contactStatus: z.enum(KIA_CONTACT_STATUSES),
  intent: z.enum(KIA_INTENTS),
  userMessage: z.string().default(''),
  nextAction: z.enum(KIA_NEXT_ACTIONS),
  quickReplies: z.array(kiaQuickReplySchema).max(3).default([]),
  toolRequests: z.array(kiaToolRequestSchema).default([]),
  dataToSave: z.record(z.string(), z.unknown()).default({}),
  confidence: z.number().min(0).max(1),
  requiresMeeting: z.boolean(),
  requiresManualReview: z.boolean(),
  decisionSummary: z.string().min(1),
  rulesApplied: z.array(z.string()).min(1),
  missingData: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

export type KiaDecision = z.infer<typeof kiaDecisionSchema>;
export type KiaToolRequest = z.infer<typeof kiaToolRequestSchema>;

export const documentClassificationDecisionSchema = z.object({
  documentType: z.string().min(1),
  documentSubtype: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  suggestedClientId: z.string().uuid().nullable(),
  suggestedCompanyId: z.string().uuid().nullable(),
  suggestedCaseId: z.string().uuid().nullable(),
  suggestedChecklistItemId: z.string().nullable(),
  extractedData: z.record(z.string(), z.unknown()).default({}),
  needsReview: z.boolean(),
  decisionSummary: z.string().min(1),
});

export type DocumentClassificationDecision = z.infer<typeof documentClassificationDecisionSchema>;

export const KIA_DECISION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'version',
    'taskType',
    'contactStatus',
    'intent',
    'userMessage',
    'nextAction',
    'quickReplies',
    'toolRequests',
    'dataToSave',
    'confidence',
    'requiresMeeting',
    'requiresManualReview',
    'decisionSummary',
    'rulesApplied',
    'missingData',
    'warnings',
  ],
  properties: {
    version: { const: '1.0' },
    taskType: { enum: KIA_TASK_TYPES },
    contactStatus: { enum: KIA_CONTACT_STATUSES },
    intent: { enum: KIA_INTENTS },
    userMessage: { type: 'string' },
    nextAction: { enum: KIA_NEXT_ACTIONS },
    toolRequests: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['toolName', 'arguments', 'reason'],
        properties: {
          toolName: { type: 'string' },
          arguments: { type: 'object' },
          reason: { type: 'string' },
        },
      },
    },
    quickReplies: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'kind'],
        properties: {
          id:    { type: 'string' },
          title: { type: 'string', maxLength: 20 },
          kind:  { enum: KIA_QUICK_REPLY_KINDS },
        },
      },
    },
    dataToSave: { type: 'object' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    requiresMeeting: { type: 'boolean' },
    requiresManualReview: { type: 'boolean' },
    decisionSummary: { type: 'string' },
    rulesApplied: { type: 'array', items: { type: 'string' } },
    missingData: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const;

export function buildFallbackDecision(params: {
  taskType: KiaTaskType;
  contactStatus?: KiaDecisionContactStatus;
  userMessage?: string;
  reason: string;
}): KiaDecision {
  return {
    version: '1.0',
    taskType: params.taskType,
    contactStatus: params.contactStatus ?? 'unknown',
    intent: 'unknown',
    userMessage: params.userMessage ?? '',
    nextAction: 'needs_review',
    quickReplies: [],
    toolRequests: [],
    dataToSave: {},
    confidence: 0,
    requiresMeeting: false,
    requiresManualReview: true,
    decisionSummary: params.reason,
    rulesApplied: ['safe_fallback', 'needs_review_only_for_technical_or_extreme_ambiguity'],
    missingData: [],
    warnings: [params.reason],
  };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty AI response');

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found');
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}
