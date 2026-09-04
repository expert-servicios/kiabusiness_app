import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260904085000_harden_misc_function_search_paths.sql'),
  'utf8',
);
const sqlWithoutComments = migration.replace(/^\s*--.*$/gm, '');

describe('misc function search-path hardening', () => {
  it('includes net for notification triggers', () => {
    for (const fn of [
      'notify_admin_on_new_user',
      'notify_admin_on_service_request',
      'notify_admin_on_client_upload',
    ]) {
      expect(migration).toContain(
        `alter function public.${fn}() set search_path = public, net, pg_temp;`,
      );
    }
  });

  it('fixes accounting and trigger helpers without extension schemas', () => {
    expect(migration).toContain(
      'alter function public.fn_check_asiento_cuadrado() set search_path = public, pg_temp;',
    );
    expect(migration).toContain(
      'alter function public._ensure_updated_trigger(regclass, text) set search_path = public, pg_temp;',
    );
  });

  it('includes extensions for pgvector search', () => {
    expect(migration).toContain(
      'alter function public.kia_memories_search(vector, uuid, uuid, text, double precision, integer)',
    );
    expect(migration).toContain('set search_path = public, extensions, pg_temp;');
  });

  it('does not change grants, security mode, policies, triggers or data', () => {
    expect(sqlWithoutComments).not.toMatch(/\b(grant|revoke)\b/i);
    expect(sqlWithoutComments).not.toMatch(/security\s+(definer|invoker)/i);
    expect(sqlWithoutComments).not.toMatch(/\b(create|drop|alter)\s+policy\b/i);
    expect(sqlWithoutComments).not.toMatch(/\b(create|drop)\s+trigger\b/i);
    expect(sqlWithoutComments).not.toMatch(/\b(insert|update|delete)\s+(into|from|public\.)/i);
  });
});
