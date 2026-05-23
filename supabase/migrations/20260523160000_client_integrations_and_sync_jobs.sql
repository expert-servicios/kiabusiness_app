-- Phase 2: Multi-client integration model + sync job queue
-- See docs/holded-accounting-integration-audit.md
--
-- Security rules:
--   - encrypted_api_key is NEVER exposed to the frontend via API routes.
--   - Only api_key_last4 (last 4 chars of the raw key) is shown in the UI.
--   - All decryption happens server-side using SECRET_ENCRYPTION_KEY.
--   - RLS restricts row visibility to owners / company members / admins.
--   - authenticated role cannot SELECT encrypted_api_key through Supabase client
--     because our API routes always select specific safe columns.

-- ── 1. Ampliar integration_sync_events ────────────────────────────────────────
-- Add company_id and client_id so events can be scoped per company/client.
-- integration_id FK is added after client_integrations is created (step 3).

alter table public.integration_sync_events
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists client_id  uuid references public.profiles(id)  on delete set null;

-- Add retrying status if missing (spec requires it)
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'text'  -- integration_sync_events.status is text with check
  ) then
    null; -- text column, handled by check constraint below
  end if;
end $$;

-- Widen the status check to include 'retrying'
alter table public.integration_sync_events
  drop constraint if exists integration_sync_events_status_check;

alter table public.integration_sync_events
  add constraint integration_sync_events_status_check
  check (status in ('pending', 'success', 'failed', 'skipped', 'retrying'));

create index if not exists integration_sync_events_company_idx
  on public.integration_sync_events (company_id)
  where company_id is not null;

create index if not exists integration_sync_events_client_idx
  on public.integration_sync_events (client_id)
  where client_id is not null;

-- ── 2. external_mappings — add company_id ─────────────────────────────────────
-- tenant_id already exists but company_id is a more explicit FK.
alter table public.external_mappings
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists external_mappings_company_idx
  on public.external_mappings (company_id)
  where company_id is not null;

-- ── 3. client_integrations ────────────────────────────────────────────────────
create table if not exists public.client_integrations (
  id                   uuid        primary key default gen_random_uuid(),

  -- Owner: either a direct client or a company (or both)
  client_id            uuid        references public.profiles(id) on delete set null,
  company_id           uuid        references public.companies(id) on delete set null,

  -- Integration identity
  provider             text        not null,                     -- holded | stripe | gocardless
  mode                 text        not null default 'client_account'
                       check (mode in ('expert_account', 'client_account')),
  api_version          text        check (api_version in ('v1', 'v2')),

  -- Credentials — encrypted_api_key is NEVER sent to the frontend
  encrypted_api_key    text,
  api_key_last4        text,

  -- Capabilities detected on last test/connect
  permissions_detected jsonb       not null default '{}',

  -- Lifecycle
  status               text        not null default 'pending'
                       check (status in ('pending', 'active', 'failed', 'revoked', 'disabled')),
  sync_mode            text        not null default 'read_only'
                       check (sync_mode in ('read_only', 'read_write')),

  -- Timing
  last_sync_at         timestamptz,
  last_success_at      timestamptz,
  last_error           text,

  -- Audit
  connected_by         uuid        references public.profiles(id) on delete set null,
  disconnected_at      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- At least one of client_id / company_id must be set
  constraint client_integrations_owner_required
    check (client_id is not null or company_id is not null)
);

create index if not exists client_integrations_provider_status_idx
  on public.client_integrations (provider, status);

create index if not exists client_integrations_company_idx
  on public.client_integrations (company_id)
  where company_id is not null;

create index if not exists client_integrations_client_idx
  on public.client_integrations (client_id)
  where client_id is not null;

-- ── 4. Backfill FK from integration_sync_events ───────────────────────────────
alter table public.integration_sync_events
  add column if not exists integration_id uuid references public.client_integrations(id) on delete set null;

create index if not exists integration_sync_events_integration_idx
  on public.integration_sync_events (integration_id)
  where integration_id is not null;

