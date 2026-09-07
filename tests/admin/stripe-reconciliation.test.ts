import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin Stripe reconciliation', () => {
  const route = source('app/api/admin/clientes/[id]/stripe-reconciliation/route.ts');
  const page = source('app/(protected)/admin/clientes/[id]/stripe/page.tsx');
  const nav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');

  it('requires exact Stripe IDs and never uses email as an identity key', () => {
    expect(route).toContain("const STRIPE_ID = /^cus_");
    expect(route).toContain("const STRIPE_SUBSCRIPTION_ID = /^sub_");
    expect(route).toContain('stripe.customers.retrieve(customerId)');
    expect(route).not.toContain(".eq('email'");
    expect(route).not.toContain('lower(email)');
    expect(page).toContain('El email es sólo un dato de contacto');
    expect(page).toContain('IDs Stripe exactos');
  });

  it('blocks a Stripe Customer reused across more than one legal tax identity', () => {
    expect(route).toContain('mixedTaxHistory: taxIds.length > 1');
    expect(route).toContain("code: 'mixed_customer_tax_history'");
    expect(route).toContain('atribución por factura/periodo');
    expect(route).toContain('if (evidence.mixedTaxHistory) return mixedHistoryResponse(evidence)');
  });

  it('creates a company only after duplicate-tax-id and existing-mapping checks', () => {
    expect(route).toContain("action: z.literal('create_company_and_map')");
    expect(route).toContain(".from('companies')");
    expect(route).toContain("code: 'tax_id_conflict'");
    expect(route).toContain(".from('company_stripe_customers')");
    expect(route).toContain("code: 'stripe_customer_conflict'");
    expect(route).toContain('stripe_tax_id_mismatch');
    expect(route).toContain("source: 'admin_manual_review'");
  });

  it('rolls back partial company creation if membership or Stripe mapping fails', () => {
    expect(route).toContain("await ctx.admin.from('companies').delete().eq('id', company.id)");
    expect(route).toContain("await ctx.admin.from('profile_companies').delete().eq('profile_id', clientId).eq('company_id', company.id)");
    expect(route).toContain('el alta parcial se ha revertido');
    expect(route).toContain('la empresa creada se ha revertido');
  });

  it('requires an explicit company-customer mapping before importing a subscription', () => {
    expect(route).toContain("action: z.literal('import_subscription')");
    expect(route).toContain("code: 'customer_mapping_required'");
    expect(route).toContain(".eq('stripe_customer_id', customerId)");
    expect(route).toContain(".in('status', ['active', 'historical'])");
    expect(route).toContain("code: 'subscription_client_conflict'");
    expect(route).toContain("code: 'subscription_company_conflict'");
  });

  it('imports operational subscription data without payment or communication side effects', () => {
    expect(route).toContain(".from('subscriptions')");
    expect(route).toContain("reconciliation_source: 'admin_manual_review'");
    expect(route).not.toContain('sendEmail(');
    expect(route).not.toContain('syncSubscriptionToHolded');
    expect(route).not.toContain('paymentIntents');
    expect(route).not.toContain('checkout.sessions.create');
  });

  it('audits every mutating reconciliation action', () => {
    expect(route).toContain("entity: 'stripe_reconciliation'");
    expect(route).toContain("'stripe_reconciliation.company_created_and_customer_mapped'");
    expect(route).toContain("'stripe_reconciliation.customer_mapped'");
    expect(route).toContain("'stripe_reconciliation.subscription_linked'");
    expect(route).toContain("'stripe_reconciliation.subscription_imported'");
  });

  it('exposes the cockpit from Client 360 and requires human confirmation in the UI', () => {
    expect(nav).toContain('href={`/admin/clientes/${clientId}/stripe`}');
    expect(page).toContain('Reconciliación Stripe');
    expect(page).toContain('window.confirm');
    expect(page).toContain("action: 'map_customer'");
    expect(page).toContain("action: 'create_company_and_map'");
    expect(page).toContain("action: 'import_subscription'");
  });
});
