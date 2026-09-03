alter table public.orders
drop constraint orders_source_check;

alter table public.orders
add constraint orders_source_check
check (source = any (array[
  'quote'::text,
  'catalog'::text,
  'waba'::text,
  'academy'::text,
  'stripe_import'::text
]));
