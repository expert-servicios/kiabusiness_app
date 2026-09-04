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
  companyId?: string | null;
  companyName?: string | null;
  provider?: string | null;
  source: 'email_event' | 'email_inbox' | 'email_thread' | 'whatsapp' | 'case_message';
};

type CompanySummary = {
  id: string;
  name: string;
};

function metadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const requestedCompany = request.nextUrl.searchParams.get('companyId');

  const [profileRes, authRes, casesRes, membershipsRes] = await Promise.all([
    admin.from('profiles').select('id,email,full_name').eq('id', id).single(),
    admin.auth.admin.getUserById(id),
    admin.from('cases').select('id,company_id').eq('client_id', id),
    admin.from('profile_companies').select('company_id').eq('profile_id', id),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const companyIds = Array.from(new Set((membershipsRes.data ?? []).map((row) => row.company_id).filter(Boolean)));
  const companiesRes = companyIds.length
    ? await admin.from('companies').select('id,razon_social,nombre_comercial').in('id', companyIds)
    : { data: [] };

  const companies: CompanySummary[] = (companiesRes.data ?? []).map((company) => ({
    id: company.id,
    name: company.razon_social || company.nombre_comercial || company.id,
  }));
  const allowedCompanyIds = new Set(companies.map((company) => company.id));

  if (requestedCompany && requestedCompany !== 'unassigned' && !allowedCompanyIds.has(requestedCompany)) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 400 });
  }

  const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
  const caseCompanyById = new Map((casesRes.data ?? []).map((row) => [row.id, row.company_id ?? null]));
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
      .select('id,direction,body,media_type,created_at,needs_review,case_id')
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
  const attachCompany = (item: ClientCommunication, candidateId: string | null | undefined) => {
    const companyId = candidateId && allowedCompanyIds.has(candidateId) ? candidateId : null;
    item.companyId = companyId;
    item.companyName = companyId ? companyNameById.get(companyId) ?? null : null;
    items.push(item);
  };

  for (const row of eventsRes.data ?? []) {
    const metadataCompanyId = metadataString(row.metadata, 'company_id');
    const metadataCaseId = metadataString(row.metadata, 'case_id');
    const caseCompanyId = metadataCaseId ? caseCompanyById.get(metadataCaseId) ?? null : null;
    attachCompany({
      id: `email-event-${row.id}`,
      date: row.created_at,
      channel: 'email',
      direction: 'out',
      title: row.subject ?? row.event_type ?? 'Email enviado',
      preview: row.event_type ? `Tipo: ${row.event_type}` : 'Email enviado por EXPERT',
      html: row.html ?? null,
      status: row.status ?? null,
      caseId: metadataCaseId,
      source: 'email_event',
    }, metadataCompanyId ?? caseCompanyId);
  }

  const inboxThreadIds = new Set<string>();
  for (const row of inboxRes.data ?? []) {
    inboxThreadIds.add(row.thread_id);
    attachCompany({
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
    }, row.case_id ? caseCompanyById.get(row.case_id) ?? null : null);
  }

  for (const row of threadsRes.data ?? []) {
    if (inboxThreadIds.has(row.thread_id)) continue;
    attachCompany({
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
    }, row.case_id ? caseCompanyById.get(row.case_id) ?? null : null);
  }

  for (const row of whatsappRes.data ?? []) {
    const incoming = row.direction === 'inbound';
    attachCompany({
      id: `whatsapp-${row.id}`,
      date: row.created_at,
      channel: 'whatsapp',
      direction: incoming ? 'in' : 'out',
      title: incoming ? 'WhatsApp recibido' : 'WhatsApp enviado',
      preview: row.body ?? (row.media_type ? `[${row.media_type}]` : ''),
      body: row.body ?? null,
      status: row.needs_review ? 'needs_review' : null,
      hasAttachment: Boolean(row.media_type),
      caseId: row.case_id ?? null,
      source: 'whatsapp',
    }, row.case_id ? caseCompanyById.get(row.case_id) ?? null : null);
  }

  for (const row of messagesRes.data ?? []) {
    const clientSender = row.sender_role === 'client';
    attachCompany({
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
    }, caseCompanyById.get(row.case_id) ?? null);
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredItems = requestedCompany === 'unassigned'
    ? items.filter((item) => !item.companyId)
    : requestedCompany
      ? items.filter((item) => item.companyId === requestedCompany)
      : items;

  return NextResponse.json({
    client: {
      id,
      name: profileRes.data.full_name ?? email,
      email,
    },
    companies,
    selectedCompanyId: requestedCompany ?? null,
    communications: filteredItems,
    counts: {
      total: filteredItems.length,
      email: filteredItems.filter((item) => item.channel === 'email').length,
      whatsapp: filteredItems.filter((item) => item.channel === 'whatsapp').length,
      caseMessages: filteredItems.filter((item) => item.channel === 'case_message').length,
      unread: filteredItems.filter((item) => item.unread).length,
      unassigned: items.filter((item) => !item.companyId).length,
    },
  });
}
