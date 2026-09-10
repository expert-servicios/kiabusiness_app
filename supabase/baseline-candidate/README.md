# Candidate Supabase baseline — issue #143

This directory contains **non-active** candidate declarative schema artifacts produced during migration-history recovery.

It is intentionally **not** `supabase/schemas/`, and `supabase/config.toml` is intentionally unchanged. Nothing in this directory is applied by `db push`, `db reset`, Development Branch bootstrap, or the current migration runner.

## Why this staging directory exists

The repository's historical migration chain is not a faithful description of the current production database. Some production objects are remote-only/bootstrap legacy, some local migrations are semantically equivalent under different versions, and some historical `CREATE ... IF NOT EXISTS` statements silently preserve an older local shape.

Activating an incomplete declarative schema would be unsafe because Supabase treats declarative schema files as desired state when generating diffs. A partial schema could therefore produce destructive or misleading diffs.

## Promotion gates

A candidate may move to `supabase/schemas/` only after all of the following are true:

1. `public` and `app` desired-state files are complete.
2. Environment-bound objects are explicitly excluded or parameterized.
3. A new disposable Development Branch can be built from Git without manual `probe_*` convergence.
4. Semantic fingerprints match production for the agreed contract.
5. Generated `supabase db diff` output is reviewed and contains no accidental destructive change.
6. Known declarative-schema caveats are represented by explicit versioned migrations where needed.
7. The production migration ledger remains unchanged until a separate before/after repair manifest and rollback plan are approved.

## Current candidate status

### `00_app.sql`

Validated on 2026-09-10 against production project `ybtpqscmqrrjjmuoryap` using disposable branch `umincarqwnizafuegfcf`.

Portable `app` parity achieved for:

- 16 relations: 11 tables, 3 sequences, 2 views;
- 80 table columns;
- 19 constraints;
- 18 indexes;
- 9 RLS-enabled tables;
- 9 RLS policies;
- 2 portable application functions;
- relation/view/sequence ACL;
- `app` schema ACL;
- `citext` extension version 1.6 in schema `app`.

`app.assign_master_admin()` is intentionally absent. The current production function embeds an environment-specific user identity and has no active trigger. It must not be copied into a portable baseline merely to make catalog text identical.

## Declarative-schema caveats

Supabase documentation notes that declarative schema diffing has important caveats around grants/default privileges, view ownership / `security_invoker`, some RLS changes, comments and other entities. Candidate validation therefore uses both declarative state and explicit semantic fingerprints.

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
