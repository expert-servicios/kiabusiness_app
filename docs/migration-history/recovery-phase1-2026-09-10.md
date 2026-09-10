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
- replay and parity probes on the disposable Development Branch;
- Git-only normalization on `infra/supabase-ledger-recovery-phase1`;
- documentation of exact before/after proposals.

Still blocked until a separate reviewed checkpoint:

- `migration repair` against production;
- direct edits to `supabase_migrations.schema_migrations`;
- replaying historical DDL against production;
- merging a Development Branch into production;
- any data rewrite or financial-history mutation.

Production remained untouched throughout this checkpoint.

## Development Branch bootstrap result

Creating/resetting the disposable Development Branch from the current project state produced an incomplete environment and did not reproduce the production schema from migration history. This reproduces the core #143 failure: the current Git/remote migration history is not a reliable clean-environment bootstrap.

The branch is therefore used only as a disposable diagnostic target. Its `probe_*` migration rows are test artifacts and must **not** be interpreted as candidate production migration-history rows.

## Controlled historical replay

A controlled replay was executed in local migration order on the disposable branch, always using the literal Git migration before applying it and stopping at deterministic failures or silent semantic divergence.

The first deterministic SQL defect was:

`20260520090000_kia_sessions_and_wa_extras.sql`

PostgreSQL 15 rejected unsupported `CREATE POLICY IF NOT EXISTS` syntax. The recovery branch replaces it with an explicit `pg_policies` existence check inside a `DO` block. Intended policy semantics are unchanged.

The corrected migration replayed successfully.

Replay then advanced through the complete active May–September local chain. Important checkpoints included:

- KIA sessions / WhatsApp additions;
- leads, billing and Holded status changes;
- client integrations and sync jobs;
- KIA decision logs, health checks, auditor and memory features;
- company open-data structures;
- Holded MCP bridge;
- KIA financial reports;
- admin operational status and Holded order traceability;
- Stripe/marketing hardening and commercial-benefit changes;
- server-only table hardening;
- helper/view security hardening;
- company↔Stripe Customer mapping;
- legal Stripe invoice attribution;
- legacy views in their verified production order.

### Corrected disposable-branch probe incident

The first probe for `20260529100000_kia_financial_reports.sql` was accidentally executed from a reconstructed statement rather than the literal Git file. This occurred only on the disposable branch.

The diagnostic object was removed there, the literal Git migration was fetched, and the exact migration then replayed successfully. Production was never touched. This incident established an explicit rule for the rest of #143: **fetch the exact Git file before every historical replay probe**.

## Silent divergence: `profile_companies`

A second defect was more important than a syntax error: a migration could report success while producing the wrong schema.

`20260528100000_company_open_data_tables.sql` used `CREATE TABLE IF NOT EXISTS public.profile_companies`, but an older local migration had already created `profile_companies` with a different contract. The later migration therefore no-op'd silently.

The older replayed structure had:

- composite primary key `(profile_id, company_id)`;
- `profile_id -> public.profiles(id)`;
- role limited to `owner|member`.

Current production has:

- UUID `id` primary key;
- unique `(profile_id, company_id)`;
- `profile_id -> auth.users(id) ON DELETE CASCADE`;
- role default `member`;
- role check `owner|admin|member`;
- canonical indexes;
- policies `admin all profile_companies` and `member view own companies`.

Remote migration `20260514170610 create_audit_logs_profile_companies_reviews` explains the production state but cannot simply be copied into Git because its own `CREATE TABLE IF NOT EXISTS` would still no-op against the older local table.

### Guarded bridge prepared in Git

The recovery branch now makes `20260528100000_company_open_data_tables.sql` detect the legacy shape by absence of the `id` column and converge only that legacy shape to the production contract.

The bridge was tested successfully on the disposable branch. Constraint, FK, index and policy semantics matched production afterward.

Column ordinal order may differ after conversion because PostgreSQL appends a newly added `id` column. Ordinal order is intentionally excluded from the semantic fingerprint because it does not change the application contract.

## Legacy/bootstrap boundary discovered

After the replayable historical chain was exhausted, production still contained a substantial group of `public.*` objects never created by the May–September Git migration chain.

Rather than invent false historical migrations, the diagnostic branch reconstructed these objects empty from the **production catalog only**. No production rows were copied.

This establishes the architecture for the final repair:

