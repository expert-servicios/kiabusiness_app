import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listMails, getConversation, sendReply } from '@/lib/integrations/microsoft365';
import {
  listGmailMails, getGmailThread, sendGmailReply,
  listGmailMailsSA, getGmailThreadSA, sendGmailReplySA,
  hasGmailSA, GMAIL_SA_IMPERSONATE_EMAIL,
} from '@/lib/integrations/gmail';
import type { GmailTokens } from '@/lib/integrations/gmail';
import { z } from 'zod';

type Provider = 'ms365' | 'gmail';

function getProvider(searchParams: URLSearchParams): Provider {
  return searchParams.get('provider') === 'gmail' ? 'gmail' : 'ms365';
}

async function assertAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return { admin };
}

async function getMs365Tokens(admin: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await admin.from('ms365_tokens').select('*').eq('id', 'admin').single();
  return data ?? null;
}

async function getGmailTokens(admin: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await admin.from('gmail_tokens').select('*').eq('id', 'admin').single();
  return data ?? null;
}

async function saveGmailRefresh(
  admin: ReturnType<typeof getSupabaseAdmin>,
  refreshed: GmailTokens | null
) {
  if (!refreshed) return;
  await admin.from('gmail_tokens').update({
    access_token:  refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expiry_date:   refreshed.expiry_date,
    updated_at:    new Date().toISOString(),
  }).eq('id', 'admin');
}

async function saveMs365Refresh(
  admin: ReturnType<typeof getSupabaseAdmin>,
  refreshed: { access_token: string; refresh_token: string; expires_at: number } | null
) {
  if (!refreshed) return;
  await admin.from('ms365_tokens').update({
    access_token:  refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at:    refreshed.expires_at,
    updated_at:    new Date().toISOString(),
  }).eq('id', 'admin');
}

// GET ?action=list|conversation|status  &provider=ms365|gmail
export async function GET(request: NextRequest) {
  const ctx = await assertAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const action   = searchParams.get('action') ?? 'list';
  const provider = getProvider(searchParams);
  const { admin } = ctx;

  if (action === 'status') {
    const saActive = hasGmailSA();
    const [ms365Row, gmailRow] = await Promise.all([
      getMs365Tokens(admin),
      saActive ? Promise.resolve(null) : getGmailTokens(admin),
    ]);
    return NextResponse.json({
      ms365Connected:  !!ms365Row,
      ms365Email:      ms365Row?.email ?? null,
      gmailConnected:  saActive || !!gmailRow,
      gmailEmail:      saActive ? GMAIL_SA_IMPERSONATE_EMAIL : (gmailRow?.email ?? null),
      gmailSA:         saActive,
    });
  }

  if (action === 'list') {
    const q = searchParams.get('q') ?? undefined;

    if (provider === 'gmail') {
      if (hasGmailSA()) {
        try {
          const mails = await listGmailMailsSA({ query: q, maxResults: 25 });
          return NextResponse.json({ mails, providerEmail: GMAIL_SA_IMPERSONATE_EMAIL });
        } catch (err) {
          console.error('[Gmail SA list]', err);
          return NextResponse.json({ mails: [], providerEmail: GMAIL_SA_IMPERSONATE_EMAIL, saError: true });
        }
      }
      const gmailRow = await getGmailTokens(admin);
      if (!gmailRow) return NextResponse.json({ error: 'Gmail no conectado' }, { status: 400 });
      const stored: GmailTokens = {
        access_token:  gmailRow.access_token,
        refresh_token: gmailRow.refresh_token,
        expiry_date:   gmailRow.expiry_date,
        email:         gmailRow.email,
      };
      const { mails, refreshed } = await listGmailMails(stored, { query: q, maxResults: 25 });
      await saveGmailRefresh(admin, refreshed);
      return NextResponse.json({ mails, providerEmail: gmailRow.email });
    }

    const ms365Row = await getMs365Tokens(admin);
    if (!ms365Row) return NextResponse.json({ error: 'MS365 no conectado' }, { status: 400 });
    const stored = { access_token: ms365Row.access_token, refresh_token: ms365Row.refresh_token, expires_at: ms365Row.expires_at };
    const { mails, refreshed } = await listMails(stored, { query: q, maxResults: 25 });
    await saveMs365Refresh(admin, refreshed);
    return NextResponse.json({ mails, providerEmail: ms365Row.email });
  }

  if (action === 'conversation') {
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) return NextResponse.json({ error: 'conversationId requerido' }, { status: 400 });

    let messages: import('@/lib/integrations/gmail').GmailMessage[] | import('@/lib/integrations/microsoft365').MailMessage[] = [];
    if (provider === 'gmail') {
      if (hasGmailSA()) {
        try {
          messages = await getGmailThreadSA(conversationId);
        } catch (err) {
          console.error('[Gmail SA thread]', err);
          messages = [];
        }
      } else {
        const gmailRow = await getGmailTokens(admin);
        if (!gmailRow) return NextResponse.json({ error: 'Gmail no conectado' }, { status: 400 });
        const stored: GmailTokens = {
          access_token:  gmailRow.access_token,
          refresh_token: gmailRow.refresh_token,
          expiry_date:   gmailRow.expiry_date,
          email:         gmailRow.email,
        };
        const result = await getGmailThread(stored, conversationId);
        await saveGmailRefresh(admin, result.refreshed);
        messages = result.messages;
      }
    } else {
      const ms365Row = await getMs365Tokens(admin);
      if (!ms365Row) return NextResponse.json({ error: 'MS365 no conectado' }, { status: 400 });
      const stored = { access_token: ms365Row.access_token, refresh_token: ms365Row.refresh_token, expires_at: ms365Row.expires_at };
      const result = await getConversation(stored, conversationId);
      await saveMs365Refresh(admin, result.refreshed);
      messages = result.messages;
    }

    const { data: link } = await admin
      .from('email_threads')
      .select('case_id, id')
      .eq('thread_id', conversationId)
      .maybeSingle();

    return NextResponse.json({ messages, linkedCaseId: link?.case_id ?? null, emailThreadRowId: link?.id ?? null });
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}

