-- #143 migration-history recovery
-- Candidate declarative baseline for the current portable `app` schema.
--
-- IMPORTANT:
-- - This directory is intentionally NOT wired into [db.migrations].schema_paths yet.
-- - This file contains schema only; it copies no production rows or secrets.
-- - app.assign_master_admin() is intentionally excluded because the production
--   function embeds an environment-specific user identity and has no active trigger.
-- - Validated on disposable Development Branch umincarqwnizafuegfcf on 2026-09-10.

create schema if not exists app authorization postgres;

create extension if not exists citext with schema app;

create table app.contacts (
  id bigserial not null,
  company_id bigint not null,
  type text not null,
  name text not null,
  nif text,
  email text,
  phone text,
  address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_pkey primary key (id),
  constraint contacts_type_check check (type = any (array['customer'::text, 'supplier'::text]))
);

create table app.plans (
  code text not null,
  name text not null,
  price_cents integer not null default 0,
  company_limit integer not null default 1,
  ticket_bundle integer not null default 0,
  created_at timestamptz default now(),
  constraint plans_pkey primary key (code)
);

create table app.purchase_invoices (
  id uuid not null default gen_random_uuid(),
  company_id bigint not null,
  contact_id bigint not null,
  number text not null,
  issue_date date not null,
  due_date date,
  irpf_declared numeric(14,2),
  is_capex boolean not null default false,
  notes text,
  status text not null default 'booked'::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_invoices_pkey primary key (id),
  constraint purchase_invoices_company_id_number_key unique (company_id, number),
  constraint purchase_invoices_contact_id_fkey foreign key (contact_id) references app.contacts(id) on delete restrict
);

create table app.purchase_invoice_items (
  id bigserial not null,
  invoice_id uuid not null,
  concept text not null,
  qty numeric(12,4) not null default 1,
  unit_price numeric(14,6) not null default 0,
  tax_rate numeric(5,2) not null default 21,
  position integer not null default 1,
  constraint purchase_invoice_items_pkey primary key (id),
  constraint purchase_invoice_items_invoice_id_fkey foreign key (invoice_id) references app.purchase_invoices(id) on delete cascade
);

create table app.sales_invoices (
  id uuid not null default gen_random_uuid(),
  company_id bigint not null,
  contact_id bigint not null,
  number text not null,
  issue_date date not null,
  due_date date,
  irpf_declared numeric(14,2),
  notes text,
  status text not null default 'issued'::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  withhold_irpf boolean not null default false,
  irpf_rate numeric(5,2) not null default 19.00,
  constraint sales_invoices_pkey primary key (id),
  constraint sales_invoices_company_id_number_key unique (company_id, number),
  constraint sales_invoices_contact_id_fkey foreign key (contact_id) references app.contacts(id) on delete restrict
);

create table app.sales_invoice_items (
  id bigserial not null,
  invoice_id uuid not null,
  concept text not null,
  qty numeric(12,4) not null default 1,
  unit_price numeric(14,6) not null default 0,
  tax_rate numeric(5,2) not null default 21,
  position integer not null default 1,
  constraint sales_invoice_items_pkey primary key (id),
  constraint sales_invoice_items_invoice_id_fkey foreign key (invoice_id) references app.sales_invoices(id) on delete cascade
);

create table app.subscription_overrides (
  user_id uuid not null,
  company_limit_override integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint subscription_overrides_pkey primary key (user_id)
);

create table app.subscriptions (
  user_id uuid not null,
  plan_code text not null,
  status text not null default 'active'::text,
  trial_until date,
  started_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint subscriptions_pkey primary key (user_id),
  constraint subscriptions_plan_code_fkey foreign key (plan_code) references app.plans(code)
);

create table app.user_companies (
  user_id uuid not null,
  company_id bigint not null,
  role text not null default 'owner'::text,
  constraint user_companies_pkey primary key (user_id, company_id)
);

create table app.user_integrations (
  user_id uuid not null,
  integration_name text not null,
  access_token text,
  refresh_token text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint user_integrations_pkey primary key (user_id, integration_name)
);

create table app.user_profile (
  user_id uuid not null,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profile_pkey primary key (user_id)
);

create unique index contacts_unique_company_type_nif_name_idx
  on app.contacts using btree (company_id, type, coalesce(nif, ''::text), lower(name));
create index pitems_invoice_idx on app.purchase_invoice_items using btree (invoice_id);
create index purchase_invoices_company_issue_idx on app.purchase_invoices using btree (company_id, issue_date);
create index sitems_invoice_idx on app.sales_invoice_items using btree (invoice_id);
create index sales_invoices_company_issue_idx on app.sales_invoices using btree (company_id, issue_date);

create or replace function app.user_has_company(target_company_id bigint)
returns boolean
language sql
stable
set search_path to 'app', 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from app.user_companies uc
    where uc.user_id = auth.uid()
      and uc.company_id = target_company_id
  );
$function$;

