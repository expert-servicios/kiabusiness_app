import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json() as { enabled: boolean };
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled debe ser boolean' }, { status: 400 });
    }

    const { error } = await admin
      .from('automation_settings')
      .upsert({ key, enabled: body.enabled, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, key, enabled: body.enabled });
  } catch (err) {
    console.error('[admin/automatizaciones/[key] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
