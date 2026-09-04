import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const route = fs.readFileSync(
  path.join(process.cwd(), 'app/api/stripe/webhook/route.ts'),
  'utf8',
);

describe('Stripe subscription webhook persistence safety', () => {
  it('throws when subscription upsert fails so Stripe can retry the event', () => {
    expect(route).toContain('throw new Error(`Could not persist Stripe subscription ${sub.id}: ${subscriptionError.message}`)');
    expect(route).not.toContain("console.error('[webhook] subscription upsert failed:', subscriptionError);\n    return null;");
  });

  it('checks persistence errors when a subscription is deleted', () => {
    expect(route).toContain('const { error: deleteUpdateError } = await supabaseAdmin');
    expect(route).toContain('throw new Error(`Could not persist canceled Stripe subscription ${sub.id}: ${deleteUpdateError.message}`)');
  });

  it('routes thrown persistence errors through fail_stripe_event and HTTP 500', () => {
    expect(route).toContain("await supabaseAdmin.rpc('fail_stripe_event', { p_event_id: event.id, p_error: message });");
    expect(route).toContain("return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });");
  });

  it('only completes the event after handlers finish', () => {
    const completeIdx = route.lastIndexOf("rpc('complete_stripe_event'");
    const failedIdx = route.indexOf("rpc('fail_stripe_event'");
    expect(completeIdx).toBeGreaterThan(0);
    expect(failedIdx).toBeGreaterThan(completeIdx);
  });
});