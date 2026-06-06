import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data, error } = await admin
      .from('automation_settings')
      .select('key, enabled, updated_at')
      .order('key');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ automations: data ?? [] });
  } catch (err) {
    console.error('[admin/automatizaciones GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
