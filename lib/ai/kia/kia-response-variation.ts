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
