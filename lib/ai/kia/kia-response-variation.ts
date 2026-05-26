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

const SHORT_BODY_THRESHOLD = 60;

/** Returns the repetition decision and the closest recent outbound, if any. */
export function isRepeatedKiaMessage(params: {
  candidate: string;
  recentAssistantTexts: string[];
  threshold?: number;
}): { repeated: boolean; match?: SimilarMessageMatch } {
  const match = findSimilarRecentMessage(
    params.candidate,
    params.recentAssistantTexts,
    params.threshold ?? DEFAULT_THRESHOLD,
  );
  return match ? { repeated: true, match } : { repeated: false };
}

export function buildVariationRequest(params: {
  candidate: string;
  repeatedText: string;
  userMessage: string;
  recentAssistantTexts: string[];
  locale: 'es' | 'ru';
}): string {
  const recent = params.recentAssistantTexts
    .slice(-4)
    .map((text, index) => `${index + 1}. ${text.slice(0, 500)}`)
    .join('\n');
  const languageInstruction = params.locale === 'ru'
    ? 'Reescribe en ruso natural.'
    : 'Reescribe en espanol claro.';

  return [
    '<variation_request>',
    languageInstruction,
    'Mantén exactamente la misma decision operativa, enlaces, botones e IDs.',
    'Cambia apertura, estructura y cierre para que no parezca una repeticion.',
    'No anadas acciones nuevas ni cambies requisitos de checkout, login, perfil, Holded o viabilidad.',
    'Si ya se ofrecio un enlace o llamada, reconoce continuidad en vez de repetir el mismo CTA literal.',
    '<current_user_message>',
    params.userMessage || 'Sin mensaje de usuario disponible.',
    '</current_user_message>',
    '<candidate_to_rewrite>',
    params.candidate,
    '</candidate_to_rewrite>',
    '<similar_recent_message>',
    params.repeatedText,
    '</similar_recent_message>',
    '<recent_assistant_messages>',
    recent || 'Sin historial reciente.',
    '</recent_assistant_messages>',
    '</variation_request>',
  ].join('\n');
}

/** Returns true when the body should NOT be varied. */
export function shouldSkipVariation(body: string): boolean {
  return body.length < SHORT_BODY_THRESHOLD;
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
 * If the body is repeated (>= 0.72 similarity to a recent outbound), applies
 * deterministic opener rotation or a continuity prefix.
 * Preserves the operational content, only varies the phrasing.
 */
export function applyDeterministicVariation(body: string, recentTexts: string[]): string {
  if (shouldSkipVariation(body)) return body;
  const repeated = isRepeatedKiaMessage({ candidate: body, recentAssistantTexts: recentTexts });
  if (!repeated.repeated) return body;

  const rotated = rotateOpener(body, recentTexts.length);
  if (rotated !== body) return rotated;

  const prefix = /[\u0400-\u04FF]/.test(body)
    ? [
        '\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0430\u0435\u043c \u043e\u0442\u0441\u044e\u0434\u0430:',
        '\u041f\u043e \u044d\u0442\u043e\u043c\u0443 \u043f\u0443\u043d\u043a\u0442\u0443:',
        '\u0427\u0442\u043e\u0431\u044b \u0434\u0432\u0438\u043d\u0443\u0442\u044c\u0441\u044f \u0434\u0430\u043b\u044c\u0448\u0435:',
      ][recentTexts.length % 3]
    : ['Lo retomamos por aqui:', 'Para avanzar con esto:', 'Te lo dejo de otra forma:'][recentTexts.length % 3];
  return `${prefix}\n\n${body}`;
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
