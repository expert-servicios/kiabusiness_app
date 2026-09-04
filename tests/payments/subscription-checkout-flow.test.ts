import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('subscription checkout flow', () => {
  const cards = source('components/subscriptions/SubscriptionPlanCards.tsx');
  const checkout = source('app/api/subscriptions/checkout/route.ts');
  const postPurchase = source('app/(protected)/dashboard/post-compra/page.tsx');

  it('sends standard monthly plan CTAs directly to the subscription checkout endpoint', () => {
    expect(cards).toContain("fetch('/api/subscriptions/checkout'");
    expect(cards).toContain("'Contratar plan'");
    expect(cards).not.toContain('ReadinessModal');
    expect(cards).not.toContain('getReadinessCheck');
  });

  it('keeps authoritative prerequisites on the server instead of the commercial questionnaire', () => {
    expect(checkout).toContain("code: 'profile_required'");
    expect(checkout).toContain("code: 'billing_required'");
    expect(checkout).toContain("code: 'company_required'");
    expect(checkout).toContain("code: 'holded_required'");
    expect(checkout).toContain("mode: 'subscription'");
  });

  it('only enters post-purchase onboarding after Stripe has created an active or trialing subscription', () => {
    expect(checkout).toContain("success_url: `${appUrl}/dashboard/post-compra?origin=subscription`");
    expect(postPurchase).toContain("s.status === 'active' || s.status === 'trialing'");
    expect(postPurchase).toContain('!s.post_purchase_onboarding_at');
  });
});
