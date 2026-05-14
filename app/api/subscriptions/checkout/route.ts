import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const bodySchema = z.object({
  priceId: z.string().min(1)
});

const VALID_PLAN_IDS = [
  process.env.STRIPE_PLAN_MONTHLY_99,
  process.env.STRIPE_PLAN_MONTHLY_199,
  process.env.STRIPE_PLAN_MONTHLY_349
].filter(Boolean) as string[];

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

    if (VALID_PLAN_IDS.length > 0 && !VALID_PLAN_IDS.includes(priceId)) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gracias/pago?type=subscription`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripciones`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
