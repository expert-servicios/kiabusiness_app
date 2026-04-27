-- Core enums
create type public.lead_state as enum ('new', 'contacted', 'quoted', 'converted');
create type public.case_state as enum ('pendiente_documentacion', 'en_revision', 'en_proceso', 'presentado', 'finalizado');
create type public.document_state as enum ('pendiente', 'revisado', 'rechazado');
create type public.review_state as enum ('pending', 'approved', 'rejected');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  full_name text,
  phone text,
  country text default 'ES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Leads + conversion funnel
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  client_type text not null,
  category text not null,
  service text not null,
  country text,
  urgency text,
  message text,
  state public.lead_state not null default 'new',
  owner_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  client_id uuid references public.profiles(id),
  title text not null,
  description text not null,
  amount_eur numeric(10,2) not null,
  status text not null default 'sent' check (status in ('draft', 'sent', 'accepted', 'paid', 'expired')),
  stripe_checkout_id text,
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id),
  client_id uuid not null references public.profiles(id),
  category text not null,
  service text not null,
  state public.case_state not null default 'pendiente_documentacion',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  file_path text not null,
  original_name text not null,
  state public.document_state not null default 'pendiente',
  created_at timestamptz not null default now()
);

create table public.review_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  client_id uuid not null references public.profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  allow_publish boolean not null default false,
  status public.review_state not null default 'pending',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.review_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_logs enable row level security;

create function public.is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy "admin all profiles" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy "user own profile" on public.profiles
for select using (id = auth.uid());

create policy "admin all leads" on public.leads
for all using (public.is_admin()) with check (public.is_admin());

create policy "admin all quotes" on public.quotes
for all using (public.is_admin()) with check (public.is_admin());

create policy "client view own quotes" on public.quotes
for select using (client_id = auth.uid());

create policy "admin all cases" on public.cases
for all using (public.is_admin()) with check (public.is_admin());

create policy "client own cases" on public.cases
for select using (client_id = auth.uid());

create policy "admin all documents" on public.documents
for all using (public.is_admin()) with check (public.is_admin());

create policy "client own documents" on public.documents
for select using (client_id = auth.uid());

create policy "admin all reviews" on public.reviews
for all using (public.is_admin()) with check (public.is_admin());

create policy "public approved reviews" on public.reviews
for select using (status = 'approved' and allow_publish = true);

create policy "admin audit logs" on public.audit_logs
for select using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false),
       ('avatars', 'avatars', false),
       ('public-assets', 'public-assets', true)
on conflict (id) do nothing;
