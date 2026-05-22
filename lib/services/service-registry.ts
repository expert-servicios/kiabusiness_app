import { services as catalogServices } from '@/lib/utils/catalog';

export interface ServiceRegistryEntry {
  slug        : string;
  name        : string;
  categoria   : string;
  price       : string | undefined;
  stripePriceId: string | undefined;
  hasViability : boolean;
  hasCheckout  : boolean;
}

function buildRegistry(): Map<string, ServiceRegistryEntry> {
  const map = new Map<string, ServiceRegistryEntry>();
  for (const svc of catalogServices) {
    map.set(svc.slug, {
      slug         : svc.slug,
      name         : svc.name,
      categoria    : svc.categoria,
      price        : svc.price,
      stripePriceId: svc.stripePriceId,
      hasViability : Boolean((svc as { viabilityCheck?: unknown }).viabilityCheck),
      hasCheckout  : Boolean(svc.stripePriceId),
    });
  }
  return map;
}

const REGISTRY = buildRegistry();

export function getService(slug: string): ServiceRegistryEntry | null {
  return REGISTRY.get(slug) ?? null;
}

export function getCheckoutableServices(): ServiceRegistryEntry[] {
  return Array.from(REGISTRY.values()).filter((s) => s.hasCheckout);
}

export function getServicesByCategory(categoria: string): ServiceRegistryEntry[] {
  return Array.from(REGISTRY.values()).filter((s) => s.categoria === categoria);
}
