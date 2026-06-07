import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data } = await getSupabaseAdmin()
    .from('holded_mcp_connections')
    .select('id, status, last_activity_at, created_at')
    .eq('supabase_user_id', user.id)
    .eq('channel', 'claude')
    .eq('status', 'connected')
    .maybeSingle();

  return NextResponse.json({
    connected: !!data,
    lastActivity: data?.last_activity_at ?? null,
    connectedAt: data?.created_at ?? null,
  });
}
