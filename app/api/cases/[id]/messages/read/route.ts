import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
    const role = (profile?.role === 'admin' || profile?.role === 'owner') ? 'admin' : 'client';

    const column = role === 'client' ? 'read_by_client' : 'read_by_admin';

    const { error } = await adminSupabase
      .from('messages')
      .update({ [column]: true })
      .eq('case_id', caseId)
      .eq(column, false);

    if (error) {
      console.error('[messages/read] update error:', error);
      return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[messages/read]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
