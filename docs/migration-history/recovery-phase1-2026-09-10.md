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
- `20260528120000_holded_integration_consent_columns.sql`
- `20260529090000_holded_mcp_bridge_tables.sql`
- `20260529100000_kia_financial_reports.sql`
- `20260602084321_admin_clients_operational_status.sql`
- `20260602092034_admin_orders_holded_traceability_repair.sql`

The replay probe for `20260529100000_kia_financial_reports.sql` was initially executed with a reconstructed statement rather than the exact Git file. This happened only on the disposable Development Branch. The probe object was removed from that branch and the exact Git migration was then applied successfully. Production was not touched.

## Second reproducibility defect: silent schema divergence

`20260528100000_company_open_data_tables.sql` originally did not fail, but it was not sufficient to reconstruct the current schema because it used `CREATE TABLE IF NOT EXISTS public.profile_companies` while an earlier local migration already created that table with a different shape.

The earlier clean-replay structure was:

- primary key `(profile_id, company_id)`;
- `profile_id` references `public.profiles(id)`;
- role check allows only `owner` and `member`.

Current production has the canonical structure:

- UUID `id` primary key;
- unique `(profile_id, company_id)`;
- `profile_id` references `auth.users(id)`;
- role default `member`;
- role check allows `owner`, `admin`, `member`;
- indexes `profile_companies_profile_idx` and `profile_companies_company_idx`;
- policies `admin all profile_companies` and `member view own companies`.

Production migration history explains the gap: remote migration `20260514170610 create_audit_logs_profile_companies_reviews` contains the canonical `profile_companies` definition, but that remote-only/adapted history is not represented by an equivalent replayable local transition at the same point in the Git migration chain.

Simply copying `20260514170610` into Git would not fix a clean replay: its own `CREATE TABLE IF NOT EXISTS public.profile_companies` would no-op because the older local table already exists.

### Guarded clean-replay bridge prepared and tested

On the recovery branch, `20260528100000_company_open_data_tables.sql` now detects the legacy local shape by the absence of the `id` column and, only in that case, converges it to the canonical production contract:

- adds UUID `id` and makes it the primary key;
- replaces the `profile_id` foreign key with `auth.users(id)`;
- sets role default/check to `member` / `owner|admin|member`;
- adds the unique `(profile_id, company_id)` constraint;
- normalizes index names;
- removes obsolete local-only policies;
- installs the canonical admin/member policies if absent.

The bridge was applied successfully on the disposable branch. A read-only comparison with production confirms logical parity for constraints, foreign keys, indexes and RLS policies.

The remaining physical difference is column ordinal order: on a converted legacy table the new `id` column is appended, while production created `id` first. This does not change SQL semantics or the application contract and must not be treated as a schema-parity failure by the future fingerprint comparator.

This is a key #143 root cause and acceptance rule: **migration success alone is not enough; clean replay must also be semantically equivalent to production.**

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

## Local version normalization in PR #194

The recovery branch normalizes the known local tooling collisions without mutating the production ledger:

- the two files that previously shared `20260607000005` are separated onto verified remote versions;
- the byte-equivalent duplicate `20260607000006_email_queue_processing_status.sql` is removed in favor of the normalized history entry;
- the two files that previously shared `20260903113000` are normalized to their verified remote versions.

These are Git-history/tooling repairs only. They do not authorize any production migration-history mutation.

## Recovery strategy from this checkpoint

1. Keep production frozen.
2. Continue exact-file replay on the disposable branch, stopping at the first deterministic SQL failure.
3. Build an explicit normalized migration manifest: exact-match, semantic-equivalent/different-version, remote-only structural, remote-only operational, local-only already-present, local-only not-applied, duplicate/collision.
4. Define a semantic schema fingerprint that ignores irrelevant physical details such as column ordinal order but compares tables, columns/types/defaults/nullability, PK/FK/unique/check constraints, indexes, functions and RLS policies.
5. Prefer a current-schema baseline for clean environments where historical adapted artifacts cannot safely be replayed verbatim.
6. Validate the normalized chain/baseline on a fresh disposable Development Branch and compare the semantic fingerprint with production.
7. Only after the fresh build matches, prepare an exact production migration-history repair manifest with before/after rows and rollback.
8. Obtain explicit approval before the first production ledger mutation.

## Current conclusion

Supabase Pro/Branching has converted #143 from a production-risk problem into a reproducible test problem. The first SQL defect is fixed on the recovery branch; known version collisions are being normalized; and the first proven silent divergence (`profile_companies`) now has a tested Git-only convergence path. Production remains unchanged. The next task is to continue exact replay through the remaining local migrations and discover the next deterministic or semantic divergence before designing any production ledger repair.
