import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('subscription post-purchase onboarding', () => {
  const checkout = source('app/api/subscriptions/checkout/route.ts');
  const postPurchase = source('app/(protected)/dashboard/post-compra/page.tsx');
  const wizard = source('components/dashboard/PostCompraWizard.tsx');
  const layout = source('app/(protected)/dashboard/layout.tsx');
  const dashboardStatus = source('components/dashboard/SubscriptionOnboardingStatus.tsx');

  it('does not require Holded before Stripe checkout', () => {
    expect(checkout).toContain("mode: 'subscription'");
    expect(checkout).not.toContain("code: 'holded_required'");
    expect(checkout).toContain('/dashboard/post-compra?origin=subscription');
  });

  it('orders onboarding meeting before Holded connection', () => {
    const meeting = wizard.indexOf('Agendar reunión de onboarding');
    const holded = wizard.indexOf('Conectar Holded');
    expect(meeting).toBeGreaterThan(-1);
    expect(holded).toBeGreaterThan(meeting);
    expect(wizard).toContain('onboardingMeetingScheduled && holdedConnected');
  });

  it('accepts direct API or authorized Holded connection', () => {
    expect(postPurchase).toContain('directHoldedConnected || authorizedHoldedConnected');
    expect(wizard).toContain('Conectar por API');
    expect(wizard).toContain('Autorizar Holded');
  });

  it('surfaces pending onboarding throughout the client dashboard', () => {
    expect(layout).toContain('<SubscriptionOnboardingStatus />');
    expect(dashboardStatus).toContain('Siguiente: agenda tu reunión de onboarding');
    expect(dashboardStatus).toContain('Siguiente: conecta Holded');
  });
});
