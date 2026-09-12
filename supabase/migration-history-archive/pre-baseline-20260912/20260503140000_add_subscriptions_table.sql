-- Add Stripe customer ID to profiles for portal access
alter table public.profiles add column if not exists stripe_customer_id text;

-- Subscriptions: tracks recurring Stripe subscriptions per client
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  plan_name text not null default 'Suscripción',
  status text not null default 'active'
    check (status in ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "admin all subscriptions" on public.subscriptions
for all using (public.is_admin()) with check (public.is_admin());

create policy "client own subscriptions" on public.subscriptions
for select using (client_id = auth.uid());
