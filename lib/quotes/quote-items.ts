import { services as catalogServices } from '@/lib/utils/catalog';

export type QuoteItemInput = {
  serviceSlug: string;
  quantity?: number;
};

export type ResolvedQuoteItem = {
  serviceSlug: string;
  stripePriceId: string;
  description: string;
  quantity: number;
  unitAmountEur: number;
  taxBehavior: 'exclusive' | 'inclusive' | 'unspecified';
  sortOrder: number;
};

const QUANTITY_RULES: Record<string, { min: number; max: number }> = {
  'holded-migracion-laboral': { min: 5, max: 200 },
  'holded-modulo-formacion': { min: 1, max: 1 },
};

function parseCatalogUnitAmount(price?: string): number | null {
  if (!price) return null;
  const match = price.match(/[\d.,]+/);
  if (!match) return null;

  const cleaned = match[0]
    .replace(/\.(\d{3})/g, '$1')
    .replace(',', '.');
  const amount = Number.parseFloat(cleaned);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function resolveQuoteItems(inputs: QuoteItemInput[]): ResolvedQuoteItem[] {
  if (!inputs.length) throw new Error('Añade al menos un servicio al presupuesto.');
  if (inputs.length > 20) throw new Error('Demasiadas líneas en el presupuesto.');

  return inputs.map((input, index) => {
    const service = catalogServices.find((candidate) => candidate.slug === input.serviceSlug);
    if (!service?.stripePriceId) {
      throw new Error(`Servicio no disponible para contratación: ${input.serviceSlug}`);
    }

    const unitAmountEur = parseCatalogUnitAmount(service.price);
    if (!unitAmountEur) {
      throw new Error(`El servicio ${service.name} no tiene un precio unitario válido.`);
    }

    const quantity = input.quantity ?? 1;
    if (!Number.isInteger(quantity)) throw new Error('La cantidad debe ser un número entero.');

    const rule = QUANTITY_RULES[service.slug] ?? { min: 1, max: 1 };
    if (quantity < rule.min || quantity > rule.max) {
      if (rule.min === rule.max) {
        throw new Error(`${service.name} solo admite cantidad ${rule.min}.`);
      }
      throw new Error(`${service.name} admite entre ${rule.min} y ${rule.max} unidades.`);
    }

    return {
      serviceSlug: service.slug,
      stripePriceId: service.stripePriceId,
      description: service.name,
      quantity,
      unitAmountEur,
      taxBehavior: 'exclusive',
      sortOrder: index,
    };
  });
}

export function quoteItemsSubtotal(items: ResolvedQuoteItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.unitAmountEur * item.quantity, 0) * 100) / 100;
}
