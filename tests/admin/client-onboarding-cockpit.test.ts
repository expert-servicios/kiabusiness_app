import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin client onboarding cockpit', () => {
  it('mounts a persistent onboarding cockpit in client 360', () => {
    const layout = source('app/(protected)/admin/clientes/[id]/layout.tsx');
    const cockpit = source('app/(protected)/admin/clientes/[id]/ClientOnboardingCockpit.tsx');
    expect(layout).toContain('ClientOnboardingCockpit');
    expect(cockpit).toContain('Mesa de operaciones del cliente');
    expect(cockpit).toContain('Perfil y facturación');
    expect(cockpit).toContain('Presupuesto y contratación');
    expect(cockpit).toContain('Stripe y suscripción');
    expect(cockpit).toContain('Onboarding');
    expect(cockpit).toContain('Holded');
    expect(cockpit).toContain('Comunicaciones');
  });

  it('links canonical commercial action to the existing admin checkout flow', () => {
    const cockpit = source('app/(protected)/admin/clientes/[id]/ClientOnboardingCockpit.tsx');
    expect(cockpit).toContain('/admin/suscripciones/generar?clientId=');
    expect(cockpit).toContain('Preparar contratación');
  });

  it('exposes onboarding completion in the client 360 API', () => {
    const route = source('app/api/admin/clientes/[id]/route.ts');
    expect(route).toContain('onboarding_completed_at');
  });

  it('preselects client and blocks duplicate open checkout in the generator', () => {
    const generator = source('app/(protected)/admin/suscripciones/generar/page.tsx');
    expect(generator).toContain("get('clientId')");
    expect(generator).toContain('openCheckoutForCompany');
    expect(generator).toContain('No se generará otro');
    expect(generator).toContain('Boolean(openCheckoutForCompany)');
  });

  it('keeps canonical traceability ids visible after checkout generation', () => {
    const generator = source('app/(protected)/admin/suscripciones/generar/page.tsx');
    expect(generator).toContain('leadId: json.leadId');
    expect(generator).toContain('quoteId: json.quoteId');
    expect(generator).toContain('onboardingCaseId: json.onboardingCaseId');
    expect(generator).toContain('Contratación preparada y Checkout registrado');
  });
});
