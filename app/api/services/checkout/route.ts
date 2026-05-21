import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';

const SERVICE_CHECKOUTS = {
  price_1TZXomLeYwwgvux4bTuqVZcU: {
    name: 'Nacionalidad española para menor nacido en España',
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    category: 'extranjeria-nacionalidad'
  },
  price_1TZXopLeYwwgvux4C1wVQeer: {
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
  },
  price_1TZYiBLeYwwgvux4EO07gS0W: {
    name: 'Certificado Digital Persona Física — Camerfirma',
    slug: 'certificado-digital-persona-fisica',
    category: 'certificado-digital'
  },
  price_1TZYiDLeYwwgvux4ovAjIxrz: {
    name: 'Certificado Digital de Entidad — Camerfirma',
    slug: 'certificado-digital-entidad',
    category: 'certificado-digital'
  },
  price_1TZYl8LeYwwgvux4EWcyxqwn: {
    name: 'Arraigo Laboral',
    slug: 'arraigo-laboral',
    category: 'extranjeria-nacionalidad'
  },
  price_1TZYlBLeYwwgvux4c3bW4zwF: {
    name: 'Reagrupación Familiar',
    slug: 'reagrupacion-familiar',
    category: 'extranjeria-nacionalidad'
  },
  price_1TZYlELeYwwgvux4Et7Loldl: {
    name: 'Renovación de Residencia',
    slug: 'renovacion-residencia',
    category: 'extranjeria-nacionalidad'
  },
  price_1TZYlGLeYwwgvux4Rj6u0Jqk: {
    name: 'Nacionalidad Española por Residencia',
    slug: 'nacionalidad-espanola',
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
  } catch (err: unknown) {
    const stripeErr = err as { type?: string; code?: string; message?: string };
    console.error('[services/checkout] error:', {
      type: stripeErr?.type,
      code: stripeErr?.code,
      message: stripeErr?.message,
    });
    const userMsg = stripeErr?.message?.includes('No such price')
      ? 'Producto no encontrado en Stripe. Contacta con soporte.'
      : stripeErr?.message?.includes('tax')
      ? 'Error de configuración fiscal. Contacta con soporte.'
      : 'Error al iniciar el pago.';
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
