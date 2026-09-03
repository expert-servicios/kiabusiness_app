import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'No se pudo resolver la entidad activa' }, { status: 500 });
    }

    const companyId = profile?.active_company_id ?? null;
    let query = admin
      .from('subscriptions')
      .select('id,company_id,plan_name,status,stripe_price_id,current_period_start,current_period_end,canceled_at,created_at,post_purchase_onboarding_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    query = companyId ? query.eq('company_id', companyId) : query.is('company_id', null);

    const { data: subscriptions, error: fetchError } = await query;
    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
    }

    let company: { id: string; razon_social: string; forma_juridica: string } | null = null;
    if (companyId) {
      const { data } = await admin
        .from('companies')
        .select('id,razon_social,forma_juridica')
        .eq('id', companyId)
        .maybeSingle();
      company = data ?? null;
    }

    return NextResponse.json({ subscriptions: subscriptions ?? [], company });
  } catch (error) {
    console.error('Subscriptions GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
