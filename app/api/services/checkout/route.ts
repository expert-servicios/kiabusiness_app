import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';

const SERVICE_CHECKOUTS = {
  price_1TQn6XLeYwwgvux4PQCePaoa: {
    name: 'Nacionalidad española para menor nacido en España',
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    category: 'extranjeria-nacionalidad'
  },
  price_1TX3epLeYwwgvux4mspOiVLg: {
    name: 'Permiso Inicial de Residencia',
    slug: 'permiso-residencia-inicial',
    category: 'extranjeria-nacionalidad'
  },
  price_1TXMmGLeYwwgvux4wIhcfhEF: {
    name: 'Declaración de la Renta (IRPF)',
    slug: 'irpf',
    category: 'declaraciones-impuestos'
  },
  price_1TXMmKLeYwwgvux4oXpYh27g: {
    name: 'Alta de Autónomo',
    slug: 'alta-autonomo',
    category: 'empresas-autonomos'
  },
  price_1TXMmNLeYwwgvux4hIk84Aug: {
    name: 'Constitución de Sociedad Limitada',
    slug: 'constitucion-sl',
    category: 'empresas-autonomos'
  },
  price_1TXMmQLeYwwgvux4ivP7Uhn8: {
    name: 'Arraigo Social',
    slug: 'arraigo-social',
    category: 'extranjeria-nacionalidad'
  },
  price_1TXMmTLeYwwgvux4OvsyKGL2: {
    name: 'Arraigo Familiar',
    slug: 'arraigo-familiar',
    category: 'extranjeria-nacionalidad'
  },
  price_1TXMmVLeYwwgvux4e9hXI90o: {
    name: 'Modelo 720 — Bienes en el Extranjero',
    slug: 'modelo-720',
    category: 'declaraciones-impuestos'
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expertconsulting.es';
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
