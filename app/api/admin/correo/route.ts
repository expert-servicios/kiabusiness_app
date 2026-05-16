import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listMails, getConversation, sendReply } from '@/lib/integrations/microsoft365';
import { z } from 'zod';

async function getAdminAndTokens(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  const { data: tokenRow } = await admin.from('ms365_tokens').select('*').eq('id', 'admin').single();
  return tokenRow ? { admin, tokenRow } : null;
}

async function saveRefreshed(
  admin: ReturnType<typeof getSupabaseAdmin>,
  refreshed: { access_token: string; refresh_token: string; expires_at: number } | null
) {
  if (!refreshed) return;
  await admin.from('ms365_tokens').update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: refreshed.expires_at,
    updated_at: new Date().toISOString(),
  }).eq('id', 'admin');
}

// GET ?action=list&q=... | ?action=conversation&conversationId=... | ?action=status
export async function GET(request: NextRequest) {
  const ctx = await getAdminAndTokens(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') ?? 'list';
  const { admin, tokenRow } = ctx;
  const stored = { access_token: tokenRow.access_token, refresh_token: tokenRow.refresh_token, expires_at: tokenRow.expires_at };

  if (action === 'status') {
    return NextResponse.json({ connected: true, email: tokenRow.email });
  }

  if (action === 'list') {
    const q = searchParams.get('q') ?? undefined;
    const { mails, refreshed } = await listMails(stored, { query: q, maxResults: 25 });
    await saveRefreshed(admin, refreshed);
    return NextResponse.json({ mails, ms365Email: tokenRow.email });
  }

  if (action === 'conversation') {
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) return NextResponse.json({ error: 'conversationId requerido' }, { status: 400 });
    const { messages, refreshed } = await getConversation(stored, conversationId);
    await saveRefreshed(admin, refreshed);

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
  messageId: z.string().min(1),
  comment: z.string().min(1),
  conversationId: z.string().optional(),
  subject: z.string().optional(),
  clientEmail: z.string().optional(),
});

const linkSchema = z.object({
  conversationId: z.string(),
  caseId: z.string().uuid().nullable(),
  subject: z.string().optional(),
  clientEmail: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ctx = await getAdminAndTokens(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const { admin, tokenRow } = ctx;
  const stored = { access_token: tokenRow.access_token, refresh_token: tokenRow.refresh_token, expires_at: tokenRow.expires_at };

  if (json.action === 'reply') {
    const parsed = replySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    const { refreshed } = await sendReply(stored, { messageId: parsed.data.messageId, comment: parsed.data.comment });
    await saveRefreshed(admin, refreshed);
    return NextResponse.json({ success: true });
  }

  if (json.action === 'link') {
    const parsed = linkSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    const { conversationId, caseId, subject, clientEmail } = parsed.data;

    if (caseId) {
      await admin.from('email_threads').upsert({
        thread_id: conversationId,
        case_id: caseId,
        subject: subject ?? null,
        client_email: clientEmail ?? null,
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
  const ctx = await getAdminAndTokens(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  await ctx.admin.from('ms365_tokens').delete().eq('id', 'admin');
  return NextResponse.json({ success: true });
}
