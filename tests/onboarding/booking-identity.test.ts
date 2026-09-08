import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('onboarding booking identity', () => {
  it('only adds the contracting company email after membership validation', () => {
    const helper = source('lib/admin/onboarding-booking-identity.ts');
    expect(helper).toContain(".from('profile_companies')");
    expect(helper).toContain(".eq('profile_id', clientId)");
    expect(helper).toContain(".eq('company_id', companyId)");
    expect(helper).toContain(".from('companies')");
    expect(helper).toContain(".select('email')");
  });

  it('loads appointments using both authorized identities', () => {
    const state = source('app/api/admin/clientes/[id]/onboarding-state/route.ts');
    const complete = source('app/api/admin/clientes/[id]/complete-onboarding/route.ts');
    expect(state).toContain('loadOnboardingAppointmentsForIdentity(admin, clientId, active?.company_id, email)');
    expect(complete).toContain('loadOnboardingAppointmentsForIdentity(admin, clientId, subscription.company_id, clientEmail)');
  });

  it('resolves company booking email only when subscription ownership is unambiguous', () => {
    const helper = source('lib/admin/onboarding-booking-identity.ts');
    expect(helper).toContain(".in('status', ['active', 'trialing'])");
    expect(helper).toContain('return clientIds.length === 1 ? clientIds[0] : null;');
  });

  it('uses the same conservative identity resolver when Cal creates onboarding cases', () => {
    const cal = source('app/api/webhooks/cal/route.ts');
    expect(cal).toContain("import { resolveBookingClientIdByEmail } from '@/lib/admin/onboarding-booking-identity';");
    expect(cal).toContain('const clientId = await resolveBookingClientIdByEmail(admin, attendee.email);');
    expect(cal).toContain('findOpenOnboardingCase(clientId)');
    expect(cal).not.toContain('async function resolveAuthUser');
  });
});
