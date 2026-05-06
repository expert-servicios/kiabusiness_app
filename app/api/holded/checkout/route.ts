import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/integrations/stripe';

const ALLOWED_PRICE_IDS = new Set([
  'price_1SxNObLeYwwgvux4fLN9k8YG',
  'price_1SxNJcLeYwwgvux42XH9HxiJ',
  'price_1SxNLlLeYwwgvux4IjCOgIQl'
]);

export async function POST(request: NextRequest) {
  try {
    const { priceId, packageName } = await request.json();

    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ error: 'Paquete no válido.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kseniailicheva.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/gracias/pago?source=holded`,
      cancel_url: `${appUrl}/holded`,
      metadata: { product_type: 'holded', package_name: packageName ?? '' },
      locale: 'es',
      payment_method_types: ['card']
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[holded/checkout]', err);
    return NextResponse.json({ error: 'Error al iniciar el pago.' }, { status: 500 });
  }
}
