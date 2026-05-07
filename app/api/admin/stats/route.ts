import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await sessionSupabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [profilesResult, pendingQuotesResult, ordersResult, activeCasesResult] = await Promise.all([
      adminSupabase.from('profiles').select('id', { count: 'exact', head: true }),
      adminSupabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'sent', 'accepted']),
      adminSupabase.from('orders').select('amount_eur').eq('status', 'paid'),
      adminSupabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .neq('state', 'finalizado')
    ]);

    const totalUsers = profilesResult.count ?? 0;
    const pendingQuotes = pendingQuotesResult.count ?? 0;
    const activeCases = activeCasesResult.count ?? 0;
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
