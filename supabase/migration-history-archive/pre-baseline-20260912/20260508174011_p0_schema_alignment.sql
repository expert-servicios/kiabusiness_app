-- P0 schema alignment
-- - Align cases with the current API state flow.
-- - Add Holded demo requests used by /api/holded-demo and /admin/holded-demos.
-- - Add integration sync events so Holded sync is visible/auditable from EXPERT.

-- Case states: keep legacy values and add the newer operational flow.
alter type public.case_state add value if not exists 'nuevo';
alter type public.case_state add value if not exists 'docs_pendientes';
alter type public.case_state add value if not exists 'docs_recibidos';
alter type public.case_state add value if not exists 'en_tramitacion';
alter type public.case_state add value if not exists 'pendiente_externo';
alter type public.case_state add value if not exists 'resolucion_recibida';
alter type public.case_state add value if not exists 'entregado';

alter table public.cases
  add column if not exists admin_note text,
  add column if not exists docs_checklist jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.cases
set docs_checklist = '[]'::jsonb
where docs_checklist is null;

alter table public.cases
  alter column docs_checklist set default '[]'::jsonb,
  alter column docs_checklist set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cases_docs_checklist_is_array'
      and conrelid = 'public.cases'::regclass
  ) then
    alter table public.cases
      add constraint cases_docs_checklist_is_array
      check (jsonb_typeof(docs_checklist) = 'array');
  end if;
end $$;

create index if not exists cases_state_idx on public.cases (state);
create index if not exists cases_updated_at_idx on public.cases (updated_at desc);

alter table public.quotes
  add column if not exists docs_checklist jsonb not null default '[]'::jsonb;

update public.quotes
set docs_checklist = '[]'::jsonb
where docs_checklist is null;

alter table public.quotes
  alter column docs_checklist set default '[]'::jsonb,
  alter column docs_checklist set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotes_docs_checklist_is_array'
      and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_docs_checklist_is_array
      check (jsonb_typeof(docs_checklist) = 'array');
  end if;
end $$;

alter table public.subscriptions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Holded demo requests from the free Holded plan funnel.
create table if not exists public.holded_demos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company_name text not null,
  company_type text,
  employees_count text,
  current_software text,
  needs text,
  status text not null default 'pending'
    check (status in ('pending', 'demo_active', 'onboarding_done', 'training_done', 'converted', 'closed')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists holded_demos_created_at_idx on public.holded_demos (created_at desc);
create index if not exists holded_demos_status_idx on public.holded_demos (status);
create index if not exists holded_demos_email_idx on public.holded_demos (lower(email));

alter table public.holded_demos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'holded_demos'
      and policyname = 'admin all holded_demos'
  ) then
    execute 'create policy "admin all holded_demos" on public.holded_demos
      for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

grant select, insert, update, delete on public.holded_demos to service_role;
grant select, update on public.holded_demos to authenticated;

-- Generic sync log for Holded now and tenant-aware integrations later.
create table if not exists public.integration_sync_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  direction text not null check (direction in ('to_external', 'from_external')),
  operation text not null,
  local_entity text,
  local_id text,
  external_entity text,
  external_id text,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'skipped')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  request_payload jsonb,
  response_payload jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_sync_events_provider_created_idx
  on public.integration_sync_events (provider, created_at desc);

create index if not exists integration_sync_events_status_created_idx
  on public.integration_sync_events (status, created_at desc);

create index if not exists integration_sync_events_local_idx
  on public.integration_sync_events (local_entity, local_id);

create index if not exists integration_sync_events_external_idx
  on public.integration_sync_events (external_entity, external_id);

alter table public.integration_sync_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'integration_sync_events'
      and policyname = 'admin all integration_sync_events'
  ) then
    execute 'create policy "admin all integration_sync_events" on public.integration_sync_events
      for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

grant select, insert, update, delete on public.integration_sync_events to service_role;
grant select on public.integration_sync_events to authenticated;
