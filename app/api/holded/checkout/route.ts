import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { getPublicAppUrl } from '@/lib/utils/app-url';

// Amounts (cents, ex-VAT) must stay in sync with the advertised `price` in
// lib/utils/catalog.ts for these same stripePriceId entries — they were
// previously out of sync (490€/1200€/2400€ hardcoded here vs 499€/899€/
// 1199€ advertised on the service pages), a latent overcharge risk if this
// route is ever wired up as an alternate checkout path.
const HOLDED_CHECKOUTS: Record<string, { name: string; unitAmount: number; productType: string }> = {
  price_1SxNObLeYwwgvux4fLN9k8YG: {
    name: 'Pack Starter - Onboarding a Holded',
    unitAmount: 49900,
    productType: 'holded',
  },
  price_1SxNJcLeYwwgvux42XH9HxiJ: {
    name: 'Migracion completa a Holded - sin inventario',
    unitAmount: 89900,
    productType: 'holded',
  },
  price_1SxNLlLeYwwgvux4IjCOgIQl: {
    name: 'Migracion completa a Holded - con inventario',
    unitAmount: 119900,
    productType: 'holded',
  },
  price_1SyB8ULeYwwgvux4sZbYod1B: {
    name: 'Formacion Holded - sesion 2 h',
    unitAmount: 18000,
    productType: 'holded_formacion',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { priceId, packageName } = await request.json();
    const checkout = typeof priceId === 'string' ? HOLDED_CHECKOUTS[priceId] : null;

    if (!checkout) {
      return NextResponse.json({ error: 'Paquete no valido.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();
    const displayName = toStripeAscii(packageName ?? checkout.name);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      automatic_tax: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: checkout.unitAmount,
            tax_behavior: 'exclusive',
            product_data: {
              name: displayName,
              metadata: { configured_price_id: priceId },
            },
          },
        },
      ],
      success_url: `${appUrl}/gracias/pago?source=holded`,
      cancel_url: `${appUrl}/holded`,
      metadata: { product_type: checkout.productType, package_name: displayName },
      locale: 'es',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[holded/checkout]', err);
    return NextResponse.json({ error: 'Error al iniciar el pago.' }, { status: 500 });
  }
}
