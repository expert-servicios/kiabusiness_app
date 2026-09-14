# #143 — Exact Supabase CLI ledger runbook

Date: 2026-09-12
Status: **NOT AUTHORIZED FOR EXECUTION**

This runbook makes the transition plan executable without reconstructing the 133 production versions by hand. It must be used only after explicit approval and all gates in `production-ledger-transition-plan-2026-09-12.md` pass.

## 0. Hard rules

- Run from a clean checkout of the reviewed recovery/transition branch.
- Link only to production project `ybtpqscmqrrjjmuoryap`.
- Never run `db push` without `--dry-run` during the ledger transition.
- Never replay historical DDL against production.
- Never commit the full production ledger backup until it has been reviewed for secrets/environment-bound material.
- Any unexpected CLI output means **STOP**.

## 1. Generate the portable baseline

```bash
python3 scripts/build_supabase_baseline.py \
  --version 20260912000000 \
  --name current_schema_baseline

sha256sum supabase/generated-baseline/20260912000000_current_schema_baseline.sql
```

The builder refuses environment-bound files and requires exactly 36 ordered SQL sources from `MANIFEST.md`.

Before production repair, the generated file must be fresh-replayed and fingerprinted again.

## 2. Capture the exact production ledger backup

Use a secure local `DATABASE_URL` environment variable. Do not paste the URL into shell history or Git.

```bash
pg_dump "$DATABASE_URL" \
  --data-only \
  --table=supabase_migrations.schema_migrations \
  --column-inserts \
  --no-owner \
  --no-privileges \
  > schema_migrations_before_20260912.sql

sha256sum schema_migrations_before_20260912.sql \
  > schema_migrations_before_20260912.sha256
```

Also capture a review-safe manifest:

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc \
"select version || '|' || coalesce(name,'') || '|' || coalesce(array_length(statements,1),0) || '|' || md5(coalesce(array_to_string(statements,E'\\n'),'')) from supabase_migrations.schema_migrations order by version" \
> schema_migrations_before_20260912.manifest
```

Expected row count: **133**.

## 3. Exact historical versions currently in production

```bash
OLD_VERSIONS=(
20260508082323
20260508120834
20260514150818
20260514150834
20260514150850
20260514150955
20260514170547
20260514170610
20260515175916
20260516084919
20260516092954
20260516104449
20260516112004
20260516151140
20260516185550
20260516185639
20260516192117
20260516192123
20260517075650
20260519083625
20260520102725
20260520184142
20260520190556
20260520191824
20260521150551
20260522073549
20260522073601
20260522073607
20260522091031
20260522154813
20260522160312
20260523102812
20260523110147
20260523131919
20260523142300
20260523152126
20260523152159
20260523190441
20260523191417
20260524183157
20260524183212
20260525162302
20260525172343
20260525172441
20260527123644
20260527124051
20260527193304
20260528082722
20260528082732
20260528193421
20260529080052
20260529105719
20260602092112
20260602092119
20260602165844
20260603092133
20260603164620
20260603170130
20260603170629
20260604131628
20260604131636
20260604131643
20260604131650
20260604135808
20260606171944
20260606172001
20260606172011
20260606172018
20260606172823
20260607082818
20260607092702
20260607092708
20260607092714
20260607095534
20260607100436
20260616154907
20260616154913
20260616154924
20260616154935
20260616154940
20260625194116
20260625194140
20260625200519
20260703100222
20260703181516
20260703182452
20260710105118
20260710190314
20260901125521
20260901181028
20260901181051
20260901181424
20260902193301
20260903091313
20260903092108
20260903093638
20260903094225
20260903102808
20260903103259
20260903103711
20260903104758
20260903123508
20260904072906
20260904081527
20260904082034
20260904082924
20260904083646
20260904090644
20260904102705
20260904104108
20260904104416
20260904104552
20260904195416
20260905082637
20260905083544
20260905083616
20260905113811
20260905120647
20260905122225
20260905131130
20260905140606
20260905192931
20260906131222
20260906193102
20260906193117
20260907074642
20260907100517
20260907100605
20260907100623
20260907100639
20260907180358
20260907184513
20260911174615
)

[ "${#OLD_VERSIONS[@]}" -eq 133 ] || { echo "STOP: version count is not 133"; exit 1; }
```

Re-query production immediately before repair. If the last migration or row count changed, regenerate this list and redo the full preflight; do not append blindly.

## 4. Prepare the active Git migration directory

Do this in the dedicated transition branch, not directly in `main`.

Archive the historical files outside the active migration path, then install the generated baseline as the sole active starting migration.

Example layout:

```text
supabase/
  migrations/
    20260912000000_current_schema_baseline.sql
  migrations-archive/
    pre-baseline-20260912/
      ... historical SQL files ...
```

Do not include `baseline-candidate/environment-bound/production_network_functions.sql` or its triggers in the portable baseline.

## 5. Before-repair CLI gates

```bash
supabase link --project-ref ybtpqscmqrrjjmuoryap
supabase migration list --linked
supabase db push --linked --dry-run
```

At this stage a mismatch is expected because production still has the old 133-row history. Save the output.

## 6. History-only repair — approval required immediately before this command

`migration repair` changes tracking only. It must not execute migration SQL.

```bash
supabase migration repair "${OLD_VERSIONS[@]}" \
  --linked \
  --status reverted

supabase migration repair 20260912000000 \
  --linked \
  --status applied
```

If either command reports anything other than migration-history repair, stop and begin rollback review.

## 7. Immediate after-repair gates

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

Required outcome:

- local/remote active history is aligned to baseline version `20260912000000`;
- dry-run says production is up to date / has no SQL to apply.

Then run read-only SQL checks:

```sql
select count(*) from supabase_migrations.schema_migrations;
select version, name, coalesce(array_length(statements,1),0)
from supabase_migrations.schema_migrations
order by version;
```

Do not assume an `applied` repair populated `statements` in a form suitable for Branching. That is why the fresh-branch test is mandatory.

## 8. Production schema invariance gate

Re-run the exact fingerprints from `final-fresh-validation-2026-09-12.md` and Security Advisor.

The application schema must be unchanged. A history-only operation that changes application DDL/data is a failure.

## 9. Branching proof

Create one disposable Development Branch.

Acceptance:

- branch does not finish in `MIGRATIONS_FAILED`;
- portable baseline objects exist;
- production-specific outbound-network functions/triggers are absent or separately provisioned by the approved environment-specific mechanism;
- the same portable fingerprints pass;
- Security Advisor has no new baseline WARN/ERROR.

Delete the branch immediately after evidence capture.

## 10. Rollback

If any after-repair gate fails, do **not** replay old migration SQL.

Restore the tracking table from the exact `pg_dump` backup under a controlled maintenance transaction/process, then verify the 133-row review manifest hashes.

The repair is not considered complete until:

1. baseline history is aligned;
2. production schema is unchanged;
3. a new branch bootstraps cleanly;
4. one subsequent forward-only migration can be validated without historical drift.
