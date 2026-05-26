import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getPublicAppUrl } from '@/lib/utils/app-url';

const bodySchema = z.object({
  priceId: z.string().min(1)
});

type BillingInterval = 'month' | 'year';

interface PlanConfig {
  priceId  : string;
  name     : string;
  amountEur: number;
  interval : BillingInterval;
}

const PLAN_CHECKOUTS: PlanConfig[] = [
  // Planes mensuales
  { priceId: process.env.STRIPE_PLAN_MONTHLY_49  ?? '', name: 'Plan Supervisión',  amountEur: 49,   interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_99  ?? '', name: 'Plan Avanzado',     amountEur: 99,   interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_199 ?? '', name: 'Plan Colaborativo', amountEur: 199,  interval: 'month' },
  // Planes anuales (2 meses gratis = 10 mensualidades)
  { priceId: process.env.STRIPE_PLAN_ANNUAL_49   ?? '', name: 'Plan Supervisión',  amountEur: 490,  interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_99   ?? '', name: 'Plan Avanzado',     amountEur: 990,  interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_199  ?? '', name: 'Plan Colaborativo', amountEur: 1990, interval: 'year' },
].filter((plan): plan is PlanConfig => Boolean(plan.priceId));

const VALID_PLAN_IDS = PLAN_CHECKOUTS.map((plan) => plan.priceId);

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = bodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'priceId requerido' }, { status: 400 });
    }

    const { priceId } = parseResult.data;

    if (VALID_PLAN_IDS.length === 0) {
      console.error('[subscriptions/checkout] no STRIPE_PLAN_MONTHLY_* price IDs configured');
      return NextResponse.json({ error: 'Planes de suscripcion no configurados' }, { status: 500 });
    }

    if (!VALID_PLAN_IDS.includes(priceId)) {
      return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
    }

    const configuredPlan = PLAN_CHECKOUTS.find((plan) => plan.priceId === priceId);
    if (!configuredPlan) {
      return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('stripe_customer_id, profile_completed, billing_ready, active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.profile_completed) {
      return NextResponse.json(
        { error: 'Completa tu perfil antes de suscribirte.', code: 'profile_required' },
        { status: 409 }
      );
    }
    if (!profile?.billing_ready) {
      return NextResponse.json(
        { error: 'Completa tus datos fiscales antes de suscribirte.', code: 'billing_required' },
        { status: 409 }
      );
    }

    let holdedQuery = adminSupabase
      .from('client_integrations')
      .select('id, status')
      .eq('provider', 'holded')
      .eq('status', 'active')
      .limit(1);

    if (profile?.active_company_id) {
      holdedQuery = holdedQuery.or(`client_id.eq.${user.id},company_id.eq.${profile.active_company_id}`);
    } else {
      holdedQuery = holdedQuery.eq('client_id', user.id);
    }

    const { data: holdedIntegrations } = await holdedQuery;
    const holdedIntegration = holdedIntegrations?.[0] ?? null;

    if (!holdedIntegration) {
      return NextResponse.json(
        { error: 'Conecta Holded desde el Panel Cliente antes de contratar un plan mensual.', code: 'holded_required' },
        { status: 409 }
      );
    }

    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan_name: configuredPlan.name, billing: configuredPlan.interval },
      subscription_data: {
        metadata: {
          user_id            : user.id,
          plan_name          : configuredPlan.name,
          configured_price_id: priceId,
          billing            : configuredPlan.interval,
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency    : 'eur',
            unit_amount : Math.round(configuredPlan.amountEur * 100),
            recurring   : { interval: configuredPlan.interval },
            product_data: {
              name    : toStripeAscii(configuredPlan.name),
              metadata: { configured_price_id: priceId, billing: configuredPlan.interval },
            },
          },
        }
      ],
      success_url: `${appUrl}/gracias/pago?type=subscription`,
      cancel_url: `${appUrl}/dashboard/suscripciones`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesion de pago' }, { status: 500 });
  }
}
