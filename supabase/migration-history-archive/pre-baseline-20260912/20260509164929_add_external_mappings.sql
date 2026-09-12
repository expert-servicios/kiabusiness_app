-- External mappings for idempotent integrations.
-- Used first for Holded, but intentionally provider-neutral for future SaaS tenants.

create table if not exists public.external_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  local_entity text not null,
  local_id text not null,
  external_entity text not null,
  external_id text not null,
  tenant_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_mappings_provider_not_blank check (length(trim(provider)) > 0),
  constraint external_mappings_local_entity_not_blank check (length(trim(local_entity)) > 0),
  constraint external_mappings_local_id_not_blank check (length(trim(local_id)) > 0),
  constraint external_mappings_external_entity_not_blank check (length(trim(external_entity)) > 0),
  constraint external_mappings_external_id_not_blank check (length(trim(external_id)) > 0),
  constraint external_mappings_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists external_mappings_local_unique_idx
  on public.external_mappings (
    provider,
    coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    local_entity,
    local_id,
    external_entity
  );

create unique index if not exists external_mappings_external_unique_idx
  on public.external_mappings (
    provider,
    coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    external_entity,
    external_id
  );

create index if not exists external_mappings_provider_idx
  on public.external_mappings (provider, created_at desc);

create index if not exists external_mappings_local_idx
  on public.external_mappings (local_entity, local_id);

create index if not exists external_mappings_external_idx
  on public.external_mappings (external_entity, external_id);

alter table public.external_mappings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'external_mappings'
      and policyname = 'admin all external_mappings'
  ) then
    execute 'create policy "admin all external_mappings" on public.external_mappings
      for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

grant select, insert, update, delete on public.external_mappings to service_role;
grant select on public.external_mappings to authenticated;
