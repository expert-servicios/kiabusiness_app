import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Admin panel canonical integrity', () => {
  it('adds a single global back-navigation control to the admin layout', () => {
    const layout = read('app/(protected)/admin/layout.tsx');
    const backBar = read('components/admin/AdminBackBar.tsx');
    expect(layout).toContain('AdminBackBar');
    expect(backBar).toContain('Volver');
    expect(backBar).toContain("router.push('/admin')");
  });

  it('uses public.companies as the canonical Empresas source', () => {
    const endpoint = read('app/api/admin/empresas/route.ts');
    const page = read('app/(protected)/admin/empresas/page.tsx');
    expect(endpoint).toContain(".from('companies')");
    expect(endpoint).toContain(".from('profile_companies')");
    expect(endpoint).toContain(".from('subscriptions')");
    expect(endpoint).toContain(".from('client_integrations')");
    expect(endpoint).toContain(".from('checkout_sessions')");
    expect(page).toContain("fetch('/api/admin/empresas'");
    expect(page).toContain('Empresas EXPERT');
    expect(page).toContain('Buscar empresa pública');
  });

  it('exposes complete operational data in client 360 without Holded-only filtering', () => {
    const endpoint = read('app/api/admin/clientes/[id]/route.ts');
    expect(endpoint).toContain(".from('checkout_sessions')");
    expect(endpoint).toContain(".from('email_events')");
    expect(endpoint).toContain('checkoutSessions:');
    expect(endpoint).toContain('emailEvents:');
    expect(endpoint).not.toContain(".eq('provider', 'holded')");
  });

  it('keeps client identity and operational context persistent across 360 views', () => {
    const layout = read('app/(protected)/admin/clientes/[id]/layout.tsx');
    const context = read('app/(protected)/admin/clientes/[id]/Client360ContextBar.tsx');
    expect(layout).toContain('Client360ContextBar');
    expect(context).toContain('active_company_id');
    expect(context).toContain('checkoutSessions');
    expect(context).toContain('emailEvents');
    expect(context).toContain('integrations');
    expect(context).toContain('Comunicaciones');
  });

  it('creates or reuses an onboarding case during admin user onboarding', () => {
    const route = read('app/api/admin/users/invite/route.ts');
    expect(route).toContain(".eq('service', 'Alta de usuario')");
    expect(route).toContain("category: 'onboarding'");
    expect(route).toContain("service: 'Alta de usuario'");
    expect(route).toContain('onboardingCaseId');
  });

  it('maintains lead -> quote -> case -> checkout traceability for admin subscriptions', () => {
    const route = read('app/api/admin/subscriptions/send-link/route.ts');
    expect(route).toContain(".from('leads')");
    expect(route).toContain(".from('quotes')");
    expect(route).toContain('quote_amount_conflict');
    expect(route).toContain('quote_id: quoteId');
    expect(route).toContain('lead_id: leadId');
    expect(route).toContain('onboarding_case_id');
    expect(route).toContain(".from('checkout_sessions')");
  });

  it('grounds Kia metrics in explicit current and historical sources', () => {
    const api = read('app/api/admin/kia-metrics/route.ts');
    const page = read('app/(protected)/admin/kia-metrics/page.tsx');
    expect(api).toContain('allTimeDecisions');
    expect(api).toContain('allTimeSessions');
    expect(api).toContain('registeredInteractions');
    expect(api).toContain(".from('kia_health_runs')");
    expect(page).toContain('Interacciones registradas');
    expect(page).toContain('Decisiones históricas');
  });
});
