import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin client communications company scoping', () => {
  it('attributes communications only from explicit company or case context', () => {
    const route = source('app/api/admin/clientes/[id]/communications/route.ts');
    expect(route).toContain("select('id,company_id,service')");
    expect(route).toContain("metadataString(row.metadata, 'company_id')");
    expect(route).toContain("metadataString(row.metadata, 'case_id')");
    expect(route).toContain('caseCompanyById');
    expect(route).toContain("requestedCompany === 'unassigned'");
    expect(route).toContain('Entidad no vinculada a este cliente');
  });

  it('does not infer company from client email or profile alone', () => {
    const route = source('app/api/admin/clientes/[id]/communications/route.ts');
    expect(route).not.toContain('companyId: profileRes.data');
    expect(route).not.toContain('companyId: id');
    expect(route).toContain("item.companyId = companyId");
  });

  it('exposes all/entity/unassigned filters in the Admin UI', () => {
    const page = source('app/(protected)/admin/clientes/[id]/comunicaciones/page.tsx');
    expect(page).toContain("params.set('companyId', companyFilter)");
    expect(page).toContain('<option value="all">Todas</option>');
    expect(page).toContain('<option value="unassigned">Sin entidad');
    expect(page).toContain("item.companyName ?? 'Sin entidad'");
  });

  it('adds a direct communications shortcut from the client 360 segment', () => {
    const layout = source('app/(protected)/admin/clientes/[id]/layout.tsx');
    const shortcut = source('app/(protected)/admin/clientes/[id]/ClientCommunicationsShortcut.tsx');
    expect(layout).toContain('ClientCommunicationsShortcut');
    expect(shortcut).toContain(`/admin/clientes/${'${clientId}'}/comunicaciones`);
    expect(shortcut).toContain("pathname.endsWith('/comunicaciones')");
  });
});
