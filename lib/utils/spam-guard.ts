const URL_PATTERN = /https?:\/\/|www\.|\.com\/|\.net\/|\.org\//i;

const SPAM_KEYWORDS = [
  'casino', 'viagra', 'cialis', 'porn', 'xxx', 'seo service', 'buy followers',
  'cheap loan', 'make money fast', 'click here', 'free download', 'earn money',
  'crypto investment', 'bitcoin profit', 'work from home guaranteed'
];

const TEMP_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com',
  'throwam.com', 'tempmail.com', 'fakeinbox.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'spam4.me', 'dispostable.com'
];

const REPEAT_CHAR_RE = /(.)\1{4,}/;

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

export function checkSpam(fields: {
  name?: string;
  email?: string;
  message?: string;
  subject?: string;
}): SpamCheckResult {
  const name = fields.name ?? '';
  const email = fields.email ?? '';
  const message = fields.message ?? '';
  const subject = fields.subject ?? '';
  const allText = `${name} ${message} ${subject}`.toLowerCase();

  if (URL_PATTERN.test(name)) {
    return { isSpam: true, reason: 'url_in_name' };
  }

  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (TEMP_EMAIL_DOMAINS.includes(domain)) {
    return { isSpam: true, reason: 'disposable_email' };
  }

  const urlCount = (message.match(/https?:\/\//gi) ?? []).length;
  if (urlCount >= 2) {
    return { isSpam: true, reason: 'multiple_urls_in_message' };
  }

  if (SPAM_KEYWORDS.some((kw) => allText.includes(kw))) {
    return { isSpam: true, reason: 'spam_keyword' };
  }

  if (REPEAT_CHAR_RE.test(message)) {
    return { isSpam: true, reason: 'repeated_chars' };
  }

  if (message.length > 10 && message.replace(/\s/g, '').length / message.length < 0.3) {
    return { isSpam: true, reason: 'low_density' };
  }

  return { isSpam: false };
}

const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT = 5;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
