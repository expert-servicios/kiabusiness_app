import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/integrations/vies', () => ({
  validateSpanishVat: vi.fn(),
}));

vi.mock('@/lib/integrations/opencorporates', () => ({
  isOpenCorporatesEnabled: vi.fn(() => false),
  searchCompaniesByName: vi.fn(),
}));

vi.mock('@/lib/integrations/boe-borme', () => ({
  BORME_DISCLAIMER: 'Confirmar en BORME',
  searchBormeByCompanyName: vi.fn(async () => []),
}));

vi.mock('@/lib/integrations/ckan/ckan-company-search', () => ({
  searchCkanCompaniesByName: vi.fn(async () => []),
  searchCkanCompaniesByTaxId: vi.fn(async () => []),
}));

vi.mock('@/lib/integrations/ckan/ckan-source-registry', () => ({
  isCkanEnabled: vi.fn(() => false),
}));

import { searchBormeByCompanyName } from '@/lib/integrations/boe-borme';
import { searchCompaniesByName } from '@/lib/integrations/opencorporates';
import {
  resolveCompanyData,
  searchCompanyByTaxId,
  validateSpanishTaxIdFormat,
} from '@/lib/integrations/company-data-resolver';

describe('validateSpanishTaxIdFormat', () => {
  it.each([
    ['12345678Z', 'nif'],
    ['X1234567L', 'nie'],
    ['B99286320', 'cif'],
    ['K1234567L', 'nif'],
  ] as const)('validates and classifies %s as %s', (taxId, type) => {
    expect(validateSpanishTaxIdFormat(taxId)).toMatchObject({ valid: true, type });
  });

  it('normalizes separators and rejects an invalid control character', () => {
    expect(validateSpanishTaxIdFormat('12.345.678-z').normalized).toBe('12345678Z');
    expect(validateSpanishTaxIdFormat('12345678A')).toMatchObject({
      valid: false,
      type: 'nif',
      error: 'Letra de control incorrecta',
    });
  });
});

describe('company data privacy', () => {
  it.each(['12345678Z', 'X1234567L', 'K1234567L'])(
    'never enriches natural-person identifier %s',
    async (taxId) => {
      await expect(searchCompanyByTaxId(taxId)).resolves.toEqual([]);
    },
  );

  it('does not use name search in OpenCorporates for an exact CIF lookup', async () => {
    await searchCompanyByTaxId('B99286320');
    expect(searchCompaniesByName).not.toHaveBeenCalled();
  });
});

describe('resolveCompanyData cache', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires confirmation and protects cached suggestions from caller mutation', async () => {
    vi.mocked(searchBormeByCompanyName).mockResolvedValueOnce([{
      bormeId: '2026-1',
      provincia: 'Alicante',
      fecha: '2026-08-31',
      acts: {
        name: 'EMPRESA DEMO SL',
        taxId: 'B99286320',
        actType: ['Constitución'],
        rawText: 'EMPRESA DEMO SL — Constitución',
        bormeId: '2026-1',
        fecha: '2026-08-31',
      },
    }]);

    const first = await resolveCompanyData({ name: 'Empresa Demo Cache Test' });
    expect(first.requiresUserConfirmation).toBe(true);
    expect(first.bestSuggestion?.name).toBe('EMPRESA DEMO SL');

    first.suggestions[0]!.name = 'MUTATED';
    first.suggestions[0]!.warnings.push('MUTATED');

    const second = await resolveCompanyData({ name: 'Empresa Demo Cache Test' });
    expect(second.bestSuggestion?.name).toBe('EMPRESA DEMO SL');
    expect(second.bestSuggestion?.warnings).not.toContain('MUTATED');
    expect(searchBormeByCompanyName).toHaveBeenCalledTimes(1);
  });
});

describe('country scope', () => {
  it('rejects countries without supported national sources', async () => {
    await expect(resolveCompanyData({ name: 'Demo Ltd', country: 'GB' }))
      .rejects.toThrow('unsupported_country');
  });
});
