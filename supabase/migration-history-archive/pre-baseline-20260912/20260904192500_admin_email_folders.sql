-- Shared Admin mail organization layer.
-- Does not mutate or replace existing email_events/email_inbox_cache/email_threads.

create table if not exists public.admin_email_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  system_key text unique,
  is_system boolean not null default false,
  sort_order integer not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_email_folders_name_not_blank check (length(btrim(name)) > 0),
  constraint admin_email_folders_system_key_check check (system_key is null or system_key in ('inbox','sent')),
  constraint admin_email_folders_system_consistency check (
    (is_system = true and system_key is not null)
    or
    (is_system = false and system_key is null)
  )
);

create table if not exists public.admin_email_item_state (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null,
  provider text not null,
  source_key text not null,
  folder_id uuid references public.admin_email_folders(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  is_archived boolean not null default false,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_email_item_state_source_kind_check check (source_kind in ('inbox_thread','sent_event')),
  constraint admin_email_item_state_provider_not_blank check (length(btrim(provider)) > 0),
  constraint admin_email_item_state_source_key_not_blank check (length(btrim(source_key)) > 0),
  constraint admin_email_item_state_source_unique unique (source_kind, provider, source_key)
);

create index if not exists admin_email_item_state_folder_idx
  on public.admin_email_item_state(folder_id, updated_at desc);
create index if not exists admin_email_item_state_client_idx
  on public.admin_email_item_state(client_id, updated_at desc);
create index if not exists admin_email_item_state_company_idx
  on public.admin_email_item_state(company_id, updated_at desc);
create index if not exists admin_email_item_state_case_idx
  on public.admin_email_item_state(case_id, updated_at desc);

insert into public.admin_email_folders (name, slug, system_key, is_system, sort_order)
values
  ('Entrantes', 'entrantes', 'inbox', true, 10),
  ('Enviados', 'enviados', 'sent', true, 20)
on conflict (slug) do nothing;

alter table public.admin_email_folders enable row level security;
alter table public.admin_email_item_state enable row level security;

-- Admin Panel is accessible to admin and owner roles. Keep system folders immutable
-- from authenticated clients; migration/service role owns the seeded system folders.
create policy "admin staff read email folders"
on public.admin_email_folders
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

create policy "admin staff create custom email folders"
on public.admin_email_folders
for insert
to authenticated
with check (
  is_system = false
  and system_key is null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

create policy "admin staff update custom email folders"
on public.admin_email_folders
for update
to authenticated
using (
  is_system = false
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
)
with check (
  is_system = false
  and system_key is null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

create policy "admin staff delete custom email folders"
on public.admin_email_folders
for delete
to authenticated
using (
  is_system = false
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

create policy "admin staff manage email item state"
on public.admin_email_item_state
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

grant select, insert, update, delete on public.admin_email_folders to authenticated;
grant select, insert, update, delete on public.admin_email_item_state to authenticated;
grant all on public.admin_email_folders to service_role;
grant all on public.admin_email_item_state to service_role;
