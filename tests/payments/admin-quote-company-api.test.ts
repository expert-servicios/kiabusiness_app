import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/quotes/route.ts'), 'utf8');

describe('admin quote company safety', () => {
  it('never falls back to the client active company', () => {
    expect(source).not.toContain('active_company_id');
    expect(source).toContain("let companyId = parsed.data.companyId ?? null");
  });

  it('requires fiscal readiness of the selected company', () => {
    expect(source).toContain('isCompanyBillingReady(contractingCompany)');
    expect(source).toContain('missingCompanyBillingFields(contractingCompany)');
  });
});
