import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getPublicAppUrl } from '@/lib/utils/app-url';

const bodySchema = z.object({
  priceId: z.string().min(1),
  companyId: z.string().uuid().optional()
});

type BillingInterval = 'month' | 'year';

interface PlanConfig {
  priceId: string;
  name: string;
  amountEur: number;
  interval: BillingInterval;
}

const PLAN_CHECKOUTS: PlanConfig[] = [
  { priceId: process.env.STRIPE_PLAN_MONTHLY_49 ?? '', name: 'Plan Supervisión', amountEur: 49, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_99 ?? '', name: 'Plan Avanzado', amountEur: 99, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_MONTHLY_199 ?? '', name: 'Plan Colaborativo', amountEur: 199, interval: 'month' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_49 ?? '', name: 'Plan Supervisión', amountEur: 490, interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_99 ?? '', name: 'Plan Avanzado', amountEur: 990, interval: 'year' },
  { priceId: process.env.STRIPE_PLAN_ANNUAL_199 ?? '', name: 'Plan Colaborativo', amountEur: 1990, interval: 'year' },
].filter((plan): plan is PlanConfig => Boolean(plan.priceId));

const VALID_PLAN_IDS = PLAN_CHECKOUTS.map((plan) => plan.priceId);

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const parseResult = bodySchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'priceId requerido y companyId debe ser UUID si se indica' }, { status: 400 });
    }

    const { priceId, companyId: requestedCompanyId } = parseResult.data;
    if (!VALID_PLAN_IDS.includes(priceId)) {
      return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
    }

    const configuredPlan = PLAN_CHECKOUTS.find((plan) => plan.priceId === priceId);
    if (!configuredPlan) {
      return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('profile_completed,billing_ready,active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo resolver tu perfil de contratación' }, { status: 500 });
    }

    if (!profile.profile_completed) {
      return NextResponse.json(
        { error: 'Completa tu perfil antes de suscribirte.', code: 'profile_required' },
        { status: 409 }
      );
    }

    if (!profile.billing_ready) {
      return NextResponse.json(
        { error: 'Completa tus datos de facturación antes de suscribirte.', code: 'billing_required' },
        { status: 409 }
      );
    }

    const companyId = requestedCompanyId ?? profile.active_company_id ?? null;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Selecciona o crea la entidad fiscal que va a contratar el plan.', code: 'company_required' },
        { status: 409 }
      );
    }

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('role')
      .eq('profile_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: 'No se pudo validar la entidad seleccionada' }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'La entidad seleccionada no pertenece al usuario', code: 'company_forbidden' }, { status: 403 });
    }

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', companyId)
      .maybeSingle();
    if (companyError || !company) {
      return NextResponse.json({ error: 'No se pudo resolver la entidad seleccionada' }, { status: 500 });
    }

    const stripeCustomerId = company.stripe_customer_id ?? null;
    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const entityMetadata = {
      user_id: user.id,
      company_id: companyId,
      plan_name: configuredPlan.name,
      billing: configuredPlan.interval,
      product_type: 'suscripcion'
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId ?? undefined,
      customer_email: stripeCustomerId ? undefined : user.email,
      client_reference_id: user.id,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true, required: 'if_supported' },
      automatic_tax: { enabled: true },
      ...(stripeCustomerId ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
      metadata: entityMetadata,
      subscription_data: {
        metadata: {
          ...entityMetadata,
          configured_price_id: priceId,
        }
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(configuredPlan.amountEur * 100),
          tax_behavior: 'exclusive',
          recurring: { interval: configuredPlan.interval },
          product_data: {
            name: toStripeAscii(configuredPlan.name),
            metadata: { configured_price_id: priceId, billing: configuredPlan.interval },
          },
        },
      }],
      success_url: `${appUrl}/dashboard/post-compra?origin=subscription`,
      cancel_url: `${appUrl}/dashboard/suscripciones`
    });

    const { error: persistError } = await admin.from('checkout_sessions').insert({
      stripe_session_id: session.id,
      user_id: user.id,
      company_id: companyId,
      status: 'open',
      metadata: {
        product_type: 'subscription',
        plan_name: configuredPlan.name,
        plan_price_id: priceId,
        billing: configuredPlan.interval,
        amount_eur: configuredPlan.amountEur,
        automatic_tax: true,
        tax_behavior: 'exclusive',
      }
    });

    if (persistError) {
      console.error('[subscriptions/checkout] checkout persistence failed:', persistError);
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error('[subscriptions/checkout] failed to expire orphan Stripe session:', expireError);
      }
      return NextResponse.json({ error: 'No se pudo registrar de forma segura la sesión de contratación' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, companyId });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesion de pago' }, { status: 500 });
  }
}
