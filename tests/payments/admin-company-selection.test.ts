import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const clientsQuick = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/clients-quick/route.ts'), 'utf8');
const modal = fs.readFileSync(path.join(process.cwd(), 'components/admin/NuevaCotizacionModal.tsx'), 'utf8');
const quoteApi = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/quotes/route.ts'), 'utf8');

describe('admin contracting entity selection', () => {
  it('client picker returns only memberships for visible clients', () => {
    expect(clientsQuick).toContain(".in('profile_id', visibleIds)");
    expect(clientsQuick).toContain('companies: companiesByProfile.get(client.id) ?? []');
  });

  it('auto-selects only when there is exactly one company', () => {
    expect(modal).toContain("setSelectedCompanyId(c.companies.length === 1 ? c.companies[0].id : '')");
  });

  it('blocks zero or ambiguous company selection before quote submission', () => {
    expect(modal).toContain('El cliente necesita una entidad fiscal antes de crear el presupuesto.');
    expect(modal).toContain('Selecciona la entidad que contrata este servicio.');
    expect(quoteApi).toContain("(memberships?.length ?? 0) > 1");
    expect(quoteApi).toContain("code: 'company_required'");
  });
});
