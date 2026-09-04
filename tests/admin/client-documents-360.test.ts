import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin client documents 360', () => {
  it('retrieves documents only from explicit client, case, company or owner relationships', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    expect(route).toContain(".eq('client_id', id)");
    expect(route).toContain(".in('case_id', caseIds)");
    expect(route).toContain(".in('company_id', companyIds)");
    expect(route).toContain(".eq('owner_type', 'profile').eq('owner_id', id)");
    expect(route).toContain(".eq('owner_type', 'company').in('owner_id', companyIds)");
    expect(route).toContain('allowedCompanyIds.has');
  });

  it('excludes internal technical artifacts from operational client documentation', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    expect(route).toContain("allMatched.filter((doc) => doc.kind === 'internal')");
    expect(route).toContain("allMatched.filter((doc) => doc.kind !== 'internal')");
    expect(route).toContain('technicalExcluded');
  });

  it('uses temporary signed urls and does not mutate document rows', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    expect(route).toContain(".from('client-documents')");
    expect(route).toContain('createSignedUrl(doc.file_path, 3600)');
    expect(route).not.toContain(".from('documents').delete(");
    expect(route).not.toContain(".from('documents').update(");
  });

  it('supports entity and unassigned filters without inferred ownership', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    const page = source('app/(protected)/admin/clientes/[id]/documentos/page.tsx');
    expect(route).toContain("requestedCompany === 'unassigned'");
    expect(route).toContain('Entidad no vinculada a este cliente');
    expect(page).toContain("params.set('companyId', companyFilter)");
    expect(page).toContain('<option value="unassigned">Sin entidad');
  });

  it('surfaces a documents shortcut from Client 360', () => {
    const shortcut = source('app/(protected)/admin/clientes/[id]/ClientCommunicationsShortcut.tsx');
    expect(shortcut).toContain(`/admin/clientes/${'${clientId}'}/documentos`);
    expect(shortcut).toContain('Documentos');
    expect(shortcut).toContain("pathname.endsWith('/documentos')");
  });
});
