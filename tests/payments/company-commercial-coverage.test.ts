import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('company commercial coverage', () => {
  const resolver = source('lib/subscriptions/company-commercial-coverage.ts');
  const subscriptionApi = source('app/api/subscriptions/route.ts');
  const checkout = source('app/api/subscriptions/checkout/route.ts');
  const dashboard = source('app/(protected)/dashboard/suscripciones/page.tsx');
  const kia = source('lib/ai/kia/kia-context-builder.ts');

  it('resolves direct and included coverage without creating financial data', () => {
    expect(resolver).toContain("source: direct.status === 'trialing' ? 'trial' : 'direct_subscription'");
    expect(resolver).toContain(".eq('feature_key', 'included_entity')");
    expect(resolver).toContain("source: 'included_entity'");
    expect(resolver).toContain(".in('status', ['active', 'trialing'])");
    expect(resolver).not.toContain('.insert(');
    expect(resolver).not.toContain('.update(');
    expect(resolver).not.toContain('stripe.checkout');
  });

  it('exposes coverage to the active entity and prevents duplicate checkout', () => {
    expect(subscriptionApi).toContain('resolveCompanyCommercialCoverage(admin, user.id, companyId)');
    expect(subscriptionApi).toContain('coverage');
    expect(checkout).toContain("coverage.source === 'included_entity'");
    expect(checkout).toContain("code: 'company_covered'");
  });

  it('shows included coverage in the client dashboard instead of plan cards', () => {
    expect(dashboard).toContain("coverage?.source === 'included_entity'");
    expect(dashboard).toContain('Cobertura activa sin segunda cuota');
    expect(dashboard).toContain('!hasCoverage && company');
  });

  it('makes KIA understand inherited coverage while preserving entity isolation', () => {
    expect(kia).toContain('resolveCompanyCommercialCoverage(admin, clientId, resolvedCompanyId)');
    expect(kia).toContain('hasMonthlyPlan: Boolean(coverage?.covered)');
    expect(kia).toContain('coveragePrimaryCompanyName');
    expect(kia).toContain('loadDocuments(admin, clientId, input.caseId, resolvedCompanyId)');
    expect(kia).toContain('loadCasesForClient(admin, clientId, resolvedCompanyId)');
  });
});
