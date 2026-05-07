create table public.saas_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company_name text not null,
  client_count_range text not null,
  current_tools text,
  operational_problem text not null,
  pilot_interest text not null,
  consent boolean not null default false check (consent = true),
  source text not null default 'para-asesorias',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saas_leads_created_at_idx on public.saas_leads (created_at desc);
create index saas_leads_status_idx on public.saas_leads (status);
create index saas_leads_email_idx on public.saas_leads (lower(email));

alter table public.saas_leads enable row level security;

create policy "admin all saas_leads" on public.saas_leads
for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.saas_leads to service_role;
grant select, update on public.saas_leads to authenticated;
