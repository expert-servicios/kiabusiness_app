# #143 — Final Supabase CLI ledger repair runbook (36-step baseline)

Date: 2026-09-12  
Project: `EXPERT` / `ybtpqscmqrrjjmuoryap`  
Production PostgreSQL: **15.8**  
Validated Supabase CLI: **2.117.0**  
Status: **USER AUTHORIZED; PRE-REPAIR GATES IN PROGRESS**

This runbook supersedes the single-baseline-file sequence in `production-ledger-cli-runbook-2026-09-12.md`. The active target is the exact 36-file baseline stack that already passed fresh replay.

The CLI behavior and rollback path were independently exercised on disposable PostgreSQL and are recorded in `production-ledger-cli-contract-validation-2026-09-12.md`.

## Safety contract

- This operation changes **migration tracking only**.
- It must not execute historical or baseline application SQL against production.
- It must not change application schema or business/financial data.
- Never edit `supabase_migrations.schema_migrations` directly except the already documented controlled restore procedure if a post-mutation rollback is required.
- Never run `supabase db push` without `--dry-run` during the transition.
- Any unexpected SQL proposal, row-count mismatch, changed production tip, empty repaired statements, or schema fingerprint mismatch is an automatic STOP.
- The exact 133-row pre-repair ledger, including `statements`, must be backed up before any repair.

## Preconditions already satisfied

- Portable baseline fresh replay: **36/36 PASS**.
- Production/fresh semantic fingerprints passed for public/app/private structure, functions, RLS/policies, views, triggers, auth hooks and API-role ACL.
- Historical SQL is preserved outside the executable migration path.
- `supabase/migrations/` contains exactly the 36 validated baseline versions `20260912000100` through `20260912003600`.
- `npm run check:supabase-migrations`, typecheck, lint and the full test suite passed after the archive normalization.
- Disposable CLI contract proved `migration repair --status applied` populates `statements` while not executing the migration SQL.
- Disposable rollback contract proved the ledger can be dumped and restored with the same `statements` hash on PostgreSQL 15.
- Production migration tip remained `20260911174615_client_accounting_records` on the latest read-only preflight.
- User explicitly authorized continuing on 2026-09-12.

## 1. Clean authenticated checkout

Run only from the reviewed recovery/operations commit. Required authentication must be supplied through an authenticated environment or secret store. Never paste access tokens or database passwords into Git, chat, issue comments or workflow logs.

Record:

```bash
supabase --version
node --version
npm run check:supabase-migrations
```

Expected CLI contract version at validation time: `2.117.0`.

## 2. Derive the exact old and new version sets

The 133 old versions are derived from the frozen Phase-0 snapshot plus the one migration added after that snapshot:

```bash
mapfile -t OLD_VERSIONS < <(
  node - <<'NODE'
const fs = require('node:fs');
const snapshot = JSON.parse(fs.readFileSync('docs/migration-history/remote-ledger-2026-09-08.json', 'utf8'));
for (const row of snapshot.ledger) console.log(row.version);
console.log('20260911174615');
NODE
)

[ "${#OLD_VERSIONS[@]}" -eq 133 ] || exit 1
```

The 36 new versions are derived from the active migration directory:

```bash
mapfile -t NEW_VERSIONS < <(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' \
    | sort \
    | sed -E 's/^([0-9]{14})_.*/\1/'
)

[ "${#NEW_VERSIONS[@]}" -eq 36 ] || exit 1
[ "${NEW_VERSIONS[0]}" = '20260912000100' ] || exit 1
[ "${NEW_VERSIONS[35]}" = '20260912003600' ] || exit 1
```

The filename-to-baseline mapping is authoritative in `production-ledger-transition-amendment-2026-09-12.md`.

## 3. Link production and capture the before-state

```bash
supabase link --project-ref ybtpqscmqrrjjmuoryap
supabase migration list --linked | tee migration-list-before-20260912.txt
```

Immediately before repair the remote must still have:

- exactly **133** migration rows;
- first version `20260508082323`;
- last version `20260911174615`;
- last name `client_accounting_records`;
- **0** rows with empty `statements`;
- no `20260912000100`–`20260912003600` row yet.

If any condition differs, STOP and re-reconcile.

## 4. Exact rollback backup — raw + PG15 restore copy

Create the raw data-only ledger dump before the first tracking mutation:

