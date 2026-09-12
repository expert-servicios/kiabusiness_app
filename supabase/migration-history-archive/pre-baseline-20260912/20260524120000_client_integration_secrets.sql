-- IMP-002: Separate encrypted_api_key into a secrets-only table
--
-- Security model after this migration:
--   - authenticated role: ZERO access to client_integration_secrets (no grant)
--   - service_role: full CRUD (bypasses RLS)
--   - client_integrations.encrypted_api_key: dropped after data migration
--
-- Rationale: even though our API routes never select encrypted_api_key,
-- the existing table-level SELECT grant on client_integrations (to authenticated)
-- means any owner could read their own key directly via the Supabase JS client.
-- Moving the secret to a separate table with no authenticated grant closes this.

-- ── 1. Create the secrets table ───────────────────────────────────────────────

create table if not exists public.client_integration_secrets (
  integration_id    uuid        primary key
                                references public.client_integrations(id)
                                on delete cascade,
  encrypted_api_key text        not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- RLS enabled with no policies = authenticated is blocked even with a valid JWT
alter table public.client_integration_secrets enable row level security;

-- service_role only — no grant to authenticated or anon (intentional)
grant select, insert, update, delete on public.client_integration_secrets to service_role;

-- ── 2. Migrate existing secrets ───────────────────────────────────────────────

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'client_integrations'
      and  column_name  = 'encrypted_api_key'
  ) then
    insert into public.client_integration_secrets (integration_id, encrypted_api_key, created_at, updated_at)
    select id, encrypted_api_key, created_at, now()
    from   public.client_integrations
    where  encrypted_api_key is not null
    on conflict (integration_id) do update
      set encrypted_api_key = excluded.encrypted_api_key,
          updated_at        = now();
  end if;
end $$;

-- ── 3. Drop the column from the parent table ──────────────────────────────────

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'client_integrations'
      and  column_name  = 'encrypted_api_key'
  ) then
    alter table public.client_integrations drop column encrypted_api_key;
  end if;
end $$;