const replySchema = z.object({
  messageId:      z.string().min(1),
  comment:        z.string().min(1),
  conversationId: z.string().optional(),
  subject:        z.string().optional(),
  clientEmail:    z.string().optional(),
  provider:       z.enum(['ms365', 'gmail']).optional(),
});

const linkSchema = z.object({
  conversationId: z.string(),
  caseId:         z.string().uuid().nullable(),
  subject:        z.string().optional(),
  clientEmail:    z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ctx = await assertAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const { admin } = ctx;

  if (json.action === 'reply') {
    const parsed = replySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    const { messageId, comment, conversationId, subject, clientEmail, provider: prov } = parsed.data;

    if (prov === 'gmail') {
      if (hasGmailSA()) {
        try {
          await sendGmailReplySA({
            threadId: conversationId ?? messageId,
            to:       clientEmail ?? '',
            subject:  subject ?? '',
            body:     comment,
          });
        } catch (err) {
          console.error('[Gmail SA reply]', err);
          return NextResponse.json({ error: 'Error al enviar correo (SA)' }, { status: 500 });
        }
      } else {
        const gmailRow = await getGmailTokens(admin);
        if (!gmailRow) return NextResponse.json({ error: 'Gmail no conectado' }, { status: 400 });
        const stored: GmailTokens = {
          access_token:  gmailRow.access_token,
          refresh_token: gmailRow.refresh_token,
          expiry_date:   gmailRow.expiry_date,
          email:         gmailRow.email,
        };
        const { refreshed } = await sendGmailReply(stored, {
          threadId: conversationId ?? messageId,
          to:       clientEmail ?? '',
          subject:  subject ?? '',
          body:     comment,
        });
        await saveGmailRefresh(admin, refreshed);
      }
    } else {
      const ms365Row = await getMs365Tokens(admin);
      if (!ms365Row) return NextResponse.json({ error: 'MS365 no conectado' }, { status: 400 });
      const stored = { access_token: ms365Row.access_token, refresh_token: ms365Row.refresh_token, expires_at: ms365Row.expires_at };
      const { refreshed } = await sendReply(stored, { messageId, comment });
      await saveMs365Refresh(admin, refreshed);
    }
    return NextResponse.json({ success: true });
  }

  if (json.action === 'link') {
    const parsed = linkSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    const { conversationId, caseId, subject, clientEmail } = parsed.data;

    if (caseId) {
      await admin.from('email_threads').upsert({
        thread_id:       conversationId,
        case_id:         caseId,
        subject:         subject ?? null,
        client_email:    clientEmail ?? null,
        last_message_at: new Date().toISOString(),
      }, { onConflict: 'thread_id' });
    } else {
      await admin.from('email_threads').delete().eq('thread_id', conversationId);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await assertAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const provider = getProvider(searchParams);
  const { admin } = ctx;

  if (provider === 'gmail') {
    if (!hasGmailSA()) {
      await admin.from('gmail_tokens').delete().eq('id', 'admin');
    }
  } else {
    await admin.from('ms365_tokens').delete().eq('id', 'admin');
  }
  return NextResponse.json({ success: true });
}
