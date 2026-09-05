import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getFounderServiceProduct } from '@/lib/services/founder-services';

const schema = z.object({
  slug: z.enum(['constitucion-sl-circe', 'nif-socio-extranjero']),
  quantity: z.number().int().min(1).max(10).default(1),
});

async function ensureStripePrice(slug: string) {
  const service = getFounderServiceProduct(slug);
  if (!service) throw new Error('Servicio no válido.');

  const stripe = getStripeClient();
  const existing = await stripe.prices.list({
    lookup_keys: [service.stripeLookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const product = await stripe.products.create(
    {
      name: toStripeAscii(service.name),
      description: toStripeAscii(service.description),
      metadata: {
        expert_service_slug: service.slug,
        expert_service_category: service.category,
      },
    },
    { idempotencyKey: `expert-founder-product-${service.slug}-v1` },
  );

  const price = await stripe.prices.create(
    {
      product: product.id,
      currency: 'eur',
      unit_amount: service.unitAmount,
      tax_behavior: 'exclusive',
      lookup_key: service.stripeLookupKey,
      metadata: {
        expert_service_slug: service.slug,
      },
    },
    { idempotencyKey: `expert-founder-price-${service.slug}-${service.unitAmount}-v1` },
  );

  return price.id;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para continuar.', requiresAuth: true }, { status: 401 });
    }

    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id,full_name,phone,email,stripe_customer_id,profile_completed')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.profile_completed) {
      return NextResponse.json({
        error: 'Completa tu perfil antes de contratar.',
        code: 'profile_required',
        profileRequired: true,
      }, { status: 409 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de compra no válidos.' }, { status: 400 });
    }

    const service = getFounderServiceProduct(parsed.data.slug);
    if (!service) {
      return NextResponse.json({ error: 'Servicio no válido.' }, { status: 400 });
    }

    const quantity = service.allowQuantity ? parsed.data.quantity : 1;
    const priceId = await ensureStripePrice(service.slug);
    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const serviceUrl = `${appUrl}/servicios/empresas-autonomos/${service.slug}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true, required: 'if_supported' },
      client_reference_id: user.id,
      customer: profile.stripe_customer_id ?? undefined,
      customer_email: profile.stripe_customer_id ? undefined : user.email,
      ...(profile.stripe_customer_id ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
      line_items: [{ price: priceId, quantity }],
      success_url: `${appUrl}/gracias/pago?source=founder_service&service=${service.slug}`,
      cancel_url: serviceUrl,
      metadata: {
        product_type: 'service',
        service_slug: service.slug,
        service_slugs: service.slug,
        service_name: toStripeAscii(quantity > 1 ? `${service.shortName} x ${quantity}` : service.shortName),
        service_names: toStripeAscii(quantity > 1 ? `${service.shortName} x ${quantity}` : service.shortName),
        founder_service: 'true',
        quantity: String(quantity),
        user_id: user.id,
      },
      locale: 'es',
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; type?: string };
    console.error('[founder-services/checkout] error:', { message: e.message, code: e.code, type: e.type });
    return NextResponse.json({ error: 'No se pudo iniciar el pago.' }, { status: 500 });
  }
}
