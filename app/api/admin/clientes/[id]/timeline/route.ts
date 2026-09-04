import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'case' | 'whatsapp_in' | 'whatsapp_out' | 'email' | 'payment' | 'quote' | 'appointment' | 'document' | 'subscription' | 'note';
  title: string;
  detail: string;
  link?: string;
  status?: string;
  amount?: number;
  direction?: 'in' | 'out';
}

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? admin : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;

  // Resolve profile email for cross-table lookups.
  const [profileRes, authRes] = await Promise.all([
    admin.from('profiles').select('email, full_name').eq('id', id).single(),
    admin.auth.admin.getUserById(id),
  ]);

  const profileEmail = (profileRes.data?.email ?? authRes.data?.user?.email ?? '').trim().toLowerCase();

  // Parallel fetch of all activity sources that can be resolved directly by client id/email.
  const [
    casesRes,
    waRes,
    emailEventsRes,
    emailThreadsRes,
    inboxRes,
    ordersRes,
    quotesRes,
    appointmentsRes,
    subsRes,
    documentsRes,
    manualPaymentsRes,
  ] = await Promise.all([
    admin
      .from('cases')
      .select('id, service, category, state, opened_at, closed_at')
      .eq('client_id', id)
      .order('opened_at', { ascending: false })
      .limit(50),

    admin
      .from('whatsapp_conversations')
      .select('id, direction, body, media_type, created_at, needs_review')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(50),

    profileEmail
      ? admin
          .from('email_events')
          .select('id, event_type, subject, status, created_at')
          .ilike('recipient_email', profileEmail)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),

    profileEmail
      ? admin
          .from('email_threads')
          .select('id, thread_id, case_id, subject, client_email, snippet, last_message_at, unread, created_at')
          .ilike('client_email', profileEmail)
          .order('last_message_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),

    profileEmail
      ? admin
          .from('email_inbox_cache')
          .select('thread_id, provider, subject, from_name, from_email, snippet, date, unread, has_attachment, case_id')
          .ilike('from_email', profileEmail)
          .order('date', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),

    admin
      .from('orders')
      .select('id, amount_eur, currency, status, stripe_payment_id, source, service_slugs, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    admin
      .from('quotes')
      .select('id, title, amount_eur, status, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    profileEmail
      ? admin
          .from('appointments')
          .select('id, name, service, status, confirmed_date, confirmed_time, preferred_date, created_at')
          .ilike('email', profileEmail)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),

    admin
      .from('subscriptions')
      .select('id, plan_name, status, created_at, canceled_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    admin
      .from('documents')
      .select('id, original_name, state, file_path, created_at, case_id')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(50),

    admin
      .from('manual_payments')
      .select('id, amount_eur, currency, payment_method, description, paid_at')
      .eq('client_id', id)
      .order('paid_at', { ascending: false })
      .limit(20),
  ]);

  const caseIds = (casesRes.data ?? []).map((c) => c.id);
  const caseMessagesRes = caseIds.length
    ? await admin
        .from('messages')
        .select('id, case_id, sender_role, body, created_at, read_by_client, read_by_admin')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] };

  const events: TimelineEvent[] = [];

  // ── Cases ──────────────────────────────────────────────────────────────────
  for (const c of casesRes.data ?? []) {
    events.push({
      id: `case-open-${c.id}`,
      date: c.opened_at,
      type: 'case',
      title: `Expediente abierto: ${c.service}`,
      detail: `Categoría: ${c.category} · Estado actual: ${c.state}`,
      link: `/admin/expedientes/${c.id}`,
      status: c.state,
    });
    if (c.closed_at && c.state === 'finalizado') {
      events.push({
        id: `case-close-${c.id}`,
        date: c.closed_at,
        type: 'case',
        title: `Expediente finalizado: ${c.service}`,
        detail: '',
        link: `/admin/expedientes/${c.id}`,
        status: 'finalizado',
      });
    }
  }

  // ── WhatsApp ────────────────────────────────────────────────────────────────
  for (const m of waRes.data ?? []) {
    events.push({
      id: `wa-${m.id}`,
      date: m.created_at,
      type: m.direction === 'inbound' ? 'whatsapp_in' : 'whatsapp_out',
      title: m.direction === 'inbound' ? 'Mensaje recibido (WhatsApp)' : 'Mensaje enviado (WhatsApp)',
      detail: m.body ? m.body.slice(0, 180) : (m.media_type ? `[${m.media_type}]` : ''),
      direction: m.direction === 'inbound' ? 'in' : 'out',
    });
  }

  // ── Transactional email sent by EXPERT ─────────────────────────────────────
  for (const e of emailEventsRes?.data ?? []) {
    events.push({
      id: `email-event-${e.id}`,
      date: e.created_at,
      type: 'email',
      title: `Email enviado: ${e.subject ?? e.event_type}`,
      detail: `Estado: ${e.status} · Tipo: ${e.event_type}`,
      direction: 'out',
      status: e.status,
    });
  }

  // ── Synced email inbox / threads ────────────────────────────────────────────
  // Inbox cache is preferred for inbound items because it has sender, unread and attachment state.
  const inboxThreadIds = new Set<string>();
  for (const e of inboxRes?.data ?? []) {
    inboxThreadIds.add(String(e.thread_id));
    const sender = e.from_name || e.from_email || 'Cliente';
    events.push({
      id: `email-inbox-${e.thread_id}-${e.date}`,
      date: e.date,
      type: 'email',
      title: `Email recibido: ${e.subject || '(sin asunto)'}`,
      detail: `${sender}${e.has_attachment ? ' · Con adjuntos' : ''}${e.unread ? ' · Sin leer' : ''}${e.snippet ? ` · ${e.snippet.slice(0, 180)}` : ''}`,
      direction: 'in',
      status: e.unread ? 'unread' : 'read',
      link: e.case_id ? `/admin/expedientes/${e.case_id}` : undefined,
    });
  }

  // Thread rows fill gaps when the inbox cache has not materialized that thread.
  for (const e of emailThreadsRes?.data ?? []) {
    if (inboxThreadIds.has(String(e.thread_id))) continue;
    events.push({
      id: `email-thread-${e.id}`,
      date: e.last_message_at ?? e.created_at,
      type: 'email',
      title: `Conversación email: ${e.subject || '(sin asunto)'}`,
      detail: `${e.unread ? 'Sin leer' : 'Leído'}${e.snippet ? ` · ${e.snippet.slice(0, 180)}` : ''}`,
      direction: 'in',
      status: e.unread ? 'unread' : 'read',
      link: e.case_id ? `/admin/expedientes/${e.case_id}` : undefined,
    });
  }

  // ── Internal case messages ──────────────────────────────────────────────────
  for (const m of caseMessagesRes.data ?? []) {
    const fromClient = m.sender_role === 'client';
    events.push({
      id: `case-message-${m.id}`,
      date: m.created_at,
      type: 'note',
      title: fromClient ? 'Mensaje del cliente en expediente' : 'Mensaje de EXPERT en expediente',
      detail: m.body?.slice(0, 180) ?? '',
      direction: fromClient ? 'in' : 'out',
      status: fromClient ? (m.read_by_admin ? 'read' : 'unread') : (m.read_by_client ? 'read' : 'unread'),
      link: `/admin/expedientes/${m.case_id}`,
    });
  }

  // ── Orders ──────────────────────────────────────────────────────────────────
  for (const o of ordersRes.data ?? []) {
    events.push({
      id: `order-${o.id}`,
      date: o.created_at,
      type: 'payment',
      title: `Pago ${o.status === 'paid' ? 'recibido' : 'pendiente'}: ${o.service_slugs ?? o.source ?? 'Servicio'}`,
      detail: `${Number(o.amount_eur).toLocaleString('es-ES')} ${o.currency?.toUpperCase() ?? 'EUR'} · Stripe: ${o.stripe_payment_id?.slice(0, 20) ?? '—'}`,
      status: o.status,
      amount: Number(o.amount_eur),
    });
  }

  // ── Manual payments ─────────────────────────────────────────────────────────
  for (const m of manualPaymentsRes.data ?? []) {
    events.push({
      id: `manual-${m.id}`,
      date: m.paid_at,
      type: 'payment',
      title: `Pago manual: ${m.description ?? m.payment_method}`,
      detail: `${Number(m.amount_eur).toLocaleString('es-ES')} ${m.currency} · ${m.payment_method}`,
      status: 'paid',
      amount: Number(m.amount_eur),
    });
  }

  // ── Quotes ──────────────────────────────────────────────────────────────────
  for (const q of quotesRes.data ?? []) {
    events.push({
      id: `quote-${q.id}`,
      date: q.created_at,
      type: 'quote',
      title: `Presupuesto: ${q.title}`,
      detail: `${q.amount_eur ? `${Number(q.amount_eur).toLocaleString('es-ES')} € · ` : ''}Estado: ${q.status}`,
      link: `/admin/presupuestos/${q.id}`,
      status: q.status,
      amount: Number(q.amount_eur),
    });
  }

  // ── Appointments ────────────────────────────────────────────────────────────
  for (const a of appointmentsRes?.data ?? []) {
    events.push({
      id: `appt-${a.id}`,
      date: a.created_at,
      type: 'appointment',
      title: `Cita solicitada: ${a.service}`,
      detail: `Estado: ${a.status}${a.confirmed_date ? ` · Confirmada: ${a.confirmed_date}${a.confirmed_time ? ` ${a.confirmed_time}` : ''}` : ''}`,
      status: a.status,
    });
  }

  // ── Subscriptions ────────────────────────────────────────────────────────────
  for (const s of subsRes.data ?? []) {
    events.push({
      id: `sub-${s.id}`,
      date: s.created_at,
      type: 'subscription',
      title: `Suscripción: ${s.plan_name}`,
      detail: `Estado: ${s.status}`,
      status: s.status,
    });
    if (s.canceled_at) {
      events.push({
        id: `sub-cancel-${s.id}`,
        date: s.canceled_at,
        type: 'subscription',
        title: `Suscripción cancelada: ${s.plan_name}`,
        detail: '',
        status: 'canceled',
      });
    }
  }

  // ── Documents ────────────────────────────────────────────────────────────────
  for (const d of documentsRes.data ?? []) {
    events.push({
      id: `doc-${d.id}`,
      date: d.created_at,
      type: 'document',
      title: `Documento subido: ${d.original_name}`,
      detail: `Estado: ${d.state}`,
      link: d.case_id ? `/admin/expedientes/${d.case_id}` : undefined,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    events,
    total: events.length,
    sources: {
      cases: casesRes.data?.length ?? 0,
      whatsapp: waRes.data?.length ?? 0,
      emailEvents: emailEventsRes?.data?.length ?? 0,
      emailThreads: emailThreadsRes?.data?.length ?? 0,
      emailInbox: inboxRes?.data?.length ?? 0,
      caseMessages: caseMessagesRes.data?.length ?? 0,
      orders: ordersRes.data?.length ?? 0,
      quotes: quotesRes.data?.length ?? 0,
      appointments: appointmentsRes?.data?.length ?? 0,
      subscriptions: subsRes.data?.length ?? 0,
      documents: documentsRes.data?.length ?? 0,
      manualPayments: manualPaymentsRes.data?.length ?? 0,
    },
  });
}

// Also return documents grouped by case for the Documents tab.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;

  const { data: cases } = await admin
    .from('cases')
    .select('id, service, category, state')
    .eq('client_id', id)
    .order('opened_at', { ascending: false });

  if (!cases || cases.length === 0) return NextResponse.json({ byCase: [] });

  const caseIds = cases.map((c) => c.id);

  const { data: docs } = await admin
    .from('documents')
    .select('id, original_name, state, file_path, created_at, case_id')
    .in('case_id', caseIds)
    .order('created_at', { ascending: false });

  const docsWithUrls = await Promise.all(
    (docs ?? []).map(async (doc) => {
      const { data: urlData } = await admin.storage
        .from('client-documents')
        .createSignedUrl(doc.file_path, 3600);
      return { ...doc, downloadUrl: urlData?.signedUrl ?? null };
    })
  );

  const byCase = cases.map((c) => ({
    ...c,
    docs: docsWithUrls.filter((d) => d.case_id === c.id),
  }));

  return NextResponse.json({ byCase });
}
