# Candidate Supabase baseline — issue #143

This directory contains **non-active** candidate declarative schema artifacts produced during migration-history recovery.

It is intentionally **not** `supabase/schemas/`, and `supabase/config.toml` is intentionally unchanged. Nothing in this directory is applied by `db push`, `db reset`, Development Branch bootstrap, or the current migration runner.

## Why this staging directory exists

The repository's historical migration chain is not a faithful description of the current production database. Some production objects are remote-only/bootstrap legacy, some local migrations are semantically equivalent under different versions, and some historical `CREATE ... IF NOT EXISTS` statements silently preserve an older local shape.

Activating an incomplete declarative schema would be unsafe because Supabase treats declarative schema files as desired state when generating diffs. A partial schema could therefore produce destructive or misleading diffs.

## Production snapshot gate

Current baseline snapshot:

- production project: `ybtpqscmqrrjjmuoryap`;
- latest verified production migration: `20260911174615_client_accounting_records`;
- this migration appeared while #143 extraction was in progress, so extraction was stopped, the change was reconciled explicitly, and the snapshot gate was advanced rather than mixing two production states;
- the recovered migration is present in Git as `supabase/migrations/20260911174615_client_accounting_records.sql`;
- no production migration-ledger mutation was performed by #143.

## Current portable parity

The disposable diagnostic branch `umincarqwnizafuegfcf` currently matches the production **portable contract** for every hard-gated layer below.

### `public`

- 162 relations total: 156 tables, 4 sequences, 2 views;
- 1,743 table columns;
- 558 constraints;
- 477 indexes total, including indexes backing PK/UNIQUE constraints;
- 156 RLS-enabled tables, `FORCE RLS = 0`;
- 278 RLS policies;
- 41 portable public triggers;
- 2 views with the production definitions/options;
- 1 portable non-extension type;
- 54 portable public functions;
- relation/view/sequence ACL parity;
- portable function ACL parity;
- `public` schema ACL parity.

The current production state also contains 4 environment-bound public functions and 2 active network triggers. They are intentionally excluded from portable hard gates because they embed the production Supabase project URL and can call production Edge Functions.

### `app`

Portable `app` parity is complete for:

- 16 relations: 11 tables, 3 sequences, 2 views;
- 80 table columns;
- 19 constraints;
- 18 indexes;
- 9 RLS-enabled tables;
- 9 RLS policies;
- 2 portable application functions;
- relation/view/sequence ACL;
- portable function ACL;
- `app` schema ACL;
- `citext` extension in schema `app`.

`app.assign_master_admin()` is intentionally absent from the portable candidate. The current production function is `SECURITY DEFINER`, contains an environment-specific UUID literal and has **zero active trigger dependencies**. Its production source hash is recorded by the verifier without copying the embedded identity into this public repository.

### `private`

`private` is part of the application contract because public RLS wrappers delegate to it.

The candidate now reproduces:

- 3 SECURITY DEFINER helper functions: `auth_tenant_id`, `is_admin`, `is_tenant_admin`;
- exact executable attributes/search paths;
- schema ACL: `USAGE` only for `authenticated` and `service_role` in addition to owner privileges;
- function ACL: `EXECUTE` only for `authenticated` and `service_role` in addition to owner privileges;
- no PUBLIC/anon access.

The ACL is explicit because PostgreSQL otherwise grants `EXECUTE` on newly created functions to PUBLIC by default.

### `auth.users` hooks

Application-owned hooks attached to Supabase-managed `auth.users` are versioned separately and currently match production:

- `on_auth_user_created` → `public.handle_new_user()`;
- `trg_handle_new_user` → `public.fn_handle_new_user()`.

## Environment-bound objects

Files under `environment-bound/` are **evidence, not portable bootstrap inputs**.

Current environment-bound objects are:

- `public.handle_new_contact_request()`;
- `public.notify_admin_on_client_upload()`;
- `public.notify_admin_on_new_user()`;
- `public.notify_admin_on_service_request()`;
- triggers `on_new_contact_request` and `on_new_service_request_notify`;
- `app.assign_master_admin()` (tracked by metadata/hash only, not copied with its fixed production identity).

They must be parameterized or consciously provisioned per environment before they can move into an active declarative schema.

## ACL / grants checkpoint

The candidate contains explicit portable ACL normalization in `80_public_acl.sql`.

On the diagnostic branch, applying the portable ACL plus the environment-bound ACL reproduced production exactly:

- public relation ACL entries: 3,976;
- public function ACL entries: 216 including environment-bound functions;
- public schema ACL entries: 7.

For the portable verifier, environment-bound functions are excluded from function ACL hard gates while relation/schema ACLs remain fully hard-gated.

## Security Advisor checkpoint

After the latest RLS/ACL work, the diagnostic branch reports the same 30 `INFO` findings of `rls_enabled_no_policy` in `public.*` as production. These are existing production characteristics, not newly introduced by #143.

Production additionally reports unrelated warnings in `stripe.*`, Auth leaked-password protection and PostgreSQL patch level. They remain outside #143 so migration-history repair is not mixed with unrelated security remediation.

Advisor reference:

- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Semantic verifier

Run `verify_semantic_fingerprint.sql` on production and the candidate environment.

Hard gates cover:

- `public`, `app`, `private` relations;
- columns/types/defaults/nullability/identity/generated state;
- constraints;
- indexes;
- RLS flags and policies;
- portable triggers;
- views and sequence configuration;
- portable non-extension types;
- portable function contract attributes;
- relation/function/schema ACLs;
- application-owned `auth.users` hook definitions;
- required extension presence/location.

The function source hash is advisory only. Internal OIDs, comments, CRLF/LF differences, source-format whitespace and physical column ordinal order are not valid cross-project hard gates.

## Promotion gates

A candidate may move to `supabase/schemas/` only after all of the following are true:

1. `public`, `app` and `private` desired-state files are complete.
2. Environment-bound objects are explicitly excluded or parameterized.
3. A **new** disposable Development Branch can be built from the updated Git state without manual `probe_*` convergence.
4. `verify_semantic_fingerprint.sql` passes all portable hard gates against the frozen production snapshot.
5. The two application-owned `auth.users` hooks match.
6. Generated `supabase db diff` output is reviewed and contains no accidental destructive change.
7. Known declarative-schema caveats are represented by explicit versioned migrations where needed.
8. The production migration ledger remains unchanged until a separate before/after repair manifest and rollback plan are approved.

## Declarative-schema caveats

Supabase declarative schema diffing has caveats around grants/default privileges, view ownership / `security_invoker`, some RLS changes, comments and other entities. Candidate validation therefore uses both declarative state and explicit semantic fingerprints.

References:

- https://supabase.com/docs/guides/local-development/declarative-database-schemas
- https://supabase.com/docs/guides/deployment/database-migrations

## Safety rules

- Never copy production rows into a baseline file.
- Never hardcode service-role keys, passwords, access tokens or credentials.
- Never auto-correct Stripe/Holded financial-history records while repairing migration history.
- Never use diagnostic `probe_*` migration rows as production migration-history entries.
- Never merge the current diagnostic Development Branch into production.
- Any production `migration repair` requires a separate reviewed manifest and explicit approval.

## Next step

The candidate has reached the point where the remaining proof is a **genuinely fresh Development Branch** from the updated Git state. The present diagnostic branch is not eligible for final validation because it contains historical replay probes and manual convergence artifacts.
