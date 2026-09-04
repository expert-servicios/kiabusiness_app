import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('entity-scoped subscriptions', () => {
  it('rewires checkout_sessions.user_id to canonical profiles', () => {
    const migration = source('supabase/migrations/20260903190000_entity_scoped_subscriptions.sql');
    expect(migration).toContain('drop constraint if exists checkout_sessions_user_id_fkey');
    expect(migration).toMatch(/foreign key \(user_id\)[\s\S]*references public\.profiles\(id\)/);
    expect(migration).not.toMatch(/checkout_sessions_user_id_fkey[\s\S]*references public\.users\(id\)/);
  });

  it('protects Stripe subscription ownership from silent reassignment', () => {
    const migration = source('supabase/migrations/20260903190000_entity_scoped_subscriptions.sql');
    expect(migration).toContain('guard_stripe_subscription_ownership');
    expect(migration).toContain('new.client_id is distinct from old.client_id');
    expect(migration).toContain('new.company_id is distinct from old.company_id');
    expect(migration).toContain('new.stripe_customer_id is distinct from old.stripe_customer_id');
    expect(migration).toContain('manual review required');
  });

  it('customer checkout requires billing readiness and a contracting entity', () => {
    const checkout = source('app/api/subscriptions/checkout/route.ts');
    expect(checkout).toContain(".select('profile_completed,billing_ready,active_company_id')");
    expect(checkout).toContain("code: 'billing_required'");
    expect(checkout).toContain("code: 'company_required'");
    expect(checkout).toContain(".eq('company_id', companyId)");
    expect(checkout).toContain('await stripe.checkout.sessions.expire(session.id)');
    expect(checkout).toContain('company_id: companyId');
    expect(checkout).not.toContain("company_id: companyId ?? ''");
  });

  it('admin subscription invite applies the same entity prerequisites', () => {
    const adminInvite = source('app/api/admin/subscriptions/send-link/route.ts');
    expect(adminInvite).toContain("code: 'billing_required'");
    expect(adminInvite).toContain("code: 'company_required'");
    expect(adminInvite).toContain("code: 'holded_required'");
    expect(adminInvite).toContain(".eq('company_id', companyId)");
    expect(adminInvite).toContain('await stripe.checkout.sessions.expire(session.id)');
    expect(adminInvite).toContain('company_id: companyId');
    expect(adminInvite).not.toContain("company_id: companyId ?? ''");
  });

  it('adding a second entity does not overwrite legacy fiscal profile fields', () => {
    const onboarding = source('app/api/admin/users/invite/route.ts');
    expect(onboarding).toContain('if (isNewUser) {');
    expect(onboarding).toContain("code: 'tax_id_conflict'");
    expect(onboarding).toContain('Revisión manual necesaria');
    expect(onboarding).toContain("action: isNewUser ? (mode === 'invite_email' ? 'user.invited' : 'user.created') : 'user.entity_onboarded'");
  });
});
