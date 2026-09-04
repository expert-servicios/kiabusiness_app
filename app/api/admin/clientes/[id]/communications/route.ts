import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'owner' ? admin : null;
}

export type ClientCommunication = {
  id: string;
  date: string;
  channel: 'email' | 'whatsapp' | 'case_message';
  direction: 'in' | 'out' | 'internal';
  title: string;
  preview: string;
  body?: string | null;
  html?: string | null;
  status?: string | null;
  unread?: boolean;
  hasAttachment?: boolean;
  caseId?: string | null;
  provider?: string | null;
  source: 'email_event' | 'email_inbox' | 'email_thread' | 'whatsapp' | 'case_message';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;

  const [profileRes, authRes, casesRes] = await Promise.all([
    admin.from('profiles').select('id,email,full_name').eq('id', id).single(),
    admin.auth.admin.getUserById(id),
    admin.from('cases').select('id').eq('client_id', id),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const email = (authRes.data.user?.email ?? profileRes.data.email ?? '').trim().toLowerCase();
  const caseIds = (casesRes.data ?? []).map((row) => row.id);

  const [eventsRes, inboxRes, threadsRes, whatsappRes, messagesRes] = await Promise.all([
    email
      ? admin
          .from('email_events')
          .select('id,event_type,subject,status,created_at,html,metadata')
          .ilike('recipient_email', email)
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    email
      ? admin
          .from('email_inbox_cache')
          .select('thread_id,provider,subject,from_name,from_email,snippet,date,unread,has_attachment,case_id')
          .ilike('from_email', email)
          .order('date', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    email
      ? admin
          .from('email_threads')
          .select('id,thread_id,case_id,subject,client_email,snippet,last_message_at,unread')
          .ilike('client_email', email)
          .order('last_message_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    admin
      .from('whatsapp_conversations')
      .select('id,direction,body,media_type,created_at,needs_review')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    caseIds.length
      ? admin
          .from('messages')
          .select('id,case_id,sender_role,body,created_at,read_by_admin,read_by_client')
          .in('case_id', caseIds)
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const items: ClientCommunication[] = [];

  for (const row of eventsRes.data ?? []) {
    items.push({
      id: `email-event-${row.id}`,
      date: row.created_at,
      channel: 'email',
      direction: 'out',
      title: row.subject ?? row.event_type ?? 'Email enviado',
      preview: row.event_type ? `Tipo: ${row.event_type}` : 'Email enviado por EXPERT',
      html: row.html ?? null,
      status: row.status ?? null,
      source: 'email_event',
    });
  }

  const inboxThreadIds = new Set<string>();
  for (const row of inboxRes.data ?? []) {
    inboxThreadIds.add(row.thread_id);
    items.push({
      id: `email-inbox-${row.thread_id}`,
      date: row.date,
      channel: 'email',
      direction: 'in',
      title: row.subject ?? 'Email recibido',
      preview: row.snippet ?? '',
      status: row.unread ? 'unread' : 'read',
      unread: Boolean(row.unread),
      hasAttachment: Boolean(row.has_attachment),
      caseId: row.case_id ?? null,
      provider: row.provider ?? null,
      source: 'email_inbox',
    });
  }

  for (const row of threadsRes.data ?? []) {
    if (inboxThreadIds.has(row.thread_id)) continue;
    items.push({
      id: `email-thread-${row.id}`,
      date: row.last_message_at,
      channel: 'email',
      direction: 'in',
      title: row.subject ?? 'Hilo de email',
      preview: row.snippet ?? '',
      status: row.unread ? 'unread' : 'read',
      unread: Boolean(row.unread),
      caseId: row.case_id ?? null,
      source: 'email_thread',
    });
  }

  for (const row of whatsappRes.data ?? []) {
    const incoming = row.direction === 'inbound';
    items.push({
      id: `whatsapp-${row.id}`,
      date: row.created_at,
      channel: 'whatsapp',
      direction: incoming ? 'in' : 'out',
      title: incoming ? 'WhatsApp recibido' : 'WhatsApp enviado',
      preview: row.body ?? (row.media_type ? `[${row.media_type}]` : ''),
      body: row.body ?? null,
      status: row.needs_review ? 'needs_review' : null,
      hasAttachment: Boolean(row.media_type),
      source: 'whatsapp',
    });
  }

  for (const row of messagesRes.data ?? []) {
    const clientSender = row.sender_role === 'client';
    items.push({
      id: `case-message-${row.id}`,
      date: row.created_at,
      channel: 'case_message',
      direction: clientSender ? 'in' : 'internal',
      title: clientSender ? 'Mensaje del cliente en expediente' : 'Mensaje interno de expediente',
      preview: row.body ?? '',
      body: row.body ?? null,
      unread: clientSender ? !row.read_by_admin : !row.read_by_client,
      caseId: row.case_id,
      source: 'case_message',
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    client: {
      id,
      name: profileRes.data.full_name ?? email,
      email,
    },
    communications: items,
    counts: {
      total: items.length,
      email: items.filter((item) => item.channel === 'email').length,
      whatsapp: items.filter((item) => item.channel === 'whatsapp').length,
      caseMessages: items.filter((item) => item.channel === 'case_message').length,
      unread: items.filter((item) => item.unread).length,
    },
  });
}
