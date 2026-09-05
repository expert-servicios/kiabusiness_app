import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: actor } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (actor?.status === 'inactive' || !isStaffRole(actor?.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id: clientId } = await params;
  const { data: subscriptions, error } = await admin
    .from('subscriptions')
    .select('id,status,company_id,post_purchase_onboarding_at,created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/clientes/onboarding-state]', error.message);
    return NextResponse.json({ error: 'No se pudo cargar el estado de onboarding' }, { status: 500 });
  }

  const active = (subscriptions ?? []).find((sub) => sub.status === 'active' || sub.status === 'trialing') ?? null;
  return NextResponse.json({
    activeSubscriptionId: active?.id ?? null,
    companyId: active?.company_id ?? null,
    completedAt: active?.post_purchase_onboarding_at ?? null,
    completed: Boolean(active?.post_purchase_onboarding_at),
  });
}
