# #143 — Production migration-ledger transition plan

Date: 2026-09-12
Project: `EXPERT` / `ybtpqscmqrrjjmuoryap`
Status: **PLAN ONLY — NOT AUTHORIZED FOR EXECUTION**

## Decision

The target is **not** to fabricate a 1:1 local counterpart for every historical production row.

The verified recovery work has established that the old history contains:

- different-version semantic equivalents;
- remote-only live migrations;
- duplicates;
- opaque Management API rows;
- local-only files whose effects are already present;
- local files that evolved after their original production application;
- legacy/bootstrap objects that were never represented by the tracked Git chain.

Trying to preserve that history as an executable clean bootstrap is both misleading and already proven to fail.

The target architecture is therefore:

1. preserve the old 133-row ledger as forensic evidence and rollback material;
2. replace the active historical chain with a **single current-schema baseline** derived from the already validated 36-file portable manifest;
3. keep production-specific outbound-network objects outside the portable baseline;
4. make every future database change a new forward-only migration after the baseline.

This follows Supabase's documented existing-project workflow: capture current remote schema as a baseline, record it as already applied remotely, and build future migrations on top of it.

## Current `before` state

Read-only production gate on 2026-09-12:

- rows in `supabase_migrations.schema_migrations`: **133**;
- rows with empty `statements`: **0**;
- first version: `20260508082323`;
- last version: `20260911174615`;
- last name: `client_accounting_records`;
- current production application schema matches the validated portable baseline fingerprints recorded in `final-fresh-validation-2026-09-12.md`.

No ledger row has been modified by #143 so far.

## Target `after` state

Proposed baseline version:

- `20260912000000_current_schema_baseline.sql`

Active `supabase/migrations/` after transition:

- the single baseline migration above;
- future forward-only migrations with versions strictly greater than `20260912000000`.

The old historical SQL files must remain preserved for audit/forensics, but **outside** the active `supabase/migrations/` directory so migration tooling does not replay them.

The portable baseline must be generated from the ordered SQL files in `supabase/baseline-candidate/MANIFEST.md`, not by lexical glob order.

## Environment-bound exclusions

The following production objects are intentionally not part of the portable baseline:

- `public.handle_new_contact_request()`;
- `public.notify_admin_on_client_upload()`;
- `public.notify_admin_on_new_user()`;
- `public.notify_admin_on_service_request()`;
- the two outbound-network triggers that depend on those functions;
- `app.assign_master_admin()`.

Reason: the current production definitions contain production-specific identity/URL bindings. A preview branch must not call production Edge Functions merely to achieve catalog parity.

Their current definitions remain preserved under `supabase/baseline-candidate/environment-bound/`.

## Mandatory preflight before any production ledger write

All items must pass. Failure of any item aborts the transition.

1. Production latest migration is still exactly `20260911174615_client_accounting_records`.
2. PR #194 head containing the final validation is unchanged/reviewed.
3. No database migration deployment is running concurrently.
4. Full production schema fingerprint still matches `final-fresh-validation-2026-09-12.md`.
5. Security Advisor has no new baseline-related ERROR/WARN.
6. The generated baseline has been recreated from `MANIFEST.md` and fresh-replayed successfully.
7. `supabase migration list --linked` output has been captured before repair.
8. Full ledger rollback backup has been created and hashed.

## Rollback backup — must preserve `statements`

A timestamp-only list is **not sufficient**. The current 133 rows all contain non-empty `statements`, and Branching can depend on migration SQL.

Before repair, export the exact ledger rows to a secure local file outside Git and calculate its SHA-256.

Recommended operator command pattern:

```bash
pg_dump "$DATABASE_URL" \
  --data-only \
  --table=supabase_migrations.schema_migrations \
  --column-inserts \
  --no-owner \
  --no-privileges \
  > schema_migrations_before_20260912.sql

sha256sum schema_migrations_before_20260912.sql
```

The backup must not be committed before it has been checked for environment-specific values/secrets.

A second independent snapshot should capture version/name/statement-count/hash only for review.

