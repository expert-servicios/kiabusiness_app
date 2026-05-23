import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';
import {
  getServiceCheckoutByPriceId,
  getServiceCheckoutLineItem,
  getServiceCheckoutMetadata,
} from '@/lib/integrations/service-checkout';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// Accept either a single priceId (backwards compat) or an array (cart checkout).
const checkoutSchema = z.object({
  priceId : z.string().min(1).optional(),
  priceIds: z.array(z.string().min(1)).min(1).max(10).optional(),
}).refine(d => d.priceId ?? d.priceIds, { message: 'priceId or priceIds is required' });

export async function POST(request: NextRequest) {
  try {
    // Require authentication — no anonymous payments (rule: login obligatorio antes de pago).
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para continuar.', requiresAuth: true }, { status: 401 });
    }

    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id,full_name,phone,email,stripe_customer_id,profile_completed,billing_ready,client_type,tax_id,address,city,postal_code')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'Completa tu perfil antes de contratar.',
        code: 'profile_required',
        profileRequired: true,
      }, { status: 409 });
    }

    if (!profile.profile_completed) {
      return NextResponse.json({
        error: 'Completa nombre y telefono antes de contratar.',
        code: 'profile_required',
        profileRequired: true,
      }, { status: 409 });
    }

    if (!profile.billing_ready) {
      return NextResponse.json({
        error: 'Completa los datos de facturacion antes de contratar.',
        code: 'billing_required',
        billingRequired: true,
      }, { status: 409 });
    }

    const parseResult = checkoutSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de checkout no validos.' }, { status: 400 });
    }

    const input  = parseResult.data;
    const rawIds = input.priceIds ?? (input.priceId ? [input.priceId] : []);

    const checkoutServices = rawIds.map(id => {
      const svc = getServiceCheckoutByPriceId(id);
      if (!svc) throw Object.assign(new Error(`Servicio no valido: ${id}`), { _isUserError: true });
      return svc;
    });

    const stripe    = getStripeClient();
    const appUrl    = getPublicAppUrl();
    const cancelUrl = checkoutServices.length === 1
      ? `${appUrl}/servicios/${checkoutServices[0].category}/${checkoutServices[0].slug}`
      : `${appUrl}/carrito`;

    const session = await stripe.checkout.sessions.create({
      mode                : 'payment',
      automatic_tax       : { enabled: true },
      client_reference_id : user.id,
      customer            : profile.stripe_customer_id ?? undefined,
      customer_email      : profile.stripe_customer_id ? undefined : user.email,
      line_items          : checkoutServices.map(getServiceCheckoutLineItem),
      success_url         : `${appUrl}/gracias/pago?source=${checkoutServices.length > 1 ? 'cart' : 'service'}&service=${checkoutServices[0].slug}`,
      cancel_url          : cancelUrl,
      metadata            : {
        ...getServiceCheckoutMetadata(checkoutServices),
        user_id: user.id,
      },
      locale              : 'es',
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const e = err as { _isUserError?: boolean; type?: string; code?: string; message?: string; statusCode?: number; raw?: unknown };
    if (e._isUserError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    console.error('[services/checkout] error:', {
      type      : e.type,
      code      : e.code,
      message   : e.message,
      statusCode: e.statusCode,
      raw       : e.raw,
    });

    const msg     = e.message ?? '';
    const userMsg = msg.includes('No such price')
      ? 'Producto no encontrado en Stripe. Contacta con soporte.'
      : 'Error al iniciar el pago.';
    return NextResponse.json({ error: userMsg, _detail: msg }, { status: 500 });
  }
}
