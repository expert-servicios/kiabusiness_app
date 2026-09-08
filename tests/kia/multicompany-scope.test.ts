import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA multi-company scope', () => {
  it('authorizes an explicit company against profile_companies before using admin context', () => {
    const route = source('app/api/ai/kia/route.ts');
    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain(".eq('profile_id', user.id)");
    expect(route).toContain(".eq('company_id', resolvedCompanyId)");
    expect(route).toContain("error: companyId ? 'company_forbidden' : 'active_company_invalid'");
  });

  it('keeps the legacy dashboard endpoint on a customer-safe tool allowlist', () => {
    const route = source('app/api/ai/kia/route.ts');
    expect(route).toContain('LEGACY_DASHBOARD_SAFE_TOOLS');
    expect(route).toContain('allowedToolNames: [...LEGACY_DASHBOARD_SAFE_TOOLS]');
    expect(route).not.toMatch(/LEGACY_DASHBOARD_SAFE_TOOLS[\s\S]*?'get_accounting_snapshot'/);
  });

  it('reuses one authorized company for coverage, company and accounting context', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain('resolveAuthorizedCompanyId(admin, input.companyId, clientId)');
    expect(context).toContain(".from('profile_companies')");
    expect(context).toContain(".eq('profile_id', clientId)");
    expect(context).toContain(".eq('company_id', companyId)");
    expect(context).toContain('loadCompany(admin, clientId, resolvedCompanyId)');
    expect(context).toContain('resolveCompanyCommercialCoverage(admin, clientId, resolvedCompanyId)');
    expect(context).toContain('loadAccounting(admin, resolvedCompanyId)');
  });

  it('scopes documents and cases to the authorized company when one is active', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    expect(context).toContain('loadDocuments(admin, clientId, input.caseId, resolvedCompanyId)');
    expect(context).toContain('loadCasesForClient(admin, clientId, resolvedCompanyId)');
    expect(context).toContain("if (companyId) query = query.eq('company_id', companyId)");
  });
});
