import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type CompanyCoverageSource = 'direct_subscription' | 'trial' | 'included_entity' | 'none';

export interface CompanyCommercialCoverage {
  covered: boolean;
  source: CompanyCoverageSource;
  companyId: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  planName: string | null;
  primaryCompanyId: string | null;
  primaryCompanyName: string | null;
  coverageScope: string | null;
  entitlementId: string | null;
  validFrom: string | null;
  validUntil: string | null;
  excludedServices: string[];
}

const NO_COVERAGE = (companyId: string): CompanyCommercialCoverage => ({
  covered: false,
  source: 'none',
  companyId,
  subscriptionId: null,
  subscriptionStatus: null,
  planName: null,
  primaryCompanyId: null,
  primaryCompanyName: null,
  coverageScope: null,
  entitlementId: null,
  validFrom: null,
  validUntil: null,
  excludedServices: [],
});

function isWindowActive(validFrom: string | null, validUntil: string | null, now: Date): boolean {
  const nowMs = now.getTime();
  const fromMs = validFrom ? new Date(validFrom).getTime() : Number.NEGATIVE_INFINITY;
  const untilMs = validUntil ? new Date(validUntil).getTime() : Number.POSITIVE_INFINITY;
  if (Number.isNaN(fromMs) || Number.isNaN(untilMs)) return false;
  return fromMs <= nowMs && nowMs <= untilMs;
}

/**
 * Canonical commercial coverage for one fiscal entity.
 *
 * Coverage can come from:
 * - a direct active/trialing subscription for the entity; or
 * - an active `included_entity` entitlement backed by another active/trialing
 *   subscription owned by the same client.
 *
 * This resolver never creates, mutates or repairs Stripe/financial data.
 */
export async function resolveCompanyCommercialCoverage(
  admin: AdminClient,
  clientId: string,
  companyId: string,
  now = new Date(),
): Promise<CompanyCommercialCoverage> {
  const { data: directSubscriptions, error: directError } = await admin
    .from('subscriptions')
    .select('id,company_id,plan_name,status,created_at')
    .eq('client_id', clientId)
    .eq('company_id', companyId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (directError) throw directError;

  const direct = directSubscriptions?.[0];
  if (direct) {
    return {
      covered: true,
      source: direct.status === 'trialing' ? 'trial' : 'direct_subscription',
      companyId,
      subscriptionId: direct.id,
      subscriptionStatus: direct.status,
      planName: direct.plan_name ?? null,
      primaryCompanyId: companyId,
      primaryCompanyName: null,
      coverageScope: 'subscription_fee',
      entitlementId: null,
      validFrom: null,
      validUntil: null,
      excludedServices: [],
    };
  }

  const { data: entitlements, error: entitlementError } = await admin
    .from('subscription_entitlements')
    .select('id,subscription_id,primary_company_id,beneficiary_company_id,coverage_scope,excluded_services,valid_from,valid_until,active,created_at')
    .eq('client_id', clientId)
    .eq('beneficiary_company_id', companyId)
    .eq('feature_key', 'included_entity')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (entitlementError) throw entitlementError;

  const candidates = (entitlements ?? []).filter((row) =>
    Boolean(row.subscription_id && row.primary_company_id)
      && row.beneficiary_company_id === companyId
      && isWindowActive(row.valid_from ?? null, row.valid_until ?? null, now)
  );

  if (!candidates.length) return NO_COVERAGE(companyId);

  const subscriptionIds = [...new Set(candidates.map((row) => row.subscription_id).filter((id): id is string => Boolean(id)))];
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from('subscriptions')
    .select('id,client_id,company_id,plan_name,status')
    .eq('client_id', clientId)
    .in('id', subscriptionIds)
    .in('status', ['active', 'trialing']);

  if (subscriptionsError) throw subscriptionsError;

  const byId = new Map((subscriptions ?? []).map((row) => [row.id, row]));
  const matched = candidates.find((entitlement) => {
    const subscription = entitlement.subscription_id ? byId.get(entitlement.subscription_id) : null;
    return Boolean(subscription && subscription.company_id === entitlement.primary_company_id);
  });

  if (!matched?.subscription_id || !matched.primary_company_id) return NO_COVERAGE(companyId);
  const sourceSubscription = byId.get(matched.subscription_id);
  if (!sourceSubscription) return NO_COVERAGE(companyId);

  const { data: primaryCompany } = await admin
    .from('companies')
    .select('id,razon_social,nombre_comercial')
    .eq('id', matched.primary_company_id)
    .maybeSingle();

  return {
    covered: true,
    source: 'included_entity',
    companyId,
    subscriptionId: sourceSubscription.id,
    subscriptionStatus: sourceSubscription.status,
    planName: sourceSubscription.plan_name ?? null,
    primaryCompanyId: matched.primary_company_id,
    primaryCompanyName: primaryCompany?.nombre_comercial || primaryCompany?.razon_social || null,
    coverageScope: matched.coverage_scope ?? 'recurring_management',
    entitlementId: matched.id,
    validFrom: matched.valid_from ?? null,
    validUntil: matched.valid_until ?? null,
    excludedServices: Array.isArray(matched.excluded_services) ? matched.excluded_services : [],
  };
}
