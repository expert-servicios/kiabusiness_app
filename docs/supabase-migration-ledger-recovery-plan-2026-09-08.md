# Supabase migration ledger recovery plan — 2026-09-08

Status: **proposal / no production changes performed**

Related issues: #143, #147, #149

Production project: `EXPERT` (`ybtpqscmqrrjjmuoryap`)

## 1. Why this plan exists

The GitHub ↔ Supabase migration check is red because the timestamp set in `supabase/migrations` does not match `supabase_migrations.schema_migrations` in production.

The read-only audit of May–September 2026 proved that this is not a simple filename problem. The history contains all of the following:

- a real pre-ledger bootstrap;
- local migrations applied later under generated remote timestamps;
- local migrations never applied when their filename suggests;
- remote-only migrations that are still live in the current schema;
- schema changes applied outside the normal migration ledger;
- exact duplicate remote applications;
- local duplicate timestamp prefixes;
- local files edited/hardened after their original application;
- `CREATE TABLE IF NOT EXISTS` migrations whose intended definition differed from the already-existing table and was therefore partly a no-op;
- Management API migrations whose remote `statements` field is only an opaque marker rather than the SQL that was executed.

Therefore **do not repair this by blindly renaming files or replaying historical SQL**.

## 2. Safety invariants

The recovery must preserve all of these invariants:

