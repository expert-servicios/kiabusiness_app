-- Read-only export used by scripts/audit-supabase-migration-ledger.mjs.
--
-- Run against the linked/target Supabase database and save the JSON result to a
-- local file. The export intentionally excludes SQL bodies, secrets and Vault
-- values; it records only migration-history metadata needed for timestamp drift
-- analysis.
--
-- Example with psql-style output handling is environment-specific. The query
-- itself returns one JSON array in the `ledger` column.

select jsonb_agg(
  jsonb_build_object(
    'version', version,
    'name', name,
    'statement_count', coalesce(array_length(statements, 1), 0),
    'statements_md5', md5(coalesce(array_to_string(statements, E'\n'), ''))
  )
  order by version
) as ledger
from supabase_migrations.schema_migrations;