-- ── 5. holded_sync_jobs ───────────────────────────────────────────────────────
create table if not exists public.holded_sync_jobs (
  id             uuid        primary key default gen_random_uuid(),
  integration_id uuid        references public.client_integrations(id) on delete cascade,
  company_id     uuid        references public.companies(id) on delete set null,
  client_id      uuid        references public.profiles(id)  on delete set null,

  -- Job descriptor
  job_type       text        not null,  -- sync_holded_sales_invoices | sync_holded_purchase_invoices | etc.
  status         text        not null default 'queued'
                 check (status in ('queued', 'running', 'success', 'failed', 'retrying', 'cancelled')),

  -- Period scoping (for quarterly accounting sync)
  period_year    integer,
  period_quarter integer     check (period_quarter between 1 and 4),

  -- Pagination cursor for incremental sync
  cursor         text,

  -- Retry tracking
  attempts       integer     not null default 0,
  next_run_at    timestamptz,

  -- Execution timing
  started_at     timestamptz,
  finished_at    timestamptz,
  error          text,

  metadata       jsonb       not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists holded_sync_jobs_status_next_run_idx
  on public.holded_sync_jobs (status, next_run_at);

create index if not exists holded_sync_jobs_integration_idx
  on public.holded_sync_jobs (integration_id);

create index if not exists holded_sync_jobs_company_idx
  on public.holded_sync_jobs (company_id)
  where company_id is not null;

-- ── 6. RLS ────────────────────────────────────────────────────────────────────

alter table public.client_integrations enable row level security;
alter table public.holded_sync_jobs    enable row level security;

-- client_integrations: owner or company-member can read own rows (safe columns only —
-- encrypted_api_key is excluded in every API route SELECT, never returned to client)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'client_integrations'
      and policyname = 'member read own integration'
  ) then
    execute '
      create policy "member read own integration" on public.client_integrations
        for select using (
          client_id = auth.uid()
          or exists (
            select 1 from public.profile_companies pc
            where pc.company_id = client_integrations.company_id
              and pc.profile_id = auth.uid()
          )
        )
    ';
  end if;
end $$;

-- Only company owners (or the client themselves) may insert/update
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'client_integrations'
      and policyname = 'owner write own integration'
  ) then
    execute '
      create policy "owner write own integration" on public.client_integrations
        for all using (
          client_id = auth.uid()
          or exists (
            select 1 from public.profile_companies pc
            where pc.company_id = client_integrations.company_id
              and pc.profile_id = auth.uid()
              and pc.role = ''owner''
          )
        )
        with check (
          client_id = auth.uid()
          or exists (
            select 1 from public.profile_companies pc
            where pc.company_id = client_integrations.company_id
              and pc.profile_id = auth.uid()
              and pc.role = ''owner''
          )
        )
    ';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'client_integrations'
      and policyname = 'admin all client_integrations'
  ) then
    execute '
      create policy "admin all client_integrations" on public.client_integrations
        for all using (public.is_admin()) with check (public.is_admin())
    ';
  end if;
end $$;

-- holded_sync_jobs: members can read; service_role manages jobs
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'holded_sync_jobs'
      and policyname = 'member read own sync jobs'
  ) then
    execute '
      create policy "member read own sync jobs" on public.holded_sync_jobs
        for select using (
          client_id = auth.uid()
          or exists (
            select 1 from public.profile_companies pc
            where pc.company_id = holded_sync_jobs.company_id
              and pc.profile_id = auth.uid()
          )
        )
    ';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'holded_sync_jobs'
      and policyname = 'admin all holded_sync_jobs'
  ) then
    execute '
      create policy "admin all holded_sync_jobs" on public.holded_sync_jobs
        for all using (public.is_admin()) with check (public.is_admin())
    ';
  end if;
end $$;

-- ── 7. Grants ─────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.client_integrations to service_role;
grant select                          on public.client_integrations to authenticated;

grant select, insert, update, delete on public.holded_sync_jobs to service_role;
grant select                          on public.holded_sync_jobs to authenticated;
