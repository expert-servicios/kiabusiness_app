import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260904111000_subscription_checkout_atomic_claim.sql'),
  'utf8',
);
const statusMigration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260904112000_sync_subscription_checkout_claim_status.sql'),
  'utf8',
);
const helper = fs.readFileSync(
  path.join(process.cwd(), 'lib/billing/subscription-checkout-claim.ts'),
  'utf8',
);

describe('atomic subscription checkout claims', () => {
  it('allows only one active intent per user + company + plan intent', () => {
    expect(migration).toContain('subscription_checkout_claims_active_intent_uidx');
    expect(migration).toContain('on public.subscription_checkout_claims(user_id, company_id, intent_key)');
    expect(migration).toContain("where state in ('claimed','open','manual_review')");
  });

  it('can transfer only an expired pre-Stripe lease', () => {
    expect(migration).toContain("v_row.state = 'claimed' and v_row.lease_expires_at <= now()");
    expect(migration).not.toContain("v_row.state = 'open' and v_row.lease_expires_at <= now()");
  });

  it('uses a stable Stripe idempotency key derived from the durable claim id', () => {
    expect(helper).toContain('return `subscription-checkout/${claimId}`');
  });

  it('restricts claim RPCs to service_role', () => {
    expect(migration).toContain('revoke all on function public.claim_subscription_checkout');
    expect(migration).toContain('grant execute on function public.claim_subscription_checkout');
    expect(migration).toContain('to service_role');
  });

  it('does not rewrite historical financial rows', () => {
    expect(migration).not.toMatch(/update\s+public\.orders/i);
    expect(migration).not.toMatch(/update\s+public\.subscriptions/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.orders/i);
  });

  it('releases active uniqueness after a persisted checkout becomes terminal', () => {
    expect(statusMigration).toContain("new.status in ('completed', 'expired')");
    expect(statusMigration).toContain('update public.subscription_checkout_claims');
    expect(statusMigration).toContain("state in ('claimed', 'open')");
  });
});
