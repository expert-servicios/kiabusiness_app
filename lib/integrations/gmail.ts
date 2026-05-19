/**
 * Gmail API integration (admin inbox).
 * Uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — same app as Google Calendar.
 * Scopes: gmail.readonly, gmail.send, userinfo.email
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGoogle = any;

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
];

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  email?: string | null;
  scope?: string | null;
}

export interface GmailRefreshResult {
  refreshed: GmailTokens | null;
}

function getRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-gmail/callback`;
}

async function getOAuth2Client(tokens?: GmailTokens): Promise<AnyGoogle> {
  const { google } = await import('googleapis' as AnyGoogle);
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
  if (tokens) {
    client.setCredentials({
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date:   tokens.expiry_date,
    });
  }
  return client;
}

export async function getGmailAuthUrl(): Promise<string> {
  const client = await getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  });
}

export async function exchangeGmailCode(code: string): Promise<GmailTokens> {
  const client = await getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const { google } = await import('googleapis' as AnyGoogle);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    access_token:  tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date:   tokens.expiry_date!,
    email: data.email ?? null,
    scope: tokens.scope ?? null,
  };
}

async function ensureFresh(stored: GmailTokens): Promise<{ client: AnyGoogle; refreshed: GmailTokens | null }> {
  const client = await getOAuth2Client(stored);
  if (stored.expiry_date > Date.now() + 60_000) return { client, refreshed: null };

  const { credentials } = await client.refreshAccessToken();
  const refreshed: GmailTokens = {
    access_token:  credentials.access_token!,
    refresh_token: credentials.refresh_token ?? stored.refresh_token,
    expiry_date:   credentials.expiry_date!,
    email: stored.email,
    scope: credentials.scope ?? stored.scope,
  };
  client.setCredentials(credentials);
  return { client, refreshed };
}

// ── Shared types (same shape as MS365 inbox) ──────────────────────────

export interface GmailSummary {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
}

export interface GmailMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  bodyType: 'html' | 'text';
  unread: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────

function hdr(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function parseAddr(addr: string): { name: string; email: string } {
  const m = addr.match(/^(.+?)\s*<(.+?)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: addr, email: addr };
}

function b64decode(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractBody(payload: AnyGoogle): { body: string; bodyType: 'html' | 'text' } {
  function findPart(p: AnyGoogle, mime: string): string | null {
    if (p.mimeType === mime && p.body?.data) return b64decode(p.body.data);
    for (const part of p.parts ?? []) {
      const found = findPart(part, mime);
      if (found) return found;
    }
    return null;
  }
  const html = findPart(payload, 'text/html');
  if (html) return { body: html, bodyType: 'html' };
  const text = findPart(payload, 'text/plain');
  if (text) return { body: text, bodyType: 'text' };
  if (payload.body?.data) return { body: b64decode(payload.body.data), bodyType: 'text' };
  return { body: '', bodyType: 'text' };
}

// ── Public API ─────────────────────────────────────────────────────────

export async function listGmailMails(
  stored: GmailTokens,
  opts?: { query?: string; maxResults?: number }
): Promise<{ mails: GmailSummary[]; refreshed: GmailTokens | null }> {
  const { client, refreshed } = await ensureFresh(stored);
  const { google } = await import('googleapis' as AnyGoogle);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const q = opts?.query ? `in:inbox ${opts.query}` : 'in:inbox';
  const listRes = await gmail.users.threads.list({
    userId: 'me',
    q,
    maxResults: opts?.maxResults ?? 25,
  });

  const threads: AnyGoogle[] = listRes.data.threads ?? [];
  const mails: GmailSummary[] = [];

  for (const thread of threads) {
    const threadRes = await gmail.users.threads.get({
      userId: 'me',
      id: thread.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });

    const messages: AnyGoogle[] = threadRes.data.messages ?? [];
    const last = messages.at(-1);
    if (!last) continue;

    const headers: Array<{ name: string; value: string }> = last.payload?.headers ?? [];
    const { name: fromName, email: fromEmail } = parseAddr(hdr(headers, 'From'));
    const subject = hdr(headers, 'Subject') || '(Sin asunto)';
    const dateRaw = hdr(headers, 'Date');
    const unread = (last.labelIds ?? []).includes('UNREAD');
    const hasAttachment = messages.some((m: AnyGoogle) =>
      (m.payload?.parts ?? []).some((p: AnyGoogle) => p.filename?.length > 0)
    );

    mails.push({
      id: last.id!,
      conversationId: thread.id!,
      subject,
      from: fromName || fromEmail,
      fromEmail,
      snippet: threadRes.data.snippet ?? '',
      date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
      unread,
      hasAttachment,
    });
  }

  return { mails, refreshed };
}

export async function getGmailThread(
  stored: GmailTokens,
  threadId: string
): Promise<{ messages: GmailMessage[]; refreshed: GmailTokens | null }> {
  const { client, refreshed } = await ensureFresh(stored);
  const { google } = await import('googleapis' as AnyGoogle);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const threadRes = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  // Mark thread as read
  await gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  }).catch(() => null);

  const rawMsgs: AnyGoogle[] = threadRes.data.messages ?? [];
  const messages: GmailMessage[] = rawMsgs.map((msg: AnyGoogle) => {
    const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
    const { name: fromName, email: fromEmail } = parseAddr(hdr(headers, 'From'));
    const subject = hdr(headers, 'Subject') || '(Sin asunto)';
    const dateRaw = hdr(headers, 'Date');
    const { body, bodyType } = extractBody(msg.payload);

    return {
      id: msg.id!,
      conversationId: threadId,
      subject,
      from: fromName || fromEmail,
      fromEmail,
      to: hdr(headers, 'To'),
      date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
      body,
      bodyType,
      unread: (msg.labelIds ?? []).includes('UNREAD'),
    };
  });

  return { messages, refreshed };
}

export async function sendGmailReply(
  stored: GmailTokens,
  opts: { threadId: string; to: string; subject: string; body: string }
): Promise<{ refreshed: GmailTokens | null }> {
  const { client, refreshed } = await ensureFresh(stored);
  const { google } = await import('googleapis' as AnyGoogle);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const subject = opts.subject.startsWith('Re:') ? opts.subject : `Re: ${opts.subject}`;
  const raw = [
    `To: ${opts.to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    opts.body,
  ].join('\r\n');

  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded, threadId: opts.threadId },
  });

  return { refreshed };
}
