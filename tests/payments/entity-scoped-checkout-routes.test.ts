import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const subscription = fs.readFileSync(path.join(process.cwd(), 'app/api/subscriptions/checkout/route.ts'), 'utf8');
const service = fs.readFileSync(path.join(process.cwd(), 'app/api/services/checkout/route.ts'), 'utf8');

describe('entity-scoped checkout route blockers', () => {
  it('subscription checkout distinguishes missing, forbidden and incomplete companies', () => {
    expect(subscription).toContain("code: 'company_required'");
    expect(subscription).toContain("code: 'company_forbidden'");
    expect(subscription).toContain("code: 'billing_required'");
    expect(subscription).toContain('missingCompanyBillingFields(company)');
  });

  it('one-time checkout applies the same company blockers', () => {
    expect(service).toContain("code: 'company_required'");
    expect(service).toContain("code: 'company_forbidden'");
    expect(service).toContain("code: 'billing_required'");
    expect(service).toContain('missingCompanyBillingFields(company)');
  });
});
