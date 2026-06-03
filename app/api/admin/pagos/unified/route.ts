import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

export interface UnifiedPayment {
  id: string;
  origin: 'stripe_order' | 'stripe_subscription' | 'manual';
  date: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  description: string;
  amount_eur: number;
  currency: string;
  status: string;
  stripe_payment_id: string | null;
  case_id: string | null;
  case_service: string | null;
  case_state: string | null;
  payment_method: string | null;
  reference: string | null;
  holded_invoice_id: string | null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since'); // ISO date string

  try {
    // ── 1. Orders (Stripe payments) ───────────────────────────────────────────
    let ordersQuery = admin
      .from('orders')
      .select(`
        id, client_id, amount_eur, currency, status,
        stripe_payment_id, holded_invoice_id, source, service_slugs,
        quote_id, case_id, created_at, metadata,
        quotes(title),
        cases!orders_case_id_fkey(id, service, state)
      `)
      .order('created_at', { ascending: false })
      .limit(300);

    if (since) ordersQuery = ordersQuery.gte('created_at', since);
    const { data: orders } = await ordersQuery;

    // ── 2. Subscriptions ──────────────────────────────────────────────────────
    let subsQuery = admin
      .from('subscriptions')
      .select('id, client_id, plan_name, status, stripe_customer_id, created_at, current_period_start, current_period_end')
      .order('created_at', { ascending: false })
      .limit(200);

    if (since) subsQuery = subsQuery.gte('created_at', since);
    const { data: subs } = await subsQuery;

    // ── 3. Manual payments ────────────────────────────────────────────────────
    let manualQuery = admin
      .from('manual_payments')
      .select(`
        id, client_id, case_id, amount_eur, currency,
        payment_method, description, paid_at, reference,
        holded_invoice_id, notes,
        cases(id, service, state)
      `)
      .order('paid_at', { ascending: false })
      .limit(200);

    if (since) manualQuery = manualQuery.gte('paid_at', since);
    const { data: manuals } = await manualQuery;

    // ── 4. Resolve client names/emails from auth ──────────────────────────────
    const clientIds = new Set<string>();
    for (const o of orders ?? []) { if (o.client_id) clientIds.add(o.client_id); }
    for (const s of subs ?? []) { if (s.client_id) clientIds.add(s.client_id); }
    for (const m of manuals ?? []) { if (m.client_id) clientIds.add(m.client_id); }

    const clientMap = new Map<string, { name: string | null; email: string }>();
    if (clientIds.size > 0) {
      const ids = Array.from(clientIds);
      const { data: profiles } = await admin.from('profiles').select('id,full_name').in('id', ids);
      await Promise.all(ids.map(async (cid) => {
        const { data: authUser } = await admin.auth.admin.getUserById(cid);
        const prof = (profiles ?? []).find((p) => p.id === cid);
        clientMap.set(cid, { name: prof?.full_name ?? null, email: authUser?.user?.email ?? '' });
      }));
    }

    // ── 5. Also resolve cases linked via quote_id ─────────────────────────────
    // For orders that have quote_id but no direct case_id
    const quoteIds = (orders ?? [])
      .filter((o) => o.quote_id && !o.case_id)
      .map((o) => o.quote_id as string);

    const quoteCaseMap = new Map<string, { id: string; service: string; state: string }>();
    if (quoteIds.length > 0) {
      const { data: linkedCases } = await admin
        .from('cases')
        .select('id,service,state,quote_id')
        .in('quote_id', quoteIds);
      for (const c of linkedCases ?? []) {
        if (c.quote_id) quoteCaseMap.set(c.quote_id, c);
      }
    }

    // ── 6. Build unified list ─────────────────────────────────────────────────
    const payments: UnifiedPayment[] = [];

    for (const o of orders ?? []) {
      const client = o.client_id ? clientMap.get(o.client_id) : undefined;
      const directCase = (o.cases as unknown as { id: string; service: string; state: string } | null);
      const quoteCase = o.quote_id ? quoteCaseMap.get(o.quote_id) : undefined;
      const linkedCase = directCase ?? quoteCase ?? null;
      const quote = (o.quotes as unknown as { title: string } | null);

      payments.push({
        id: o.id,
        origin: 'stripe_order',
        date: o.created_at,
        client_id: o.client_id ?? null,
        client_name: client?.name ?? null,
        client_email: client?.email ?? null,
        description: quote?.title ?? o.service_slugs ?? 'Pago Stripe',
        amount_eur: Number(o.amount_eur),
        currency: o.currency ?? 'EUR',
        status: o.status,
        stripe_payment_id: o.stripe_payment_id ?? null,
        case_id: linkedCase?.id ?? null,
        case_service: linkedCase?.service ?? null,
        case_state: linkedCase?.state ?? null,
        payment_method: 'card',
        reference: o.stripe_payment_id ?? null,
        holded_invoice_id: o.holded_invoice_id ?? null,
      });
    }

    for (const s of subs ?? []) {
      const client = s.client_id ? clientMap.get(s.client_id) : undefined;
      payments.push({
        id: s.id,
        origin: 'stripe_subscription',
        date: s.current_period_start ?? s.created_at,
        client_id: s.client_id ?? null,
        client_name: client?.name ?? null,
        client_email: client?.email ?? null,
        description: `Suscripción ${s.plan_name ?? ''}`,
        amount_eur: 0, // subscriptions don't have amount here
        currency: 'EUR',
        status: s.status,
        stripe_payment_id: null,
        case_id: null,
        case_service: null,
        case_state: null,
        payment_method: 'card',
        reference: s.stripe_customer_id ?? null,
        holded_invoice_id: null,
      });
    }

    for (const m of manuals ?? []) {
      const client = m.client_id ? clientMap.get(m.client_id) : undefined;
      const linkedCase = (m.cases as unknown as { id: string; service: string; state: string } | null);
      payments.push({
        id: m.id,
        origin: 'manual',
        date: m.paid_at,
        client_id: m.client_id ?? null,
        client_name: client?.name ?? null,
        client_email: client?.email ?? null,
        description: m.description ?? 'Pago manual',
        amount_eur: Number(m.amount_eur),
        currency: m.currency ?? 'EUR',
        status: 'paid',
        stripe_payment_id: null,
        case_id: linkedCase?.id ?? m.case_id ?? null,
        case_service: linkedCase?.service ?? null,
        case_state: linkedCase?.state ?? null,
        payment_method: m.payment_method ?? 'transferencia',
        reference: m.reference ?? null,
        holded_invoice_id: m.holded_invoice_id ?? null,
      });
    }

    // Sort by date desc
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // KPIs
    const totalCobrado = payments
      .filter((p) => p.status === 'paid' || p.status === 'succeeded')
      .reduce((s, p) => s + p.amount_eur, 0);
    const pendingCount = payments.filter((p) =>
      p.status !== 'paid' && p.status !== 'succeeded' && p.status !== 'canceled'
    ).length;
    const unlinkedCount = payments.filter((p) =>
      p.origin === 'stripe_order' && !p.case_id
    ).length;

    return NextResponse.json({
      payments,
      kpis: { totalCobrado, pendingCount, unlinkedCount, total: payments.length },
    });
  } catch (err) {
    console.error('[pagos-unified]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
