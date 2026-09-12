# #143 — Final Supabase CLI ledger repair runbook (36-step baseline)

Date: 2026-09-12  
Project: `EXPERT` / `ybtpqscmqrrjjmuoryap`  
Status: **USER AUTHORIZED; NOT YET EXECUTED**

This runbook supersedes the single-baseline-file repair sequence in `production-ledger-cli-runbook-2026-09-12.md`. The active target is the exact 36-file baseline stack that already passed fresh replay.

## Safety contract

- This operation changes **migration tracking only**.
- It must not execute historical SQL against production.
- It must not change application schema or business/financial data.
- Never edit `supabase_migrations.schema_migrations` directly.
- Never run `supabase db push` without `--dry-run` during the transition.
- Any unexpected SQL proposal, row-count mismatch, changed production tip, or schema fingerprint mismatch is an automatic STOP.
- The exact 133-row pre-repair ledger, including `statements`, must be backed up before repair.

## Preconditions already satisfied in #143

- Portable baseline fresh replay: 36/36 steps PASS.
- Production/fresh semantic fingerprints PASS for public/app/private structure, functions, RLS/policies, views, triggers, auth hooks and API-role ACL.
- Development branches used for validation have been deleted.
- Production tip remained `20260911174615_client_accounting_records` at the final read-only preflight.
- User explicitly authorized continuing the production ledger migration after documentation on 2026-09-12.

Execution remains blocked until the CI gate on PR #194 is green and the exact ledger backup has been created.

## 1. Use a clean authenticated checkout

Required tools/environment:

```bash
supabase --version
node --version
```

Required authentication is supplied outside Git/chat, for example through an already authenticated Supabase CLI session or environment variables supported by the operator environment. Do not paste access tokens or database passwords into chat, Git, shell scripts, or issue comments.

Check out the reviewed head of:

```text
infra/supabase-ledger-recovery-phase1
```

Working tree must be clean.

## 2. Verify active baseline stack

```bash
npm ci
npm run check:supabase-migrations
npm run typecheck
npm run lint
npm test
```

Expected active SQL count:

```bash
find supabase/migrations -maxdepth 1 -type f -name '*.sql' | sort | wc -l
# 36
```

Expected versions are `20260912000100` through `20260912003600`, in one-minute synthetic increments, matching the explicit manifest mapping documented in `production-ledger-transition-amendment-2026-09-12.md`.

Historical SQL must exist only under:

```text
supabase/migration-history-archive/pre-baseline-20260912/
```

## 3. Link production and capture before-state

```bash
supabase link --project-ref ybtpqscmqrrjjmuoryap
supabase migration list --linked | tee migration-list-before-20260912.txt
```

Read-only expected production facts immediately before repair:

- ledger rows: **133**
- first version: `20260508082323`
- last version: `20260911174615`
- last name: `client_accounting_records`
- rows with empty `statements`: **0**
- review-safe ledger hash captured by #143 preflight: `ee21051957a23b6384a5631f9ef69fe0`

If any value differs, STOP and repeat reconciliation before continuing.

## 4. Create exact rollback backup

Preferred linked dump:

```bash
mkdir -p .ledger-repair-private
chmod 700 .ledger-repair-private

supabase db dump \
  --linked \
  --schema supabase_migrations \
  --data-only \
  --use-copy \
  --file .ledger-repair-private/schema_migrations_before_20260912.sql

sha256sum .ledger-repair-private/schema_migrations_before_20260912.sql \
  | tee .ledger-repair-private/schema_migrations_before_20260912.sha256
```

The dump and checksum are rollback material. Do not commit the dump.

Also preserve `supabase migration list --linked` output.

## 5. Derive exact old and new version arrays

Do not maintain a second handwritten 133-row list. Derive the first 132 versions from the frozen Phase-0 snapshot and append the one production migration added afterward.

