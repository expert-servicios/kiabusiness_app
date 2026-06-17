import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const [countResult, dataResult] = await Promise.all([
      adminSupabase
        .from('email_events')
        .select('id', { count: 'exact', head: true }),
      adminSupabase
        .from('email_events')
        .select('id,event_type,recipient_email,subject,status,created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1),
    ]);

    if (dataResult.error) {
      return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
    }

    return NextResponse.json({
      events: dataResult.data ?? [],
      total: countResult.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error('Admin emails GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
