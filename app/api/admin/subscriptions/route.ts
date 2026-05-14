import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: subscriptions, error } = await adminSupabase
      .from('subscriptions')
      .select('id,plan_name,status,stripe_customer_id,current_period_end,canceled_at,created_at,client_id')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: subscriptions ?? [] });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
