import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isOperationallyActiveCase } from '@/lib/utils/case-states';

export async function GET(request: NextRequest) {
  try {
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [profilesResult, pendingQuotesResult, ordersResult, casesResult] = await Promise.all([
      adminSupabase.from('profiles').select('id', { count: 'exact', head: true }),
      adminSupabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'sent', 'accepted']),
      adminSupabase.from('orders').select('amount_eur').eq('status', 'paid'),
      adminSupabase
        .from('cases')
        .select('state')
    ]);

    const totalUsers = profilesResult.count ?? 0;
    const pendingQuotes = pendingQuotesResult.count ?? 0;
    const activeCases = (casesResult.data ?? []).filter((caseItem) =>
      isOperationallyActiveCase(String(caseItem.state))
    ).length;
    const totalRevenue = (ordersResult.data ?? []).reduce(
      (sum, order) => sum + Number(order.amount_eur),
      0
    );

    return NextResponse.json({ totalUsers, pendingQuotes, activeCases, totalRevenue });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
