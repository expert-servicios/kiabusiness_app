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

const CALENDAR_SA_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const CALENDAR_SA_IMPERSONATE = 'info@expertconsulting.es';

export function hasCalendarSA(): boolean {
  return !!(process.env.GOOGLE_GMAIL_SA_EMAIL && process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY);
}

async function getCalendarSAClient() {
  if (!hasCalendarSA()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_GMAIL_SA_EMAIL!,
    key: process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: CALENDAR_SA_SCOPES,
    subject: CALENDAR_SA_IMPERSONATE,
  });
  return google.calendar({ version: 'v3', auth });
}

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
  date: string; // YYYY-MM-DD (all-day OR the date part of a timed event)
  // Optional fields for timed events (e.g. citas)
  startTime?: string;        // HH:MM (24h), makes it a timed event instead of all-day
  endTime?: string;          // HH:MM (24h), defaults to startTime + 60 min
  timezone?: string;         // IANA tz, defaults to 'Europe/Madrid'
  reminderDaysBefore?: number[];
  reminderMinutesBefore?: number[]; // Used for timed events instead of day-based
}

function buildEventResource(input: CalendarEventInput) {
  const tz = input.timezone ?? 'Europe/Madrid';
  const overrides = input.startTime
    ? (input.reminderMinutesBefore ?? [60, 15]).map((m) => ({ method: 'email', minutes: m }))
    : (input.reminderDaysBefore ?? [7, 1]).map((d) => ({ method: 'email', minutes: d * 24 * 60 }));

  if (input.startTime) {
    // Timed event
    const startDt = `${input.date}T${input.startTime}:00`;
    let endDt: string;
    if (input.endTime) {
      endDt = `${input.date}T${input.endTime}:00`;
    } else {
      // default +60 min
      const [h, m] = input.startTime.split(':').map(Number);
      const endH = String(Math.floor((h * 60 + m + 60) / 60) % 24).padStart(2, '0');
      const endM = String((m + 60) % 60).padStart(2, '0');
      endDt = `${input.date}T${endH}:${endM}:00`;
    }
    return {
      summary: input.summary,
      description: input.description,
      start: { dateTime: startDt, timeZone: tz },
      end: { dateTime: endDt, timeZone: tz },
      reminders: { useDefault: false, overrides },
    };
  }

  // All-day event
  return {
    summary: input.summary,
    description: input.description,
    start: { date: input.date },
    end: { date: input.date },
    reminders: { useDefault: false, overrides },
  };
}

async function upsertEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cal: any,
  calendarId: string,
  input: CalendarEventInput,
  existingEventId?: string | null
): Promise<string> {
  const resource = buildEventResource(input);
  if (existingEventId) {
    const { data } = await cal.events.update({ calendarId, eventId: existingEventId, resource });
    return data.id as string;
  }
  const { data } = await cal.events.insert({ calendarId, resource });
  return data.id as string;
}

// ── OAuth2 (per-user) path ─────────────────────────────────────────────────

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
  return upsertEvent(cal, 'primary', input, existingEventId);
}

export async function deleteCalendarEvent(tokens: StoredTokens, eventId: string): Promise<void> {
  const fresh = await refreshTokensIfNeeded(tokens);
  const client = await getOAuth2Client(fresh);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const cal = google.calendar({ version: 'v3', auth: client });
  await cal.events.delete({ calendarId: 'primary', eventId }).catch(() => {});
}

// ── Service Account path (info@expertconsulting.es) ────────────────────────
// Requires Google Workspace Admin Console → DWD → add scope:
//   https://www.googleapis.com/auth/calendar.events
// to the Gmail SA client ID.

export async function upsertCalendarEventSA(
  input: CalendarEventInput,
  existingEventId?: string | null
): Promise<string | null> {
  const cal = await getCalendarSAClient();
  if (!cal) return null;
  try {
    return await upsertEvent(cal, 'primary', input, existingEventId);
  } catch (err) {
    console.error('[Calendar SA] upsertCalendarEventSA:', err);
    return null;
  }
}

export async function deleteCalendarEventSA(eventId: string): Promise<void> {
  const cal = await getCalendarSAClient();
  if (!cal) return;
  await cal.events.delete({ calendarId: 'primary', eventId }).catch(() => {});
}
