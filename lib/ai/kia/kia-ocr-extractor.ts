const GPT4O_VISION_MODEL = 'gpt-4o';

export type InvoiceMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf';

export interface InvoiceOcrResult {
  vendorName: string;
  totalAmount: number;
  vatAmount: number;
  date: string;
  invoiceNumber: string;
  currency: string;
  confidence: number;
  needsManualReview: boolean;
}

const INVOICE_OCR_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['vendorName', 'totalAmount', 'vatAmount', 'date', 'invoiceNumber', 'currency', 'confidence', 'needsManualReview'],
  properties: {
    vendorName:        { type: 'string' },
    totalAmount:       { type: 'number' },
    vatAmount:         { type: 'number' },
    date:              { type: 'string' },
    invoiceNumber:     { type: 'string' },
    currency:          { type: 'string' },
    confidence:        { type: 'number', minimum: 0, maximum: 1 },
    needsManualReview: { type: 'boolean' },
  },
} as const;

const OCR_INSTRUCTIONS = [
  'Extrae los datos de esta factura o ticket. Reglas:',
  '- vendorName: nombre del emisor/proveedor. Vacío ("") si no visible.',
  '- totalAmount: importe total con IVA. -1 si no encontrado.',
  '- vatAmount: importe del IVA. -1 si no encontrado.',
  '- date: fecha en formato YYYY-MM-DD. Vacío si no visible.',
  '- invoiceNumber: número de factura. Vacío si no visible.',
  '- currency: código ISO (EUR, USD…). Por defecto "EUR".',
  '- confidence: 0.0 si imagen ilegible, 0.5 si parcialmente legible, 0.9+ si clara.',
  '- needsManualReview: true si hay datos críticos ambiguos o faltantes.',
].join(' ');

function fallbackResult(confidence = 0): InvoiceOcrResult {
  return { vendorName: '', totalAmount: -1, vatAmount: -1, date: '', invoiceNumber: '', currency: 'EUR', confidence, needsManualReview: true };
}

function parseOcrResponse(raw: string): InvoiceOcrResult {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    vendorName:        typeof parsed.vendorName === 'string' ? parsed.vendorName : '',
    totalAmount:       typeof parsed.totalAmount === 'number' ? parsed.totalAmount : -1,
    vatAmount:         typeof parsed.vatAmount === 'number' ? parsed.vatAmount : -1,
    date:              typeof parsed.date === 'string' ? parsed.date : '',
    invoiceNumber:     typeof parsed.invoiceNumber === 'string' ? parsed.invoiceNumber : '',
    currency:          typeof parsed.currency === 'string' && parsed.currency ? parsed.currency : 'EUR',
    confidence:        typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    needsManualReview: Boolean(parsed.needsManualReview),
  };
}

export async function extractInvoiceOcr(params: {
  mediaUrl: string;
  mediaType: InvoiceMediaType;
  openAiApiKey: string;
}): Promise<InvoiceOcrResult> {
  // PDFs require conversion to image — not handled here, flag for manual review
  if (params.mediaType === 'application/pdf') {
    return fallbackResult(0.1);
  }

  // Fetch media and base64-encode (WABA media URLs require no extra auth once resolved)
  let base64Data: string;
  try {
    const mediaRes = await fetch(params.mediaUrl);
    if (!mediaRes.ok) throw new Error(`Media fetch failed: HTTP ${mediaRes.status}`);
    const buffer = await mediaRes.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
    base64Data = btoa(binary);
  } catch {
    return fallbackResult(0);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${params.openAiApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: GPT4O_VISION_MODEL,
      max_tokens: 500,
      temperature: 0,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'invoice_ocr', strict: true, schema: INVOICE_OCR_SCHEMA },
      },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${params.mediaType};base64,${base64Data}`, detail: 'high' },
          },
          { type: 'text', text: OCR_INSTRUCTIONS },
        ],
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`GPT-4o OCR request failed: HTTP ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data?.choices?.[0]?.message?.content ?? '';

  return parseOcrResponse(raw);
}
