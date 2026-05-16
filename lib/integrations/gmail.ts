const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
];

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  email?: string;
}

function getRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`;
}

async function getOAuth2Client(tokens?: GmailTokens) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = await import('googleapis' as any);
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
  if (tokens) client.setCredentials(tokens);
  return client;
}

export function getGmailAuthUrl(state = '') {
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })}`;
}

export async function exchangeGmailCode(code: string): Promise<GmailTokens & { email: string }> {
  const client = await getOAuth2Client();
  const { tokens } = await client.getToken(code);

  // Get user email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = await import('googleapis' as any);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    email: data.email,
  };
}

async function getAuthedClient(stored: GmailTokens) {
  const client = await getOAuth2Client(stored);
  if (Date.now() > stored.expiry_date - 60_000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    return { client, refreshed: { ...stored, access_token: credentials.access_token!, expiry_date: credentials.expiry_date! } };
  }
  return { client, refreshed: null };
}

export interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  unread: boolean;
}

function headerVal(headers: { name: string; value: string }[], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractEmail(str: string) {
  const m = str.match(/<(.+?)>/);
  return m ? m[1] : str.trim();
}

function decodeBody(data: string) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function getBodyFromParts(payload: Record<string, unknown>): string {
  const mimeType = payload.mimeType as string;
  if (mimeType === 'text/plain') {
    const data = (payload.body as Record<string, string>)?.data;
    return data ? decodeBody(data) : '';
  }
  if (mimeType === 'text/html') {
    const data = (payload.body as Record<string, string>)?.data;
    return data ? decodeBody(data) : '';
  }
  if (payload.parts) {
    for (const part of payload.parts as Record<string, unknown>[]) {
      const text = getBodyFromParts(part);
      if (text) return text;
    }
  }
  return '';
}

export async function listEmails(tokens: GmailTokens, opts: { query?: string; maxResults?: number } = {}): Promise<{ emails: EmailSummary[]; tokens: GmailTokens | null }> {
  const { client, refreshed } = await getAuthedClient(tokens);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = await import('googleapis' as any);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: opts.maxResults ?? 30,
    q: opts.query ?? 'in:inbox',
  });

  const messages: EmailSummary[] = [];
  for (const msg of listRes.data.messages ?? []) {
    const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
    const headers = detail.data.payload?.headers ?? [];
    const from = headerVal(headers, 'From');
    messages.push({
      id: detail.data.id,
      threadId: detail.data.threadId,
      subject: headerVal(headers, 'Subject') || '(sin asunto)',
      from,
      fromEmail: extractEmail(from),
      snippet: detail.data.snippet ?? '',
      date: headerVal(headers, 'Date'),
      unread: (detail.data.labelIds ?? []).includes('UNREAD'),
      hasAttachment: (detail.data.payload?.parts ?? []).some((p: { filename?: string }) => p.filename),
    });
  }

  return { emails: messages, tokens: refreshed };
}

export async function getThread(tokens: GmailTokens, threadId: string): Promise<{ messages: EmailMessage[]; tokens: GmailTokens | null }> {
  const { client, refreshed } = await getAuthedClient(tokens);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = await import('googleapis' as any);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const threadRes = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' });

  const messages: EmailMessage[] = (threadRes.data.messages ?? []).map((msg: Record<string, unknown>) => {
    const headers = (msg.payload as Record<string, unknown>)?.headers as { name: string; value: string }[] ?? [];
    const from = headerVal(headers, 'From');
    return {
      id: msg.id as string,
      threadId: msg.threadId as string,
      subject: headerVal(headers, 'Subject') || '(sin asunto)',
      from,
      fromEmail: extractEmail(from),
      to: headerVal(headers, 'To'),
      date: headerVal(headers, 'Date'),
      body: getBodyFromParts(msg.payload as Record<string, unknown>),
      unread: ((msg.labelIds as string[]) ?? []).includes('UNREAD'),
    };
  });

  // Mark thread as read
  await gmail.users.threads.modify({ userId: 'me', id: threadId, requestBody: { removeLabelIds: ['UNREAD'] } }).catch(() => null);

  return { messages, tokens: refreshed };
}

export async function sendReply(tokens: GmailTokens, opts: { to: string; subject: string; body: string; threadId?: string; inReplyTo?: string }): Promise<{ tokens: GmailTokens | null }> {
  const { client, refreshed } = await getAuthedClient(tokens);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = await import('googleapis' as any);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const subject = opts.subject.startsWith('Re:') ? opts.subject : `Re: ${opts.subject}`;
  const raw = [
    `To: ${opts.to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    opts.inReplyTo ? `In-Reply-To: ${opts.inReplyTo}` : '',
    '',
    opts.body,
  ].filter(Boolean).join('\r\n');

  const encoded = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encoded,
      threadId: opts.threadId,
    },
  });

  return { tokens: refreshed };
}
