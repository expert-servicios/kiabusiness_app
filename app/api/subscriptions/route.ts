import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id,plan_name,status,stripe_price_id,current_period_start,current_period_end,canceled_at,created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: subscriptions ?? [] });
  } catch (error) {
    console.error('Subscriptions GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
