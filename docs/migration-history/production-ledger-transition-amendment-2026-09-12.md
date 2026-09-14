# #143 — Production ledger transition amendment

Date: 2026-09-12
Project: `EXPERT` / `ybtpqscmqrrjjmuoryap`
Status: approved strategy refinement; production ledger still unchanged at time of writing.

## Why the target changes from one concatenated file to 36 baseline migrations

The final clean validation did not execute one monolithic SQL file. It executed the 36 ordered SQL units in `supabase/baseline-candidate/MANIFEST.md`, and that exact sequence reproduced the portable production contract.

Keeping those same 36 units as active migrations is safer than concatenating them because:

1. it preserves the exact dependency order already proven on a fresh Supabase project;
2. each migration remains small enough to diagnose independently;
3. Supabase CLI can record the parsed `statements` array for each file when the version is marked applied;
4. Branching can replay the same migration sequence from Git instead of depending on a newly assembled monolith;
5. rollback/reconciliation can identify an exact failed baseline step.

This does not change the application-schema target or the fresh-build evidence.

## New baseline stack versions

The active baseline stack will use these synthetic versions, strictly in the manifest order:

1. `20260912000100_baseline_public_primitives.sql` ← `10_public_primitives.sql`
2. `20260912000200_baseline_public_tables_001_040.sql` ← `11_public_tables_001_040.sql`
3. `20260912000300_baseline_public_tables_041_080.sql` ← `12_public_tables_041_080.sql`
4. `20260912000400_baseline_public_tables_081_120.sql` ← `13_public_tables_081_120.sql`
5. `20260912000500_baseline_public_tables_121_155.sql` ← `14_public_tables_121_155.sql`
6. `20260912000600_baseline_public_table_client_accounting_records.sql` ← `15_public_table_20260911174615.sql`
7. `20260912000700_baseline_public_local_constraints_001_100.sql` ← `20_public_local_constraints_001_100.sql`
8. `20260912000800_baseline_public_local_constraints_101_200.sql` ← `21_public_local_constraints_101_200.sql`
9. `20260912000900_baseline_public_local_constraints_201_300.sql` ← `22_public_local_constraints_201_300.sql`
10. `20260912001000_baseline_public_local_constraints_301_338.sql` ← `23_public_local_constraints_301_338.sql`
11. `20260912001100_baseline_public_foreign_keys_001_100.sql` ← `24_public_foreign_keys_001_100.sql`
12. `20260912001200_baseline_public_foreign_keys_101_200.sql` ← `25_public_foreign_keys_101_200.sql`
13. `20260912001300_baseline_public_foreign_keys_201_220.sql` ← `26_public_foreign_keys_201_220.sql`
14. `20260912001400_baseline_public_indexes_001_100.sql` ← `30_public_indexes_001_100.sql`
15. `20260912001500_baseline_public_indexes_101_200.sql` ← `31_public_indexes_101_200.sql`
16. `20260912001600_baseline_public_indexes_201_283.sql` ← `32_public_indexes_201_283.sql`
17. `20260912001700_baseline_app.sql` ← `00_app.sql`
18. `20260912001800_baseline_private.sql` ← `05_private.sql`
19. `20260912001900_baseline_public_function_dependency_prelude.sql` ← `39_public_function_dependency_prelude.sql`
20. `20260912002000_baseline_public_functions_001_010.sql` ← `40_public_functions_portable_001_010.sql`
21. `20260912002100_baseline_public_functions_011_020.sql` ← `41_public_functions_portable_011_020.sql`
22. `20260912002200_baseline_public_functions_021_030.sql` ← `42_public_functions_portable_021_030.sql`
23. `20260912002300_baseline_public_functions_031_040.sql` ← `43_public_functions_portable_031_040.sql`
24. `20260912002400_baseline_public_functions_041_050.sql` ← `44_public_functions_portable_041_050.sql`
25. `20260912002500_baseline_public_functions_051_054.sql` ← `45_public_functions_portable_051_054.sql`
26. `20260912002600_baseline_public_rls_enable.sql` ← `50_public_rls_enable.sql`
27. `20260912002700_baseline_public_policies_001_050.sql` ← `51_public_policies_001_050.sql`
28. `20260912002800_baseline_public_policies_051_100.sql` ← `52_public_policies_051_100.sql`
29. `20260912002900_baseline_public_policies_101_150.sql` ← `53_public_policies_101_150.sql`
30. `20260912003000_baseline_public_policies_151_200.sql` ← `54_public_policies_151_200.sql`
31. `20260912003100_baseline_public_policies_201_250.sql` ← `55_public_policies_201_250.sql`
32. `20260912003200_baseline_public_policies_251_278.sql` ← `56_public_policies_251_278.sql`
33. `20260912003300_baseline_public_views.sql` ← `70_public_views.sql`
34. `20260912003400_baseline_public_triggers_portable.sql` ← `60_public_triggers_portable.sql`
35. `20260912003500_baseline_auth_hooks.sql` ← `61_auth_hooks.sql`
36. `20260912003600_baseline_public_acl.sql` ← `80_public_acl.sql`

All future migrations must have a version greater than `20260912003600`.

## Historical preservation

The pre-baseline migration chain remains preserved in the frozen forensic branch:

- `archive/migrations-pre-baseline-20260908`

The recovery branch can therefore replace the active `supabase/migrations/` subtree without destroying historical evidence.

## Revised ledger after-state

After the approved history-only repair:

- the 133 historical remote versions are marked `reverted`;
- the 36 baseline-stack versions above are marked `applied` from the corresponding local files;
- no baseline SQL is executed against production;
- `supabase migration list --linked` must show all 36 Local/Remote versions aligned;
- `supabase db push --linked --dry-run` must report the linked database up to date;
- application-schema fingerprints must remain unchanged;
- a newly created preview branch must replay the 36-file stack successfully.

## Backup remains mandatory

Before the first remote-history mutation, preserve the complete existing 133-row `supabase_migrations.schema_migrations` dataset including `version`, `name` and `statements`, plus a SHA-256 checksum. A timestamp-only backup is not sufficient.

## Execution-channel rule

Preferred: official Supabase CLI `migration repair` because it updates tracking only and populates migration metadata from the local migration files.

The connected Supabase tool in this chat does not expose `migration repair`. Raw `DELETE/INSERT` against `supabase_migrations.schema_migrations` remains prohibited unless a separate connector-native rollback design is explicitly documented first.

## Approval

The user explicitly authorized continuing the migration recovery on 2026-09-12 after the full transition plan and fresh-build evidence were documented. This amendment narrows the implementation to the already validated 36-file execution units and does not expand the scope of production data/schema changes.