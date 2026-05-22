import { services as catalogServices } from '@/lib/utils/catalog';
import { toStripeAscii } from '@/lib/integrations/stripe';

export type ServiceCheckoutItem = {
  priceId: string;
  name: string;
  slug: string;
  category: string;
  unitAmount: number;
};

function parseUnitAmount(price?: string): number | null {
  if (!price) return null;
  const match = price.match(/[\d.,]+/);
  if (!match) return null;
  // Strip Spanish thousands dots (dot followed by exactly 3 digits: "1.199" → "1199")
  // then normalise decimal comma to dot ("1.199,50" → "1199.50")
  const cleaned = match[0]
    .replace(/\.(\d{3})/g, '$1')
    .replace(',', '.');
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function buildServiceCheckouts() {
  const checkouts = new Map<string, ServiceCheckoutItem>();

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

export function getServiceCheckoutByPriceId(priceId: string): ServiceCheckoutItem | null {
  return SERVICE_CHECKOUTS.get(priceId) ?? null;
}

export function getServiceCheckoutLineItem(item: ServiceCheckoutItem) {
  return {
    quantity  : 1,
    price_data: {
      currency    : 'eur',
      unit_amount : item.unitAmount,
      tax_behavior: 'exclusive' as const,
      product_data: {
        name    : toStripeAscii(item.name),
        metadata: {
          service_slug       : item.slug,
          service_category   : item.category,
          configured_price_id: item.priceId,
        },
      },
    },
  };
}

export function getServiceCheckoutMetadata(items: ServiceCheckoutItem[]) {
  const isCart = items.length > 1;

  return {
    product_type : isCart ? 'cart' : 'service',
    service_slug : isCart ? '' : items[0].slug,
    service_name : isCart ? 'Pedido de servicios EXPERT' : toStripeAscii(items[0].name),
    service_slugs: items.map((item) => item.slug).join(',').slice(0, 499),
    service_names: toStripeAscii(items.map((item) => item.name).join(', ')),
  };
}
