import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin correo folders', () => {
  it('keeps system folders protected and custom folders mutable', () => {
    const migration = source('supabase/migrations/20260904192500_admin_email_folders.sql');
    expect(migration).toContain("('Entrantes', 'entrantes', 'inbox', true, 10)");
    expect(migration).toContain("('Enviados', 'enviados', 'sent', true, 20)");
    expect(migration).toContain('admin staff update custom email folders');
    expect(migration).toContain('admin staff delete custom email folders');
    expect(migration).toContain('is_system = false');
  });

  it('organizes mail without mutating original source tables', () => {
    const migration = source('supabase/migrations/20260904192500_admin_email_folders.sql');
    expect(migration).toContain('admin_email_item_state');
    expect(migration).not.toContain('alter table public.email_events add');
    expect(migration).not.toContain('alter table public.email_inbox_cache add');
    expect(migration).not.toContain('delete from public.email_events');
  });

  it('supports create rename delete and idempotent move operations', () => {
    const route = source('app/api/admin/correo/folders/route.ts');
    expect(route).toContain("body.action === 'move'");
    expect(route).toContain("onConflict: 'source_kind,provider,source_key'");
    expect(route).toContain('export async function PATCH');
    expect(route).toContain('export async function DELETE');
    expect(route).toContain('Las carpetas del sistema no se pueden eliminar');
    expect(route).toContain('Las carpetas del sistema no se pueden renombrar');
  });

  it('renders the folder manager inside the canonical Admin correo page', () => {
    const page = source('app/(protected)/admin/correo/page.tsx');
    const panel = source('components/admin/CorreoFoldersPanel.tsx');
    expect(page).toContain('CorreoFoldersPanel');
    expect(panel).toContain('/api/admin/correo/folders');
    expect(panel).toContain('Entrantes y Enviados son carpetas del sistema');
  });
});
