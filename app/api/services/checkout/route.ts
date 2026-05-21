import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripeClient } from '@/lib/integrations/stripe';
import { services as catalogServices } from '@/lib/utils/catalog';

type ServiceCheckout = {
  priceId: string;
  name: string;
  slug: string;
  category: string;
  unitAmount: number;
};

function parseUnitAmount(price?: string): number | null {
  const match = price?.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;

  const amount = Number.parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.round(amount * 100);
}

function toStripeAscii(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 499);
}

function buildServiceCheckouts() {
  const checkouts = new Map<string, ServiceCheckout>();

  for (const service of catalogServices) {
    if (!service.stripePriceId) continue;

    const unitAmount = parseUnitAmount(service.price);
    if (!unitAmount) continue;

    checkouts.set(service.stripePriceId, {
      priceId: service.stripePriceId,
      name: service.name,
      slug: service.slug,
      category: service.categoria,
      unitAmount,
    });
  }

  return checkouts;
}

const SERVICE_CHECKOUTS = buildServiceCheckouts();

// Accept either a single priceId (backwards compat) or an array (cart checkout).
const checkoutSchema = z.object({
  priceId : z.string().min(1).optional(),
  priceIds: z.array(z.string().min(1)).min(1).max(10).optional(),
}).refine(d => d.priceId ?? d.priceIds, { message: 'priceId or priceIds is required' });

export async function POST(request: NextRequest) {
  try {
    const parseResult = checkoutSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de checkout no validos.' }, { status: 400 });
    }

    const input  = parseResult.data;
    const rawIds = input.priceIds ?? (input.priceId ? [input.priceId] : []);

    const checkoutServices = rawIds.map(id => {
      const svc = SERVICE_CHECKOUTS.get(id);
      if (!svc) throw Object.assign(new Error(`Servicio no valido: ${id}`), { _isUserError: true });
      return svc;
    });

    const stripe    = getStripeClient();
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expertconsulting.es';
    const cancelUrl = checkoutServices.length === 1
      ? `${appUrl}/servicios/${checkoutServices[0].category}/${checkoutServices[0].slug}`
      : `${appUrl}/carrito`;
    const serviceSlugs = checkoutServices.map(s => s.slug).join(',').slice(0, 499);
    const serviceNames = toStripeAscii(checkoutServices.map(s => s.name).join(', '));

    const session = await stripe.checkout.sessions.create({
      mode      : 'payment',
      automatic_tax: { enabled: true },
      line_items: checkoutServices.map(s => ({
        quantity  : 1,
        price_data: {
          currency    : 'eur',
          unit_amount : s.unitAmount,
          tax_behavior: 'exclusive',
          product_data: {
            name    : toStripeAscii(s.name),
            metadata: {
              service_slug       : s.slug,
              service_category   : s.category,
              configured_price_id: s.priceId,
            },
          },
        },
      })),
      success_url: `${appUrl}/gracias/pago?source=${checkoutServices.length > 1 ? 'cart' : 'service'}&service=${checkoutServices[0].slug}`,
      cancel_url : cancelUrl,
      metadata   : {
        product_type : checkoutServices.length > 1 ? 'cart' : 'service',
        service_slug : checkoutServices.length === 1 ? checkoutServices[0].slug : '',
        service_name : checkoutServices.length === 1 ? toStripeAscii(checkoutServices[0].name) : 'Pedido de servicios EXPERT',
        service_slugs: serviceSlugs,
        service_names: serviceNames,
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
