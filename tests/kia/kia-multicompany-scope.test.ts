import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA multi-company isolation', () => {
  it('authorizes a caller-supplied company against profile_companies', () => {
    const route = source('app/api/ai/kia/route.ts');

    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain(".eq('profile_id', user.id)");
    expect(route).toContain(".eq('company_id', resolvedCompanyId)");
    expect(route).toContain("error: companyId ? 'company_forbidden' : 'active_company_invalid'");
  });

  it('keeps the legacy dashboard copilot on a customer-safe tool allowlist', () => {
    const route = source('app/api/ai/kia/route.ts');

    expect(route).toContain('LEGACY_DASHBOARD_SAFE_TOOLS');
    expect(route).toContain('allowedToolNames: [...LEGACY_DASHBOARD_SAFE_TOOLS]');
    expect(route).not.toMatch(/LEGACY_DASHBOARD_SAFE_TOOLS\s*=\s*\[[\s\S]*?'get_accounting_snapshot'/);
    expect(route).not.toMatch(/LEGACY_DASHBOARD_SAFE_TOOLS\s*=\s*\[[\s\S]*?'extract_invoice_ocr'/);
  });

  it('uses the selected or active authorized entity as KIA context', () => {
    const route = source('app/api/ai/kia/route.ts');

    expect(route).toContain('const resolvedCompanyId = companyId ?? profile?.active_company_id ?? undefined;');
    expect(route).toContain('companyId   : resolvedCompanyId');
  });
});
