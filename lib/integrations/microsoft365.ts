import { absoluteAppUrl } from '@/lib/utils/app-url';

const AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0/me';

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Mail.Read',
  'Mail.Send',
].join(' ');

function getRedirectUri() {
  return absoluteAppUrl('/api/auth/ms365/callback');
}

export function getMs365AuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: process.env.MS365_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    response_mode: 'query',
    prompt: 'consent',
  });
  if (state) params.set('state', state);
  return `${AUTH_BASE}/authorize?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function fetchToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MS365_CLIENT_ID!,
      client_secret: process.env.MS365_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      ...body,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description ?? 'MS365 token error');
  }
  return res.json();
}

export async function exchangeMs365Code(code: string) {
  const tokens = await fetchToken({ grant_type: 'authorization_code', code });
  const email = await getMs365UserEmail(tokens.access_token);
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    email,
  };
}

async function ensureFreshToken(stored: { access_token: string; refresh_token: string; expires_at: number }) {
  if (Date.now() < stored.expires_at - 60_000) {
    return { access_token: stored.access_token, refreshed: null };
  }
  const tokens = await fetchToken({ grant_type: 'refresh_token', refresh_token: stored.refresh_token, scope: SCOPES });
  const refreshed = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? stored.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };
  return { access_token: refreshed.access_token, refreshed };
}

async function graphGet(accessToken: string, path: string) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Graph GET ${path} failed: ${res.status}`);
  return res.json();
}

async function graphPatch(accessToken: string, path: string, body: object) {
  await fetch(`${GRAPH_BASE}${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function graphPost(accessToken: string, path: string, body: object) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Graph POST ${path} failed: ${res.status}`);
  }
}

async function getMs365UserEmail(accessToken: string): Promise<string> {
  const data = await fetch(`${GRAPH_BASE}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json());
  return data.mail ?? data.userPrincipalName ?? '';
}

export interface MailSummary {
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

export interface MailMessage {
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

export async function listMails(
  stored: { access_token: string; refresh_token: string; expires_at: number },
  opts: { query?: string; maxResults?: number } = {}
): Promise<{ mails: MailSummary[]; refreshed: typeof stored | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);

  const select = 'id,conversationId,subject,from,isRead,receivedDateTime,bodyPreview,hasAttachments';
  const top = opts.maxResults ?? 25;

  let url = `${GRAPH_BASE}/mailFolders/inbox/messages?$top=${top}&$orderby=receivedDateTime desc&$select=${select}`;
  if (opts.query) {
    url = `${GRAPH_BASE}/messages?$top=${top}&$orderby=receivedDateTime desc&$select=${select}&$search="${encodeURIComponent(opts.query)}"`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok) throw new Error(`listMails failed: ${res.status}`);
  const data = await res.json();

  const mails: MailSummary[] = (data.value ?? []).map((m: Record<string, unknown>) => {
    const fromObj = m.from as { emailAddress: { name: string; address: string } };
    return {
      id: m.id as string,
      conversationId: m.conversationId as string,
      subject: (m.subject as string) || '(sin asunto)',
      from: fromObj?.emailAddress?.name || fromObj?.emailAddress?.address || '',
      fromEmail: fromObj?.emailAddress?.address || '',
      snippet: (m.bodyPreview as string) || '',
      date: m.receivedDateTime as string,
      unread: !(m.isRead as boolean),
      hasAttachment: m.hasAttachments as boolean,
    };
  });

  return { mails, refreshed: refreshed ? { ...stored, ...refreshed } : null };
}

export async function getConversation(
  stored: { access_token: string; refresh_token: string; expires_at: number },
  conversationId: string
): Promise<{ messages: MailMessage[]; refreshed: typeof stored | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);

  const select = 'id,conversationId,subject,from,toRecipients,body,isRead,receivedDateTime';
  const filter = `conversationId eq '${conversationId}'`;
  const data = await graphGet(
    access_token,
    `/messages?$filter=${encodeURIComponent(filter)}&$orderby=receivedDateTime asc&$select=${select}`
  );

  // Mark unread messages as read
  for (const m of data.value ?? []) {
    if (!m.isRead) {
      await graphPatch(access_token, `/messages/${m.id}`, { isRead: true }).catch(() => null);
    }
  }

  const messages: MailMessage[] = (data.value ?? []).map((m: Record<string, unknown>) => {
    const fromObj = m.from as { emailAddress: { name: string; address: string } };
    const toArr = m.toRecipients as { emailAddress: { name: string; address: string } }[];
    const bodyObj = m.body as { contentType: string; content: string };
    return {
      id: m.id as string,
      conversationId: m.conversationId as string,
      subject: (m.subject as string) || '(sin asunto)',
      from: fromObj?.emailAddress?.name || fromObj?.emailAddress?.address || '',
      fromEmail: fromObj?.emailAddress?.address || '',
      to: toArr?.map((r) => r.emailAddress?.address).join(', ') || '',
      date: m.receivedDateTime as string,
      body: bodyObj?.content || '',
      bodyType: (bodyObj?.contentType?.toLowerCase() === 'html' ? 'html' : 'text') as 'html' | 'text',
      unread: !(m.isRead as boolean),
    };
  });

  return { messages, refreshed: refreshed ? { ...stored, ...refreshed } : null };
}

export async function sendReply(
  stored: { access_token: string; refresh_token: string; expires_at: number },
  opts: { messageId: string; comment: string }
): Promise<{ refreshed: typeof stored | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  await graphPost(access_token, `/messages/${opts.messageId}/reply`, { comment: opts.comment });
  return { refreshed: refreshed ? { ...stored, ...refreshed } : null };
}
