import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260904104500_entity_scope_one_time_orders.sql'), 'utf8');

describe('one-time order entity-scope migration safety', () => {
  it('uses insert-time triggers with fixed search paths', () => {
    expect(migration).toContain('security invoker');
    expect(migration).toContain('set search_path = public, pg_temp');
    expect(migration).toContain('before insert on public.orders');
    expect(migration).toContain('after insert on public.orders');
  });

  it('does not rewrite historical financial rows', () => {
    expect(migration).not.toMatch(/update\s+public\.orders/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.orders/i);
    expect(migration).not.toMatch(/insert\s+into\s+public\.orders/i);
  });
});
