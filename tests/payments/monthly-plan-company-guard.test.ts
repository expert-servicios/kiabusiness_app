import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const guard = fs.readFileSync(path.join(process.cwd(), 'lib/checkout/plan-mensual-guard.ts'), 'utf8');

describe('monthly plan company guard', () => {
  it('checks profile identity separately from company fiscal readiness', () => {
    expect(guard).toContain(".select('profile_completed, active_company_id')");
    expect(guard).not.toContain('billing_ready');
    expect(guard).toContain('isCompanyBillingReady(company)');
  });

  it('sends incomplete fiscal data to the company page', () => {
    expect(guard).toContain("billing_incomplete: '/dashboard/empresa'");
  });
});
