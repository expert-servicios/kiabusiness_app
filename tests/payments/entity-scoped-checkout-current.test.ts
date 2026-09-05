import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isCompanyBillingReady, missingCompanyBillingFields } from '@/lib/companies/billing-readiness';

const serviceCheckout = readFileSync(resolve(process.cwd(), 'app/api/services/checkout/route.ts'), 'utf8');
const subscriptionCheckout = readFileSync(resolve(process.cwd(), 'app/api/subscriptions/checkout/route.ts'), 'utf8');

describe('entity-scoped contracting', () => {
  it('requires complete fiscal data on the selected company', () => {
    const complete = {
      razon_social: 'Empresa Demo SL',
      cif_nif: 'B12345678',
      direccion: 'C Demo 1',
      ciudad: 'Alicante',
      codigo_postal: '03001',
      pais: 'ES',
    };
    expect(isCompanyBillingReady(complete)).toBe(true);
    expect(missingCompanyBillingFields({ ...complete, cif_nif: '' })).toEqual(['cif_nif']);
  });

  it('persists service checkout context by explicit company', () => {
    expect(serviceCheckout).toContain(".eq('company_id', companyId)");
    expect(serviceCheckout).toContain('company_id: companyId');
    expect(serviceCheckout).toContain('company_id: companyId,');
    expect(serviceCheckout).toContain("from('checkout_sessions').insert");
    expect(serviceCheckout).toContain('await stripe.checkout.sessions.expire(session.id)');
    expect(serviceCheckout).not.toContain("select('id,full_name,phone,email,stripe_customer_id,profile_completed')");
  });

  it('validates subscription billing and duplicate subscription by company', () => {
    expect(subscriptionCheckout).toContain(".eq('company_id', companyId)");
    expect(subscriptionCheckout).toContain('isCompanyBillingReady(company)');
    expect(subscriptionCheckout).toContain("code: 'subscription_exists'");
    expect(subscriptionCheckout).not.toContain('profile.billing_ready');
  });
});
