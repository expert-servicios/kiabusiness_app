# #143 — Supabase CLI migration-repair contract validation

Date: 2026-09-12  
Production project: `EXPERT` / `ybtpqscmqrrjjmuoryap`  
Production PostgreSQL: **15.8**  
CLI exercised in CI: **Supabase CLI 2.117.0**

## Purpose

Before any production migration-ledger mutation, #143 validates the exact behavior relied on by the transition plan against a disposable PostgreSQL database. No production database was used by this contract test.

## Tracking-only repair proof

A disposable migration file containing a real `CREATE TABLE` statement was created, then marked applied with:

```text
supabase migration repair <version> --status applied
```

Observed and asserted:

- one row was created in `supabase_migrations.schema_migrations`;
- `statements` was populated (`statement_count = 1`);
- the test table was **not** created;
- therefore `migration repair --status applied` changed tracking only and did not execute the migration SQL;
- `migration repair --status reverted` removed the tracking row without running the migration SQL.

This proves the specific contract required for the 36-file baseline stack: the repair can populate migration statements from the local file while leaving the application schema untouched.

## Exact rollback-backup proof

The populated test ledger was exported using the same data-only Supabase CLI dump mechanism planned for production. The original dump was retained unchanged and hashed.

A compatibility issue was intentionally caught during the first restore attempt:

- current Supabase CLI 2.117.0 uses PostgreSQL 17 dump tooling;
- its SQL dump includes `SET transaction_timeout = 0;`;
- production is PostgreSQL 15.8;
- PostgreSQL 15 does not recognize the `transaction_timeout` GUC.

The production rollback procedure therefore preserves two artifacts:

1. **raw forensic backup** — byte-for-byte output from `supabase db dump`, never modified;
2. **PG15 restore copy** — deterministically derived from the raw backup by removing only the exact line `SET transaction_timeout = 0;`.

The CI contract then:

1. created and hashed the raw ledger backup;
2. generated the PG15-compatible restore copy;
3. marked the test migration reverted;
4. verified the row disappeared;
5. restored the PG15-compatible dump;
6. verified the migration row returned;
7. verified the restored `statements` hash exactly matched the pre-backup hash;
8. verified the migration's application DDL had still never executed.

Result: **PASS**.

## Safer production ordering derived from the proof

The production transition should not remove the 133 legacy rows first. The safer order is:

1. capture and hash the exact 133-row backup;
2. mark all 36 baseline versions `applied` while the 133 legacy rows still exist;
3. verify all 36 new rows exist and have non-empty `statements`;
4. verify application-schema invariance;
5. only then mark the 133 legacy versions `reverted`;
6. run final migration-list, dry-run, schema, Security Advisor and Branching gates.

Until step 5, rollback is non-destructive: mark the 36 new versions reverted and the original 133-row ledger remains untouched.

If a failure occurs after step 5, restore the exact 133-row backup using the tested PG15-compatible restore copy; never replay historical application SQL.

## Safety result

This validation changes no production schema, data or migration history. It removes two previously untested assumptions from the production transition:

- repaired `applied` rows do contain migration `statements`;
- the exact ledger can be restored on production's PostgreSQL major version using the documented compatibility derivation.
