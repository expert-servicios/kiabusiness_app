import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// Safe columns — encrypted_api_key is deliberately excluded
const SAFE_COLUMNS = 'id,provider,mode,api_key_last4,permissions_detected,status,sync_mode,last_sync_at,last_success_at,last_error,connected_by,disconnected_at,created_at,updated_at';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const companyId = request.nextUrl.searchParams.get('companyId') ?? profile?.active_company_id ?? null;

    let query = getSupabaseAdmin()
      .from('client_integrations')
      .select(SAFE_COLUMNS)
      .eq('provider', 'holded')
      .neq('status', 'revoked')
      .order('created_at', { ascending: false })
      .limit(1);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      query = query.eq('client_id', user.id);
    }

    const { data: rows, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ error: 'Error consultando integración' }, { status: 500 });
    }

    const integration = rows?.[0] ?? null;
    return NextResponse.json({ integration });
  } catch (err) {
    console.error('[holded/status] error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
