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

// Accept either a single priceId (backwards compat) or an array (cart checkout)
const checkoutSchema = z.object({
  priceId : z.string().min(1).optional(),
  priceIds: z.array(z.string().min(1)).min(1).max(10).optional(),
}).refine(d => d.priceId ?? d.priceIds, { message: 'priceId or priceIds is required' });

export async function POST(request: NextRequest) {
  try {
    const input  = checkoutSchema.parse(await request.json());
    const rawIds = input.priceIds ?? (input.priceId ? [input.priceId] : []);

    // Validate every priceId against the allow-list
    const services = rawIds.map(id => {
      const svc = SERVICE_CHECKOUTS[id as keyof typeof SERVICE_CHECKOUTS];
      if (!svc) throw Object.assign(new Error(`Servicio no válido: ${id}`), { _isUserError: true });
      return { priceId: id, ...svc };
    });

    const stripe    = getStripeClient();
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expertconsulting.es';
    const cancelUrl = services.length === 1
      ? `${appUrl}/servicios/${services[0].category}/${services[0].slug}`
      : `${appUrl}/carrito`;

    const session = await stripe.checkout.sessions.create({
      mode      : 'payment',
      line_items: services.map(s => ({ price: s.priceId, quantity: 1 })),
      success_url: `${appUrl}/gracias/pago?source=${services.length > 1 ? 'cart' : 'service'}&service=${services[0].slug}`,
      cancel_url : cancelUrl,
      metadata   : {
        product_type  : services.length > 1 ? 'cart' : 'service',
        service_names : services.map(s => s.name).join(' | ').slice(0, 499),
        service_slugs : services.map(s => s.slug).join(',').slice(0, 499),
      },
      locale: 'es',
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
