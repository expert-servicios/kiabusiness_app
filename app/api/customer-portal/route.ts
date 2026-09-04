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

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('active_company_id,stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'No se pudo resolver tu perfil de facturación' }, { status: 500 });
    }

    let stripeCustomerId = profile?.stripe_customer_id ?? null;
    if (profile?.active_company_id) {
      const { data: membership } = await admin
        .from('profile_companies')
        .select('id')
        .eq('profile_id', user.id)
        .eq('company_id', profile.active_company_id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'La entidad activa no pertenece a tu cuenta' }, { status: 403 });
      }

      const { data: company } = await admin
        .from('companies')
        .select('stripe_customer_id')
        .eq('id', profile.active_company_id)
        .maybeSingle();
      stripeCustomerId = company?.stripe_customer_id ?? null;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'Esta entidad no tiene una suscripción de Stripe para gestionar' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: absoluteAppUrl('/dashboard/suscripciones')
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    return NextResponse.json({ error: 'Error al acceder al portal de facturación' }, { status: 500 });
  }
}