## Baseline generation gate

The deployable baseline is assembled from the 36 files in `MANIFEST.md` in their explicit order.

Required checks before ledger repair:

- fresh replay succeeds from an empty application schema;
- public/app/private/auth-hook fingerprints match production under the documented portable rules;
- environment-bound network objects are absent from the fresh branch;
- Security Advisor reproduces the accepted baseline state;
- no seed/business/financial data is contained in the baseline migration.

## Production history repair — official CLI path

Use the Supabase CLI on a clean, linked checkout. Do not run raw historical DDL against production.

The Supabase CLI documentation states that `migration repair` updates migration tracking only; it does not execute or revert migration SQL.

High-level sequence after all preflight gates pass:

1. Archive the old active migration files outside `supabase/migrations/`.
2. Place only `20260912000000_current_schema_baseline.sql` in the active migrations directory.
3. Run `supabase migration list --linked` and save the output.
4. Mark the 133 old remote versions `reverted` using `supabase migration repair --linked --status reverted ...`.
5. Mark `20260912000000` `applied` using `supabase migration repair --linked --status applied 20260912000000`.
6. Immediately run:
   - `supabase migration list --linked`;
   - `supabase db push --linked --dry-run`.
7. Expected gate:
   - Local and remote show only the baseline as the active starting history;
   - dry-run reports no SQL to apply to production.
8. Re-run the production schema fingerprint and Security Advisor. They must remain unchanged.
9. Create a new disposable Supabase branch and verify that bootstrap no longer ends in `MIGRATIONS_FAILED` and reproduces the portable baseline.
10. Delete the disposable branch immediately after evidence capture.

If the CLI proposes SQL application to production at any point, **abort**. The transition is history-only.

## Verification of the repaired ledger itself

After repair, inspect `supabase_migrations.schema_migrations` directly in read-only mode.

Record:

- row count;
- version/name;
- statement count and statement hash for the baseline row;
- `migration list` output;
- `db push --dry-run` output.

Because CLI versions can differ in how repaired rows populate `statements`, the post-repair Branching test is mandatory. An empty/insufficient baseline tracking row is not accepted merely because `migration list` looks aligned.

## Abort conditions

Abort and restore the previous ledger if any of the following occurs:

- production application schema changes during repair;
- `db push --dry-run` wants to apply baseline DDL to production;
- local/remote versions remain inconsistent;
- the baseline row is not represented in a way Branching can consume;
- a new branch is empty or reaches `MIGRATIONS_FAILED`;
- schema fingerprint differs from the validated contract;
- any new Security Advisor ERROR/WARN attributable to the baseline appears.

## Rollback procedure

Rollback affects **only** migration tracking. Do not replay historical SQL.

1. Stop any deployment/branch creation.
2. Restore the exact 133 original rows from `schema_migrations_before_20260912.sql` inside a controlled transaction/maintenance operation.
3. Remove the new baseline ledger row as part of the same ledger restore.
4. Verify:
   - row count = 133;
   - first/last versions match the `before` state;
   - all saved statement hashes match the backup;
   - production application-schema fingerprint is unchanged.
5. Restore the forensic historical migration files to the previous Git state if the Git transition had already been merged.
6. Keep #143 open and document the failed gate.

The rollback backup must remain available until at least one fresh branch and one subsequent forward migration have succeeded after the transition.

## Connector limitation

The currently available Supabase connector does not expose `supabase migration repair` or `migration squash` as an auditable action. Therefore #143 must **not** substitute a raw `DELETE/INSERT` against `supabase_migrations` merely for convenience.

Execution of the production history transition requires the official Supabase CLI (or a future connector action that exposes the equivalent operation) and a separate explicit approval.

## Approval boundary

This document authorizes **nothing** by itself.

Before the first production ledger mutation, obtain explicit approval covering:

- reverting the 133 historical tracking rows;
- marking the new baseline as applied;
- the rollback procedure above;
- the temporary Development Branch cost for the post-repair Branching verification.
