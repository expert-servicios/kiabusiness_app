-- RLS tenant-aware Fase 2
-- Añade políticas para tenant_admin sobre cases, profiles, documents y companies.
-- auth_tenant_id() ya existe (fase 1). Nuevas políticas no rompen las existentes.

-- ── Helper: is_tenant_admin() ─────────────────────────────────────────────────

create or replace function public.is_tenant_admin() returns boolean
language sql stable security definer as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'tenant_admin'
      and tenant_id is not null
  )
$$;

comment on function public.is_tenant_admin() is
  'Devuelve true si el usuario autenticado es tenant_admin con tenant asignado.';

-- ── cases ─────────────────────────────────────────────────────────────────────
-- tenant_admin puede SELECT/INSERT/UPDATE/DELETE sobre expedientes de su tenant.

drop policy if exists "tenant_admin all cases" on public.cases;
create policy "tenant_admin all cases" on public.cases
  for all using (
    is_tenant_admin() and tenant_id = auth_tenant_id()
  );

-- ── profiles ──────────────────────────────────────────────────────────────────
-- tenant_admin puede ver los perfiles de clientes de su tenant.

drop policy if exists "tenant_admin select profiles" on public.profiles;
create policy "tenant_admin select profiles" on public.profiles
  for select using (
    is_tenant_admin() and tenant_id = auth_tenant_id()
  );

-- tenant_admin puede actualizar su propio perfil (ya cubierto por "user own profile").
-- No se añade UPDATE para evitar que pueda modificar perfiles de clientes.

-- ── documents ─────────────────────────────────────────────────────────────────
-- tenant_admin puede ver y subir documentos de clientes de su tenant.
-- Subconsulta usa SECURITY DEFINER vía auth_tenant_id(), sin cost de join.

drop policy if exists "tenant_admin all documents" on public.documents;
create policy "tenant_admin all documents" on public.documents
  for all using (
    is_tenant_admin() and client_id in (
      select id from public.profiles
      where tenant_id = auth_tenant_id()
    )
  );

-- ── companies ─────────────────────────────────────────────────────────────────
-- tenant_admin puede ver empresas de clientes de su tenant.

drop policy if exists "tenant_admin select companies" on public.companies;
create policy "tenant_admin select companies" on public.companies
  for select using (
    is_tenant_admin() and tenant_id = auth_tenant_id()
  );

-- ── orders ────────────────────────────────────────────────────────────────────
drop policy if exists "tenant_admin select orders" on public.orders;
create policy "tenant_admin select orders" on public.orders
  for select using (
    is_tenant_admin() and tenant_id = auth_tenant_id()
  );

-- ── quotes ────────────────────────────────────────────────────────────────────
drop policy if exists "tenant_admin select quotes" on public.quotes;
create policy "tenant_admin select quotes" on public.quotes
  for select using (
    is_tenant_admin() and tenant_id = auth_tenant_id()
  );

-- ── Índice de apoyo para la subconsulta de documents ─────────────────────────
-- Permite resolver la subconsulta (profiles.tenant_id = auth_tenant_id()) en O(log n).
-- El índice en profiles(tenant_id) ya existe (de fase 1). Solo añadir si falta.
create index if not exists profiles_role_tenant_idx
  on public.profiles (role, tenant_id)
  where role = 'tenant_admin' and tenant_id is not null;
