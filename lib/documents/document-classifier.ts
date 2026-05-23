import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { logAiEvent } from '@/lib/integrations/ai';
import { createNba } from '@/lib/nba/create-nba';
import { extractStructuredData } from './document-extractor';

const MODEL = 'claude-haiku-4-5-20251001';

export type DocumentSource = 'whatsapp' | 'email' | 'portal' | 'drive' | 'admin';
export type DocumentStatus = 'classified' | 'needs_review' | 'corrected' | 'rejected';

export interface ClassifyDocumentParams {
  fileName: string;
  mimeType?: string;
  caption?: string;
  source: DocumentSource;
  clientId?: string;
  caseId?: string;
  fileId?: string;
  sourceUrl?: string;
}

export interface ClassificationResult {
  id: string;
  detected_type: string;
  detected_subtype?: string;
  confidence: number;
  status: DocumentStatus;
  extracted_data: Record<string, string>;
}

// ── Rule-based fast classification ──────────────────────────────────────────

interface RuleResult {
  type: string;
  subtype?: string;
  confidence: number;
}

const EXT_MAP: Record<string, RuleResult> = {
  '.p12': { type: 'certificado_digital', confidence: 1.0 },
  '.pfx': { type: 'certificado_digital', confidence: 1.0 },
  '.cer': { type: 'certificado_digital', confidence: 0.95 },
  '.ogg': { type: 'otros', confidence: 0.95 },
  '.mp3': { type: 'otros', confidence: 0.95 },
  '.m4a': { type: 'otros', confidence: 0.95 },
  '.mp4': { type: 'otros', confidence: 0.95 },
};

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function quickClassify(fileName: string, mimeType?: string): RuleResult {
  const ext = getExtension(fileName);
  const lower = fileName.toLowerCase();

  // Extension-based hard rules
  if (EXT_MAP[ext]) return EXT_MAP[ext];

  // Excel/CSV → contable
  if (['.xlsx', '.xls', '.ods', '.csv'].includes(ext)) {
    return { type: 'excel_contable', confidence: 0.85 };
  }

  // AEAT model numbers in filename (very high confidence)
  const modelMatch = /\b(303|130|190|720|100|111|200|202|349|390)\b/.exec(lower);
  if (modelMatch) {
    return { type: 'modelo_aeat', subtype: modelMatch[1], confidence: 0.9 };
  }

  // Requerimiento
  if (/requeri?miento|requer\d|notificaci[oó]n.aeat/i.test(lower)) {
    return { type: 'requerimiento', confidence: 0.85 };
  }

  // Identity docs
  if (/\bdni\b/.test(lower)) return { type: 'dni', confidence: 0.85 };
  if (/\bnie\b/.test(lower)) return { type: 'nie', confidence: 0.85 };
  if (/\btie\b/.test(lower)) return { type: 'tie', confidence: 0.85 };
  if (/pasaporte/.test(lower)) return { type: 'pasaporte', confidence: 0.85 };

  // Invoices
  if (/factura.*(emitida|venta|cliente)|invoice.out/i.test(lower)) {
    return { type: 'factura_emitida', confidence: 0.8 };
  }
  if (/factura.*(recibida|proveedor|compra)|invoice.in/i.test(lower)) {
    return { type: 'factura_recibida', confidence: 0.8 };
  }
  if (/\bfactura\b|invoice/.test(lower)) {
    return { type: 'factura_emitida', confidence: 0.55 }; // ambiguous
  }

  // Banking
  if (/extracto|banco|cuenta|iban|transfer/i.test(lower)) {
    return { type: 'documento_bancario', confidence: 0.75 };
  }

  // Contracts
  if (/contrato|contract/i.test(lower)) {
    return { type: 'contrato', confidence: 0.8 };
  }

  // Certificates
  if (/certificado|certificate/i.test(lower)) {
    return { type: 'certificado', confidence: 0.75 };
  }

  // MIME-type fallbacks
  if (mimeType?.includes('pdf')) {
    return { type: 'otros', confidence: 0.3 };
  }
  if (mimeType?.includes('image')) {
    return { type: 'otros', confidence: 0.25 };
  }

  return { type: 'otros', confidence: 0.2 };
}

// ── AI classification ────────────────────────────────────────────────────────

const VALID_TYPES = [
  'requerimiento', 'modelo_aeat', 'factura_emitida', 'factura_recibida',
  'dni', 'nie', 'tie', 'pasaporte', 'datos_fiscales_aeat', 'contrato',
  'escritura', 'certificado', 'justificante_pago', 'documento_bancario',
  'excel_contable', 'certificado_digital', 'otros',
] as const;

