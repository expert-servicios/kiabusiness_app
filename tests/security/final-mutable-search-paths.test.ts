import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260904090000_harden_final_mutable_search_paths.sql'),
  'utf8',
);
const sqlWithoutComments = migration.replace(/^\s*--.*$/gm, '');

describe('final mutable search-path hardening', () => {
  it('fixes the legacy app trigger function search path', () => {
    expect(migration).toContain(
      'alter function app.assign_master_admin() set search_path = app, public, pg_temp;',
    );
  });

  it('fixes public SECURITY DEFINER helper search paths', () => {
    expect(migration).toContain(
      'alter function public.increment_helpful_count(uuid) set search_path = public, pg_temp;',
    );
    expect(migration).toContain(
      'alter function public.is_admin_email() set search_path = public, pg_temp;',
    );
    expect(migration).toContain(
      'alter function public.is_admin_user() set search_path = public, pg_temp;',
    );
  });

  it('does not change grants, security mode, policies, triggers or data', () => {
    expect(sqlWithoutComments).not.toMatch(/\b(grant|revoke)\b/i);
    expect(sqlWithoutComments).not.toMatch(/security\s+(definer|invoker)/i);
    expect(sqlWithoutComments).not.toMatch(/\b(create|drop|alter)\s+policy\b/i);
    expect(sqlWithoutComments).not.toMatch(/\b(create|drop)\s+trigger\b/i);
    expect(sqlWithoutComments).not.toMatch(/\b(insert|update|delete)\s+(into|from|public\.|app\.)/i);
  });
});