- historical migrations remain historical transitions;
- objects that predate or escaped the tracked history belong in a current-schema declarative baseline;
- ledger reconciliation must not pretend that missing legacy/bootstrap DDL was applied under invented historical timestamps.

## Public-schema parity checkpoint

The disposable diagnostic branch now matches production exactly for the following `public` schema layers.

### Relations

- 155 tables
- 2 views
- 157 relations total
- exact same relation-name set

### Columns

- production: 1,732 table columns
- diagnostic branch: 1,732
- semantic hash: `aae132d5f560e35c27d3a231f053f165`

The column fingerprint compares relation, column name, type, nullability and default while intentionally ignoring physical ordinal position.

### Constraints

- production: 553
- diagnostic branch: 553
- semantic hash: `902ddcf2e4700b1a1367192ea1fde8b1`

This includes PK, FK, UNIQUE and CHECK definitions.

### Indexes

- production: 473
- diagnostic branch: 473
- semantic hash: `209ce89f6b5e68d81afa529ea0e292d2`

Secondary, unique, expression and partial-index definitions were included.

### Row-level security flags

- RLS-enabled public tables: 155 / 155
- `FORCE ROW LEVEL SECURITY`: 0
- flags hash: `56b21fbfeb485de0bc90c65cd286316d`

### RLS policies

- production: 276
- diagnostic branch: 276
- semantic hash: `6de814c76c15d6be031c369c67e48c22`

For this diagnostic gate, the branch's previous public policies were removed and the current production policy catalog was recreated exactly. This operation occurred only on the disposable branch.

### Triggers

- production non-internal public triggers: 43
- diagnostic branch: 43
- semantic hash: `c4f8db6f9697f773915a374d42a83906`

Only user-defined/public triggers were compared. PostgreSQL internal FK triggers were not rewritten.

### Views

Both production views are present with `security_invoker=true`:

- `public.v_invoice_documents`
- `public.v_servicios_con_pagos`

A cosmetic lateral-subquery alias difference was normalized on the disposable branch. View logic and options now match production.

### ACL / grants

Effective ACL comparison uses role names rather than role OIDs so independently created Supabase projects can be compared safely.

Relations/tables/views/sequences:

- effective ACL entries: 3,948
- hash: `a1be6d00206af720dba8d0a07c4ffd3d`

Public functions:

- effective ACL entries: 216
- hash: `1cd94fda7041ca6d3d5481243af2da67`

`public` schema ACL:

- entries: 7
- hash: `fdf18ac11d259b68b8787d5163484d6a`

All three ACL fingerprints now match production exactly.

## Public functions and fingerprint rules

Production and the diagnostic branch each contain 58 public function signatures.

During comparison, an important fingerprint bug was found: using `pg_proc.prolang` directly compares an internal language OID, and OIDs are not portable across PostgreSQL projects. The comparator must join `pg_language` and compare `lanname` (`sql`, `plpgsql`, etc.) instead.

A second false-positive source is stored source formatting. PostgreSQL preserves comments, CRLF/LF and some textual formatting in function source. These do not by themselves represent a behavior difference.

After removing internal-OID false positives, the meaningful function differences were reduced to a small set of actual legacy/current body differences. Current production definitions were reproduced on the disposable branch for the affected Academy, checkout, auth/profile, admin-follow-up and helper functions.

Acceptance rule for the future comparator:

- compare function schema/name/signature;
- language **name**, never language OID;
- return type;
- volatility/strict/leakproof/parallel/security-definer attributes;
- configured `search_path` and other executable settings;
- normalized executable logic;
- ignore comments, CRLF/LF and irrelevant source whitespace.

A literal `pg_get_functiondef()` hash is not a valid cross-environment semantic gate by itself.

## Environment-bound legacy function

`app.assign_master_admin()` contains an environment-specific fixed identity and has no active production trigger dependency in the inspected state.

It must not be copied blindly into a portable baseline just to obtain byte-level catalog parity. It requires an explicit design decision: parameterize/remove the environment binding, or classify the function as environment-specific bootstrap state.

No such production change is part of #143 at this stage.

## Security Advisor checkpoint

Security Advisor was rerun after branch DDL/RLS work.

### Production

Production currently reports 30 `INFO` findings of `rls_enabled_no_policy` in `public.*`. These are existing production characteristics and were not introduced by this recovery work.

