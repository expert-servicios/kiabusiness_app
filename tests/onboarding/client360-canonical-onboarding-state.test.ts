import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('canonical subscription onboarding state', () => {
  const stateRoute = source('app/api/admin/clientes/[id]/onboarding-state/route.ts');
  const cockpit = source('app/(protected)/admin/clientes/[id]/ClientOnboardingCockpit.tsx');
  const citas = source('app/api/dashboard/citas/route.ts');
  const complete = source('app/api/dashboard/post-compra/complete/route.ts');

  it('exposes the active subscription post-purchase marker only to staff', () => {
    expect(stateRoute).toContain('isStaffRole');
    expect(stateRoute).toContain('post_purchase_onboarding_at');
    expect(stateRoute).toContain("sub.status === 'active' || sub.status === 'trialing'");
    expect(stateRoute).toContain('completed: Boolean(active?.post_purchase_onboarding_at)');
  });

  it('uses subscription completion as canonical in Client 360 with legacy fallback only', () => {
    expect(cockpit).toContain('/onboarding-state');
    expect(cockpit).toContain('onboardingState?.completed ?? Boolean(data.profile.onboarding_completed_at)');
    expect(cockpit).toContain('Onboarding poscompra completado para la suscripción activa.');
  });

  it('matches appointment email case-insensitively and preserves canonical appointment type validation', () => {
    expect(citas).toContain(".ilike('email', user.email)");
    expect(complete).toContain(".ilike('email', user.email)");
    expect(complete).toContain("appointment.appointment_type ?? ''");
    expect(complete).toContain("=== 'onboarding'");
    expect(citas).not.toContain(".eq('email', user.email)");
    expect(complete).not.toContain(".eq('email', user.email)");
  });
});
