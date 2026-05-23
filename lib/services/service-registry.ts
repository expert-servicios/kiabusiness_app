import { services as catalogServices } from '@/lib/utils/catalog';
import { hasSpecificViabilityCheck } from '@/lib/data/viability-checks';
import { hasReadinessCheck } from '@/lib/data/service-readiness-checks';

export type ServiceFlowType =
  | 'viability'            // shows ViabilityButton (juridical/fiscal eligibility check)
  | 'readiness'            // shows ReadinessButton (technical preparation check)
  | 'direct_checkout'      // goes straight to checkout
  | 'quote'                // no checkout, request-a-quote flow
  | 'subscription_readiness'; // monthly plans with readiness check

export interface ServiceRegistryEntry {
  slug          : string;
  name          : string;
  categoria     : string;
  price         : string | undefined;
  stripePriceId : string | undefined;
  hasViability  : boolean;
  hasCheckout   : boolean;
  /** Determined flow type for this service */
  flowType      : ServiceFlowType;
  /** Whether a ReadinessCheck exists for this slug */
  hasReadiness  : boolean;
  /** Slug to use when looking up the ReadinessCheck (defaults to service slug) */
  readinessSlug : string;
  /** True for Holded services that need an active Holded licence */
  requiresHoldedLicense: boolean;
  /** True for Holded API-integration services */
  requiresHoldedApi    : boolean;
  /** True for recurring monthly plan services */
  isSubscription       : boolean;
}

const HOLDED_SLUGS = new Set([
  'holded-pack-starter',
  'holded-migracion-sin-inventario',
  'holded-migracion-con-inventario',
  'holded-modulo-laboral',
  'holded-modulo-formacion',
  'holded-integraciones-api',
]);

const HOLDED_API_SLUGS = new Set(['holded-integraciones-api']);

function resolveFlowType(slug: string, categoria: string): ServiceFlowType {
  if (HOLDED_SLUGS.has(slug) || categoria === 'holded') return 'readiness';
  if (hasSpecificViabilityCheck(slug))                   return 'viability';
  if (hasReadinessCheck(slug))                           return 'readiness';
  return 'direct_checkout';
}

function buildRegistry(): Map<string, ServiceRegistryEntry> {
  const map = new Map<string, ServiceRegistryEntry>();
  for (const svc of catalogServices) {
    const flowType = resolveFlowType(svc.slug, svc.categoria);
    map.set(svc.slug, {
      slug                : svc.slug,
      name                : svc.name,
      categoria           : svc.categoria,
      price               : svc.price,
      stripePriceId       : svc.stripePriceId,
      hasViability        : hasSpecificViabilityCheck(svc.slug),
      hasCheckout         : Boolean(svc.stripePriceId),
      flowType,
      hasReadiness        : hasReadinessCheck(svc.slug),
      readinessSlug       : svc.slug,
      requiresHoldedLicense: HOLDED_SLUGS.has(svc.slug),
      requiresHoldedApi   : HOLDED_API_SLUGS.has(svc.slug),
      isSubscription      : false,
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
