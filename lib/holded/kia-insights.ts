import Anthropic from '@anthropic-ai/sdk';
import { logAiEvent } from '@/lib/integrations/ai';
import type { QuarterSummary } from './quarter-data';

const MODEL = 'claude-haiku-4-5-20251001';
const QUARTER_LABELS = ['', 'primer', 'segundo', 'tercer', 'cuarto'];

export async function generateQuarterInsight(data: QuarterSummary): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const t0 = Date.now();

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const prompt = `Eres Kia, asistente de EXPERT Estudios Profesionales.
Resume el ${QUARTER_LABELS[data.quarter]} trimestre de ${data.year} para este cliente en máximo 3 frases en español, tono profesional y claro.

Datos del trimestre:
- Ventas totales: ${fmt(data.salesTotal)} (${data.salesCount} facturas emitidas)
- Gastos totales: ${fmt(data.purchasesTotal)} (${data.purchasesCount} facturas recibidas)
- IVA repercutido: ${fmt(data.vatRepercutido)}
- IVA soportado: ${fmt(data.vatSoportado)}
- Resultado estimado Modelo 303: ${fmt(Math.abs(data.vatResult))} ${data.vatResult >= 0 ? 'a ingresar' : 'a compensar'}

REGLAS ESTRICTAS:
- Máximo 3 frases.
- Solo describe datos del trimestre. No proyectes.
- No des consejos fiscales definitivos.
- No inventes datos ni cifras adicionales.
- Si los datos son 0 en todo, indica que no hay actividad registrada en este período.`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : null;
    await logAiEvent({
      eventType: 'generateQuarterInsight',
      input: { year: data.year, quarter: data.quarter, salesTotal: data.salesTotal },
      output: { text },
      latencyMs: Date.now() - t0,
    });
    return text;
  } catch (err) {
    await logAiEvent({
      eventType: 'generateQuarterInsight',
      input: { year: data.year, quarter: data.quarter },
      error: String(err),
      latencyMs: Date.now() - t0,
    });
    return null;
  }
}
