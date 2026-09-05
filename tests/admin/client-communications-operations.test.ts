import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Client 360 communications operations', () => {
  it('supports company, case, date, channel and text filters', () => {
    const page = source('app/(protected)/admin/clientes/[id]/comunicaciones/page.tsx');
    expect(page).toContain("setCompanyFilter");
    expect(page).toContain("setCaseFilter");
    expect(page).toContain("setDateFrom");
    expect(page).toContain("setDateTo");
    expect(page).toContain("setSearch");
    expect(page).toContain("item.channel !== channel");
    expect(page).toContain("item.caseId !== caseFilter");
  });

  it('links inbound email threads only through a client-owned case', () => {
    const route = source('app/api/admin/clientes/[id]/communications/route.ts');
    expect(route).toContain("action: z.literal('link_email_thread')");
    expect(route).toContain("context.cases.find");
    expect(route).toContain('El expediente no pertenece a este cliente');
    expect(route).toContain(".from('email_threads').upsert");
    expect(route).toContain("case_id: caseId");
  });

  it('derives entity attribution from the linked case and never guesses by client email', () => {
    const route = source('app/api/admin/clientes/[id]/communications/route.ts');
    expect(route).toContain('caseCompanyById');
    expect(route).toContain('threadCaseById');
    expect(route).toContain('companyNameById');
    expect(route).not.toContain('company_id: id');
    expect(route).not.toContain('companyId: profile');
  });

  it('deep-links a provider-backed inbox thread into Correo 360', () => {
    const page = source('app/(protected)/admin/clientes/[id]/comunicaciones/page.tsx');
    const thread = source('app/(protected)/admin/correo/hilo/page.tsx');
    expect(page).toContain('/admin/correo/hilo?provider=');
    expect(page).toContain("selected.provider === 'gmail' || selected.provider === 'ms365'");
    expect(thread).toContain("action: 'conversation'");
    expect(thread).toContain("action: 'reply'");
    expect(thread).toContain('conversationId');
  });

  it('shows Communications as a first-class Client 360 navigation destination', () => {
    const nav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');
    expect(nav).toContain(`/admin/clientes/${'${clientId}'}/comunicaciones`);
    expect(nav).toContain('Comunicaciones');
  });
});
