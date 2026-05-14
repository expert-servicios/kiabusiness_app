import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return admin;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const limit = Number(searchParams.get('limit') ?? '100');

    let query = admin
      .from('integration_sync_events')
      .select(
        'id,provider,direction,operation,local_entity,local_id,external_entity,external_id,status,attempt_count,error,metadata,created_at,updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (provider) query = query.eq('provider', provider);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    console.error('[admin/integration-sync-events] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
