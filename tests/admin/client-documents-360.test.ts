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
    expect(route).toContain("if (doc.kind === 'internal') return false");
    expect(route).toContain('technicalExcluded');
  });

  it('uses temporary signed urls for stored client files', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    expect(route).toContain(".from('client-documents')");
    expect(route).toContain('createSignedUrl(doc.file_path, 3600)');
    expect(route).not.toContain(".from('documents').delete(");
  });

  it('supports entity and unassigned filters without inferred ownership', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    const page = source('app/(protected)/admin/clientes/[id]/documentos/page.tsx');
    expect(route).toContain("requestedCompany === 'unassigned'");
    expect(route).toContain('Entidad no vinculada a este cliente');
    expect(page).toContain("params.set('companyId', companyFilter)");
    expect(page).toContain('<option value="unassigned">Sin entidad');
  });

  it('enriches email attachments with provenance and a deterministic Correo 360 deep link', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    const page = source('app/(protected)/admin/clientes/[id]/documentos/page.tsx');

    expect(route).toContain(".from('email_attachment_documents')");
    expect(route).toContain('conversation_id,message_id,attachment_id,subject,from_email,message_date');
    expect(route).toContain('providerLabel');
    expect(route).toContain('/admin/correo/hilo?provider=');
    expect(page).toContain('Abrir correo de origen');
    expect(page).toContain('doc.provenance?.subject');
    expect(page).toContain('doc.provenance?.fromEmail');
  });

  it('allows only controlled admin mutations for status, classification, title and case', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    const page = source('app/(protected)/admin/clientes/[id]/documentos/page.tsx');

    expect(route).toContain('export async function PATCH');
    expect(route).toContain("z.enum(['pendiente', 'revisado', 'rechazado'])");
    expect(route).toContain('docType: z.string().trim().min(1).max(80)');
    expect(route).toContain('title: z.string().trim().min(1).max(160)');
    expect(route).toContain('caseId: z.string().uuid().nullable().optional()');
    expect(page).toContain("method: 'PATCH'");
    expect(page).toContain('Guardar cambios');
    expect(page).toContain('Gestionar');
  });

  it('blocks cross-entity case assignment and never changes company automatically', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    expect(route).toContain("code: 'case_company_mismatch'");
    expect(route).toContain('targetCase.company_id !== current.company_id');
    expect(route).toContain('No se cambia la entidad automáticamente.');
    expect(route).not.toContain('updates.company_id');
  });

  it('writes an audit event with previous and next document values', () => {
    const route = source('app/api/admin/clientes/[id]/documents/route.ts');
    expect(route).toContain(".from('audit_logs').insert");
    expect(route).toContain("action: 'document.admin_updated'");
    expect(route).toContain("entity: 'documents'");
    expect(route).toContain('previous: {');
    expect(route).toContain('next: {');
  });

  it('loads document history lazily and scopes audit rows to document, client and company', () => {
    const historyRoute = source('app/api/admin/clientes/[id]/documents/history/route.ts');
    const history = source('app/(protected)/admin/clientes/[id]/documentos/DocumentHistory.tsx');
    const page = source('app/(protected)/admin/clientes/[id]/documentos/page.tsx');

    expect(historyRoute).toContain(".eq('entity', 'documents')");
    expect(historyRoute).toContain(".eq('entity_id', document.id)");
    expect(historyRoute).toContain(".eq('action', 'document.admin_updated')");
    expect(historyRoute).toContain('metadata.client_id === id');
    expect(historyRoute).toContain('metadata.company_id === document.company_id');
    expect(historyRoute).toContain('.limit(50)');
    expect(history).toContain('Historial');
    expect(history).toContain('Todavía no hay cambios administrativos registrados');
    expect(history).toContain('/documents/history?');
    expect(page).toContain('<DocumentHistory clientId={id} documentId={doc.id} />');
  });

  it('shows actor, timestamp and before-to-after field changes in history', () => {
    const historyRoute = source('app/api/admin/clientes/[id]/documents/history/route.ts');
    const history = source('app/(protected)/admin/clientes/[id]/documentos/DocumentHistory.tsx');

    expect(historyRoute).toContain("admin.from('profiles').select('id,full_name,email,role').in('id', actorIds)");
    expect(historyRoute).toContain("const fields = ['state', 'doc_type', 'title', 'case_id'] as const");
    expect(historyRoute).toContain("label = field === 'state' ? 'Estado'");
    expect(history).toContain("new Date(entry.createdAt).toLocaleString('es-ES')");
    expect(history).toContain('{change.before}</span> → {change.after}');
  });

  it('surfaces a documents shortcut from Client 360', () => {
    const shortcut = source('app/(protected)/admin/clientes/[id]/ClientCommunicationsShortcut.tsx');
    expect(shortcut).toContain(`/admin/clientes/${'${clientId}'}/documentos`);
    expect(shortcut).toContain('Documentos');
    expect(shortcut).toContain("pathname.endsWith('/documentos')");
  });
});
