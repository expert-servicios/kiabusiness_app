import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const subscriptionRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/subscriptions/send-link/route.ts'),
  'utf8',
);
const quoteResendRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/quotes/[id]/resend/route.ts'),
  'utf8',
);

describe('critical payment-link email compensation', () => {
  it('expires a new subscription checkout when invite delivery fails', () => {
    expect(subscriptionRoute).toContain("await stripe.checkout.sessions.expire(session.id)");
    expect(subscriptionRoute).toContain("email_delivery_failed: true");
    expect(subscriptionRoute).toContain("email_failed_manual_review");
    expect(subscriptionRoute).toContain("email_failed_safe_retry");
  });

  it('does not claim safe retry if Stripe expiration fails', () => {
    expect(subscriptionRoute).toContain("status: expireFailed ? 'open' : 'expired'");
  });

  it('restores the previous quote session reference if resend email fails', () => {
    expect(quoteResendRoute).toContain('const previousSessionId = quote.stripe_checkout_id ?? null');
    expect(quoteResendRoute).toContain(".update({ stripe_checkout_id: previousSessionId, status: quote.status })");
    expect(quoteResendRoute).toContain(".eq('stripe_checkout_id', session.id)");
  });

  it('expires the previous quote link only after the new email succeeds', () => {
    const sendIndex = quoteResendRoute.indexOf("eventType: 'quote.payment_link_resent'");
    const previousExpireIndex = quoteResendRoute.indexOf('await stripe.checkout.sessions.expire(previousSessionId)');
    expect(sendIndex).toBeGreaterThan(0);
    expect(previousExpireIndex).toBeGreaterThan(sendIndex);
  });

  it('surfaces manual review instead of hiding a duplicate-link risk', () => {
    expect(quoteResendRoute).toContain("code: 'previous_link_manual_review'");
    expect(quoteResendRoute).toContain("code: expireFailed ? 'email_failed_manual_review' : 'email_failed_previous_link_kept'");
  });
});
