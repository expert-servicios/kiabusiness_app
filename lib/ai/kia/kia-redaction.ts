import { createHash } from 'crypto';

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\d)(?:\+?\d[\s().-]?){8,16}(?!\d)/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;
const API_KEY_RE = /\b(?:sk|rk|pk|whsec|xoxb|AIza|key|token)[A-Za-z0-9_\-]{16,}\b/g;

export function redactSensitiveText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(IBAN_RE, '[iban]')
    .replace(API_KEY_RE, '[secret]');
}

export function redactJson<T>(value: T): T {
  if (typeof value === 'string') return redactSensitiveText(value) as T;
  if (Array.isArray(value)) return value.map((item) => redactJson(item)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const lower = key.toLowerCase();
      if (lower.includes('api_key') || lower.includes('apikey') || lower.includes('secret') || lower.includes('token')) {
        out[key] = '[secret]';
      } else {
        out[key] = redactJson(val);
      }
    }
    return out as T;
  }
  return value;
}

export function stableHash(input: unknown): string {
  const redacted = redactJson(input);
  const serialized = JSON.stringify(redacted);
  return createHash('sha256').update(serialized).digest('hex');
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactSensitiveText(message).slice(0, 500);
}
