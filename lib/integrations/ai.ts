import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from './supabase';

const MODEL = 'claude-haiku-4-5-20251001';

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

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

export async function logAiEvent(params: AiLogParams): Promise<void> {
  try {
    await getSupabaseAdmin().from('ai_logs').insert({
      event_type: params.eventType,
      client_id: params.clientId ?? null,
      input: params.input ?? null,
      output: params.output ?? null,
      model: params.model ?? MODEL,
      latency_ms: params.latencyMs ?? null,
      error: params.error ?? null
    });
  } catch (err) {
    console.error('[AI] logAiEvent error:', err);
  }
}

/**
 * Classify a quote description into a fiscal/legal service category.
 */
export async function classifyQuote(description: string): Promise<QuoteClassification> {
  const client = getClient();
  if (!client) {
    console.log('[AI stub] classifyQuote — no ANTHROPIC_API_KEY');
    return { category: 'general', confidence: 0, suggestedService: null };
  }

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Clasifica esta solicitud de asesoría en una de estas categorías: fiscal, laboral, mercantil, extranjeria, contabilidad, general. Devuelve JSON con campos "category", "confidence" (0-1) y "suggestedService" (string o null). Solicitud: "${description}"`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: QuoteClassification = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { category: 'general', confidence: 0, suggestedService: null };

    await logAiEvent({ eventType: 'classifyQuote', input: { description }, output: result, latencyMs: Date.now() - t0 });
    return result;
  } catch (err) {
    await logAiEvent({ eventType: 'classifyQuote', input: { description }, error: String(err), latencyMs: Date.now() - t0 });
    return { category: 'general', confidence: 0, suggestedService: null };
  }
}

/**
 * Suggest the best service category for a free-text input.
 */
export async function suggestServiceCategory(text: string): Promise<string> {
  const client = getClient();
  if (!client) return 'general';

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 64,
      messages: [{
        role: 'user',
        content: `Dado este texto: "${text}", responde SOLO con la categoría de servicio más adecuada de: fiscal, laboral, mercantil, extranjeria, contabilidad, general. Sin explicación.`
      }]
    });

    const category = message.content[0].type === 'text'
      ? message.content[0].text.trim().toLowerCase()
      : 'general';

    await logAiEvent({ eventType: 'suggestServiceCategory', input: { text }, output: { category }, latencyMs: Date.now() - t0 });
    return category;
  } catch (err) {
    await logAiEvent({ eventType: 'suggestServiceCategory', input: { text }, error: String(err), latencyMs: Date.now() - t0 });
    return 'general';
  }
}

/**
 * Draft an admin reply to a client quote request.
 */
export async function draftAdminReply(params: {
  quoteDescription: string;
  clientName: string;
}): Promise<AdminReplyDraft> {
  const client = getClient();
  if (!client) return { subject: '', body: '' };

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Redacta una respuesta profesional en español a esta solicitud de presupuesto del cliente "${params.clientName}": "${params.quoteDescription}". Somos EXPERT ESTUDIOS PROFESIONALES, asesoría fiscal y legal en España. Devuelve JSON con "subject" y "body" (texto plano, sin HTML).`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: AdminReplyDraft = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { subject: `Re: Solicitud de ${params.clientName}`, body: '' };

    await logAiEvent({ eventType: 'draftAdminReply', input: params, output: result, latencyMs: Date.now() - t0 });
    return result;
  } catch (err) {
    await logAiEvent({ eventType: 'draftAdminReply', input: params, error: String(err), latencyMs: Date.now() - t0 });
    return { subject: '', body: '' };
  }
}

/**
 * Summarize the history of a case for admin review.
 * TODO: fetch case + messages + documents before calling, pass as context.
 */
export async function summarizeCaseHistory(caseId: string): Promise<CaseSummary> {
  console.log('[AI stub] summarizeCaseHistory — implement context fetch first', { caseId });
  return { summary: '', keyDates: [], pendingActions: [] };
}

/**
 * Detect which required documents are missing for a given case and service type.
 * TODO: fetch uploaded docs and compare against a known checklist.
 */
export async function detectMissingDocuments(
  caseId: string,
  serviceType: string
): Promise<MissingDocumentsResult> {
  console.log('[AI stub] detectMissingDocuments — implement checklist first', { caseId, serviceType });
  return { missing: [], present: [] };
}