```bash
mkdir -p .ledger-repair-private
chmod 700 .ledger-repair-private

supabase db dump \
  --linked \
  --schema supabase_migrations \
  --data-only \
  --use-copy \
  --file .ledger-repair-private/schema_migrations_before_20260912.raw.sql

sha256sum .ledger-repair-private/schema_migrations_before_20260912.raw.sql \
  > .ledger-repair-private/schema_migrations_before_20260912.raw.sha256
```

**Never modify the raw backup.** It is forensic rollback evidence.

Supabase CLI 2.117.0 currently uses PostgreSQL 17 dump tooling. Production is PostgreSQL 15.8. The raw dump therefore contains `SET transaction_timeout = 0;`, which PostgreSQL 15 does not recognize. Derive a restore-compatible copy by removing only that exact compatibility line:

```bash
sed '/^SET transaction_timeout = 0;$/d' \
  .ledger-repair-private/schema_migrations_before_20260912.raw.sql \
  > .ledger-repair-private/schema_migrations_before_20260912.pg15.sql

sha256sum .ledger-repair-private/schema_migrations_before_20260912.pg15.sql \
  > .ledger-repair-private/schema_migrations_before_20260912.pg15.sha256
```

The disposable rollback contract verified that the PG15 copy restores the same migration row and identical `statements` hash.

Keep both files out of Git. If stored as a CI artifact, restrict access/retention and do not expose their contents in logs.

## 5. Capture exact application-schema before fingerprint

Use the same serializer before and after repair. The canonical portable serializer is:

```text
supabase/baseline-candidate/verify_semantic_fingerprint.sql
```

Also capture Security Advisor immediately before mutation. This fingerprint is a before/after invariance gate; it is not a replacement for the previously validated fresh-build parity proof.

## 6. Dry gates

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

Before repair, history mismatch is expected because remote still has the legacy 133-row ledger. No application SQL is authorized to run.

## 7. Stage A — add the 36 baseline tracking rows first

This ordering is intentionally safer than deleting the old history first.

```bash
supabase migration repair \
  "${NEW_VERSIONS[@]}" \
  --linked \
  --status applied
```

Expected temporary state:

- legacy 133 rows are still intact;
- 36 new baseline rows also exist;
- total tracking rows = **169**;
- every new baseline row has non-empty `statements`;
- application schema/data are unchanged.

At this stage, if any gate fails, simply mark the 36 new versions reverted. The original 133-row ledger is still untouched:

```bash
supabase migration repair \
  "${NEW_VERSIONS[@]}" \
  --linked \
  --status reverted
```

Do **not** proceed to Stage B until the 36 new tracking rows and schema invariance have been independently verified.

## 8. Stage B — retire the 133 legacy tracking rows

Only after Stage A passes:

```bash
supabase migration repair \
  "${OLD_VERSIONS[@]}" \
  --linked \
  --status reverted
```

Expected final tracking state:

- exactly **36** migration rows;
- versions `20260912000100`–`20260912003600`;
- every row has non-empty `statements`;
- no legacy version remains active.

`migration repair` must not execute application DDL/DML.

## 9. Immediate final gates

```bash
supabase migration list --linked | tee migration-list-after-20260912.txt
supabase db push --linked --dry-run
```

Required result:

- all 36 Local/Remote versions align;
- dry-run reports no application SQL to apply;
- application-schema fingerprint is byte-for-byte/field-for-field identical under the same serializer used before repair;
- Security Advisor has no new #143-related ERROR/WARN;
- business/financial data were never altered by the operation.

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

### Failure before Stage B

Revert only the 36 new baseline versions. The original 133 rows remain untouched, so no raw-table restore is needed.

### Failure after Stage B

Do **not** replay historical application SQL.

Restore migration tracking only from the tested PG15-compatible backup under a controlled maintenance transaction/process. Then verify:

- row count = 133;
- first/last versions match the before-state;
- all saved `statements` hashes match the pre-repair manifest;
- application-schema fingerprint is unchanged.

The raw forensic dump and its checksum must remain preserved separately from the derived PG15 restore copy.

The rollback material remains retained until both a clean hosted branch and at least one subsequent forward-only migration have succeeded.

## Connector boundary

The connected Supabase tool in this ChatGPT session can read/query production and manage normal migrations/branches, but it does not expose the official `migration repair` operation. Direct SQL deletion/insertion of migration tracking remains prohibited as the normal execution path.

Therefore the production tracking mutation is executed only through the validated Supabase CLI path, with credentials supplied by an external secret store/CI environment and never surfaced in chat.
