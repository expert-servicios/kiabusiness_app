import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: cases, error: fetchError } = await supabase
      .from('cases')
      .select('id,category,service,state,opened_at,closed_at,quote_id,docs_checklist')
      .order('opened_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching cases:', fetchError);
      return NextResponse.json({ error: 'Error al obtener expedientes' }, { status: 500 });
    }

    const caseList = cases ?? [];

    // Attach unread message counts
    if (caseList.length > 0) {
      const adminSupabase = getSupabaseAdmin();
      const { data: profile } = await adminSupabase
        .from('profiles').select('role').eq('id', user.id).single();
      const isAdmin = profile?.role === 'admin';
      const unreadColumn = isAdmin ? 'read_by_admin' : 'read_by_client';

      const caseIds = caseList.map((c) => c.id);
      const { data: unreadRows } = await adminSupabase
        .from('messages')
        .select('case_id')
        .in('case_id', caseIds)
        .eq(unreadColumn, false);

      const unreadMap: Record<string, number> = {};
      for (const row of unreadRows ?? []) {
        unreadMap[row.case_id] = (unreadMap[row.case_id] ?? 0) + 1;
      }

      return NextResponse.json({
        cases: caseList.map((c) => ({ ...c, unread_count: unreadMap[c.id] ?? 0 }))
      });
    }

    return NextResponse.json({ cases: caseList });
  } catch (error) {
    console.error('Cases GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
