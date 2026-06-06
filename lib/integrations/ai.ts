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

export async function summarizeCaseHistory(caseId: string): Promise<CaseSummary> {
  const client = getClient();
  if (!client) return { summary: '', keyDates: [], pendingActions: [] };

  const supabase = getSupabaseAdmin();
  const [caseResult, messagesResult, documentsResult] = await Promise.all([
    supabase.from('cases').select('category,service,state,opened_at,closed_at,admin_note').eq('id', caseId).single(),
    supabase.from('messages').select('body,sender_role,created_at').eq('case_id', caseId).order('created_at').limit(50),
    supabase.from('documents').select('original_name,state,created_at').eq('case_id', caseId).order('created_at')
  ]);

  const caseData = caseResult.data;
  if (!caseData) return { summary: '', keyDates: [], pendingActions: [] };

  const context = [
    `Expediente: ${caseData.service} (${caseData.category}) — Estado: ${caseData.state}`,
    `Abierto: ${caseData.opened_at ?? 'desconocido'}`,
    caseData.admin_note ? `Nota admin: ${caseData.admin_note}` : '',
    '',
    'Mensajes:',
    ...(messagesResult.data ?? []).map((m) => `[${m.sender_role} ${m.created_at}] ${m.body}`),
    '',
    'Documentos:',
    ...(documentsResult.data ?? []).map((d) => `- ${d.original_name} (${d.state}) — ${d.created_at}`)
  ].filter(Boolean).join('\n');

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Resume este expediente de asesoría en español. Devuelve JSON con "summary" (texto breve), "keyDates" (array de strings), "pendingActions" (array de acciones pendientes). Contexto:\n${context}`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: CaseSummary = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { summary: '', keyDates: [], pendingActions: [] };

    await logAiEvent({ eventType: 'summarizeCaseHistory', input: { caseId }, output: result, latencyMs: Date.now() - t0 });
    return result;
  } catch (err) {
    await logAiEvent({ eventType: 'summarizeCaseHistory', input: { caseId }, error: String(err), latencyMs: Date.now() - t0 });
    return { summary: '', keyDates: [], pendingActions: [] };
  }
}

export interface ViabilityResult {
  result: 'viable' | 'parcial' | 'no_viable';
  emoji: '🟢' | '🟡' | '🔴';
  summary: string;
  met: string[];
  missing: string[];
  recommendations: string[];
  nextSteps: string[];
  escalate: boolean;
}

export async function evaluateViability(params: {
  serviceSlug: string;
  serviceName: string;
  aiCriteria: string;
  answers: Record<string, string | boolean>;
  docStatus: Record<string, 'have' | 'missing' | 'need_help'>;
  clientName?: string;
}): Promise<ViabilityResult> {
  const fallback: ViabilityResult = {
    result: 'parcial',
    emoji: '🟡',
    summary: 'No se pudo evaluar automáticamente. Un asesor revisará tu caso.',
    met: [],
    missing: [],
    recommendations: ['Contacta con nuestro equipo para una evaluación personalizada.'],
    nextSteps: ['Solicita una consulta gratuita con nuestros asesores.'],
    escalate: true
  };

  const client = getClient();
  if (!client) return fallback;

  const answersText = Object.entries(params.answers)
    .map(([k, v]) => `- ${k}: ${String(v)}`)
    .join('\n');

  const docsText = Object.entries(params.docStatus)
    .map(([k, v]) => `- ${k}: ${v === 'have' ? 'disponible' : v === 'missing' ? 'no disponible' : 'necesita ayuda para obtenerlo'}`)
    .join('\n');

  const prompt = `Eres un asesor legal y fiscal español experto. Evalúa la viabilidad de tramitar el servicio "${params.serviceName}" para ${params.clientName ? `el cliente ${params.clientName}` : 'este cliente'}.

CRITERIOS LEGALES:
${params.aiCriteria}

RESPUESTAS DEL CLIENTE:
${answersText}

DOCUMENTACIÓN:
${docsText}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
{
  "result": "viable" | "parcial" | "no_viable",
  "emoji": "🟢" | "🟡" | "🔴",
  "summary": "máx 150 caracteres explicando el resultado",
  "met": ["requisito cumplido 1", "requisito cumplido 2"],
  "missing": ["requisito no cumplido o documentación faltante"],
  "recommendations": ["acción recomendada 1"],
  "nextSteps": ["próximo paso concreto"],
  "escalate": true | false
}

Reglas:
- "viable" (🟢): cumple todos los requisitos clave
- "parcial" (🟡): cumple algunos pero faltan elementos subsanables
- "no_viable" (🔴): incumple requisitos legales fundamentales
- escalate=true si hay dudas legales complejas o el resultado es ambiguo`;

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: ViabilityResult = jsonMatch ? JSON.parse(jsonMatch[0]) : fallback;

    await logAiEvent({
      eventType: 'evaluateViability',
      input: { serviceSlug: params.serviceSlug, answers: params.answers, docStatus: params.docStatus },
      output: result,
      latencyMs: Date.now() - t0
    });
    return result;
  } catch (err) {
    await logAiEvent({
      eventType: 'evaluateViability',
      input: { serviceSlug: params.serviceSlug },
      error: String(err),
      latencyMs: Date.now() - t0
    });
    return fallback;
  }
}

export interface DraftMessageResult {
  subject: string;
  body: string;
}

export async function draftClientMessage(
  caseId: string,
  goal: string
): Promise<DraftMessageResult> {
  const client = getClient();
  if (!client) return { subject: '', body: '' };

  const supabase = getSupabaseAdmin();
  const { data: caseRow } = await supabase
    .from('cases')
    .select('service, category, state, admin_note, client_id')
    .eq('id', caseId)
    .single();

  if (!caseRow) return { subject: '', body: '' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', caseRow.client_id)
    .single();

  const clientName = profile?.full_name ?? 'Cliente';

  const stateLabels: Record<string, string> = {
    nuevo:                'nuevo',
    pendiente_cliente:    'pendiente de documentación del cliente',
    en_revision:          'en revisión por el equipo',
    listo_para_presentar: 'listo para presentar ante el organismo',
    presentado:           'presentado ante el organismo',
    finalizado:           'finalizado',
    bloqueado:            'bloqueado temporalmente',
  };

  const context = [
    `Expediente: ${caseRow.service} (${caseRow.category})`,
    `Estado actual: ${stateLabels[caseRow.state] ?? caseRow.state}`,
    caseRow.admin_note ? `Nota interna: ${caseRow.admin_note}` : '',
    `Cliente: ${clientName}`,
  ].filter(Boolean).join('\n');

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Eres Ksenia, asesora de EXPERT Consulting (asesoría de extranjería y trámites legales en España). Redacta un mensaje profesional en español para el cliente ${clientName} sobre su expediente.

Contexto del expediente:
${context}

El administrador quiere comunicar: ${goal}

Devuelve JSON con:
- "subject": asunto conciso para email (ej: "Actualización de tu expediente")
- "body": cuerpo del mensaje. Tono profesional y cercano. Directo al punto. Sin markdown. Incluye saludo y despedida breves.`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: DraftMessageResult = jsonMatch
      ? (JSON.parse(jsonMatch[0]) as DraftMessageResult)
      : { subject: '', body: '' };

    await logAiEvent({ eventType: 'draftClientMessage', input: { caseId, goal }, output: result, latencyMs: Date.now() - t0 });
    return result;
  } catch (err) {
    await logAiEvent({ eventType: 'draftClientMessage', input: { caseId, goal }, error: String(err), latencyMs: Date.now() - t0 });
    return { subject: '', body: '' };
  }
}

