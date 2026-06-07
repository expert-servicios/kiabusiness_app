import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const resolved = searchParams.get('resolved') === 'true';

  const { data: alerts, error } = await getSupabaseAdmin()
    .from('security_alerts')
    .select('id, alert_type, user_email, detail, resolved, resolved_at, created_at')
    .eq('resolved', resolved)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: alerts ?? [] });
}