Production also reports unrelated existing warnings including mutable search paths under `stripe.*`, leaked-password protection disabled, and an available PostgreSQL security upgrade. These are not being remediated inside #143 because doing so would mix migration-history recovery with security-policy changes.

### Diagnostic branch

The branch reports the same 30 public `rls_enabled_no_policy` findings plus 3 additional INFO findings:

- `app.plans`
- `app.subscriptions`
- `app.user_companies`

The three extras are explained by an incomplete `app` schema bootstrap, not by the reconstructed public RLS policies.

Reference for the Advisor lint: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Remaining non-public `app` schema gap

The public-schema parity gate is now strong, but #143 is not ready for closure because the diagnostic branch does not yet reproduce the current `app` schema.

Production currently has 13 `app` relations:

Tables:

- `contacts`
- `plans`
- `purchase_invoice_items`
- `purchase_invoices`
- `sales_invoice_items`
- `sales_invoices`
- `subscription_overrides`
- `subscriptions`
- `user_companies`
- `user_integrations`
- `user_profile`

Views:

- `v_purchases_totals`
- `v_sales_totals`

The current diagnostic branch has only four `app` tables:

- `plans`
- `subscription_overrides`
- `subscriptions`
- `user_companies`

It also lacks the current production policies on `app.plans`, `app.subscriptions` and `app.user_companies`.

This gap must be reconstructed and fingerprinted separately before the fresh-build validation. It must not be conflated with separate security-hardening tickets such as #147/#149.

## Remote-only and local-only history

Read-only production inspection recovered exact statements for previously identified remote-only operational migrations, including email cache/system KV, manual-payment/case linkage, Calendar IDs, campaigns, email repairs, order entity scoping, subscription checkout claims/status synchronization and Holded contact claims.

No recovered remote statement has been replayed against production.

Known local-only migrations whose effects already exist in production remain candidates for future **history-only** mark-applied treatment, not DDL replay. In particular:

- `20260721000001_academy_enrollments.sql`
- `20260901000001_academy_knowledge_status.sql`

The old Academy order constraint has evolved since then, which is additional evidence that replaying historical DDL against production would be unsafe.

## Local version normalization already in PR #194

The recovery branch normalizes known tooling collisions without touching the production ledger:

- duplicate `20260607000005` versions are separated onto verified remote versions;
- byte-equivalent duplicate `20260607000006_email_queue_processing_status.sql` is removed in favor of the normalized history entry;
- duplicate `20260903113000` versions are normalized to verified remote versions.

These are Git-history/tooling repairs only. They do not authorize production migration-history mutation.

## What this checkpoint proves — and what it does not

It proves that the current production `public` contract can be reconstructed from a combination of:

1. replayable historical transitions;
2. guarded compatibility bridges for silent drift;
3. a catalog-derived current-schema baseline for legacy/bootstrap state.

It does **not** yet prove that Git can bootstrap a fresh environment without diagnostic probes. The current Development Branch contains test-only `probe_*` migrations and manual convergence operations.

Therefore this branch must never be merged to production.

## Next recovery phase

1. Keep production frozen.
2. Reconstruct and fingerprint the missing `app` schema separately.
3. Convert the verified current production contract into portable declarative baseline artifacts under `supabase/schemas/`, excluding or explicitly handling environment-bound objects.
4. Finish the normalized migration manifest: exact match, semantic match/different version, remote-only structural, remote-only operational, local-only already-present, local-only not-applied, duplicate/collision.
5. Add a reusable semantic fingerprint query/tool that ignores column ordinal order, internal OIDs and source-format noise.
6. Create a **new** disposable Development Branch from the updated Git state. The present diagnostic branch is not eligible for final validation.
7. Run the clean bootstrap with no manual probes and compare public + app fingerprints, RLS, triggers, views and ACLs with production.
8. Only after clean-build parity, prepare the exact production migration-history repair manifest with before/after ledger rows and rollback procedure.
9. Obtain explicit approval before the first production ledger mutation.

## Current conclusion

The largest unknown in #143 has been removed: production `public` is no longer an opaque target. Its current contract has been reconstructed and independently fingerprinted on a disposable branch with exact parity for relations, columns, constraints, indexes, RLS policies, triggers and ACLs.

The remaining engineering problem is now bounded: encode that verified state as a portable Git baseline, recover the missing `app` bootstrap, validate from a genuinely fresh branch, and only then design the production ledger repair.

Production remains unchanged.