create or replace function app.can_create_company(p_user uuid)
returns table(can_create boolean, current_count integer, max_allowed integer)
language sql
stable
set search_path to 'app', 'public', 'pg_temp'
as $function$
  with sub as (
    select coalesce(o.company_limit_override, p.company_limit) as limit
    from app.subscriptions s
    join app.plans p on p.code = s.plan_code
    left join app.subscription_overrides o on o.user_id = s.user_id
    where s.user_id = p_user and s.status = 'active'
  ),
  cnt as (
    select count(*)::int as n
    from app.user_companies
    where user_id = p_user
  )
  select (cnt.n < sub.limit), cnt.n, sub.limit
  from sub, cnt
$function$;

alter table app.contacts enable row level security;
alter table app.plans enable row level security;
alter table app.purchase_invoice_items enable row level security;
alter table app.purchase_invoices enable row level security;
alter table app.sales_invoice_items enable row level security;
alter table app.sales_invoices enable row level security;
alter table app.subscriptions enable row level security;
alter table app.user_companies enable row level security;
alter table app.user_integrations enable row level security;

create policy contacts_all_own on app.contacts
  as permissive for all to authenticated
  using (app.user_has_company(company_id))
  with check (app.user_has_company(company_id));

create policy plans_read_all on app.plans
  as permissive for select to authenticated
  using (true);

create policy purchase_items_all_own on app.purchase_invoice_items
  as permissive for all to authenticated
  using (exists (
    select 1 from app.purchase_invoices pi
    where pi.id = purchase_invoice_items.invoice_id
      and app.user_has_company(pi.company_id)
  ))
  with check (exists (
    select 1 from app.purchase_invoices pi
    where pi.id = purchase_invoice_items.invoice_id
      and app.user_has_company(pi.company_id)
  ));

create policy purchase_invoices_all_own on app.purchase_invoices
  as permissive for all to authenticated
  using (app.user_has_company(company_id))
  with check (app.user_has_company(company_id));

create policy sales_items_all_own on app.sales_invoice_items
  as permissive for all to authenticated
  using (exists (
    select 1 from app.sales_invoices si
    where si.id = sales_invoice_items.invoice_id
      and app.user_has_company(si.company_id)
  ))
  with check (exists (
    select 1 from app.sales_invoices si
    where si.id = sales_invoice_items.invoice_id
      and app.user_has_company(si.company_id)
  ));

create policy sales_invoices_all_own on app.sales_invoices
  as permissive for all to authenticated
  using (app.user_has_company(company_id))
  with check (app.user_has_company(company_id));

create policy subscriptions_self on app.subscriptions
  as permissive for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_companies_select_self on app.user_companies
  as permissive for select to authenticated
  using (user_id = auth.uid());

create policy user_integrations_self on app.user_integrations
  as permissive for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace view app.v_purchases_totals as
select pi.id,
       pi.company_id,
       pi.contact_id,
       pi.number,
       pi.issue_date,
       pi.is_capex,
       coalesce(sum(ii.qty * ii.unit_price), 0::numeric)::numeric(14,2) as base_calc,
       coalesce(sum(ii.qty * ii.unit_price * ii.tax_rate / 100::numeric), 0::numeric)::numeric(14,2) as vat_calc,
       coalesce(pi.irpf_declared, 0::numeric)::numeric(14,2) as irpf,
       (coalesce(sum(ii.qty * ii.unit_price), 0::numeric)
        + coalesce(sum(ii.qty * ii.unit_price * ii.tax_rate / 100::numeric), 0::numeric)
        - coalesce(pi.irpf_declared, 0::numeric))::numeric(14,2) as total_calc
from app.purchase_invoices pi
left join app.purchase_invoice_items ii on ii.invoice_id = pi.id
group by pi.id;

create or replace view app.v_sales_totals as
with bases as (
  select si.id,
         si.company_id,
         si.contact_id,
         si.number,
         si.issue_date,
         si.withhold_irpf,
         si.irpf_rate,
         si.irpf_declared,
         coalesce(sum(ii.qty * ii.unit_price), 0::numeric)::numeric(14,2) as base_calc,
         coalesce(sum(ii.qty * ii.unit_price * ii.tax_rate / 100::numeric), 0::numeric)::numeric(14,2) as vat_calc
  from app.sales_invoices si
  left join app.sales_invoice_items ii on ii.invoice_id = si.id
  group by si.id
)
select b.id,
       b.company_id,
       b.contact_id,
       b.number,
       b.issue_date,
       b.base_calc,
       b.vat_calc,
       coalesce(
         b.irpf_declared,
         case when b.withhold_irpf then round(b.base_calc * (b.irpf_rate / 100.0), 2) else 0::numeric end,
         0::numeric
       )::numeric(14,2) as irpf,
       (b.base_calc + b.vat_calc - coalesce(
         b.irpf_declared,
         case when b.withhold_irpf then round(b.base_calc * (b.irpf_rate / 100.0), 2) else 0::numeric end,
         0::numeric
       ))::numeric(14,2) as total_calc
from bases b;

grant all privileges on sequence app.contacts_id_seq to anon, authenticated, service_role;
grant all privileges on sequence app.purchase_invoice_items_id_seq to anon, authenticated, service_role;
grant all privileges on sequence app.sales_invoice_items_id_seq to anon, authenticated, service_role;