```bash
mapfile -t OLD_VERSIONS < <(
  node - <<'NODE'
const fs = require('node:fs');
const snapshot = JSON.parse(fs.readFileSync('docs/migration-history/remote-ledger-2026-09-08.json', 'utf8'));
for (const row of snapshot.ledger) console.log(row.version);
console.log('20260911174615');
NODE
)

[ "${#OLD_VERSIONS[@]}" -eq 133 ] || {
  echo "STOP: expected 133 old versions, got ${#OLD_VERSIONS[@]}" >&2
  exit 1
}

mapfile -t NEW_VERSIONS < <(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' \
    | sort \
    | sed -E 's/^([0-9]{14})_.*/\1/'
)

[ "${#NEW_VERSIONS[@]}" -eq 36 ] || {
  echo "STOP: expected 36 baseline versions, got ${#NEW_VERSIONS[@]}" >&2
  exit 1
}

[ "${NEW_VERSIONS[0]}" = '20260912000100' ] || exit 1
[ "${NEW_VERSIONS[35]}" = '20260912003600' ] || exit 1
```

## 6. Before-repair dry gates

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

A history mismatch is expected at this point because production still has the 133-row legacy ledger. No SQL is authorized to run.

## 7. History-only repair

The following is the first production migration-ledger mutation.

```bash
supabase migration repair \
  "${OLD_VERSIONS[@]}" \
  --linked \
  --status reverted

supabase migration repair \
  "${NEW_VERSIONS[@]}" \
  --linked \
  --status applied
```

`migration repair` is used specifically because it updates migration tracking rather than replaying/reverting the migration SQL.

If the CLI attempts to execute application DDL/DML, STOP immediately.

## 8. Immediate after-repair gates

```bash
supabase migration list --linked | tee migration-list-after-20260912.txt
supabase db push --linked --dry-run
```

Required outcome:

- Local/Remote versions align for all 36 baseline files.
- No old remote-only version remains active.
- `db push --dry-run` reports no application SQL to apply.

Then inspect the remote ledger read-only and record:

- row count;
- versions/names;
- statement counts;
- review-safe statement hashes.

Do not accept alignment based only on `migration list`; Branching must also be proven.

## 9. Production schema invariance

Repeat the exact same pre/post fingerprint query captured immediately before repair.

Every count/hash must remain identical:

- tables: `167`
- columns: `1823`, hash `ea5725a89ae02946864f8b0a9d1d185a`
- constraints: `577`, hash `507dbdfd4ec8400ddd6c27a2239bf193`
- indexes: `495`, hash `466cf00b720afcfa5e89bd03b21992b0`
- functions: `109`, hash `9d2a98f9a47330b5fdf93b044fe47a31`
- policies: `287`, hash `e12c4eff053e3660dfc0edcf2b17776c`
- triggers: `45`, hash `1f4eac5f8436fa0c249df3911c5dfc6c`
- views: `4`, hash `230dd57eb1ace54cdda8e833445c327b`
- RLS table rows: `167`, hash `1e1cd11a0551d184d41c4a807e3770f5`

Security Advisor must also show no new #143-related ERROR/WARN.

## 10. Hosted Branching proof

Create one disposable Development Branch from the repaired production project.

Acceptance:

- branch reaches healthy state and does not end in `MIGRATIONS_FAILED`;
- all 36 baseline migrations replay;
- portable fingerprints match the validated contract;
- environment-bound production network functions/triggers are not introduced by the portable baseline;
- Security Advisor introduces no baseline-related WARN/ERROR.

Delete the branch immediately after evidence capture.

## 11. Rollback

If any post-repair gate fails:

1. stop branch/deployment activity;
2. do **not** replay old historical SQL;
3. restore the exact 133-row ledger backup, including original `statements`, through a controlled maintenance operation;
4. verify row count, first/last version and review-safe hashes;
5. verify application-schema fingerprints are still unchanged;
6. document the failed gate in #143 and keep the issue open.

The rollback backup must be retained until at least one clean hosted branch and one subsequent forward-only migration succeed after the transition.

## Current execution limitation in this ChatGPT session

The connected Supabase tool available in this session exposes schema queries/migrations and branch operations, but **does not expose `supabase migration repair`**. Direct SQL edits to `supabase_migrations.schema_migrations` are prohibited by the #143 safety contract.

Therefore the supported repair commands in section 7 must run from an already authenticated Supabase CLI environment. Everything before that boundary is versioned and reproducible in PR #194.