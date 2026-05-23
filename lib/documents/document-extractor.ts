// Pure extraction — no AI, no async. Works from filename + caption text only.

export type ExtractedDocumentData = Record<string, string>;

const NIF_RE   = /\b[0-9]{8}[A-Za-z]\b/;
const NIE_RE   = /\b[XYZxyz][0-9]{7}[A-Za-z]\b/;
const CIF_RE   = /\b[ABCDEFGHJNPQRSUVWabcdefghjnpqrsuvw][0-9]{7}[0-9A-Ja-j]\b/;
const YEAR_RE  = /20[0-9]{2}/;
const DATE_RE  = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/;
const MODEL_RE = /(?:modelo[_\s-]?|mod[_\s-]?)?(?<num>303|130|190|720|100|111|200|202|349|390)\b/i;

export function extractStructuredData(
  _detectedType: string,
  fileName: string,
  caption?: string
): ExtractedDocumentData {
  const combined = [fileName.toLowerCase(), (caption ?? '').toLowerCase()].join(' ');
  const result: ExtractedDocumentData = {};

  // Tax ID
  const cifMatch = CIF_RE.exec(combined);
  if (cifMatch) result.nif = cifMatch[0].toUpperCase();
  else {
    const nieMatch = NIE_RE.exec(combined);
    if (nieMatch) result.nif = nieMatch[0].toUpperCase();
    else {
      const nifMatch = NIF_RE.exec(combined);
      if (nifMatch) result.nif = nifMatch[0].toUpperCase();
    }
  }

  // Year / fiscal year
  const yearMatch = YEAR_RE.exec(combined);
  if (yearMatch) result.ejercicio = yearMatch[0];

  // Quarter
  const quarterMatch = /(?:t([1-4])[^0-9]|[^0-9]([1-4])t[^0-9])/i.exec(combined);
  if (quarterMatch) result.periodo = `T${quarterMatch[1] ?? quarterMatch[2]}`;

  // AEAT model number
  const modelMatch = MODEL_RE.exec(combined);
  if (modelMatch?.groups?.num) result.modelo = modelMatch.groups.num;

  // Date
  const dateMatch = DATE_RE.exec(combined);
  if (dateMatch) result.fecha = dateMatch[0];

  return result;
}