export async function detectMissingDocuments(
  caseId: string,
  serviceType: string
): Promise<MissingDocumentsResult> {
  const client = getClient();
  if (!client) return { missing: [], present: [] };

  const supabase = getSupabaseAdmin();
  const { data: docs } = await supabase
    .from('documents')
    .select('original_name,state')
    .eq('case_id', caseId);

  const uploaded = (docs ?? []).map((d) => d.original_name).filter(Boolean);

  const t0 = Date.now();
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 384,
      messages: [{
        role: 'user',
        content: `Para un expediente de "${serviceType}" en España, determina qué documentos pueden faltar. Documentos ya subidos: ${uploaded.length ? uploaded.join(', ') : 'ninguno'}. Devuelve JSON con "missing" (array de documentos que probablemente faltan) y "present" (array de los ya subidos que reconoces). Sé conciso.`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result: MissingDocumentsResult = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { missing: [], present: uploaded };

    await logAiEvent({ eventType: 'detectMissingDocuments', input: { caseId, serviceType, uploaded }, output: result, latencyMs: Date.now() - t0 });
    return result;
  } catch (err) {
    await logAiEvent({ eventType: 'detectMissingDocuments', input: { caseId, serviceType }, error: String(err), latencyMs: Date.now() - t0 });
    return { missing: [], present: uploaded };
  }
}
