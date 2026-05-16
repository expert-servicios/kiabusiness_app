import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listEmails, getThread, sendReply } from '@/lib/integrations/gmail';
import { z } from 'zod';

async function getAdminAndTokens(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  const { data: tokenRow } = await admin.from('gmail_tokens').select('*').eq('id', 'admin').single();
  return tokenRow ? { admin, tokenRow } : null;
}

async function saveRefreshed(admin: ReturnType<typeof getSupabaseAdmin>, refreshed: { access_token: string; expiry_date: number } | null) {
  if (!refreshed) return;
  await admin.from('gmail_tokens').update({ access_token: refreshed.access_token, expiry_date: refreshed.expiry_date, updated_at: new Date().toISOString() }).eq('id', 'admin');
}

// GET ?action=list&q=... | ?action=thread&threadId=...
export async function GET(request: NextRequest) {
  const ctx = await getAdminAndTokens(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') ?? 'list';
  const { admin, tokenRow } = ctx;
  const tokens = { access_token: tokenRow.access_token, refresh_token: tokenRow.refresh_token, expiry_date: tokenRow.expiry_date };

  if (action === 'list') {
    const q = searchParams.get('q') ?? 'in:inbox';
    const { emails, tokens: refreshed } = await listEmails(tokens, { query: q, maxResults: 25 });
    await saveRefreshed(admin, refreshed);
    return NextResponse.json({ emails, gmailEmail: tokenRow.email });
  }

  if (action === 'thread') {
    const threadId = searchParams.get('threadId');
    if (!threadId) return NextResponse.json({ error: 'threadId requerido' }, { status: 400 });
    const { messages, tokens: refreshed } = await getThread(tokens, threadId);
    await saveRefreshed(admin, refreshed);

    // Check if thread is linked to a case
    const { data: link } = await admin.from('email_threads').select('case_id, id').eq('thread_id', threadId).maybeSingle();
    return NextResponse.json({ messages, linkedCaseId: link?.case_id ?? null, emailThreadRowId: link?.id ?? null });
  }

  if (action === 'status') {
    return NextResponse.json({ connected: true, email: tokenRow.email });
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAdminAndTokens(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  await ctx.admin.from('gmail_tokens').delete().eq('id', 'admin');
  return NextResponse.json({ success: true });
}

const replySchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string().min(1),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
});

const linkSchema = z.object({
  threadId: z.string(),
  caseId: z.string().uuid().nullable(),
  subject: z.string().optional(),
  clientEmail: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ctx = await getAdminAndTokens(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const { admin, tokenRow } = ctx;
  const tokens = { access_token: tokenRow.access_token, refresh_token: tokenRow.refresh_token, expiry_date: tokenRow.expiry_date };

  // Reply to email
  if (json.action === 'reply') {
    const parsed = replySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    const { tokens: refreshed } = await sendReply(tokens, parsed.data);
    await saveRefreshed(admin, refreshed);
    return NextResponse.json({ success: true });
  }

  // Link/unlink thread to case
  if (json.action === 'link') {
    const parsed = linkSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    const { threadId, caseId, subject, clientEmail } = parsed.data;

    if (caseId) {
      await admin.from('email_threads').upsert({
        thread_id: threadId,
        case_id: caseId,
        subject: subject ?? null,
        client_email: clientEmail ?? null,
        last_message_at: new Date().toISOString(),
      }, { onConflict: 'thread_id' });
    } else {
      await admin.from('email_threads').delete().eq('thread_id', threadId);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
}
