import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260904082000_harden_trigger_function_acl.sql'),
  'utf8',
);

const functions = [
  'delete_user_data',
  'fn_handle_new_user',
  'handle_new_auth_user',
  'handle_new_contact_request',
  'handle_new_user_to_usuarios',
];

describe('SECURITY DEFINER trigger function ACL hardening', () => {
  it('removes direct public, anon and authenticated execution', () => {
    for (const fn of functions) {
      expect(migration).toContain(
        `revoke execute on function public.${fn}() from public, anon, authenticated;`,
      );
    }
  });

  it('retains service-role execution and fixes search paths', () => {
    for (const fn of functions) {
      expect(migration).toContain(`grant execute on function public.${fn}() to service_role;`);
      expect(migration).toMatch(new RegExp(`alter function public\\.${fn}\\(\\) set search_path`));
    }
  });

  it('does not alter tables, policies, triggers or historical data', () => {
    expect(migration).not.toMatch(/\b(delete|insert|update)\s+from\b/i);
    expect(migration).not.toMatch(/\b(drop|create)\s+trigger\b/i);
    expect(migration).not.toMatch(/\b(drop|create|alter)\s+policy\b/i);
  });
});
