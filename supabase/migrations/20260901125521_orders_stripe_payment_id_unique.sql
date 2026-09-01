create unique index if not exists orders_stripe_payment_id_unique
  on public.orders (stripe_payment_id)
  where stripe_payment_id is not null;