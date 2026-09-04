import { describe, expect, it } from 'vitest';
import { missingCompanyBillingFields } from '@/lib/companies/billing-readiness';

describe('missing company billing fields', () => {
  it('reports all required fiscal fields for a missing company', () => {
    expect(missingCompanyBillingFields(null)).toEqual(['razon_social', 'cif_nif', 'direccion', 'ciudad', 'codigo_postal']);
  });
});
