import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { error } = await getSupabaseAdmin()
    .from('security_alerts')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('resolved', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
