import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260904104500_entity_scope_one_time_orders.sql'), 'utf8');

describe('one-time order migration historical safety', () => {
  it('contains no broad order rewrite statement', () => {
    expect(migration).not.toMatch(/\bupdate\s+public\.orders\b/i);
  });
});
