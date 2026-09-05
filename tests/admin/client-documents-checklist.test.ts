import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin Documents 360 checklist linking', () => {
  it('uses the case docs_checklist as the requirement source and received_documents_json as the versioned link store', () => {
    const route = source('app/api/admin/clientes/[id]/documents/checklist/route.ts');
    expect(route).toContain('docs_checklist,received_documents_json,updated_at');
    expect(route).toContain('type LinkStore = {');
    expect(route).toContain('version: 1;');
    expect(route).toContain('received_documents_json: nextStore');
  });

  it('only loads documents already linked to an explicit client case', () => {
    const route = source('app/api/admin/clientes/[id]/documents/checklist/route.ts');
    expect(route).toContain(".in('case_id', caseIds)");
    expect(route).toContain(".neq('kind', 'internal')");
    expect(route).toContain('caseRow.client_id !== clientId');
  });

  it('requires document and case to share the same explicit company', () => {
    const route = source('app/api/admin/clientes/[id]/documents/checklist/route.ts');
    expect(route).toContain('doc.company_id !== caseRow.company_id');
    expect(route).toContain("code: 'case_company_mismatch'");
    expect(route).not.toContain('update({ company_id');
  });

  it('never overwrites an unknown historical received-documents format', () => {
    const route = source('app/api/admin/clientes/[id]/documents/checklist/route.ts');
    expect(route).toContain("code: 'unsupported_received_documents_format'");
    expect(route).toContain('requiere revisión manual');
    expect(route).toContain('if (!supported)');
  });

  it('uses optimistic locking to prevent concurrent checklist edits from being lost', () => {
    const route = source('app/api/admin/clientes/[id]/documents/checklist/route.ts');
    expect(route).toContain(".eq('updated_at', caseRow.updated_at)");
    expect(route).toContain("code: 'case_concurrent_update'");
    expect(route).toContain('Actualiza la vista y vuelve a intentarlo.');
  });

  it('audits both linking and unlinking without moving or deleting documents', () => {
    const route = source('app/api/admin/clientes/[id]/documents/checklist/route.ts');
    expect(route).toContain("'case.document_requirement_unlinked'");
    expect(route).toContain("'case.document_requirement_linked'");
    expect(route).toContain(".from('audit_logs').insert");
    expect(route).not.toContain(".from('documents').delete(");
    expect(route).not.toContain(".from('documents').update(");
  });

  it('shows coverage, pending requirements and explicit document-to-requirement controls', () => {
    const page = source('app/(protected)/admin/clientes/[id]/documentos/checklist/page.tsx');
    expect(page).toContain('Checklist documental 360º');
    expect(page).toContain("['Cubiertos', totals.covered]");
    expect(page).toContain("['Pendientes', totals.missing]");
    expect(page).toContain('Sin requisito asignado');
    expect(page).toContain('Vínculo documental guardado.');
  });

  it('surfaces the checklist workspace from the client 360 shortcut', () => {
    const shortcut = source('app/(protected)/admin/clientes/[id]/ClientCommunicationsShortcut.tsx');
    expect(shortcut).toContain(`/admin/clientes/${'${clientId}'}/documentos/checklist`);
    expect(shortcut).toContain("pathname.endsWith('/documentos/checklist')");
    expect(shortcut).toContain('Checklist');
  });
});
