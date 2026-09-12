-- S2 fix: fiscal_obligations table was missing, causing silent query errors
-- in WABA webhook context builder, fiscal calendar admin routes, and
-- the daily fiscal-reminders cron job.

create table if not exists public.fiscal_obligations (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  company_id      uuid        references public.companies(id) on delete set null,
  year            int         not null,
  obligation_key  text        not null,
  modelo          text        not null,
  description     text        not null,
  period_label    text,
  deadline        date        not null,
  status          text        not null default 'pending'
                    check (status in ('pending', 'done', 'na')),
  notes           text,
  google_event_id text,
  reminded_30d_at timestamptz,
  reminded_7d_at  timestamptz,
  reminded_1d_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- NULLS NOT DISTINCT (pg15+) treats NULL=NULL in uniqueness so upsert
-- on (user_id, company_id, year, obligation_key) works when company_id is null.
create unique index if not exists fiscal_obligations_upsert_key
  on public.fiscal_obligations (user_id, company_id, year, obligation_key)
  nulls not distinct;

create index if not exists fiscal_obligations_user_year_idx
  on public.fiscal_obligations (user_id, year);

create index if not exists fiscal_obligations_status_deadline_idx
  on public.fiscal_obligations (status, deadline);

create or replace function public.set_fiscal_obligations_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists fiscal_obligations_updated_at on public.fiscal_obligations;
create trigger fiscal_obligations_updated_at
  before update on public.fiscal_obligations
  for each row execute function public.set_fiscal_obligations_updated_at();

alter table public.fiscal_obligations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'fiscal_obligations'
      and policyname = 'admin all fiscal_obligations'
  ) then
    execute 'create policy "admin all fiscal_obligations" on public.fiscal_obligations
      for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'fiscal_obligations'
      and policyname = 'client own fiscal_obligations'
  ) then
    execute 'create policy "client own fiscal_obligations" on public.fiscal_obligations
      for select using (user_id = auth.uid())';
  end if;
end $$;

grant select, insert, update, delete on public.fiscal_obligations to service_role;
grant select on public.fiscal_obligations to authenticated;
