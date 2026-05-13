import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';

const SERVICE_CHECKOUTS = {
  price_1TQn6XLeYwwgvux4PQCePaoa: {
    name: 'Nacionalidad española para menor nacido en España',
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    category: 'extranjeria-nacionalidad'
  }
} as const;

const checkoutSchema = z.object({
  priceId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const service = SERVICE_CHECKOUTS[input.priceId as keyof typeof SERVICE_CHECKOUTS];

    if (!service) {
      return NextResponse.json({ error: 'Servicio no válido.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kseniailicheva.com';
    const serviceUrl = `${appUrl}/servicios/${service.category}/${service.slug}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: `${appUrl}/gracias/pago?source=service&service=${service.slug}`,
      cancel_url: serviceUrl,
      metadata: {
        product_type: 'service',
        service_name: service.name,
        service_slug: service.slug,
        service_category: service.category
      },
      locale: 'es',
      customer_creation: 'always',
      phone_number_collection: { enabled: true }
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[services/checkout]', err);
    return NextResponse.json({ error: 'Error al iniciar el pago.' }, { status: 500 });
  }
}
