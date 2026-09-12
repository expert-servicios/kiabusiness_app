-- Checkout readiness and Holded invoice traceability.
--
-- Profiles need explicit completion flags because checkout must not rely on
-- frontend-only validation. Orders keep the Stripe payment even when Holded
-- invoice creation fails.

alter table public.profiles
  add column if not exists client_type text,
  add column if not exists company text,
  add column if not exists tax_id text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists province text,
  add column if not exists billing_country text not null default 'ES',
  add column if not exists habitual_address text,
  add column if not exists habitual_city text,
  add column if not exists habitual_postal_code text,
  add column if not exists habitual_province text,
  add column if not exists habitual_country text not null default 'ES',
  add column if not exists profile_completed boolean not null default false,
  add column if not exists billing_ready boolean not null default false,
  add column if not exists habitual_address_ready boolean not null default false,
  add column if not exists profile_completed_at timestamptz,
  add column if not exists billing_ready_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_client_type_allowed'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_client_type_allowed
      check (client_type in ('particular', 'autonomo', 'empresa'));
  end if;
exception
  when undefined_column then
    alter table public.profiles add column if not exists client_type text;
    alter table public.profiles
      add constraint profiles_client_type_allowed
      check (client_type in ('particular', 'autonomo', 'empresa'));
end $$;

update public.profiles
set profile_completed = true,
    profile_completed_at = coalesce(profile_completed_at, now())
where profile_completed = false
  and full_name is not null
  and phone is not null;

update public.profiles
set billing_ready = true,
    billing_ready_at = coalesce(billing_ready_at, now())
where billing_ready = false
  and tax_id is not null
  and address is not null
  and city is not null
  and postal_code is not null;

create index if not exists profiles_checkout_readiness_idx
  on public.profiles (profile_completed, billing_ready);

alter table public.orders
  add column if not exists holded_invoice_id text,
  add column if not exists holded_sync_event_id text,
  add column if not exists holded_sync_error text,
  add column if not exists holded_synced_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'paid_invoice_error'));

create index if not exists orders_holded_invoice_idx
  on public.orders (holded_invoice_id)
  where holded_invoice_id is not null;
