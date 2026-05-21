import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { absoluteAppUrl } from '@/lib/utils/app-url';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa para gestionar' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: absoluteAppUrl('/dashboard/suscripciones')
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    return NextResponse.json({ error: 'Error al acceder al portal de facturación' }, { status: 500 });
  }
}
