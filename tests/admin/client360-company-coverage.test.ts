import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Client 360 company coverage', () => {
  const api = source('app/api/admin/clientes/[id]/route.ts');
  const contextBar = source('app/(protected)/admin/clientes/[id]/Client360ContextBar.tsx');

  it('resolves commercial coverage for every entity owned by the client', () => {
    expect(api).toContain('resolveCompanyCommercialCoverage');
    expect(api).toContain('Promise.all(companyIds.map((companyId) => resolveCompanyCommercialCoverage(admin, id, companyId)))');
    expect(api).toContain('commercialCoverageByCompany');
  });

  it('shows coverage for the active entity rather than any active subscription on the user', () => {
    expect(contextBar).toContain('commercialCoverageByCompany');
    expect(contextBar).toContain('data?.commercialCoverageByCompany?.[activeCompany.id]');
    expect(contextBar).toContain('sub.company_id === activeCompany.id');
    expect(contextBar).toContain("activeCoverage?.source === 'included_entity'");
    expect(contextBar).toContain('Entidad incluida');
    expect(contextBar).toContain('Contratante:');
  });

  it('keeps entity operational context scoped in the 360 bar', () => {
    expect(contextBar).toContain('session.company_id === activeCompany.id');
    expect(contextBar).toContain('integration.company_id === activeCompany.id');
    expect(contextBar).toContain('item.company_id === activeCompany.id');
  });
});
