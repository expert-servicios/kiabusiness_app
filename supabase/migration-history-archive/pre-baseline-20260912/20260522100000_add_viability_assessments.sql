-- S1 fix: viability_assessments table was missing, causing silent failures
-- in POST /api/services/viabilidad when trying to persist precal results.

create table if not exists public.viability_assessments (
  id                  uuid        primary key default gen_random_uuid(),
  service_slug        text        not null,
  service_name        text        not null,
  client_name         text        not null,
  client_email        text        not null,
  client_phone        text,
  gdpr_consent        boolean     not null default false,
  gdpr_consent_at     timestamptz,
  answers             jsonb       not null default '{}'::jsonb,
  doc_status          jsonb       not null default '{}'::jsonb,
  ai_result           text        not null check (ai_result in ('viable', 'parcial', 'no_viable')),
  ai_emoji            text,
  ai_summary          text,
  ai_met              text[]      not null default '{}',
  ai_missing          text[]      not null default '{}',
  ai_recommendations  text[]      not null default '{}',
  ai_next_steps       text[]      not null default '{}',
  ai_escalate         boolean     not null default false,
  checkout_url        text,
  email_sent          boolean     not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists viability_assessments_service_slug_idx
  on public.viability_assessments (service_slug);

create index if not exists viability_assessments_client_email_idx
  on public.viability_assessments (lower(client_email));

create index if not exists viability_assessments_created_at_idx
  on public.viability_assessments (created_at desc);

alter table public.viability_assessments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'viability_assessments'
      and policyname = 'admin all viability_assessments'
  ) then
    execute 'create policy "admin all viability_assessments" on public.viability_assessments
      for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

grant select, insert, update, delete on public.viability_assessments to service_role;
