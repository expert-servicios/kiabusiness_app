import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('entity-scoped billing', () => {
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

  it('customer subscription checkout validates the contracting company, not legacy profile billing', () => {
    const checkout = source('app/api/subscriptions/checkout/route.ts');
    expect(checkout).toContain(".select('profile_completed,active_company_id')");
    expect(checkout).not.toContain('profile.billing_ready');
    expect(checkout).toContain('isCompanyBillingReady(company)');
    expect(checkout).toContain("code: 'billing_required'");
    expect(checkout).toContain("code: 'company_required'");
    expect(checkout).toContain("code: 'subscription_exists'");
    expect(checkout).toContain(".eq('company_id', companyId)");
    expect(checkout).toContain('await stripe.checkout.sessions.expire(session.id)');
    expect(checkout).toContain('company_id: companyId');
  });

  it('admin subscription invite applies the same entity prerequisites', () => {
    const adminInvite = source('app/api/admin/subscriptions/send-link/route.ts');
    expect(adminInvite).not.toContain('clientProfile.billing_ready');
    expect(adminInvite).toContain('isCompanyBillingReady(company)');
    expect(adminInvite).toContain("code: 'billing_required'");
    expect(adminInvite).toContain("code: 'company_required'");
    expect(adminInvite).toContain("code: 'holded_required'");
    expect(adminInvite).toContain("code: 'subscription_exists'");
    expect(adminInvite).toContain(".eq('company_id', companyId)");
    expect(adminInvite).toContain('await stripe.checkout.sessions.expire(session.id)');
  });

  it('monthly plan guard checks active company fiscal readiness and Holded', () => {
    const guard = source('lib/checkout/plan-mensual-guard.ts');
    expect(guard).toContain("reason: 'no_company'");
    expect(guard).toContain('isCompanyBillingReady(company)');
    expect(guard).not.toContain('profile.billing_ready');
    expect(guard).toContain(".eq('company_id', profile.active_company_id)");
  });

  it('adding a second entity does not overwrite legacy fiscal profile fields', () => {
    const onboarding = source('app/api/admin/users/invite/route.ts');
    expect(onboarding).toContain('if (isNewUser) {');
    expect(onboarding).toContain("code: 'tax_id_conflict'");
    expect(onboarding).toContain('Revisión manual necesaria');
    expect(onboarding).toContain("action: isNewUser ? (mode === 'invite_email' ? 'user.invited' : 'user.created') : 'user.entity_onboarded'");
  });

  it('self-service company creation blocks global tax id conflicts and compensates partial writes', () => {
    const companies = source('app/api/companies/route.ts');
    expect(companies).toContain("code: 'tax_id_conflict'");
    expect(companies).toContain('Revisión manual necesaria');
    expect(companies).toContain("await admin.from('companies').delete().eq('id', company.id)");
    expect(companies).toContain("await admin.from('profile_companies').delete().eq('profile_id', user.id).eq('company_id', company.id)");
  });

  it('admin quotes require explicit entity when ambiguous and validate that entity', () => {
    const quotes = source('app/api/admin/quotes/route.ts');
    expect(quotes).not.toContain('clientProfile.active_company_id');
    expect(quotes).toContain("let companyId = parsed.data.companyId ?? null");
    expect(quotes).toContain("(memberships?.length ?? 0) === 1");
    expect(quotes).toContain('Selecciona cuál contrata el servicio');
    expect(quotes).toContain('isCompanyBillingReady(contractingCompany)');
    expect(quotes).toContain('company_id: companyId');
  });

  it('admin onboarding passes its newly created/reused entity to plans and one-time quotes', () => {
    const onboarding = source('app/(protected)/admin/onboarding/page.tsx');
    const occurrences = onboarding.match(/companyId: createdCompanyId \|\| undefined/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('general quote modal exposes and requires the contracting entity', () => {
    const modal = source('components/admin/NuevaCotizacionModal.tsx');
    const clients = source('app/api/admin/clients-quick/route.ts');
    expect(clients).toContain('companies: companiesByProfile.get(client.id) ?? []');
    expect(modal).toContain("const [selectedCompanyId, setSelectedCompanyId] = useState('')");
    expect(modal).toContain('Selecciona la entidad que contrata este servicio.');
    expect(modal).toContain('companyId: selectedCompanyId');
    expect(modal).toContain('disabled={saving || !selectedCompanyId}');
  });

  it('one-time self-service checkout persists exact entity context before redirect', () => {
    const checkout = source('app/api/services/checkout/route.ts');
    expect(checkout).toContain('const companyId = input.companyId ?? profile.active_company_id ?? null');
    expect(checkout).toContain('isCompanyBillingReady(company)');
    expect(checkout).toContain('customer                   : stripeCustomerId ?? undefined');
    expect(checkout).toContain('company_id: companyId');
    expect(checkout).toContain("from('checkout_sessions').insert");
    expect(checkout).toContain('await stripe.checkout.sessions.expire(session.id)');
  });

  it('new one-time orders inherit company from persisted checkout without historical DML', () => {
    const migration = source('supabase/migrations/20260904104500_entity_scope_one_time_orders.sql');
    expect(migration).toContain('inherit_checkout_company_to_order');
    expect(migration).toContain('complete_checkout_session_from_order');
    expect(migration).toContain("new.metadata -> 'checkout_session' ->> 'id'");
    expect(migration).toContain('before insert on public.orders');
    expect(migration).toContain('after insert on public.orders');
    expect(migration).not.toMatch(/\bupdate\s+public\.orders\b/i);
    expect(migration).not.toMatch(/\binsert\s+into\s+public\.orders\b/i);
    expect(migration).not.toMatch(/\bdelete\s+from\s+public\.orders\b/i);
  });

  it('one-off quotes carry company context and derived records inherit it', () => {
    const migration = source('supabase/migrations/20260903190000_entity_scoped_subscriptions.sql');
    const quotes = source('app/api/admin/quotes/route.ts');
    expect(migration).toContain('orders_inherit_quote_company');
    expect(migration).toContain('cases_inherit_quote_company');
    expect(quotes).toContain("metadata: { quote_id: quote.id, company_id: companyId, product_type: 'presupuesto' }");
  });

  it('Holded retry keeps contracting company context', () => {
    const cron = source('app/api/cron/holded-sync/route.ts');
    expect(cron).toContain('companyId?: string | null');
    expect(cron).toContain(".select('razon_social,email')");
    expect(cron).toContain('manual review required');
  });

  it('company switcher checks PATCH response before refreshing', () => {
    const switcher = source('components/dashboard/CompanySwitcher.tsx');
    expect(switcher).toContain('if (!response.ok)');
    expect(switcher).toContain("setError(data?.error ?? 'No se pudo cambiar la entidad activa.')");
  });
});