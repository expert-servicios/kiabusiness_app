import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  return profile && profile.status !== 'inactive' && (profile.role === 'admin' || profile.role === 'owner')
    ? admin
    : null;
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
  conversationId?: string | null;
  source: 'email_event' | 'email_inbox' | 'email_thread' | 'whatsapp' | 'case_message';
};

type CompanySummary = {
  id: string;
  name: string;
};

type CaseSummary = {
  id: string;
  service: string;
  companyId: string | null;
  companyName: string | null;
};

function metadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function loadClientContext(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string) {
  const [profileRes, authRes, casesRes, membershipsRes] = await Promise.all([
    admin.from('profiles').select('id,email,full_name').eq('id', clientId).single(),
    admin.auth.admin.getUserById(clientId),
    admin.from('cases').select('id,company_id,service').eq('client_id', clientId),
    admin.from('profile_companies').select('company_id').eq('profile_id', clientId),
  ]);

  if (profileRes.error || !profileRes.data) return null;

  const companyIds = Array.from(new Set((membershipsRes.data ?? []).map((row) => row.company_id).filter(Boolean)));
  const companiesRes = companyIds.length
    ? await admin.from('companies').select('id,razon_social,nombre_comercial').in('id', companyIds)
    : { data: [] };

  const companies: CompanySummary[] = (companiesRes.data ?? []).map((company) => ({
    id: company.id,
    name: company.razon_social || company.nombre_comercial || company.id,
  }));
  const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
  const cases: CaseSummary[] = (casesRes.data ?? []).map((row) => ({
    id: row.id,
    service: row.service,
    companyId: row.company_id ?? null,
    companyName: row.company_id ? companyNameById.get(row.company_id) ?? null : null,
  }));

  return {
    profile: profileRes.data,
    email: (authRes.data.user?.email ?? profileRes.data.email ?? '').trim().toLowerCase(),
    companies,
    cases,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const requestedCompany = request.nextUrl.searchParams.get('companyId');
  const context = await loadClientContext(admin, id);
  if (!context) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { profile, email, companies, cases } = context;
  const allowedCompanyIds = new Set(companies.map((company) => company.id));

  if (requestedCompany && requestedCompany !== 'unassigned' && !allowedCompanyIds.has(requestedCompany)) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 400 });
  }

  const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
  const caseCompanyById = new Map(cases.map((row) => [row.id, row.companyId]));
  const caseIds = cases.map((row) => row.id);

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

  const threadCaseById = new Map<string, string | null>();
  for (const row of threadsRes.data ?? []) threadCaseById.set(row.thread_id, row.case_id ?? null);

  const items: ClientCommunication[] = [];
  const attachCompany = (item: ClientCommunication, candidateId: string | null | undefined) => {
    const companyId = candidateId && allowedCompanyIds.has(candidateId) ? candidateId : null;
    item.companyId = companyId;
    item.companyName = companyId ? companyNameById.get(companyId) ?? null : null;
    items.push(item);
  };

  for (const row of eventsRes.data ?? []) {
    const metadataCompanyId = metadataString(row.metadata, 'company_id');
    const rawMetadataCaseId = metadataString(row.metadata, 'case_id');
    const metadataCaseId = rawMetadataCaseId && caseCompanyById.has(rawMetadataCaseId) ? rawMetadataCaseId : null;
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
    const effectiveCaseId = threadCaseById.has(row.thread_id)
      ? threadCaseById.get(row.thread_id) ?? null
      : row.case_id ?? null;
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
      caseId: effectiveCaseId,
      provider: row.provider ?? null,
      conversationId: row.thread_id,
      source: 'email_inbox',
    }, effectiveCaseId ? caseCompanyById.get(effectiveCaseId) ?? null : null);
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
      conversationId: row.thread_id,
      source: 'email_thread',
    }, row.case_id ? caseCompanyById.get(row.case_id) ?? null : null);
  }

  for (const row of whatsappRes.data ?? []) {
    const incoming = row.direction === 'inbound';
    const safeCaseId = row.case_id && caseCompanyById.has(row.case_id) ? row.case_id : null;
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
      caseId: safeCaseId,
      source: 'whatsapp',
    }, safeCaseId ? caseCompanyById.get(safeCaseId) ?? null : null);
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
      name: profile.full_name ?? email,
      email,
    },
    companies,
    cases,
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

const linkSchema = z.object({
  action: z.literal('link_email_thread'),
  conversationId: z.string().trim().min(1).max(500),
  caseId: z.string().uuid().nullable(),
  subject: z.string().trim().max(500).optional(),
  lastMessageAt: z.string().datetime().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const parsed = linkSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const context = await loadClientContext(admin, id);
  if (!context) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { conversationId, caseId, subject, lastMessageAt } = parsed.data;
  const selectedCase = caseId ? context.cases.find((item) => item.id === caseId) ?? null : null;
  if (caseId && !selectedCase) {
    return NextResponse.json({ error: 'El expediente no pertenece a este cliente' }, { status: 409 });
  }

  if (caseId) {
    const { error } = await admin.from('email_threads').upsert({
      thread_id: conversationId,
      case_id: caseId,
      subject: subject ?? null,
      client_email: context.email || null,
      last_message_at: lastMessageAt ?? null,
    }, { onConflict: 'thread_id' });
    if (error) {
      console.error('[client communications] link thread failed', error);
      return NextResponse.json({ error: 'No se pudo vincular el hilo' }, { status: 500 });
    }
  } else {
    const { error } = await admin
      .from('email_threads')
      .update({ case_id: null })
      .eq('thread_id', conversationId)
      .ilike('client_email', context.email);
    if (error) {
      console.error('[client communications] unlink thread failed', error);
      return NextResponse.json({ error: 'No se pudo quitar el vínculo' }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    caseId: selectedCase?.id ?? null,
    companyId: selectedCase?.companyId ?? null,
    companyName: selectedCase?.companyName ?? null,
  });
}
