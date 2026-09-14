create table public.orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  client_id uuid references public.profiles(id),
  stripe_payment_id text,
  amount_eur numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'paid' check (status in ('pending', 'paid', 'failed')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "admin all orders" on public.orders
for all using (public.is_admin()) with check (public.is_admin());

create policy "client own orders" on public.orders
for select using (client_id = auth.uid());
