import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260904083000_harden_timestamp_trigger_search_paths.sql'),
  'utf8',
);

const functions = [
  'kia_reports_set_updated_at',
  'set_email_queue_updated_at',
  'set_fiscal_obligations_updated_at',
  'set_kia_session_updated_at',
  'set_updated_at',
  'set_updated_at_sra',
  'update_admin_users_updated_at',
  'update_companies_updated_at',
  'update_connector_instances_updated_at',
  'update_entitlements_updated_at',
  'update_subscription_trials_updated_at',
  'update_updated_at_column',
];

describe('timestamp trigger search-path hardening', () => {
  it('fixes the search_path for every audited timestamp trigger function', () => {
    for (const fn of functions) {
      expect(migration).toContain(
        `alter function public.${fn}() set search_path = public, pg_temp;`,
      );
    }
  });

  it('does not change grants, policies, triggers or data', () => {
    expect(migration).not.toMatch(/\b(grant|revoke)\b/i);
    expect(migration).not.toMatch(/\b(create|drop)\s+trigger\b/i);
    expect(migration).not.toMatch(/\b(create|drop|alter)\s+policy\b/i);
    expect(migration).not.toMatch(/\b(insert|update|delete)\s+(into|from|public\.)/i);
  });
});
