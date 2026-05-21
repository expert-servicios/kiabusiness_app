/**
 * Google Calendar OAuth2 + API helper.
 * Requires `googleapis` package: npm install googleapis
 * Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL
 */

// Dynamic import so the module doesn't crash at build time if googleapis isn't installed yet.
// Once googleapis is installed, these functions work normally.

import { absoluteAppUrl } from '@/lib/utils/app-url';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope?: string;
}

function getRedirectUri(): string {
  return absoluteAppUrl('/api/auth/google-calendar/callback');
}

async function getOAuth2Client(tokens?: StoredTokens) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
  if (tokens) client.setCredentials(tokens);
  return client;
}

export async function getAuthUrl(state?: string): Promise<string> {
  const client = await getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

export async function exchangeCode(code: string): Promise<StoredTokens> {
  const client = await getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    scope: tokens.scope,
  };
}

export async function refreshTokensIfNeeded(stored: StoredTokens): Promise<StoredTokens> {
  if (stored.expiry_date > Date.now() + 60_000) return stored;
  const client = await getOAuth2Client(stored);
  const { credentials } = await client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    refresh_token: credentials.refresh_token ?? stored.refresh_token,
    expiry_date: credentials.expiry_date!,
    scope: credentials.scope ?? stored.scope,
  };
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  date: string; // YYYY-MM-DD (all-day)
  reminderDaysBefore?: number[];
}

export async function upsertCalendarEvent(
  tokens: StoredTokens,
  input: CalendarEventInput,
  existingEventId?: string | null
): Promise<string> {
  const fresh = await refreshTokensIfNeeded(tokens);
  const client = await getOAuth2Client(fresh);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const cal = google.calendar({ version: 'v3', auth: client });

  const overrides = (input.reminderDaysBefore ?? [7, 1]).map((days) => ({
    method: 'email',
    minutes: days * 24 * 60,
  }));

  const resource = {
    summary: input.summary,
    description: input.description,
    start: { date: input.date },
    end: { date: input.date },
    reminders: { useDefault: false, overrides },
  };

  if (existingEventId) {
    const { data } = await cal.events.update({
      calendarId: 'primary',
      eventId: existingEventId,
      resource,
    });
    return data.id as string;
  }

  const { data } = await cal.events.insert({ calendarId: 'primary', resource });
  return data.id as string;
}

export async function deleteCalendarEvent(tokens: StoredTokens, eventId: string): Promise<void> {
  const fresh = await refreshTokensIfNeeded(tokens);
  const client = await getOAuth2Client(fresh);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const cal = google.calendar({ version: 'v3', auth: client });
  await cal.events.delete({ calendarId: 'primary', eventId }).catch(() => {
    // Already deleted — ignore
  });
}