async function aiClassify(params: ClassifyDocumentParams): Promise<RuleResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const t0 = Date.now();

  const prompt = `Eres un clasificador documental para una gestoría española (EXPERT Estudios Profesionales).
Clasifica este documento basándote SOLO en su nombre, tipo MIME y caption. NO tendrás acceso al contenido.

Nombre: ${params.fileName}
Tipo MIME: ${params.mimeType ?? 'desconocido'}
Caption: ${params.caption ?? '(sin caption)'}
Canal de entrada: ${params.source}

Tipos válidos: ${VALID_TYPES.join(', ')}

Devuelve SOLO JSON válido:
{"detected_type":"...","detected_subtype":"...o null","confidence":0.0}

Reglas:
- confidence entre 0.0 y 1.0
- detected_subtype puede ser null si no aplica
- Para modelo_aeat, detected_subtype es el número (303, 130, etc.)
- Para factura, subtype es "simplificada" o "completa" si se puede inferir
- Para certificado, subtype es el tipo (empadronamiento, vida_laboral, antecedentes, etc.)`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;

    const parsed = JSON.parse(json) as { detected_type: string; detected_subtype?: string; confidence: number };
    const type = VALID_TYPES.includes(parsed.detected_type as typeof VALID_TYPES[number])
      ? parsed.detected_type
      : 'otros';

    await logAiEvent({
      eventType: 'classifyDocument',
      input: { fileName: params.fileName, mimeType: params.mimeType, source: params.source },
      output: parsed,
      latencyMs: Date.now() - t0,
    });

    return { type, subtype: parsed.detected_subtype ?? undefined, confidence: parsed.confidence };
  } catch (err) {
    await logAiEvent({
      eventType: 'classifyDocument',
      input: { fileName: params.fileName },
      error: String(err),
      latencyMs: Date.now() - t0,
    });
    return null;
  }
}

// ── Main entry point ─────────────────────────────────────────────────────────

export async function classifyDocument(
  params: ClassifyDocumentParams
): Promise<ClassificationResult | null> {
  const admin = getSupabaseAdmin();

  // Step 1: try fast rule-based classification
  let { type: detected_type, subtype: detected_subtype, confidence } = quickClassify(
    params.fileName,
    params.mimeType
  );

  // Step 2: if low confidence, escalate to AI
  if (confidence < 0.75) {
    const ai = await aiClassify(params);
    if (ai && ai.confidence > confidence) {
      detected_type    = ai.type;
      detected_subtype = ai.subtype;
      confidence       = ai.confidence;
    }
  }

  const status: DocumentStatus = confidence >= 0.6 ? 'classified' : 'needs_review';
  const extracted_data = extractStructuredData(detected_type, params.fileName, params.caption);

  // Step 3: try to resolve client by NIF if not provided
  let resolvedClientId = params.clientId ?? null;
  if (!resolvedClientId && extracted_data.nif) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('tax_id', extracted_data.nif)
      .maybeSingle();
    if (profile) resolvedClientId = profile.id;
  }

  // Step 4: store classification
  const { data: inserted, error } = await admin
    .from('document_classifications')
    .insert({
      client_id:        resolvedClientId,
      case_id:          params.caseId ?? null,
      file_id:          params.fileId ?? null,
      source:           params.source,
      detected_type,
      detected_subtype: detected_subtype ?? null,
      confidence,
      extracted_data:   { ...extracted_data, ...(params.sourceUrl ? { source_url: params.sourceUrl } : {}) },
      status,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[classifyDocument] DB insert error', error?.message);
    return null;
  }

  // Step 5: create NBAs
  if (status === 'needs_review') {
    await createNba({
      action_type: 'documento_sin_clasificar',
      priority:    'media',
      title:       `Documento sin clasificar: ${params.fileName}`,
      description: `Confianza: ${Math.round(confidence * 100)}% — revisión manual requerida`,
      client_id:   resolvedClientId ?? undefined,
      case_id:     params.caseId,
      metadata:    { classification_id: inserted.id, file_name: params.fileName, source: params.source },
    });
  }

  if (detected_type === 'requerimiento') {
    await createNba({
      action_type: 'requerimiento_recibido',
      priority:    'critica',
      title:       `Requerimiento recibido: ${params.fileName}`,
      description: extracted_data.organismo ? `Organismo: ${extracted_data.organismo}` : undefined,
      client_id:   resolvedClientId ?? undefined,
      case_id:     params.caseId,
      metadata:    { classification_id: inserted.id, file_name: params.fileName },
    });
  }

  return {
    id: inserted.id,
    detected_type,
    detected_subtype,
    confidence,
    status,
    extracted_data,
  };
}
