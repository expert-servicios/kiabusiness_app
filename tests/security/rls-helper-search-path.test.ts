import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260904084000_harden_rls_helper_search_paths.sql'),
  'utf8',
);

describe('RLS helper search-path hardening', () => {
  it('fixes app helper search paths', () => {
    expect(migration).toContain(
      'alter function app.user_has_company(bigint) set search_path = app, public, pg_temp;',
    );
    expect(migration).toContain(
      'alter function app.can_create_company(uuid) set search_path = app, public, pg_temp;',
    );
  });

  it('fixes public identity helper search paths', () => {
    for (const fn of ['is_admin', 'is_gestor', 'is_admin_or_gestor', 'whoami']) {
      expect(migration).toContain(
        `alter function public.${fn}() set search_path = public, pg_temp;`,
      );
    }
  });

  it('does not change grants, function security mode, policies or data', () => {
    expect(migration).not.toMatch(/\b(grant|revoke)\b/i);
    expect(migration).not.toMatch(/security\s+(definer|invoker)/i);
    expect(migration).not.toMatch(/\b(create|drop|alter)\s+policy\b/i);
    expect(migration).not.toMatch(/\b(insert|update|delete)\s+(into|from|public\.|app\.)/i);
  });
});
