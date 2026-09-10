# Supabase migration-ledger recovery — Phase 1

Date: 2026-09-10
Tracking: #143
Production project: `ybtpqscmqrrjjmuoryap`
Disposable Development Branch project: `umincarqwnizafuegfcf`
Disposable branch: `migration-ledger-reconcile-20260910`

## Safety boundary

This phase does **not** change production schema, production rows or the production migration ledger.

Allowed in this phase:

- read-only inspection of production schema and `supabase_migrations.schema_migrations`;
- replay probes on the disposable Development Branch;
- Git-only normalization on `infra/supabase-ledger-recovery-phase1`;
- documentation of exact before/after proposals.

Still blocked until a separate reviewed checkpoint:

- `migration repair` against production;
- direct edits to `supabase_migrations.schema_migrations`;
- replaying historical DDL against production;
- merging a Development Branch into production;
- any data rewrite or financial-history mutation.

## Development Branch bootstrap result

Creating/resetting the disposable Development Branch from the current project state produced an empty `public` schema and no replayed migration ledger. This reproduces the core #143 failure: the current Git/remote migration history cannot bootstrap a clean environment.

## Controlled local replay

A controlled replay was started from the oldest local migration, applying SQL only to the disposable Development Branch and stopping at the first error.

The first eleven local migrations through `20260509164929_add_external_mappings.sql` replayed successfully.

The first deterministic failure is:

`20260520090000_kia_sessions_and_wa_extras.sql`

PostgreSQL error:

```text
ERROR 42601: syntax error at or near "NOT"
CREATE POLICY IF NOT EXISTS "Admin manage kia_sessions" ...
```

PostgreSQL 15 does not support `CREATE POLICY IF NOT EXISTS`. The failed migration was transactional: `public.kia_sessions` was not left behind after the failure.

### Git-only fix prepared

On this recovery branch only, the unsupported statement is replaced with an explicit `pg_policies` existence check inside a `DO` block. The intended policy semantics are unchanged.

The corrected migration replayed successfully on the disposable Development Branch.

After that correction, the following local migrations were also replayed successfully in order:

- `20260520091000_leads_whatsapp_fields.sql`
- `20260520092000_profiles_add_email.sql`
- `20260522100000_add_viability_assessments.sql`
- `20260522110000_add_fiscal_obligations.sql`
- `20260522120000_orders_catalog_support.sql`
- `20260522130000_leads_whatsapp_upsert.sql`
- `20260522184242_whatsapp_thread_replies.sql`
- `20260523062807_profile_billing_and_holded_order_status.sql`
- `20260523160000_client_integrations_and_sync_jobs.sql`
- `20260523171440_kia_decision_logs.sql`
- `20260523182625_kia_health_check.sql`
- `20260524060850_kia_auditor_reviews.sql`
- `20260524120000_client_integration_secrets.sql`
- `20260525162302_kia_health_schema_repair.sql`
- `20260525172343_kia_rls_repair.sql`
- `20260525172441_kia_grants_repair.sql`
- `20260528100000_company_open_data_tables.sql`

## Second reproducibility defect: silent schema divergence

`20260528100000_company_open_data_tables.sql` does not fail, but it is not sufficient to reconstruct the current schema because it uses `CREATE TABLE IF NOT EXISTS public.profile_companies` while an earlier local migration already created that table with a different shape.

After replay, the disposable branch still has the earlier structure:

- primary key `(profile_id, company_id)`;
- `profile_id` references `public.profiles(id)`;
- role check allows only `owner` and `member`.

Current production has a different canonical structure:

- UUID `id` primary key;
- unique `(profile_id, company_id)`;
- `profile_id` references `auth.users(id)`;
- role check currently allows `owner`, `admin`, `member`.

Production migration history explains the gap: remote migration `20260514170610 create_audit_logs_profile_companies_reviews` contains the newer `profile_companies` definition, but that remote-only/adapted history is not represented by an equivalent replayable local transition at the same point in the Git migration chain.

This is a key #143 root cause: **some local migrations can report success while still producing a schema different from production**.

## Remote-only SQL recovered read-only

Exact `statements` have been recovered from production for the previously identified remote-only operational migrations, including:

- email inbox cache/system KV;
- manual payments/case linkage;
- Google Calendar IDs;
- campaigns;
- email event error/HTML columns;
- email queue repair;
- one-time order entity scoping;
- atomic subscription checkout claims;
- subscription checkout claim status sync;
- Holded contact creation claims.

No recovered statement has been replayed against production.

A May 2026 inspection also confirms that production contains adapted/remote structural migrations that are material to a clean bootstrap, including `20260514170610 create_audit_logs_profile_companies_reviews`.

## Candidate local-only historical rows

Read-only production verification confirms that the schema effects represented by:

- `20260721000001_academy_enrollments.sql`
- `20260901000001_academy_knowledge_status.sql`

already exist in production. They are candidates for a future **history-only** mark-applied operation, not for DDL replay. `orders_source_check` has evolved since the Academy migration, so replaying the old DDL would be specifically unsafe.

## Known local version defects

The local directory still contains version collisions that must be normalized before a clean Supabase migration run can be trusted:

- two files with version `20260607000005`;
- two files with version `20260903113000`;
- a byte-equivalent duplicate of `email_queue_processing_status` under `20260607000005` and `20260607000006`.

These are Git-history/tooling defects; no production ledger mutation is authorized by this document.

## Recovery strategy from this checkpoint

1. Keep production frozen.
2. Use the disposable branch to continue identifying replay errors and silent divergences.
3. Build an explicit normalized migration manifest: exact-match, semantic-equivalent/different-version, remote-only structural, remote-only operational, local-only already-present, local-only not-applied, duplicate/collision.
4. Prefer a current-schema baseline for clean environments rather than forcing every historical deployment artifact to replay forever.
5. Validate the baseline on a fresh disposable Development Branch and compare schema fingerprints with production.
6. Only after the fresh build matches, prepare an exact production migration-history repair manifest with before/after rows and rollback.
7. Obtain explicit approval before the first production ledger mutation.

## Current conclusion

Supabase Pro/Branching has converted #143 from a production-risk problem into a reproducible test problem. The first SQL defect is fixed on the recovery branch, and the next root issue is now proven: remote adapted schema changes are missing from the local replay path, so migration success alone cannot be used as the acceptance criterion. Schema equivalence/fingerprint validation is mandatory.
