-- EXPERT P0 verification queries
-- Run after applying supabase/migrations/20260508174011_p0_schema_alignment.sql.
-- These queries are read-only.

select
  'case_state enum values' as check_name,
  enum_range(null::public.case_state)::text[] as result;

select
  'critical tables' as check_name,
  jsonb_build_object(
    'saas_leads', to_regclass('public.saas_leads') is not null,
    'holded_demos', to_regclass('public.holded_demos') is not null,
    'integration_sync_events', to_regclass('public.integration_sync_events') is not null
  ) as result;

select
  'cases columns' as check_name,
  jsonb_object_agg(column_name, data_type order by column_name) as result
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cases'
  and column_name in ('admin_note', 'docs_checklist', 'updated_at');

select
  'subscriptions metadata column' as check_name,
  jsonb_object_agg(column_name, data_type order by column_name) as result
from information_schema.columns
where table_schema = 'public'
  and table_name = 'subscriptions'
  and column_name = 'metadata';

select
  'quotes docs_checklist column' as check_name,
  jsonb_object_agg(column_name, data_type order by column_name) as result
from information_schema.columns
where table_schema = 'public'
  and table_name = 'quotes'
  and column_name = 'docs_checklist';

select
  'rls enabled' as check_name,
  jsonb_object_agg(relname, relrowsecurity order by relname) as result
from pg_class
where oid in (
  'public.saas_leads'::regclass,
  'public.holded_demos'::regclass,
  'public.integration_sync_events'::regclass
);

select
  'admin policies' as check_name,
  jsonb_agg(
    jsonb_build_object(
      'table', tablename,
      'policy', policyname,
      'roles', roles,
      'command', cmd
    )
    order by tablename, policyname
  ) as result
from pg_policies
where schemaname = 'public'
  and tablename in ('saas_leads', 'holded_demos', 'integration_sync_events');

select
  'integration sync recent rows' as check_name,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'provider', provider,
        'operation', operation,
        'status', status,
        'local_entity', local_entity,
        'local_id', local_id,
        'external_entity', external_entity,
        'external_id', external_id,
        'created_at', created_at
      )
      order by created_at desc
    ),
    '[]'::jsonb
  ) as result
from (
  select *
  from public.integration_sync_events
  order by created_at desc
  limit 10
) recent_events;
