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

  // Resolve profile email for cross-table lookups
  const [profileRes, authRes] = await Promise.all([
    admin.from('profiles').select('email, full_name').eq('id', id).single(),
    admin.auth.admin.getUserById(id),
  ]);

  const profileEmail = profileRes.data?.email ?? authRes.data?.user?.email ?? '';

  // Parallel fetch of all activity sources
  const [
    casesRes,
    waRes,
    emailEventsRes,
    ordersRes,
    quotesRes,
    appointmentsRes,
    subsRes,
    documentsRes,
    manualPaymentsRes,
  ] = await Promise.all([
    // Cases created
    admin
      .from('cases')
      .select('id, service, category, state, opened_at, closed_at')
      .eq('client_id', id)
      .order('opened_at', { ascending: false })
      .limit(50),

    // WhatsApp messages
    admin
      .from('whatsapp_conversations')
      .select('id, direction, body, media_type, created_at, needs_review')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(50),

    // Email events (by recipient email)
    profileEmail
      ? admin
          .from('email_events')
          .select('id, event_type, subject, status, created_at')
          .eq('recipient_email', profileEmail)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),

    // Orders / payments
    admin
      .from('orders')
      .select('id, amount_eur, currency, status, stripe_payment_id, source, service_slugs, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Quotes
    admin
      .from('quotes')
      .select('id, title, amount_eur, status, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Appointments (by email — no client_id on appointments table)
    profileEmail
      ? admin
          .from('appointments')
          .select('id, name, service, status, confirmed_date, confirmed_time, preferred_date, created_at')
          .eq('email', profileEmail)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),

    // Subscriptions
    admin
      .from('subscriptions')
      .select('id, plan_name, status, created_at, canceled_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(10),

    // Documents (through cases)
    admin
      .from('documents')
      .select('id, original_name, state, file_path, created_at, case_id')
      .in('client_id', [id])
      .order('created_at', { ascending: false })
      .limit(30),

    // Manual payments
    admin
      .from('manual_payments')
      .select('id, amount_eur, currency, payment_method, description, paid_at')
      .eq('client_id', id)
      .order('paid_at', { ascending: false })
      .limit(20),
  ]);

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
        detail: ``,
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
      detail: m.body ? m.body.slice(0, 120) : (m.media_type ? `[${m.media_type}]` : ''),
      direction: m.direction === 'inbound' ? 'in' : 'out',
    });
  }

  // ── Emails ──────────────────────────────────────────────────────────────────
  for (const e of emailEventsRes?.data ?? []) {
    events.push({
      id: `email-${e.id}`,
      date: e.created_at,
      type: 'email',
      title: `Email: ${e.subject ?? e.event_type}`,
      detail: `Estado: ${e.status} · Tipo: ${e.event_type}`,
      direction: 'out',
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
      detail: `Estado: ${a.status}${a.confirmed_date ? ` · Confirmada: ${a.confirmed_date}${a.confirmed_time ? ' ' + a.confirmed_time : ''}` : ''}`,
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

  // Sort all events by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ events, total: events.length });
}

// Also return documents grouped by case for the Documents tab
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;

  // Get all cases for this client
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

  // Generate signed URLs
  const docsWithUrls = await Promise.all(
    (docs ?? []).map(async (doc) => {
      const { data: urlData } = await admin.storage
        .from('client-documents')
        .createSignedUrl(doc.file_path, 3600);
      return { ...doc, downloadUrl: urlData?.signedUrl ?? null };
    })
  );

  // Group by case
  const byCase = cases.map((c) => ({
    ...c,
    docs: docsWithUrls.filter((d) => d.case_id === c.id),
  }));

  return NextResponse.json({ byCase });
}
