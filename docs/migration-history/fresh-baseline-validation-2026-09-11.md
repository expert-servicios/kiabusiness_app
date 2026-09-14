# Supabase #143 — Fresh baseline validation checkpoint

Date: 2026-09-11
Tracking: #143
Production project: `ybtpqscmqrrjjmuoryap`
Diagnostic fresh branch project: `xivvcggexcntlqwnjwwh`
Recovery branch: `infra/supabase-ledger-recovery-phase1`
PR: #194

## Safety boundary

Production remained frozen throughout this checkpoint.

No production DDL, DML, migration-ledger mutation, `migration repair`, branch merge, historical financial rewrite, Stripe/Holded record correction, or secret/credential change was performed.

All write operations described below occurred only on a disposable Supabase Development Branch or on the draft Git recovery branch.

## Fresh-branch bootstrap result

Creating a new Supabase Development Branch from the current production migration history reproduced the #143 failure: the automatic historical bootstrap reached `MIGRATIONS_FAILED`.

Read-only verification immediately afterward showed:

- `public` relations: 0
- migration-ledger rows: 0

The candidate baseline was therefore applied to an actually empty public schema, making this a clean reconstruction test rather than a convergence test over an existing copy of production.

## Deterministic baseline defects found by the fresh build

### 1. Constraint dependency ordering

The first candidate constraint layout interleaved local constraints and foreign keys by table name. A foreign key such as `academy_enrollments -> profiles` could therefore be created before the referenced primary/unique key existed.

The failed migration transaction rolled back cleanly and left zero public constraints.

The baseline was corrected to a deterministic two-phase order:

1. all 338 local `PRIMARY KEY`, `UNIQUE` and `CHECK` constraints;
2. all 220 foreign keys.

After that change the fresh branch reproduced all 558 production constraints exactly.

### 2. SQL-function dependency ordering

`public.is_admin_or_gestor()` is a SQL-language function and requires `public.is_gestor()` to exist at function-creation time. The first segmented function order placed the consumer before the dependency, so that block failed and rolled back cleanly.

The baseline now includes `39_public_function_dependency_prelude.sql`, which creates `is_gestor()` before its consumer. The canonical definition is repeated later in the portable function set.

After that change all 54 portable public functions created successfully.

## Exact public-schema gates

### Tables and columns

- public tables: 156 / 156
- public table columns: 1,743 / 1,743
- semantic column hash: `c91d2e3f2172b95dd2f93a7731b6ef44`

The column fingerprint ignores physical ordinal position and compares the logical column contract.

### Constraints

- total constraints: 558 / 558
- exact constraint hash: `f429c9a517a354b74c8b29a4dfd650f3`

Production composition at this gate:

- CHECK: 144
- PRIMARY KEY: 156
- UNIQUE: 38
- FOREIGN KEY: 220

### Indexes

- total public indexes: 477 / 477
- exact index hash: `9b9604d2a5d5ffc96349da8bbf035b58`

The total includes indexes backing PK/UNIQUE constraints plus the separately recreated secondary indexes.

### Portable public functions

Production contains 58 public function signatures. Four are environment-bound because their stored definitions contain the production project reference and are deliberately excluded from the portable baseline:

- `handle_new_contact_request()`
- `notify_admin_on_client_upload()`
- `notify_admin_on_new_user()`
- `notify_admin_on_service_request()`

Portable functions:

- count: 54 / 54
- normalized executable-body hash: `e81f45509ddd28f3f95eee723aebac6a`
- executable-attribute hash: `40066e775fedf02040c4874896eac1fc`

The attribute gate compares language name, volatility, security-definer status and configured executable settings such as `search_path`.

The body gate removes comments, CRLF/LF differences, tabs and irrelevant whitespace. This avoids false drift from PostgreSQL source formatting while still comparing executable logic.

### RLS and policies

- public tables with RLS enabled: 156 / 156
- FORCE RLS: none
- policies: 278 / 278
- exact `pg_policies` hash: `3de6e9f607acb1e8b50a61b89e6db7f0`

### Public views

- views: 2 / 2
- exact view/options hash: `1dc13f4cb8a13019ee2949eaca5a7e65`

Both production views use `security_invoker=true` and are reproduced in the candidate.

### Public triggers

Production has 43 non-internal public triggers:

- portable triggers: 41
- outbound/network environment-bound triggers: 2

The 41 portable triggers are reproduced exactly:

- count: 41 / 41
- exact trigger-definition hash: `a599b845b238e20df635d089177cbe4a`

The two network-bound triggers remain intentionally outside the portable baseline together with their production-URL-bound functions.

### Auth hooks

Only the two active user-defined hooks on `auth.users` are reproduced:

- `on_auth_user_created -> public.handle_new_user()`
- `trg_handle_new_user -> public.fn_handle_new_user()`

