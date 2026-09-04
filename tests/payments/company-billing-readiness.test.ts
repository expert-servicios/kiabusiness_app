import { describe, expect, it } from 'vitest';
import { isCompanyBillingReady, missingCompanyBillingFields } from '@/lib/companies/billing-readiness';

describe('company billing readiness', () => {
  const complete = {
    razon_social: 'Empresa Demo SL',
    cif_nif: 'B12345678',
    direccion: 'Calle Demo 1',
    ciudad: 'Alicante',
    codigo_postal: '03001',
    pais: 'ES',
  };

  it('accepts a complete contracting entity', () => {
    expect(isCompanyBillingReady(complete)).toBe(true);
    expect(missingCompanyBillingFields(complete)).toEqual([]);
  });

  it('does not borrow missing fiscal fields from a user profile', () => {
    const company = { ...complete, cif_nif: null, direccion: '' };
    expect(isCompanyBillingReady(company)).toBe(false);
    expect(missingCompanyBillingFields(company)).toEqual(['cif_nif', 'direccion']);
  });

  it('treats Spain as the default country only when the company row otherwise exists', () => {
    expect(isCompanyBillingReady({ ...complete, pais: null })).toBe(true);
    expect(isCompanyBillingReady(null)).toBe(false);
  });
});
