import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin Correo 360 operational behavior', () => {
  it('syncs live Gmail and Microsoft inbox reads into email_inbox_cache', () => {
    const route = source('app/api/admin/correo/route.ts');
    expect(route).toContain('syncInboxCache');
    expect(route).toContain(".from('email_inbox_cache').upsert");
    expect(route).toContain("provider: Provider");
    expect(route).toContain('listGmailMailsSA');
    expect(route).toContain('listGmailMails(stored');
    expect(route).toContain('listMails(stored');
  });

  it('exposes custom folder items without mutating source emails', () => {
    const route = source('app/api/admin/correo/folders/route.ts');
    expect(route).toContain("searchParams.get('folderId')");
    expect(route).toContain(".from('email_inbox_cache')");
    expect(route).toContain(".from('email_events')");
    expect(route).toContain("sourceKind: state.source_kind");
    expect(route).not.toContain("from('email_events').delete");
    expect(route).not.toContain("from('email_inbox_cache').delete");
  });

  it('provides an in-platform folder view for incoming threads and EXPERT sent HTML', () => {
    const view = source('components/admin/CorreoFolderView.tsx');
    const page = source('app/(protected)/admin/correo/carpetas/[id]/page.tsx');
    const panel = source('components/admin/CorreoFoldersPanel.tsx');
    expect(view).toContain("action=conversation");
    expect(view).toContain('selected.sourceKind === \'sent_event\'');
    expect(view).toContain('srcDoc={selected.html}');
    expect(page).toContain('CorreoFolderView');
    expect(panel).toContain('/admin/correo/carpetas/');
  });
});
