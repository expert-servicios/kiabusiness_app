import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const migration = source('supabase/migrations/20260905111000_client360_fiscal_obligations.sql');
const api = source('app/api/admin/clientes/[id]/obligations/route.ts');
const page = source('app/(protected)/admin/clientes/[id]/obligaciones/page.tsx');
const nav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');

describe('Client 360 fiscal obligations', () => {
  it('keeps fiscal applicability explicit instead of inferring obligations from legal form or plan', () => {
    expect(migration).toContain('Conservative by design: no obligation is inferred from legal form or plan');
    expect(page).toContain('EXPERT no asigna modelos fiscales automáticamente por forma jurídica o plan');
    expect(api).not.toContain('forma_juridica');
    expect(api).not.toContain('plan_slug');
  });

  it('hardens obligations calendar with Admin-only RLS and a fiscal task source', () => {
    expect(migration).toContain('alter table public.obligations_calendar enable row level security');
    expect(migration).toContain('create policy obligations_calendar_admin_all');
    expect(migration).toContain("'fiscal_calendar'::text");
    expect(migration).toContain('add column if not exists company_id uuid references public.companies');
    expect(migration).toContain("add column if not exists metadata jsonb not null default '{}'::jsonb");
  });

  it('creates one operational Admin task from each confirmed obligation and closes it with the obligation', () => {
    expect(migration).toContain('create or replace function public.sync_fiscal_obligation_task()');
    expect(migration).toContain("source = 'fiscal_calendar'");
    expect(migration).toContain("status = 'completada'");
    expect(migration).toContain("status = 'cancelada'");
    expect(migration).toContain('obligations_calendar_sync_task');
  });

  it('guards client-company ownership before creating or changing fiscal obligations', () => {
    expect(api).toContain(".from('profile_companies')");
    expect(api).toContain(".eq('profile_id', clientId)");
    expect(api).toContain(".eq('company_id', companyId)");
    expect(api).toContain('Entidad no vinculada a este cliente');
    expect(api).toContain(".eq('client_id', clientId)");
  });

  it('uses the Admin calendar only as a secondary reminder layer', () => {
    expect(api).toContain('hasCalendarSA()');
    expect(api).toContain('upsertCalendarEventSA({');
    expect(api).toContain('deleteCalendarEventSA(row.google_event_id)');
    expect(api).toContain('reminderDaysBefore: [10, 5, 1]');
  });

  it('exposes fiscal management contextually inside Client 360', () => {
    expect(nav).toContain('href={`/admin/clientes/${clientId}/obligaciones`}');
    expect(page).toContain('Obligaciones y plazos');
    expect(page).toContain('Guardar y crear seguimiento');
    expect(page).toContain("setStatus(item.id, 'completed')");
    expect(page).toContain("setStatus(item.id, 'cancelled')");
  });
});
