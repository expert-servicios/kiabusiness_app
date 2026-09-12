-- Canonical billing entity model: public.companies + public.profile_companies.
-- This migration is schema-only. It does not rewrite or merge historical data.

-- profiles.active_company_id was accidentally wired to expert_companies, while
-- the dashboard, Admin and Holded flows use public.companies.
alter table public.profiles
  drop constraint if exists profiles_active_company_id_fkey;

alter table public.profiles
  add constraint profiles_active_company_id_fkey
  foreign key (active_company_id)
  references public.companies(id)
  on delete set null;

-- Stripe customer identity belongs to the contracting entity. Keep the legacy
-- profiles.stripe_customer_id read-only for backward compatibility with older
-- data, but new subscription flows are always company-scoped.
alter table public.companies
  add column if not exists stripe_customer_id text;

create unique index if not exists companies_stripe_customer_id_unique
  on public.companies(stripe_customer_id)
  where stripe_customer_id is not null;

-- checkout_sessions.user_id historically referenced public.users, but the
-- authenticated application uses auth.users/profile IDs and public.users is no
-- longer the canonical identity table. Point the FK at public.profiles instead.
-- This changes referential metadata only; it does not rewrite checkout history.
alter table public.checkout_sessions
  drop constraint if exists checkout_sessions_user_id_fkey;

alter table public.checkout_sessions
  add constraint checkout_sessions_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;

-- Persist subscription checkouts immediately so abandoned/expired checkouts
-- are visible before a subscription exists.
alter table public.checkout_sessions
  add column if not exists company_id uuid;

alter table public.checkout_sessions
  drop constraint if exists checkout_sessions_company_id_fkey;

alter table public.checkout_sessions
  add constraint checkout_sessions_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete set null;

create index if not exists checkout_sessions_company_id_idx
  on public.checkout_sessions(company_id);

create index if not exists checkout_sessions_user_status_idx
  on public.checkout_sessions(user_id, status, created_at desc);

-- subscriptions.company_id already exists; add the missing referential guard.
alter table public.subscriptions
  drop constraint if exists subscriptions_company_id_fkey;

alter table public.subscriptions
  add constraint subscriptions_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete restrict;

create index if not exists subscriptions_company_id_idx
  on public.subscriptions(company_id);

-- Stripe subscription ownership is immutable. A retry/update may change plan,
-- period or status, but it must never silently move the same Stripe subscription
-- to a different EXPERT client, company or Stripe Customer.
create or replace function public.guard_stripe_subscription_ownership()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.stripe_subscription_id is not null
     and new.stripe_subscription_id = old.stripe_subscription_id
     and (
       new.client_id is distinct from old.client_id
       or new.company_id is distinct from old.company_id
       or new.stripe_customer_id is distinct from old.stripe_customer_id
     ) then
    raise exception 'Stripe subscription ownership conflict; manual review required';
  end if;
  return new;
end;
$$;

drop trigger if exists subscriptions_guard_stripe_ownership on public.subscriptions;
create trigger subscriptions_guard_stripe_ownership
before update on public.subscriptions
for each row
execute function public.guard_stripe_subscription_ownership();

-- One-off services/quotes use the same contracting-entity model. Historical
-- quotes stay NULL: this migration does not infer or backfill old ownership.
alter table public.quotes
  add column if not exists company_id uuid;

alter table public.quotes
  drop constraint if exists quotes_company_id_fkey;

alter table public.quotes
  add constraint quotes_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete set null;

create index if not exists quotes_company_id_idx
  on public.quotes(company_id);

-- cases.company_id existed without referential integrity. Add the FK without
-- changing any existing case row.
alter table public.cases
  drop constraint if exists cases_company_id_fkey;

alter table public.cases
  add constraint cases_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete set null;

create index if not exists cases_company_id_idx
  on public.cases(company_id);

-- Derived cases/orders created from a quote inherit its company automatically.
-- This keeps legacy webhook paths safe without guessing historical ownership.
create or replace function public.inherit_quote_company_id()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  resolved_company_id uuid;
begin
  if new.quote_id is not null and new.company_id is null then
    select q.company_id into resolved_company_id
    from public.quotes q
    where q.id = new.quote_id;
    new.company_id := resolved_company_id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_inherit_quote_company on public.orders;
create trigger orders_inherit_quote_company
before insert or update of quote_id, company_id on public.orders
for each row
execute function public.inherit_quote_company_id();

drop trigger if exists cases_inherit_quote_company on public.cases;
create trigger cases_inherit_quote_company
before insert or update of quote_id, company_id on public.cases
for each row
execute function public.inherit_quote_company_id();
