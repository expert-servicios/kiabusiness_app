import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const activeDir = resolve(root, 'supabase', 'migrations');
const forensicDir = resolve(root, 'supabase', 'migration-history-archive', 'pre-baseline-20260912');

const expectedActive = [
  '20260912000100_baseline_public_primitives.sql',
  '20260912000200_baseline_public_tables_001_040.sql',
  '20260912000300_baseline_public_tables_041_080.sql',
  '20260912000400_baseline_public_tables_081_120.sql',
  '20260912000500_baseline_public_tables_121_155.sql',
  '20260912000600_baseline_public_table_client_accounting_records.sql',
  '20260912000700_baseline_public_local_constraints_001_100.sql',
  '20260912000800_baseline_public_local_constraints_101_200.sql',
  '20260912000900_baseline_public_local_constraints_201_300.sql',
  '20260912001000_baseline_public_local_constraints_301_338.sql',
  '20260912001100_baseline_public_foreign_keys_001_100.sql',
  '20260912001200_baseline_public_foreign_keys_101_200.sql',
  '20260912001300_baseline_public_foreign_keys_201_220.sql',
  '20260912001400_baseline_public_indexes_001_100.sql',
  '20260912001500_baseline_public_indexes_101_200.sql',
  '20260912001600_baseline_public_indexes_201_283.sql',
  '20260912001700_baseline_app.sql',
  '20260912001800_baseline_private.sql',
  '20260912001900_baseline_public_function_dependency_prelude.sql',
  '20260912002000_baseline_public_functions_001_010.sql',
  '20260912002100_baseline_public_functions_011_020.sql',
  '20260912002200_baseline_public_functions_021_030.sql',
  '20260912002300_baseline_public_functions_031_040.sql',
  '20260912002400_baseline_public_functions_041_050.sql',
  '20260912002500_baseline_public_functions_051_054.sql',
  '20260912002600_baseline_public_rls_enable.sql',
  '20260912002700_baseline_public_policies_001_050.sql',
  '20260912002800_baseline_public_policies_051_100.sql',
  '20260912002900_baseline_public_policies_101_150.sql',
  '20260912003000_baseline_public_policies_151_200.sql',
  '20260912003100_baseline_public_policies_201_250.sql',
  '20260912003200_baseline_public_policies_251_278.sql',
  '20260912003300_baseline_public_views.sql',
  '20260912003400_baseline_public_triggers_portable.sql',
  '20260912003500_baseline_auth_hooks.sql',
  '20260912003600_baseline_public_acl.sql',
];

describe('Supabase active migration baseline layout', () => {
  it('contains exactly the 36 validated baseline migrations in version order', () => {
    const actual = readdirSync(activeDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    expect(actual).toEqual(expectedActive);
    expect(actual).toHaveLength(36);
  });

  it('keeps historical SQL outside the active Supabase migration path', () => {
    expect(existsSync(forensicDir)).toBe(true);
    expect(existsSync(resolve(forensicDir, '20260905111000_client360_fiscal_obligations.sql'))).toBe(true);
    expect(existsSync(resolve(activeDir, '20260905111000_client360_fiscal_obligations.sql'))).toBe(false);
  });

  it('keeps all future baseline versions strictly after the former production tip', () => {
    const formerProductionTip = '20260911174615';
    for (const filename of expectedActive) {
      expect(filename.slice(0, 14) > formerProductionTip).toBe(true);
    }
  });
});
