-- Admin clients operational status repair.
--
-- The admin CRM already treats profiles and companies as soft-deletable
-- entities. Keep that contract explicit in the schema so list/detail/edit
-- endpoints do not depend on manually-added remote columns.

alter table public.profiles
  add column if not exists status text not null default 'active';

update public.profiles
set status = 'active'
where status is null;

alter table public.profiles
  alter column status set default 'active',
  alter column status set not null;

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'inactive'));

create index if not exists profiles_role_status_idx
  on public.profiles (role, status, created_at desc);

alter table public.companies
  add column if not exists status text not null default 'active';

update public.companies
set status = 'active'
where status is null;

alter table public.companies
  alter column status set default 'active',
  alter column status set not null;

alter table public.companies
  drop constraint if exists companies_status_check;

alter table public.companies
  add constraint companies_status_check
  check (status in ('active', 'inactive'));

create index if not exists companies_status_created_idx
  on public.companies (status, created_at desc);
