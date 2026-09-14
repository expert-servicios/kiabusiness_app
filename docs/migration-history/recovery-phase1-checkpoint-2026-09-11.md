# Supabase migration-ledger recovery — checkpoint 2026-09-11

Tracking: #143
Production project: `ybtpqscmqrrjjmuoryap`
Recovery PR: #194 (`infra/supabase-ledger-recovery-phase1`)

## Safety boundary

Production remained read-only throughout this checkpoint. No production DDL, DML, migration-history repair, direct ledger edit, branch merge or historical financial-record mutation was performed.

`supabase/config.toml` still has `schema_paths = []`. Everything under `supabase/baseline-candidate/` remains inert candidate material and is not part of deployment or `db diff` yet.

## Portable `app` baseline

The disposable diagnostic branch was rebuilt to the production `app` contract and reached exact semantic parity for the portable surface:

- 16 relations;
- 80 columns;
- 19 constraints;
- 18 indexes;
- 9 RLS-enabled tables;
- 9 policies;
- 2 views;
- `citext` 1.6 in schema `app`;
- exact relation/function/schema ACLs for the portable objects.

`app.assign_master_admin()` remains intentionally excluded from the portable baseline because it embeds an environment-specific UUID and has no active trigger dependency in the inspected production state.

Security Advisor on the diagnostic branch no longer has the three earlier extra `app.*` INFO findings; it now matches the 30 existing production `public.*` `rls_enabled_no_policy` INFO findings for the reconstructed scope.

## Cross-schema auth hooks

Production has exactly two custom triggers on `auth.users` that call EXPERT functions:

- `on_auth_user_created` -> `public.handle_new_user()`;
- `trg_handle_new_user` -> `public.fn_handle_new_user()`.

The diagnostic branch originally reproduced only the first. The second was added there for parity. No other custom triggers from managed schemas to `public`/`app` functions were found.

These auth hooks must be represented explicitly in the final operational bootstrap layer rather than hidden inside the declarative `public`/`app` schema baseline.

## Candidate current-schema baseline added to PR #194

The following inert candidate files now exist:

- `00_app.sql`
- `10_public_primitives.sql`
- `11_public_tables_001_040.sql`
- `12_public_tables_041_080.sql`
- `13_public_tables_081_120.sql`
- `14_public_tables_121_155.sql`
- `15_public_table_20260911174615.sql`
- `20_public_constraints_001_100.sql`
- `21_public_constraints_101_200.sql`
- `22_public_constraints_201_300.sql`
- `23_public_constraints_301_400.sql`
- `24_public_constraints_401_500.sql`
- `25_public_constraints_501_553.sql`
- `26_public_constraints_20260911174615.sql`
- `30_public_indexes_001_100.sql`
- `31_public_indexes_101_200.sql`
- `32_public_indexes_201_283.sql`
- `verify_semantic_fingerprint.sql`

A transcription error in the generated expression for `public.invoice_lines.total_line` was detected before validation and corrected in Git. Final fresh-branch validation remains mandatory.

## Concurrent production migration detected safely

While extracting the candidate baseline, the production catalog changed. Extraction was stopped immediately instead of mixing two snapshots.

The new production migration is:

- version: `20260911174615`
- name: `client_accounting_records`

It added:

- `public.client_accounting_records`;
- 11 columns;
- 5 constraints;
- 2 secondary indexes;
- RLS;
- 2 policies.

This exactly explained the observed constraint-count increase from 553 to 558.

The production migration was not present on `main` at the time of inspection. Its exact remote ledger statement was recovered into the recovery branch as:

`supabase/migrations/20260911174615_client_accounting_records.sql`

This is a Git-history recovery artifact. It does not authorize re-running that migration against production.

The candidate baseline was updated using an explicit delta file instead of silently renumbering the already extracted pre-change snapshot.

## Snapshot gate

From this point onward, catalog extraction is gated by the latest production migration version. The current gate is:

`20260911174615_client_accounting_records`

If the latest migration changes during extraction, the operation must stop, identify the delta, and rebase the candidate snapshot deliberately.

## Current structural baseline counts

At snapshot gate `20260911174615`:

- public tables: 156;
- public constraints: 558;
- secondary indexes not backing PK/UNIQUE/EXCLUDE constraints: 283.

The 553 pre-change constraints remain valid and are preserved in their existing candidate blocks; the five concurrent constraints are isolated in `26_public_constraints_20260911174615.sql`.

## Next gates

1. Capture current public functions as a portable function layer, separating executable contract from source-format noise.
2. Capture RLS flags and 278 expected current policies (verify exact count at the snapshot gate; do not assume).
3. Capture the 43 public triggers plus the two managed-schema auth hooks.
4. Capture the two public views and exact ACL/grant layer.
5. Run static candidate checks and verify snapshot version has not moved.
6. Create a brand-new disposable Development Branch and apply only the normalized Git/baseline bootstrap path — no `probe_*` history.
7. Compare semantic fingerprints with production.
8. Only after fresh-build parity prepare the production ledger before/after repair manifest and rollback plan.
9. Require explicit approval before any production ledger mutation.

## Current conclusion

The recovery has progressed from forensic diagnosis to a versioned, catalog-derived candidate current-schema baseline. The concurrent migration was detected rather than accidentally folded into a mixed snapshot, and has been recovered explicitly as a remote-only Git history entry plus a baseline delta. Production remains untouched.
