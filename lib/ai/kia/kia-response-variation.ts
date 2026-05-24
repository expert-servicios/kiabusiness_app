import type { KiaContext } from './kia-context-builder';

export interface SimilarMessageMatch {
  text: string;
  similarity: number;
}

const MIN_TOKEN_COUNT = 6;
const DEFAULT_THRESHOLD = 0.72;

export function normalizeForSimilarity(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\*|_|~|`|["'“”«»]/g, '')
    .replace(/[^\p{L}\p{N}\s[\]/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSimilarityTokens(text: string): string[] {
  const normalized = normalizeForSimilarity(text);
  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && token !== 'url');
}

export function messageSimilarity(a: string, b: string): number {
  const aTokens = new Set(extractSimilarityTokens(a));
  const bTokens = new Set(extractSimilarityTokens(b));
  if (aTokens.size < MIN_TOKEN_COUNT || bTokens.size < MIN_TOKEN_COUNT) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = aTokens.size + bTokens.size - intersection;
  const jaccard = union > 0 ? intersection / union : 0;
  const aNorm = normalizeForSimilarity(a);
  const bNorm = normalizeForSimilarity(b);
  const prefix = aNorm.slice(0, 90) === bNorm.slice(0, 90) ? 1 : 0;

  return Math.max(jaccard, prefix);
}

export function findSimilarRecentMessage(
  candidate: string,
  recentAssistantTexts: string[],
  threshold = DEFAULT_THRESHOLD,
): SimilarMessageMatch | null {
  let best: SimilarMessageMatch | null = null;
  for (const text of recentAssistantTexts) {
    const similarity = messageSimilarity(candidate, text);
    if (similarity >= threshold && (!best || similarity > best.similarity)) {
      best = { text, similarity };
    }
  }
  return best;
}

export function getRecentAssistantTextsFromContext(context: KiaContext, limit = 6): string[] {
  return context.conversation.recentMessages
    .filter((message) => message.role === 'assistant' || message.role === 'admin')
    .map((message) => message.text)
    .filter(Boolean)
    .slice(-limit);
}

// ── Deterministic variation for Kia Engine replies ────────────────────────────

const URL_RE = /https?:\/\/\S+/;
const SHORT_BODY_THRESHOLD = 60;

/** Returns true if body is too similar to a recent outbound and should be varied. */
export function isRepeatedKiaMessage(
  body: string,
  recentTexts: string[],
  threshold = DEFAULT_THRESHOLD,
): boolean {
  return findSimilarRecentMessage(body, recentTexts, threshold) !== null;
}

/** Returns true when the body should NOT be varied (URLs, very short messages). */
export function shouldSkipVariation(body: string): boolean {
  return URL_RE.test(body) || body.length < SHORT_BODY_THRESHOLD;
}

// Each sub-array is a group of interchangeable openers.
// The function picks an alternative that differs from the one currently in use.
const OPENER_GROUPS: Array<{ pattern: RegExp; alts: string[] }> = [
  { pattern: /^Perfecto[,!\s]/i,           alts: ['Perfecto, ', 'Entendido, ', 'De acuerdo, ', 'Muy bien, '] },
  { pattern: /^¡Perfecto[!,]/i,            alts: ['¡Perfecto! ', '¡Entendido! ', '¡Muy bien! ', '¡Estupendo! '] },
  { pattern: /^¡Genial[!,]/i,              alts: ['¡Genial! ', '¡Perfecto! ', '¡Estupendo! ', '¡Muy bien! '] },
  { pattern: /^Genial[,!\s]/i,             alts: ['Genial, ', 'Perfecto, ', 'Muy bien, ', 'Entendido, '] },
  { pattern: /^Entendido[,!\s.]/i,         alts: ['Entendido. ', 'Perfecto. ', 'De acuerdo. ', 'Claro. '] },
  { pattern: /^¡Entendido[!,]/i,           alts: ['¡Entendido! ', '¡Perfecto! ', '¡Claro! ', '¡Muy bien! '] },
  { pattern: /^¡Claro[!,]/i,              alts: ['¡Claro! ', '¡Por supuesto! ', '¡Entendido! ', '¡Perfecto! '] },
  { pattern: /^No te preocupes/i,          alts: ['No te preocupes', 'Sin problema', 'Tranquilo/a', 'Está bien'] },
  { pattern: /^Sin problema/i,             alts: ['Sin problema', 'No te preocupes', 'Tranquilo/a', 'Claro'] },
  { pattern: /^(?:💬\s*)?¡Cuéntame[!,]/,  alts: ['💬 ¡Cuéntame! ', '😊 ¡Adelante! ', '💬 ¡Aquí estoy! ', '✨ ¡Dime! '] },
  // Russian openers
  { pattern: /^Отлично[,!\s]/,             alts: ['Отлично! ', 'Хорошо! ', 'Понял! ', 'Замечательно! '] },
  { pattern: /^Хорошо[,!\s]/,              alts: ['Хорошо! ', 'Отлично! ', 'Понятно! ', 'Понял! '] },
  { pattern: /^Понял[,!\s.]/,              alts: ['Понял. ', 'Хорошо. ', 'Отлично. ', 'Понятно. '] },
  { pattern: /^Не беспокойтесь/,           alts: ['Не беспокойтесь', 'Всё в порядке', 'Не волнуйтесь', 'Хорошо'] },
];

/**
 * Rotates the opener of `body` to a different phrase from the same group.
 * `seed` is used to pick deterministically without repeating the current opener.
 */
export function rotateOpener(body: string, seed: number): string {
  for (const { pattern, alts } of OPENER_GROUPS) {
    const match = body.match(pattern);
    if (!match) continue;
    const current = match[0];
    const rest    = body.slice(current.length);
    // Pick an alt that's different from current
    const filtered = alts.filter((a) => !body.startsWith(a.trimEnd()));
    if (filtered.length === 0) return body;
    const picked = filtered[Math.abs(seed) % filtered.length]!;
    return picked + rest;
  }
  return body;
}

/**
 * If the body is repeated (≥ 0.72 similarity to a recent outbound) and doesn't
 * contain a URL, applies deterministic opener rotation.
 * Preserves the operational content, only varies the phrasing.
 */
export function applyDeterministicVariation(body: string, recentTexts: string[]): string {
  if (shouldSkipVariation(body)) return body;
  if (!isRepeatedKiaMessage(body, recentTexts)) return body;
  return rotateOpener(body, recentTexts.length);
}

export function buildNoRepeatInstruction(recentAssistantTexts: string[]): string {
  if (recentAssistantTexts.length === 0) return '';
  const snippets = recentAssistantTexts.slice(-4).map((text, index) => `${index + 1}. ${text.slice(0, 500)}`).join('\n');
  return [
    '<anti_repetition_rules>',
    'Antes de responder, revisa estas respuestas previas de Kia/EXPERT.',
    'No reutilices la misma apertura, cierre, CTA ni estructura de parrafos.',
    'Si el usuario insiste sobre el mismo tema, reconoce continuidad y aporta el siguiente dato util en vez de repetir.',
    'Si ya ofreciste llamada, no vuelvas a decir la misma frase: explica por que conviene o pide un dato minimo.',
    'Si ya enviaste un enlace, no lo repitas salvo que el usuario lo pida; resume el siguiente paso.',
    '<recent_assistant_messages>',
    snippets,
    '</recent_assistant_messages>',
    '</anti_repetition_rules>',
  ].join('\n');
}
