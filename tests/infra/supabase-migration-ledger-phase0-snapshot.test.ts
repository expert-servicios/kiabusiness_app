import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type LedgerRow = {
  version: string;
  name: string;
  statement_count: number;
  statements_md5: string;
};

function json<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;
}

function collectSqlReferences(value: unknown): string[] {
  if (typeof value === 'string') return value.endsWith('.sql') ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectSqlReferences);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(collectSqlReferences);
  }
  return [];
}

describe('Supabase migration ledger Phase 0 evidence', () => {
  it('freezes the complete read-only production ledger metadata snapshot', () => {
    const snapshot = json<{
      project_id: string;
      captured_at: string;
      row_count: number;
      ledger: LedgerRow[];
    }>('docs/migration-history/remote-ledger-2026-09-08.json');

    expect(snapshot.project_id).toBe('ybtpqscmqrrjjmuoryap');
    expect(snapshot.captured_at).toBe('2026-09-08');
    expect(snapshot.row_count).toBe(132);
    expect(snapshot.ledger).toHaveLength(snapshot.row_count);
    expect(snapshot.ledger[0]?.version).toBe('20260508082323');
    expect(snapshot.ledger.at(-1)?.version).toBe('20260907184513');

    const versions = snapshot.ledger.map((row) => row.version);
    expect(versions).toEqual([...versions].sort());
    expect(new Set(versions).size).toBe(versions.length);

    for (const row of snapshot.ledger) {
      expect(row.version).toMatch(/^\d{14}$/);
      expect(row.name.length).toBeGreaterThan(0);
      expect(row.statement_count).toBeGreaterThanOrEqual(0);
      expect(row.statements_md5).toMatch(/^[a-f0-9]{32}$/);
      expect(row).not.toHaveProperty('statements');
      expect(row).not.toHaveProperty('rollback');
      expect(row).not.toHaveProperty('created_by');
    }
  });

  it('keeps the classification manifest read-only and blocks implicit history replay', () => {
    const manifest = json<{
      phase: string;
      database_writes: boolean;
      ddl_action: string;
      history_repair_policy: {
        direct_schema_migrations_edits: boolean;
        replay_historical_sql: boolean;
        requires_explicit_checkpoint_before_production_repair: boolean;
      };
      remote_only_live: unknown[];
      remote_duplicates: unknown[];
      local_version_collisions: unknown[];
    }>('docs/migration-history/remote-local-classification-2026-09-08.json');

    expect(manifest.phase).toBe('phase_0_read_only');
    expect(manifest.database_writes).toBe(false);
    expect(manifest.ddl_action).toBe('none');
    expect(manifest.history_repair_policy.direct_schema_migrations_edits).toBe(false);
    expect(manifest.history_repair_policy.replay_historical_sql).toBe(false);
    expect(manifest.history_repair_policy.requires_explicit_checkpoint_before_production_repair).toBe(true);
    expect(manifest.remote_only_live.length).toBeGreaterThan(0);
    expect(manifest.remote_duplicates.length).toBeGreaterThan(0);
    expect(manifest.local_version_collisions.length).toBeGreaterThan(0);

    const referencedSql = [...new Set(collectSqlReferences(manifest))];
    expect(referencedSql.length).toBeGreaterThan(0);
    for (const filename of referencedSql) {
      expect(existsSync(resolve(process.cwd(), 'supabase', 'migrations', filename)), filename).toBe(true);
    }
  });

  it('records a data-free public-schema fingerprint for later parity checks', () => {
    const fingerprint = json<{
      schema: string;
      warning: string;
      relations: { count: number; md5: string };
      columns: { count: number; md5: string };
      policies: { count: number; md5: string };
    }>('docs/migration-history/production-public-schema-fingerprint-2026-09-08.json');

    expect(fingerprint.schema).toBe('public');
    expect(fingerprint.warning).toContain('not a substitute');
    expect(fingerprint.relations.count).toBeGreaterThan(0);
    expect(fingerprint.columns.count).toBeGreaterThan(0);
    expect(fingerprint.policies.count).toBeGreaterThan(0);
    expect(fingerprint.relations.md5).toMatch(/^[a-f0-9]{32}$/);
    expect(fingerprint.columns.md5).toMatch(/^[a-f0-9]{32}$/);
    expect(fingerprint.policies.md5).toMatch(/^[a-f0-9]{32}$/);
  });
});
