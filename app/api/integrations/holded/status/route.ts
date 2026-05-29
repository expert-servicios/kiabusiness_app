/**
 * GET /api/integrations/holded/status
 * Returns the Holded connection status for the current user.
 * Used by the dashboard to show the connection card.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('active_company_id')
    .eq('id', user.id)
    .single();

  const companyId = profile?.active_company_id ?? null;

  let query = admin
    .from('client_integrations')
    .select('id, status, api_key_last4, permissions_detected, last_success_at, consent_at')
    .eq('provider', 'holded')
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })
    .limit(1);

  query = companyId ? query.eq('company_id', companyId) : query.eq('client_id', user.id);

  const { data: row } = await query.maybeSingle();

  return NextResponse.json({
    connected  : row?.status === 'active',
    status     : row?.status ?? 'not_connected',
    last4      : row?.api_key_last4 ?? null,
    permissions: row?.permissions_detected ?? null,
    lastSync   : row?.last_success_at ?? null,
    consentAt  : row?.consent_at ?? null,
    connectUrl : '/dashboard/integraciones/holded',
  });
}
