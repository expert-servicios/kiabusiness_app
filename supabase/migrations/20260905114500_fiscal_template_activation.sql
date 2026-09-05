-- Confirmed fiscal template activation by company.
-- No template is inferred automatically. Admin/owner must activate it explicitly.

create table if not exists public.company_fiscal_templates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  template_code text not null,
  status text not null default 'active',
  effective_from date not null default current_date,
  effective_to date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_fiscal_templates_status_check check (status in ('active','inactive')),
  constraint company_fiscal_templates_dates_check check (effective_to is null or effective_to >= effective_from),
  constraint company_fiscal_templates_template_check check (template_code in (
    '303_quarterly','111_quarterly','115_quarterly','130_quarterly','202_triannual',
    '200_annual_calendar_year','390_annual','347_annual','190_annual','180_annual'
  ))
);

create unique index if not exists company_fiscal_templates_one_active
  on public.company_fiscal_templates (client_id, company_id, template_code)
  where status = 'active';

create index if not exists company_fiscal_templates_company_idx
  on public.company_fiscal_templates (company_id, status, template_code);

alter table public.company_fiscal_templates enable row level security;

drop policy if exists company_fiscal_templates_admin_all on public.company_fiscal_templates;
create policy company_fiscal_templates_admin_all
on public.company_fiscal_templates
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

alter table public.fiscal_obligations
  add column if not exists template_code text,
  add column if not exists obligations_calendar_id uuid references public.obligations_calendar(id) on delete set null;

create index if not exists fiscal_obligations_template_idx
  on public.fiscal_obligations (company_id, template_code, year);
