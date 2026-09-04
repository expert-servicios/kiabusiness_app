import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'lib/email/send.ts'), 'utf8');

describe('Stripe-triggered email idempotency', () => {
  it('derives an intent from Stripe checkout session metadata', () => {
    expect(source).toContain("const sessionId = stringMetadata(metadata, 'session_id')");
    expect(source).toContain('`email/${eventType}/session/${sessionId}`');
  });

  it('derives payment-failure intents from invoice ids', () => {
    expect(source).toContain("const invoiceId = stringMetadata(metadata, 'invoice_id')");
    expect(source).toContain('`email/${eventType}/invoice/${invoiceId}`');
  });

  it('makes subscription-created mail idempotent but does not suppress later billing failures', () => {
    expect(source).toContain("eventType === 'subscription.created' || eventType === 'subscription.created.admin'");
    expect(source).toContain('Do not apply this fallback to');
    expect(source).toContain('subscription.payment_failed');
  });

  it('checks durable audit history before calling Resend', () => {
    const lookupIndex = source.indexOf('findAcceptedIntent(effectiveIdempotencyKey)');
    const sendIndex = source.indexOf('await resend.emails.send(payload, { idempotencyKey: effectiveIdempotencyKey })');
    expect(lookupIndex).toBeGreaterThan(0);
    expect(sendIndex).toBeGreaterThan(lookupIndex);
  });
});
