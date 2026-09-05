import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const templateApi = read('app/api/admin/clientes/[id]/fiscal-templates/route.ts');
const fiscalApi = read('app/api/admin/fiscal-calendar/route.ts');
const obligationsApi = read('app/api/admin/clientes/[id]/obligations/route.ts');
const page = read('app/(protected)/admin/clientes/[id]/obligaciones/page.tsx');
const migration = read('supabase/migrations/20260905114500_fiscal_template_activation.sql');


describe('confirmed fiscal template activation', () => {
  it('requires an Admin-confirmed template before generating obligations', () => {
    expect(templateApi).toContain("action: z.enum(['activate', 'deactivate', 'generate'])");
    expect(templateApi).toContain(".eq('status', 'active')");
    expect(templateApi).toContain('Confirma y activa esta plantilla antes de generar vencimientos');
    expect(templateApi).toContain(".from('profile_companies')");
    expect(templateApi).toContain(".eq('profile_id', clientId)");
    expect(templateApi).toContain(".eq('company_id', companyId)");
  });

  it('materializes both fiscal source records and Admin operational follow-up', () => {
    expect(templateApi).toContain(".from('fiscal_obligations')");
    expect(templateApi).toContain(".from('obligations_calendar')");
    expect(templateApi).toContain("source: 'system'");
    expect(templateApi).toContain('fiscal_template_code: templateCode');
    expect(templateApi).toContain('obligations_calendar_id: operationalId');
    expect(templateApi).toContain('syncOperationalCalendar(operational)');
  });

  it('retires the unsafe legacy inference endpoint', () => {
    expect(fiscalApi).toContain("code: 'confirmed_fiscal_template_required'");
    expect(fiscalApi).toContain('{ status: 410 }');
    expect(fiscalApi).not.toContain('generateFiscalObligations(');
    expect(fiscalApi).not.toContain('clientType: ClientType');
  });

  it('keeps fiscal and operational statuses aligned', () => {
    expect(fiscalApi).toContain("status === 'submitted'");
    expect(fiscalApi).toContain("'completed'");
    expect(fiscalApi).toContain("'cancelled'");
    expect(obligationsApi).toContain(".eq('obligations_calendar_id', changed.id)");
    expect(obligationsApi).toContain("? 'submitted'");
    expect(obligationsApi).toContain("? 'skipped'");
  });

  it('exposes templates in Client 360 while preserving manual exceptional deadlines', () => {
    expect(page).toContain('<FiscalTemplatePanel');
    expect(page).toContain('Obligación manual / caso especial');
    expect(page).toContain('EXPERT no asigna modelos fiscales automáticamente');
    expect(page).toContain('Tampoco los deduce por tipo de cliente');
  });

  it('adds an Admin-only activation table without mutating existing fiscal history', () => {
    expect(migration).toContain('create table if not exists public.company_fiscal_templates');
    expect(migration).toContain('company_fiscal_templates_one_active');
    expect(migration).toContain('alter table public.company_fiscal_templates enable row level security');
    expect(migration).toContain("p.role in ('admin','owner')");
    expect(migration).toContain('add column if not exists template_code text');
    expect(migration).not.toContain('delete from public.fiscal_obligations');
    expect(migration).not.toContain('update public.fiscal_obligations set');
  });
});
