import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// GET /api/fiscal-calendar?year=2026 — client-scoped, siempre filtra por el
// usuario autenticado. IMP-033: la pagina de cliente usaba antes
// /api/admin/fiscal-calendar, que devuelve 403 para clientes normales, o
// (para un admin/owner viendo su propio panel) las obligaciones de TODOS
// los clientes al no mandar userId.
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('fiscal_obligations')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)
    .order('deadline');

  if (error) return NextResponse.json({ error: 'Error al obtener obligaciones' }, { status: 500 });

  return NextResponse.json({ obligations: data ?? [] });
}
