export interface QuoteClassification {
  category: string;
  confidence: number;
  suggestedService: string | null;
}

export interface AdminReplyDraft {
  subject: string;
  body: string;
}

export interface CaseSummary {
  summary: string;
  keyDates: string[];
  pendingActions: string[];
}

export interface MissingDocumentsResult {
  missing: string[];
  present: string[];
}

export interface AiLogParams {
  eventType: string;
  clientId?: string;
  input?: unknown;
  output?: unknown;
  model?: string;
  latencyMs?: number;
  error?: string;
}

/**
 * Classify a quote description into a service category.
 * TODO: call Claude API with a classification prompt and parse structured output.
 */
export async function classifyQuote(description: string): Promise<QuoteClassification> {
  console.log('[AI stub] classifyQuote', { description });
  return { category: 'general', confidence: 0, suggestedService: null };
}

/**
 * Suggest the best service category for a free-text input.
 * TODO: call Claude API and return the top matched category slug.
 */
export async function suggestServiceCategory(text: string): Promise<string> {
  console.log('[AI stub] suggestServiceCategory', { text });
  return 'general';
}

/**
 * Draft an admin reply to a client quote request.
 * TODO: call Claude API with case context and return subject + body.
 */
export async function draftAdminReply(params: {
  quoteDescription: string;
  clientName: string;
}): Promise<AdminReplyDraft> {
  console.log('[AI stub] draftAdminReply', params);
  return { subject: '', body: '' };
}

/**
 * Summarize the history of a case for admin review.
 * TODO: fetch case + messages + documents, then call Claude API for a structured summary.
 */
export async function summarizeCaseHistory(caseId: string): Promise<CaseSummary> {
  console.log('[AI stub] summarizeCaseHistory', { caseId });
  return { summary: '', keyDates: [], pendingActions: [] };
}

/**
 * Detect which required documents are missing for a given case and service type.
 * TODO: fetch uploaded docs, compare against a known checklist, return diff.
 */
export async function detectMissingDocuments(
  caseId: string,
  serviceType: string
): Promise<MissingDocumentsResult> {
  console.log('[AI stub] detectMissingDocuments', { caseId, serviceType });
  return { missing: [], present: [] };
}

/**
 * Persist an AI interaction to the ai_logs table.
 * TODO: replace stub with real insert via getSupabaseAdmin().
 */
export async function logAiEvent(params: AiLogParams): Promise<void> {
  console.log('[AI stub] logAiEvent', params);
}
