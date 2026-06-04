-- IMP-014: Arquitectura tenant-ready
-- Fase 1: schema y seed. No rompe la operativa actual (tenant_id nullable = EXPERT legacy).
-- Fase 2 (SaaS): poblar tenant_id en entidades y activar RLS tenant-aware.

-- ── Tenants ───────────────────────────────────────────────────────────────────

create table if not exists public.tenants (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,
  name         text        not null,
  domain       text,
  plan         text        not null default 'starter'
               check (plan in ('starter', 'pro', 'enterprise')),
  settings     jsonb       not null default '{}',
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.tenants is
  'Cada fila es una asesoria/gestoria cliente del SaaS. '
  'slug=expert es el tenant inicial (operativa propia de EXPERT).';

alter table public.tenants enable row level security;

-- Solo service_role puede gestionar tenants (admin accede via API interna)
grant select, insert, update on public.tenants to service_role;
grant select on public.tenants to authenticated;

create policy "authenticated read own tenant" on public.tenants
  for select using (
    id in (
      select tenant_id from public.profiles
      where id = auth.uid()
        and tenant_id is not null
    )
  );

-- ── tenant_id en entidades críticas (nullable = backward compat) ──────────────

alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

alter table public.cases
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

alter table public.orders
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

alter table public.quotes
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

alter table public.companies
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

-- Índices para joins y filtros por tenant
create index if not exists profiles_tenant_id_idx  on public.profiles  (tenant_id) where tenant_id is not null;
create index if not exists cases_tenant_id_idx     on public.cases     (tenant_id) where tenant_id is not null;
create index if not exists orders_tenant_id_idx    on public.orders    (tenant_id) where tenant_id is not null;
create index if not exists quotes_tenant_id_idx    on public.quotes    (tenant_id) where tenant_id is not null;
create index if not exists companies_tenant_id_idx on public.companies (tenant_id) where tenant_id is not null;

-- ── Helper: tenant del usuario autenticado ────────────────────────────────────

create or replace function public.auth_tenant_id() returns uuid
language sql stable security definer as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

comment on function public.auth_tenant_id() is
  'Devuelve el tenant_id del usuario autenticado leyendo su perfil. '
  'NULL si el usuario pertenece a la operativa legacy EXPERT (sin tenant asignado).';

-- ── is_admin ahora también es tenant-aware ────────────────────────────────────
-- La funcion existente verifica role=admin sin filtrar por tenant.
-- Se mantiene así en Fase 1 (un solo tenant EXPERT).
-- En Fase 2 se reemplazará por: is_admin() AND auth_tenant_id() = row.tenant_id

-- ── Seed: tenant inicial EXPERT ──────────────────────────────────────────────

insert into public.tenants (slug, name, domain, plan, settings)
values (
  'expert',
  'EXPERT Consulting',
  'expertconsulting.es',
  'enterprise',
  '{
    "brand_color": "#0D1B2A",
    "support_email": "soy@expertconsulting.es",
    "whatsapp_enabled": true,
    "holded_enabled": true,
    "kia_copilot_enabled": true
  }'::jsonb
)
on conflict (slug) do update set
  name   = excluded.name,
  domain = excluded.domain,
  plan   = excluded.plan;

-- ── Roles: añadir tenant_admin al check constraint de profiles ────────────────
-- El check constraint actual es: role in ('admin', 'client')
-- Lo ampliamos para incluir 'owner' (ya en uso) y 'tenant_admin'.

do $$
begin
  -- Elimina constraint viejo si existe con nombre conocido
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles drop constraint if exists profiles_check;
exception when others then null;
end $$;

-- El rol 'owner' ya se usa en el código (lib/auth/roles.ts y require-admin.ts)
-- 'tenant_admin' = admin de una asesoria cliente del SaaS
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'owner', 'client', 'tenant_admin'));
