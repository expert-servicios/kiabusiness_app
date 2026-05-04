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

    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id,full_name,phone,role,whatsapp_number,whatsapp_consent,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }

    // Enrich with auth email + quote/case counts in parallel
    const [authUsers, quotesResult, casesResult] = await Promise.all([
      adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
      adminSupabase.from('quotes').select('client_id'),
      adminSupabase.from('cases').select('client_id,state')
    ]);

    const emailMap = new Map(
      (authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
    );
    const quoteCounts = new Map<string, number>();
    for (const q of quotesResult.data ?? []) {
      quoteCounts.set(q.client_id, (quoteCounts.get(q.client_id) ?? 0) + 1);
    }
    const caseCounts = new Map<string, number>();
    const activeCaseCounts = new Map<string, number>();
    for (const c of casesResult.data ?? []) {
      caseCounts.set(c.client_id, (caseCounts.get(c.client_id) ?? 0) + 1);
      if (c.state !== 'finalizado') {
        activeCaseCounts.set(c.client_id, (activeCaseCounts.get(c.client_id) ?? 0) + 1);
      }
    }

    const users = (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? '',
      totalQuotes: quoteCounts.get(p.id) ?? 0,
      totalCases: caseCounts.get(p.id) ?? 0,
      activeCases: activeCaseCounts.get(p.id) ?? 0
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const { userId, role } = await request.json();
    if (!userId || !['admin', 'client'].includes(role)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
