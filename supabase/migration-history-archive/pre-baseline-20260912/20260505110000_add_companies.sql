-- ── Companies (fiscal entities) ──────────────────────────────────────────────
create table public.companies (
  id               uuid        primary key default gen_random_uuid(),

  -- Identificación
  razon_social     text        not null,
  nombre_comercial text,
  cif_nif          text,
  forma_juridica   text        not null default 'autonomo'
                   check (forma_juridica in ('autonomo','sl','sa','slne','cb','cooperativa','fundacion','otra')),

  -- Dirección fiscal
  direccion        text,
  ciudad           text,
  provincia        text,
  codigo_postal    text,
  pais             text        not null default 'ES',

  -- Contacto empresa
  telefono         text,
  email            text,
  web              text,

  -- Stripe (subscripción por empresa)
  stripe_customer_id text,

  -- Auditoría
  created_by       uuid        not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Profile ↔ Company (many-to-many) ─────────────────────────────────────────
create table public.profile_companies (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner','member')),
  created_at  timestamptz not null default now(),
  primary key (profile_id, company_id)
);

-- ── Active company per profile ────────────────────────────────────────────────
alter table public.profiles
  add column if not exists active_company_id uuid references public.companies(id) on delete set null;

-- ── Nullable company_id on operational tables (backward-compat) ───────────────
alter table public.cases
  add column if not exists company_id uuid references public.companies(id) on delete set null;

alter table public.subscriptions
  add column if not exists company_id uuid references public.companies(id) on delete set null;

alter table public.orders
  add column if not exists company_id uuid references public.companies(id) on delete set null;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.companies enable row level security;
alter table public.profile_companies enable row level security;

-- Companies: owner can do everything; member can read; admin can do everything
create policy "owner manage company" on public.companies
  for all using (
    exists (
      select 1 from public.profile_companies pc
      where pc.company_id = companies.id
        and pc.profile_id = auth.uid()
        and pc.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.profile_companies pc
      where pc.company_id = companies.id
        and pc.profile_id = auth.uid()
        and pc.role = 'owner'
    )
  );

create policy "member read company" on public.companies
  for select using (
    exists (
      select 1 from public.profile_companies pc
      where pc.company_id = companies.id
        and pc.profile_id = auth.uid()
    )
  );

create policy "admin all companies" on public.companies
  for all using (public.is_admin()) with check (public.is_admin());

-- profile_companies: user manages own rows; admin can see all
create policy "user own profile_companies" on public.profile_companies
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "admin all profile_companies" on public.profile_companies
  for all using (public.is_admin()) with check (public.is_admin());
