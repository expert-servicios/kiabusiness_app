import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin Correo 360 operational behavior', () => {
  it('syncs Gmail SA, Gmail OAuth and Microsoft inbox reads into email_inbox_cache', () => {
    const route = source('app/api/admin/correo/route.ts');
    expect(route).toContain('syncInboxCache');
    expect(route).toContain(".from('email_inbox_cache').upsert");
    expect(route).toContain('listGmailMailsSA');
    expect(route).toContain('listGmailMails(stored');
    expect(route).toContain('listMails(stored');
  });

  it('keeps threads moved to custom folders out of refreshed live inbox lists', () => {
    const route = source('app/api/admin/correo/route.ts');
    expect(route).toContain('hideMovedInboxItems');
    expect(route).toContain(".from('admin_email_item_state')");
    expect(route).toContain(".eq('source_kind', 'inbox_thread')");
    expect(route).toContain(".not('folder_id', 'is', null)");
    expect(route).toContain('mails: visibleMails');
  });

  it('sends new Microsoft 365 mail instead of returning a false success', () => {
    const integration = source('lib/integrations/microsoft365.ts');
    const route = source('app/api/admin/correo/route.ts');
    expect(integration).toContain('export async function sendNewMail');
    expect(integration).toContain("graphPost(access_token, '/sendMail'");
    expect(integration).toContain('saveToSentItems: true');
    expect(route).toContain('sendNewMail');
    expect(route).toContain("if (prov === 'ms365')");
    expect(route).toContain('await sendNewMail(stored');
  });

  it('moves an inbox thread from the selected conversation and preserves case context', () => {
    const inbox = source('components/admin/CorreoInbox.tsx');
    const cases = source('app/api/admin/cases/route.ts');
    expect(inbox).toContain('Mover a');
    expect(inbox).toContain("action: 'move'");
    expect(inbox).toContain("sourceKind: 'inbox_thread'");
    expect(inbox).toContain('clientId: linkedCase?.client_id');
    expect(inbox).toContain('companyId: linkedCase?.company_id');
    expect(inbox).toContain('caseId: caseId ?? null');
    expect(cases).toContain('client_id,company_id');
  });

  it('restores an item to its system folder by deleting only organizational state', () => {
    const route = source('app/api/admin/correo/folders/route.ts');
    const view = source('components/admin/CorreoFolderView.tsx');
    expect(route).toContain('if (input.folderId === null)');
    expect(route).toContain(".from('admin_email_item_state')");
    expect(route).toContain('.delete()');
    expect(route).not.toContain("from('email_events').delete");
    expect(route).not.toContain("from('email_inbox_cache').delete");
    expect(view).toContain('Volver a Entrantes');
    expect(view).toContain('Volver a Enviados');
  });

  it('validates client/company/case consistency before persisting organization context', () => {
    const route = source('app/api/admin/correo/folders/route.ts');
    expect(route).toContain(".from('cases')");
    expect(route).toContain('El expediente no pertenece al cliente indicado');
    expect(route).toContain('El expediente no pertenece a la entidad indicada');
  });

  it('opens custom-folder content while preserving a route back to Client 360', () => {
    const view = source('components/admin/CorreoFolderView.tsx');
    const page = source('app/(protected)/admin/correo/carpetas/[id]/page.tsx');
    const panel = source('components/admin/CorreoFoldersPanel.tsx');
    expect(view).toContain('action=conversation');
    expect(view).toContain("selected.sourceKind === 'sent_event'");
    expect(view).toContain('srcDoc={selected.html}');
    expect(view).toContain('/admin/clientes/${selected.clientId}');
    expect(page).toContain('CorreoFolderView');
    expect(panel).toContain('/admin/correo/carpetas/');
    expect(panel).toContain('correo-folders-changed');
  });
});