Gate:

- hooks: 2 / 2
- exact trigger-definition hash: `548844f289d5e71eed7face627023a13`

### Public API-role ACL

Effective privileges for `PUBLIC`, `anon`, `authenticated` and `service_role` were compared by role name rather than internal role OID.

- ACL rows: 3,007 / 3,007
- exact ACL hash: `deefc86c499cb8ae1930a3565e627c39`

## `app` schema parity

The current portable `app` contract is reproduced exactly:

- tables: 11
- columns: 99 — hash `73078a53b6d26469a60c8a7547947916`
- constraints: 19 — hash `23b4d4ac73c035889fb2cdea79b7146b`
- indexes: 18 — hash `aed72537e79beb0e29441787aa9635de`
- policies: 9 — hash `8af60c03d71790722f5e505518a26aa1`
- RLS-enabled tables: 9
- views: 2 — hash `8102df0e51cde4546ae5a9b9fc4113b2`
- portable user-defined functions: 2 — hash `efea4d6b20bc37e10b65cd4d49bdd0e8`

`app.assign_master_admin()` is deliberately excluded because the production definition embeds an environment-specific fixed identity. It is not copied merely to obtain byte-level catalog parity.

## `private` schema parity

- user-defined helper functions: 3 / 3
- exact portable function hash: `76d568285d8917431ade456572fa60b9`

These are the hardened SECURITY DEFINER helpers used by public RLS wrappers.

## `app` + `private` ACL parity

Effective API-role ACL across `app` and `private`, excluding the intentionally environment-bound `app.assign_master_admin()`:

- ACL rows: 84 / 84
- exact ACL hash: `3c152df8795880c4fc7b42a0a1d152fc`

## Sequences

Across `public` and `app`:

- sequences: 7 / 7
- exact structural hash: `a73e671a768415ba9e86e87c3622c7eb`

## Extension-version allowance

`citext` matches exactly:

- production: 1.6 in schema `app`
- fresh branch: 1.6 in schema `app`

`vector` differs only at the Supabase platform package level:

- production: 0.8.0 in schema `extensions`
- fresh Development Branch: 0.8.2 in schema `extensions`

The fresh platform reports 0.8.0, 0.8.1 and 0.8.2 as available, with 0.8.2 preinstalled/current on the new branch.

This version delta is classified as a platform-managed compatible difference, not application-schema drift, because all dependent application contracts recreate successfully and match production: the `vector(1536)` column, IVFFlat index, and `kia_memories_search` RPC.

No production extension upgrade or downgrade is authorized by #143.

## Security Advisor parity

After the fresh DDL/RLS/ACL build, Security Advisor was rerun.

Fresh branch reports one public-schema lint family:

- `rls_enabled_no_policy` — INFO — 30 tables

Production reports the same 30 `public.*` tables with the same INFO condition. Therefore these findings are existing production policy choices and are not changed inside migration-history recovery.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Production also currently reports platform/security warnings outside the #143 portable baseline scope:

- mutable `search_path` on three functions in the managed/integration `stripe` schema;
- leaked-password protection disabled in Auth settings;
- a PostgreSQL security upgrade available.

References:

- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/platform/upgrading

Those warnings are not remediated inside #143 because doing so would mix history recovery with separate platform/security changes.

## What this diagnostic fresh build proves

The current production application contract can be reconstructed on an empty Supabase Development Branch from versioned Git baseline artifacts with exact parity for the portable application surface:

- public tables/columns;
- constraints;
- indexes;
- portable functions and executable attributes;
- RLS flags and policies;
- views;
- portable public triggers;
- active Auth hooks;
- API-role ACL;
- `app` tables/functions/views/RLS/policies;
- `private` helpers;
- sequences.

The only accepted differences are explicitly environment/platform-bound:

1. four public production-URL-bound functions;
2. two outbound-network public triggers that depend on those functions;
3. `app.assign_master_admin()` with fixed environment identity;
4. Supabase-managed `vector` patch version 0.8.0 vs 0.8.2, with dependent contract parity proven.

## Why #143 is not yet closed

This branch was diagnostic. During the run two candidate ordering defects were discovered, fixed in Git, and then retried. Although the failed migrations rolled back cleanly, this branch is not the final proof of a one-pass reproducible bootstrap.

Before #143 can move to production-ledger planning, we still require:

1. a single canonical ordered baseline manifest with superseded candidate files removed or excluded;
2. a second, newly created disposable Development Branch;
3. one-pass application of the canonical baseline with no intermediate repair;
4. repetition of all semantic/fingerprint gates and Security Advisor;
5. deletion of the disposable branch after evidence is captured;
6. a separate explicit production migration-ledger repair manifest with before/after rows and rollback procedure;
7. explicit approval before any production migration-ledger mutation.

Production remains unchanged.