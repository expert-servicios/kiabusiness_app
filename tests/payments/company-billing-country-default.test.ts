import { describe, expect, it } from 'vitest';
import { isCompanyBillingReady } from '@/lib/companies/billing-readiness';

describe('company billing country fallback', () => {
  it('accepts a complete Spanish company whose country is null', () => {
    expect(isCompanyBillingReady({ razon_social: 'Demo SL', cif_nif: 'B12345678', direccion: 'C Demo 1', ciudad: 'Alicante', codigo_postal: '03001', pais: null })).toBe(true);
  });
});
