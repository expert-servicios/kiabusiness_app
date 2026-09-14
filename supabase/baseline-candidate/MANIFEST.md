# #143 canonical baseline manifest

Snapshot gate: `20260911174615_client_accounting_records`
Status: candidate / validation only

This manifest is the **authoritative application order** for the portable current-schema baseline. Do not infer execution order from filenames and do not apply every `.sql` file in this directory by glob.

Production migration history remains frozen. This baseline does not authorize `migration repair` or any production DDL/DML.

## Ordered SQL files

1. `10_public_primitives.sql`
2. `11_public_tables_001_040.sql`
3. `12_public_tables_041_080.sql`
4. `13_public_tables_081_120.sql`
5. `14_public_tables_121_155.sql`
6. `15_public_table_20260911174615.sql`
7. `20_public_local_constraints_001_100.sql`
8. `21_public_local_constraints_101_200.sql`
9. `22_public_local_constraints_201_300.sql`
10. `23_public_local_constraints_301_338.sql`
11. `24_public_foreign_keys_001_100.sql`
12. `25_public_foreign_keys_101_200.sql`
13. `26_public_foreign_keys_201_220.sql`
14. `30_public_indexes_001_100.sql`
15. `31_public_indexes_101_200.sql`
16. `32_public_indexes_201_283.sql`
17. `00_app.sql`
18. `05_private.sql`
19. `39_public_function_dependency_prelude.sql`
20. `40_public_functions_portable_001_010.sql`
21. `41_public_functions_portable_011_020.sql`
22. `42_public_functions_portable_021_030.sql`
23. `43_public_functions_portable_031_040.sql`
24. `44_public_functions_portable_041_050.sql`
25. `45_public_functions_portable_051_054.sql`
26. `50_public_rls_enable.sql`
27. `51_public_policies_001_050.sql`
28. `52_public_policies_051_100.sql`
29. `53_public_policies_101_150.sql`
30. `54_public_policies_151_200.sql`
31. `55_public_policies_201_250.sql`
32. `56_public_policies_251_278.sql`
33. `70_public_views.sql`
34. `60_public_triggers_portable.sql`
35. `61_auth_hooks.sql`
36. `80_public_acl.sql`

## Why this order is explicit

Two deterministic dependency errors were caught during the first fresh-build validation:

- foreign keys must be applied only after all referenced PK/UNIQUE constraints exist;
- SQL-language `is_admin_or_gestor()` requires `is_gestor()` at CREATE FUNCTION time.

The manifest encodes those dependencies directly. The views are intentionally applied before public triggers even though their numeric filename prefix is higher; therefore lexical sorting is not a valid execution strategy.

## Intentionally excluded environment-bound objects

These production objects are **not portable baseline objects** and must not be copied with production-specific identity/URL values.

### Public functions

- `handle_new_contact_request()`
- `notify_admin_on_client_upload()`
- `notify_admin_on_new_user()`
- `notify_admin_on_service_request()`

### Public triggers

Two outbound-network triggers whose trigger functions are production-URL-bound are excluded. Their exact production definitions remain documented under `environment-bound/`; they require environment-specific provisioning rather than portable bootstrap DDL.

### App function

- `app.assign_master_admin()` — excluded because its production body contains a fixed environment/user identity.

## Platform-managed extension allowance

- `citext`: expected 1.6 in schema `app`.
- `vector`: production snapshot is 0.8.0; new Supabase Development Branches may preinstall a newer compatible patch/minor such as 0.8.2.

A newer branch `vector` version is accepted only when all application-level dependent contracts still match: vector column type/dimension, IVFFlat index definition and `kia_memories_search` function contract.

No extension upgrade/downgrade in production is authorized by this manifest.

## Acceptance fingerprints from diagnostic fresh build

- public tables: 156
- public columns: 1,743 — `c91d2e3f2172b95dd2f93a7731b6ef44`
- public constraints: 558 — `f429c9a517a354b74c8b29a4dfd650f3`
- public indexes: 477 — `9b9604d2a5d5ffc96349da8bbf035b58`
- portable public function body: 54 — `e81f45509ddd28f3f95eee723aebac6a`
- portable public function attributes: `40066e775fedf02040c4874896eac1fc`
- RLS-enabled public tables: 156
- public policies: 278 — `3de6e9f607acb1e8b50a61b89e6db7f0`
- public views: 2 — `1dc13f4cb8a13019ee2949eaca5a7e65`
- portable public triggers: 41 — `a599b845b238e20df635d089177cbe4a`
- Auth hooks: 2 — `548844f289d5e71eed7face627023a13`
- public API-role ACL rows: 3,007 — `deefc86c499cb8ae1930a3565e627c39`
- app columns: 99 — `73078a53b6d26469a60c8a7547947916`
- app constraints: 19 — `23b4d4ac73c035889fb2cdea79b7146b`
- app indexes: 18 — `aed72537e79beb0e29441787aa9635de`
- app policies: 9 — `8af60c03d71790722f5e505518a26aa1`
- portable app functions: 2 — `efea4d6b20bc37e10b65cd4d49bdd0e8`
- app views: 2 — `8102df0e51cde4546ae5a9b9fc4113b2`
- private functions: 3 — `76d568285d8917431ade456572fa60b9`
- app/private API-role ACL rows: 84 — `3c152df8795880c4fc7b42a0a1d152fc`
- public+app sequences: 7 — `a73e671a768415ba9e86e87c3622c7eb`

## Final validation requirement

Before any production-ledger plan can be approved, a **new disposable Supabase Development Branch** must apply this manifest once from an empty application schema, with no intermediate fixes or ad-hoc DDL, and reproduce the acceptance fingerprints above. Security Advisor must be rerun afterward.
