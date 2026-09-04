import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const subscriptionRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/subscriptions/send-link/route.ts'),
  'utf8',
);
const quoteRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/quotes/route.ts'),
  'utf8',
);
const quoteResendRoute = fs.readFileSync(
  path.join(process.cwd(), 'app/api/admin/quotes/[id]/resend/route.ts'),
  'utf8',
);
const resendWebhook = fs.readFileSync(
  path.join(process.cwd(), 'app/api/resend/webhook/route.ts'),
  'utf8',
);
const emailSend = fs.readFileSync(
  path.join(process.cwd(), 'lib/email/send.ts'),
  'utf8',
);
const authCallback = fs.readFileSync(
  path.join(process.cwd(), 'app/auth/callback/route.ts'),
  'utf8',
);

describe('critical payment-link email compensation', () => {
  it('expires a new subscription checkout when invite delivery fails', () => {
    expect(subscriptionRoute).toContain('await stripe.checkout.sessions.expire(session.id)');
    expect(subscriptionRoute).toContain('email_delivery_failed: true');
    expect(subscriptionRoute).toContain('email_failed_manual_review');
    expect(subscriptionRoute).toContain('email_failed_safe_retry');
  });

  it('does not claim safe retry if Stripe expiration fails', () => {
    expect(subscriptionRoute).toContain("status: expireFailed ? 'open' : 'expired'");
  });

  it('compensates only the request-created initial quote after safe Stripe expiration', () => {
    expect(quoteRoute).toContain("await adminSupabase.from('leads').delete().eq('id', lead.id)");
    expect(quoteRoute).toContain("code: 'email_failed_safe_retry'");
    expect(quoteRoute).toContain("code: 'email_failed_cleanup_manual_review'");
    expect(quoteRoute).toContain("code: 'email_failed_manual_review'");
    const expireIndex = quoteRoute.indexOf('await stripe.checkout.sessions.expire(session.id)');
    const safeCleanupIndex = quoteRoute.lastIndexOf("from('leads').delete().eq('id', lead.id)");
    expect(expireIndex).toBeGreaterThan(0);
    expect(safeCleanupIndex).toBeGreaterThan(expireIndex);
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

describe('Resend delivery attribution', () => {
  it('uses the webhook recipient together with resend_id', () => {
    expect(resendWebhook).toContain('to?: string[] | string');
    expect(resendWebhook).toContain(".eq('resend_id', resendId)");
    expect(resendWebhook).toContain(".ilike('recipient_email', recipient)");
  });

  it('keeps a backwards-compatible fallback when old payloads omit data.to', () => {
    expect(resendWebhook).toContain('if (recipients.length)');
    expect(resendWebhook).toContain('Backwards-compatible fallback');
  });

  it('fails the webhook when status persistence fails so Resend can retry it', () => {
    expect(resendWebhook).toContain("return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });");
  });
});

describe('durable email idempotency', () => {
  it('passes the effective idempotency key to Resend and records it in email_events', () => {
    expect(emailSend).toContain('await resend.emails.send(payload, { idempotencyKey: effectiveIdempotencyKey })');
    expect(emailSend).toContain('idempotency_key: idempotencyKey');
  });

  it('suppresses a logical retry once Resend previously accepted the intent', () => {
    expect(emailSend).toContain(".contains('metadata', { idempotency_key: idempotencyKey })");
    expect(emailSend).toContain(".not('resend_id', 'is', null)");
    expect(emailSend).toContain('if (existingResendId)');
    expect(emailSend).toContain('return { sent: false, resendId: existingResendId }');
  });

  it('uses one deterministic welcome intent per user', () => {
    expect(authCallback).toContain('sendEmailOnce({');
    expect(authCallback).toContain('idempotencyKey: `user-welcome/${user.id}`');
  });
});