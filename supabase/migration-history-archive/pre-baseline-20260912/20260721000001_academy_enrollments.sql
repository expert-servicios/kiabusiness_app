-- EXPERT Business Academy — enrollments table.
-- Separate from `cases` (a course isn't a gestoria trámite/expediente) and
-- from `orders` alone (we still insert an `orders` row too, from the Stripe
-- webhook, for financial consistency with the rest of the catalog) — this
-- table tracks the domain-specific enrollment state: which program, whether
-- the optional official certification (ADGD0210) was requested, and its
-- own admin-reviewed approval status, per docs/business-academy-implementation-plan.md.

-- The Stripe webhook inserts an `orders` row for every academy enrollment
-- (financial consistency with the rest of the catalog) — allow the new source.
alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders
  add constraint orders_source_check check (source in ('quote', 'catalog', 'waba', 'academy'));

create table public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  program_slug text not null,
  program_name text not null,
  amount_eur numeric(10,2) not null,
  stripe_payment_id text not null unique,
  status text not null default 'active' check (status in ('active', 'cancelled', 'completed')),
  certification_requested boolean not null default false,
  certification_status text not null default 'none'
    check (certification_status in ('none', 'requested', 'under_review', 'approved', 'rejected', 'paid')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index academy_enrollments_client_id_idx on public.academy_enrollments(client_id);

alter table public.academy_enrollments enable row level security;

create policy "admin all academy_enrollments" on public.academy_enrollments
for all using (public.is_admin()) with check (public.is_admin());

create policy "client own academy_enrollments" on public.academy_enrollments
for select using (client_id = auth.uid());
