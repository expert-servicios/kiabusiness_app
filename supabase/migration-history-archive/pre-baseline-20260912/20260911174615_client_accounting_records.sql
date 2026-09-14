-- Recovered from the production migration ledger during #143 reconciliation.
-- Production version/name: 20260911174615 client_accounting_records.
-- This file is Git history recovery only; do not re-run it against production.
-- Fase B del conector KIA-Holded (docs/kia-holded-cliente-implementation-plan.md):
-- tabla de destino del sync contable programado por cliente. holded_sync_jobs
-- ya soporta integration_id/company_id y se reutiliza tal cual (job_type nuevo:
-- 'client_accounting_sync'), no requiere migración propia.

create table if not exists client_accounting_records (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references client_integrations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  record_type text not null check (record_type in ('sales_invoice','purchase_invoice','tax','bank_movement')),
  external_id text not null,
  record_date date,
  amount numeric,
  currency text default 'EUR',
  status text,
  data jsonb not null,
  synced_at timestamptz not null default now(),
  unique (integration_id, record_type, external_id)
);

create index if not exists client_accounting_records_lookup_idx
  on client_accounting_records (integration_id, record_type, record_date desc);

create index if not exists client_accounting_records_company_idx
  on client_accounting_records (company_id, record_type);

alter table client_accounting_records enable row level security;

-- Lectura: el cliente/miembro de la empresa ve solo sus propios registros.
create policy "member read own accounting records" on client_accounting_records
  for select using (
    exists (
      select 1 from profile_companies pc
      where pc.company_id = client_accounting_records.company_id
        and pc.profile_id = auth.uid()
    )
  );

-- Admin: acceso total.
create policy "admin all accounting records" on client_accounting_records
  for all using (is_admin()) with check (is_admin());

-- Deliberadamente SIN policy de insert/update/delete para el rol autenticado:
-- solo el service role (server-side, en el cron de sync) escribe aquí. Mismo
-- patrón que client_integration_secrets.
