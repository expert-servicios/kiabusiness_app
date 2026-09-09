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
    expect(helper).toContain('if (clientIds.length !== 1) return null;');
    expect(helper).toContain("source: 'company_email'");
    expect(helper).not.toContain('endsWith');
  });

  it('only scopes an auth email to a company when one unfinished onboarding company is unambiguous', () => {
    const helper = source('lib/admin/onboarding-booking-identity.ts');
    expect(helper).toContain(".is('post_purchase_onboarding_at', null)");
    expect(helper).toContain('return companyIds.length === 1 ? companyIds[0] : null;');
    expect(helper).toContain("source: 'auth_email'");
  });

  it('binds Cal onboarding cases and tasks to the resolved fiscal entity', () => {
    const route = source('app/api/webhooks/cal/route.ts');
    const followup = source('lib/admin/onboarding-followup.ts');
    expect(route).toContain('resolveBookingIdentityByEmail(admin, attendee.email)');
    expect(route).toContain('company_id: identity.companyId');
    expect(route).toContain('companyId: activeSubscription.company_id');
    expect(followup).toContain("lookup.eq('company_id', input.companyId)");
    expect(followup).toContain('company_id: input.companyId ?? null');
  });

  it('finishes only the selected subscription company onboarding', () => {
    const complete = source('app/api/admin/clientes/[id]/complete-onboarding/route.ts');
    expect(complete).toContain("onboardingCaseQuery.eq('company_id', subscription.company_id)");
    expect(complete).toContain('completeOnboardingTask(clientId, subscription.company_id)');
    expect(complete).toContain(".eq('id', subscription.id)");
  });

  it('logs signature diagnostics without exposing the webhook secret', () => {
    const route = source('app/api/webhooks/cal/route.ts');
    expect(route).toContain("warning: 'invalid_signature'");
    expect(route).toContain('hasHeader: Boolean(signature)');
    expect(route).toContain('hasSecret: Boolean(process.env.CAL_WEBHOOK_SECRET)');
    expect(route).not.toContain('secretValue');
  });
});
