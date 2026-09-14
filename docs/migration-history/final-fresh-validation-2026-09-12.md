# #143 — Final fresh-build validation (2026-09-12)

## Scope and safety boundary

This document records the final disposable fresh-build validation for GitHub issue #143.

Production project `ybtpqscmqrrjjmuoryap` remained frozen throughout this validation:

- no production DDL or DML;
- no production migration-ledger writes;
- no `migration repair`;
- no branch merge into production;
- no financial-history mutation or deduplication.

The production snapshot gate remained stable at:

- `20260911174615_client_accounting_records`

The validated source is the ordered portable baseline in `supabase/baseline-candidate/MANIFEST.md` on branch `infra/supabase-ledger-recovery-phase1`.

## Final disposable branch

- Supabase branch: `migration-ledger-final-validation2-20260911`
- project ref: `qaydyhwmcpsgigtqujek`
- production data copied: no
- application schema before replay: empty
- manifest migrations applied: **36/36**
- first validation-ledger version: `20260911203050`
- last validation-ledger version: `20260912054438`

Supabase's automatic branch bootstrap still reports `MIGRATIONS_FAILED` against the historical production migration chain. That is the original #143 reproducibility failure and is separate from the manually validated current-schema baseline.

## Defects caught by fresh replay and fixed in Git

The controlled fresh-replay process found three deterministic baseline defects before final acceptance:

1. Foreign keys were originally ordered before all referenced PK/UNIQUE constraints existed.
   - Fixed by applying 338 local PK/UNIQUE/CHECK constraints before 220 FKs.
2. `public.is_admin_or_gestor()` depends on `public.is_gestor()` at `CREATE FUNCTION` time.
   - Fixed with `39_public_function_dependency_prelude.sql`.
3. The first final one-pass attempt stopped at portable triggers because two production trigger functions were absent from the portable function blocks:
   - `public.update_companies_updated_at()`
   - `public.update_connector_instances_updated_at()`
   - Added to `44_public_functions_portable_041_050.sql` in commit `040e136285ea49edeabda9a6e9d4fb15e87c47f8`.

The failed final branch was deleted. The second final branch was created from scratch and completed the full manifest without an intermediate patch.

## Final production ↔ fresh-branch gates

The same catalog serialization was executed on production and the fresh branch for each hard gate.

### `public`

| Contract | Result |
|---|---:|
| Base tables | 156 = 156 |
| Columns | 1,743 = 1,743 |
| Columns hash | `814be97c7cf236a9340b4a024193f7cb` |
| Constraints | 558 = 558 |
| Constraints hash | `f429c9a517a354b74c8b29a4dfd650f3` |
| Indexes | 477 = 477 |
| Index hash | `9b9604d2a5d5ffc96349da8bbf035b58` |
| Portable functions | 54 = 54 |
| Portable function semantic hash | `12c94ccd30a28ba448ffb28ebf0b3d04` |
| RLS-enabled tables | 156 = 156 |
| Policies | 278 = 278 |
| Policy hash | `4024013e9abdd868dde5683ca86f2f6a` |
| Views | 2 = 2 |
| View hash | `1dc13f4cb8a13019ee2949eaca5a7e65` |
| Portable triggers | 41 = 41 |
| Trigger hash | `a362874147aa1bd79b4a0cbfcad47bb4` |
| Auth hooks | 2 = 2 |
| Auth-hook hash | `548844f289d5e71eed7face627023a13` |

Function signatures, language, volatility, `SECURITY DEFINER`, return contract and `search_path` attributes matched function-by-function. PostgreSQL preserves source formatting in `prosrc`; therefore the final semantic function hash normalizes comments, whitespace and keyword case before hashing.

### `app` and `private`

| Contract | Result |
|---|---:|
| `app` tables | 11 = 11 |
| `app` columns | 99 = 99 |
| `app` columns hash | `9bd67d80b61e4d7e25f81fdbebf5dc44` |
| `app` constraints | 19 = 19 |
| `app` constraints hash | `23b4d4ac73c035889fb2cdea79b7146b` |
| `app` indexes | 18 = 18 |
| `app` indexes hash | `aed72537e79beb0e29441787aa9635de` |
| `app` RLS tables | 9 = 9 |
| `app` policies | 9 = 9 |
| `app` policy hash | `9eded84c5be3cad694da9c85ae7a9a5d` |
| `app` views | 2 = 2 |
| `app` views hash | `8102df0e51cde4546ae5a9b9fc4113b2` |
| `app` portable functions, including `citext` extension functions | 49 = 49 |
| `app` function hash | `095a2b412d8f8b4e1742ae7bd250f706` |
| `private` functions | 3 = 3 |
| `private` function hash | `8d943ae078b6dd9a97c9bd083e0a1dc0` |
| `public + app` sequences | 7 = 7 |
| Sequence hash | `0640cdec0328855362f15384ec8a0281` |

`app.assign_master_admin()` remains intentionally excluded because the production body is environment/user-bound.

### API-role ACL

Effective ACL entries for `PUBLIC`, `anon`, `authenticated` and `service_role` were normalized across `public`, `app` and `private`, excluding the documented environment-bound functions.

- ACL rows: **3,091 = 3,091**
- ACL hash: `0dcf70192989d0ce277670a3223b27db`

### Extension allowance

- `citext`: 1.6 on both environments.
- `vector`: production 0.8.0; new Development Branch 0.8.2.

The `vector` version difference is accepted under the documented platform-managed extension allowance because the dependent application contracts reproduce successfully: the `vector(1536)` column, IVFFlat index and `kia_memories_search` contract are included in the matching public column/index/function gates.

## Security Advisor

After the full 36-step DDL replay:

- fresh branch: no ERROR/WARN generated by the portable baseline; 30 INFO `rls_enabled_no_policy` findings;
- production: the same 30 INFO findings on the same `public` tables;
- production additionally has unrelated platform/integration WARNs for `stripe.*` mutable search paths, leaked-password protection configuration and PostgreSQL patch level.

RLS INFO reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

No security change is authorized by #143 merely to eliminate those existing INFO findings.

## Result

**Portable current-schema baseline: PASS.**

A fresh application schema can now be reconstructed in the manifest order and reproduces the portable production contract across structure, functions, RLS, views, triggers, Auth hooks and API-role ACLs.

This validation does **not** by itself authorize mutation of `supabase_migrations.schema_migrations` in production. The production history remains frozen until an explicit ledger-reconciliation/transition plan, rollback procedure and approval are recorded.