1. No historical financial rows are deleted, merged, rewritten or automatically reconciled.
2. No historical migration DDL is replayed against production merely to satisfy the ledger.
3. No direct UPDATE/DELETE/INSERT is performed on `supabase_migrations.schema_migrations`.
4. If migration history must change, use the supported Supabase migration-history mechanism only, after an explicit reviewed manifest.
5. No secret, Vault value, service-role key or password is committed to Git.
6. Security fixes (#147 and #149) remain separate forward migrations; do not hide them inside history repair.
7. Every future DDL change requires the usual preflight, migration review, CI, post-apply verification and Security Advisor run.
8. The existing production database remains the evidence source for current state until a new canonical baseline is independently verified.

## 3. Frozen rollback point

Before changing migration files, keep an immutable Git reference to the exact pre-recovery state.

Created on 2026-09-08:

- branch: `archive/migrations-pre-baseline-20260908`
- source commit: `bc67cf1b633ab37ed410c59c7c11f337387f0e13`

This preserves the complete current `supabase/migrations` directory and application code before any migration-history normalization.

Do not delete or force-move this branch during the recovery.

## 4. Recommended target architecture

Treat two concerns separately.

### A. Ledger compatibility

`supabase/migrations` must contain a timestamp history that is coherent with the production migration ledger so Supabase does not treat old history as pending or missing.

### B. Fresh-database reproducibility

The project must have a reviewed declaration of the **current desired schema**, independent of the historical accidents that produced it.

Recommended source of truth going forward:

- `supabase/schemas/` — declarative current schema, generated initially from production and then reviewed/split into maintainable files;
- `supabase/migrations/` — normalized deployment history plus all future forward migrations;
- `docs/migration-history/` or an archive branch — forensic historical SQL and the remote↔local manifest.

Do not use the old imperative migration chain as the only source of truth for a fresh database.

## 5. Why a current baseline is safer than historical replay

A fresh database should not need to reproduce every historical mistake in order to reach the current schema.

Examples from the audit:

- production `orders` originated with legacy `pack_name`/`amount` columns that are not represented by the early local `add_orders_table` file;
- `viability_assessments` was created with one definition and then a conflicting `CREATE TABLE IF NOT EXISTS` attempted another definition;
- `tenant_ready` was adapted remotely so referenced columns existed before policies were created, while the current local file has a different order;
- several KIA files were hardened after their original application;
- July `profile_billing_and_holded_order_status` explicitly says the May file existed in Git but was not applied until July;
- Academy enrollment exists and is required by September functions, but its July migration has no ledger row.

A reviewed current-state baseline removes these ambiguities for new environments while the historical manifest remains available for audit.

## 6. Proposed implementation phases

### Phase 0 — freeze and export evidence

Already done:

- pre-recovery Git snapshot branch created;
- May–September remote/local history classified read-only in #143.

Still required before mutation:

- export the current production migration ledger (`version`, `name`, statement hash/metadata) to a non-secret audit artifact;
- produce a machine-readable manifest with one row per remote and local timestamp;
- record the current production schema fingerprint / dump before baseline generation.

No database writes in this phase.

### Phase 1 — create declarative production schema

In a controlled Supabase CLI environment linked to the production project, generate a schema-only production dump into `supabase/schemas/`.

Recommended starting point from current Supabase documentation:

```bash
supabase db dump > supabase/schemas/prod.sql
```

Then review and split it by dependency where useful.

Important caveats to inventory separately because schema diff/dump workflows do not fully represent every operational side effect:

- DML / seed rows;
- storage bucket rows and storage configuration;
- cron jobs;
- Vault secrets;
- publication changes;
- some grants / column privileges / view ownership details;
- external/managed schemas such as Stripe Sync.

Never include decrypted Vault secrets in the dump or Git.

### Phase 2 — validate the baseline in a disposable environment

Do **not** test the baseline by applying it to production.

Use a disposable local database or an explicitly approved staging/branch environment.

Validation gates:

1. baseline creates the expected public schema from empty;
2. critical constraints, indexes, RLS flags, policies, functions and grants match the reviewed production target;
3. no secret material is present;
4. application typecheck/lint/tests pass against the baseline;
5. targeted smoke tests cover Auth/profile creation, checkout/order persistence, subscriptions, Academy, KIA, Holded integration metadata and multi-entity Stripe attribution;
6. a schema diff against production is understood and reduced to zero or an explicitly documented accepted set.

Do not create a paid Supabase branch without cost lookup and explicit cost confirmation.

### Phase 3 — normalize historical timestamps in Git, without historical replay

Only after the baseline is independently proven.

Build the active `supabase/migrations` history from the audited manifest:

- every **remote ledger timestamp** must have a corresponding local migration-history entry;
- remote-only SQL that matters for forensic history should be preserved in the archive/manifest;
- exact duplicate remote applications should be represented so the timestamp exists, but the normalized fresh-db path must not intentionally perform destructive work twice;
- obsolete local-only files that were never applied must not remain in the active migration directory as apparently pending migrations;
- files proven to have been applied outside the ledger require an explicit history decision (see Phase 4), not silent deletion.

Do not modify this directory piecemeal on `main`; perform the normalization in one reviewed PR from the frozen manifest.

### Phase 4 — reconcile the production ledger using supported history repair only

This phase **changes production migration history but must not execute schema DDL**.

Use only after the exact proposed before/after timestamp sets have been reviewed.

Supabase documents `migration repair --status applied|reverted` as a migration-history operation. It changes recorded history; it does not execute or revert the SQL itself.

Candidate cases that may legitimately require `applied` status because the schema effect is proven present while the ledger row is absent include:

- `20260721000001_academy_enrollments`;
- `20260901000001_academy_knowledge_status`.

These are **candidates, not authorization to run the command**. Each must be included in the final manifest and independently re-verified immediately before repair.

Do not mark local-only migrations as applied merely because a similarly named or later schema effect exists. Examples that must not be treated this way include the old June `email_queue` variant and the May-dated billing migration that was actually applied in July.

### Phase 5 — establish the new baseline marker

Once the canonical baseline has been validated, create a clearly named baseline migration/version representing the new migration era.

Production already contains the baseline schema, so the baseline version must not be executed against production. If the chosen Supabase workflow requires the baseline version to be present in the production history, record it through the reviewed history-repair mechanism only after proving production matches the baseline.

A fresh environment should be able to build from the normalized history/baseline without relying on undocumented remote state.

Exact timestamp/name must be chosen at implementation time so it cannot collide with any existing migration.

### Phase 6 — verify ledger and deployment behavior

Before merging the normalization PR:

- compare local and remote migration timestamp sets explicitly;
- run the supported dry-run/list commands in the linked CLI environment;
- confirm there are **no historical DDL migrations proposed for execution against production**;
- confirm the only pending migrations are intentional new forward migrations, if any.

After the reviewed history repair:

- `supabase migration list` should show coherent local/remote status;
- the Supabase GitHub check on the PR/main should be green;
- the normalized fresh-db test must still pass;
- production schema/data must be unchanged by the history-only operation.

If any command proposes historical DDL against production: **stop**.

## 7. Migration classes and required treatment

| Class | Example | Treatment |
|---|---|---|
| Exact local/remote version | KIA repairs 20260525, invoice attribution 20260907184513 | Keep version; preserve SQL/archive evidence |
| Same SQL, different timestamp | Holded consent, pgcron auth | Active history follows reviewed remote mapping; archive original local filename |
| Exact remote duplicate | July pgcron fix; September onboarding | Preserve both remote timestamps in ledger compatibility; avoid destructive duplicate fresh replay |
| Remote-only live change | `fix_email_queue_schema_mismatch`, checkout claim functions | Reconstruct/archive exact remote SQL; include effect in canonical baseline |
| Local effect present, ledger absent | Academy enrollment; Academy knowledge status | Candidate for supported `applied` history repair after re-verification |
| Local file not actually applied at that date | May billing file, June onboarding/email variants | Do not mark applied under old timestamp; archive/normalize according to actual history |
| Local file evolved after original application | KIA memory/RPC, tenant-ready/RLS | Historical remote SQL and current desired schema must be separated |
| Pre-ledger bootstrap | core EXPERT schema + legacy orders/subscriptions | Represent in current baseline, not by guessing a false historical replay |

## 8. Operational side-effects manifest

Schema reproducibility is not enough. Before declaring baseline completion, create a separate reviewed inventory for operational state that should exist in new environments.

At minimum inspect:

- required storage buckets;
- cron job definitions excluding secret values;
- required seed/config rows;
- extension enablement;
- required grants and RLS policies;
- webhook/integration configuration that lives outside Postgres migrations;
- Stripe Sync managed objects, which must not be treated as ordinary application-owned DDL.

Secrets must be provisioned through environment/Vault procedures and never embedded in a baseline.

## 9. Security findings discovered by this audit

History repair must not be used to conceal real forward security gaps.

### #147 — stale tenant-admin ALL policies

Production still contains legacy `FOR ALL` tenant-admin policies on `cases` and `documents` combined with effective authenticated write grants.

Fix separately through a forward security migration after its own preflight.

### #149 — direct writes to `kia_financial_reports`

The table has `INSERT WITH CHECK (true)` / `UPDATE USING (true)` public policies plus anon/authenticated write grants, while normal application persistence uses the backend admin client.

Fix separately through a forward security migration after its own preflight.

## 10. Verification checklist before any production history repair

- [ ] frozen Git snapshot still exists and points to the pre-recovery commit;
- [ ] remote/local timestamp manifest complete;
- [ ] current production schema dump captured without secrets;
- [ ] declarative schema reviewed;
- [ ] fresh disposable database can be created successfully;
- [ ] application tests pass on fresh database;
- [ ] production vs baseline schema diff reviewed;
- [ ] operational side-effects inventory reviewed;
- [ ] every proposed `applied`/`reverted` history change listed explicitly;
- [ ] dry run proves no historical DDL would be executed on production;
- [ ] rollback procedure for migration-history changes documented;
- [ ] explicit production checkpoint approval obtained immediately before history repair.

## 11. Rollback principle

Because migration-history repair changes metadata rather than schema, rollback means restoring the previous migration-status entries using the supported history-repair mechanism according to the exported pre-change manifest.

Never attempt to “rollback” this work by running down-DDL against production.

If schema state changes unexpectedly, stop and treat it as an incident; do not improvise destructive corrections.

## 12. Definition of done

#143 can close only when all are true:

1. production and Git migration timestamp sets are intentionally coherent;
2. Supabase GitHub migration check is green;
3. no historical SQL was replayed merely to fix history;
4. a fresh disposable environment can be built from the new canonical schema/history;
5. schema parity is verified;
6. side-effect configuration is explicitly documented/provisioned;
7. future database changes follow one workflow: declarative schema or reviewed forward migration → CI/test → production migration → verification;
8. security issues #147 and #149 remain independently tracked until fixed by forward migrations.
