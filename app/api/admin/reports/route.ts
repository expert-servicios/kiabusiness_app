import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', sessionData.session.user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [
      ordersResult,
      casesResult,
      quotesResult,
      emailsResult,
      subsResult
    ] = await Promise.all([
      adminSupabase.from('orders').select('amount_eur,created_at').eq('status', 'paid').order('created_at'),
      adminSupabase.from('cases').select('state,created_at'),
      adminSupabase.from('quotes').select('status,created_at'),
      adminSupabase.from('email_events').select('status,event_type,created_at').order('created_at', { ascending: false }).limit(500),
      adminSupabase.from('subscriptions').select('status,plan_name,created_at')
    ]);

    const orders = ordersResult.data ?? [];
    const cases = casesResult.data ?? [];
    const quotes = quotesResult.data ?? [];
    const emails = emailsResult.data ?? [];
    const subscriptions = subsResult.data ?? [];

    // Revenue by month (last 6 months)
    const revenueByMonth = buildMonthlyRevenue(orders);

    // Cases by state
    const casesByState = groupCount(cases, 'state');

    // Quotes funnel
    const quotesByStatus = groupCount(quotes, 'status');

    // Email delivery rate
    const emailStats = {
      total: emails.length,
      delivered: emails.filter((e) => e.status === 'delivered').length,
      bounced: emails.filter((e) => e.status === 'bounced').length,
      failed: emails.filter((e) => e.status === 'failed').length
    };

    // Subscriptions by plan
    const subsByPlan = groupCount(subscriptions, 'plan_name');
    const activeSubs = subscriptions.filter(
      (s) => s.status === 'active' || s.status === 'trialing'
    ).length;

    // Total revenue
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount_eur), 0);

    return NextResponse.json({
      totalRevenue,
      revenueByMonth,
      casesByState,
      quotesByStatus,
      emailStats,
      subsByPlan,
      activeSubs
    });
  } catch (error) {
    console.error('Admin reports GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

function groupCount(items: Record<string, unknown>[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item[key] ?? 'unknown');
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

function buildMonthlyRevenue(orders: { amount_eur: unknown; created_at: string }[]) {
  const map: Record<string, number> = {};
  for (const o of orders) {
    const month = o.created_at.slice(0, 7); // YYYY-MM
    map[month] = (map[month] ?? 0) + Number(o.amount_eur);
  }
  // Return last 6 months sorted
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }));
}
