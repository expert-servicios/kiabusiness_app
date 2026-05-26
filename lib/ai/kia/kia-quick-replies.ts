import type { KiaDecision } from './kia-output-schema';

export type KiaQuickReply = KiaDecision['quickReplies'][number];

const OTHER_TITLES = {
  es: 'Otro',
  ru: '\u0414\u0440\u0443\u0433\u043e\u0435',
} as const;

const QUICK_REPLY_TITLE_MAX = 20;

function isOtherReply(reply: Pick<KiaQuickReply, 'id' | 'title'>): boolean {
  const title = reply.title.trim().toLowerCase();
  return reply.id === 'btn_other'
    || reply.id === 'quick_other'
    || title === 'otro'
    || title === '\u0434\u0440\u0443\u0433\u043e\u0435'
    || title === '\u0434\u0440\u0443\u0433\u043e\u0439';
}

export function otherQuickReply(locale: 'es' | 'ru'): KiaQuickReply {
  return {
    id: 'btn_other',
    title: OTHER_TITLES[locale],
    kind: 'other',
  };
}

export function normalizeKiaQuickReplies(
  replies: Array<Partial<KiaQuickReply> & { id?: string; title?: string }> | undefined,
  locale: 'es' | 'ru',
  options: { ensureOther?: boolean; maxItems?: number } = {},
): KiaQuickReply[] {
  const maxItems = Math.min(Math.max(options.maxItems ?? 3, 1), 3);
  const ensureOther = options.ensureOther ?? true;
  const normalized = (replies ?? [])
    .map((reply, index): KiaQuickReply | null => {
      const id = String(reply.id ?? `quick_${index}`).trim();
      const title = String(reply.title ?? '').trim().slice(0, QUICK_REPLY_TITLE_MAX);
      if (!id || !title) return null;
      if (isOtherReply({ id, title })) return otherQuickReply(locale);
      return {
        id,
        title,
        kind: reply.kind ?? 'secondary',
      };
    })
    .filter((reply): reply is KiaQuickReply => Boolean(reply));

  const withoutOther = normalized.filter((reply) => !isOtherReply(reply));
  if (!ensureOther) return withoutOther.slice(0, maxItems);

  const other = otherQuickReply(locale);
  if (withoutOther.length === 0) return [other];
  return [...withoutOther.slice(0, Math.max(0, maxItems - 1)), other].slice(0, maxItems);
}

export function quickRepliesToButtons(replies: KiaQuickReply[]): Array<{ id: string; title: string }> {
  return replies.map((reply) => ({ id: reply.id, title: reply.title.slice(0, QUICK_REPLY_TITLE_MAX) }));
}
