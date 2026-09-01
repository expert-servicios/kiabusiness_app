import { describe, expect, it } from 'vitest';
import {
  acceptPendingCompanyData,
  buildPendingCompanyData,
  clearPendingCompanyData,
  PENDING_COMPANY_DATA_KEY,
  readPendingCompanyData,
  serializePendingCompanyData,
} from '@/lib/integrations/kia-company-confirmation';

const suggestion = {
  name: 'DEMO EXPERT SL',
  registeredAddress: 'Calle Mayor 1',
  city: 'Alicante',
  province: 'Alicante',
  incorporationDate: '2024-01-02',
  source: 'boe_borme' as const,
  retrievedAt: '2026-09-01T00:00:00.000Z',
  confidence: 'medium' as const,
  warnings: [],
};

describe('Kia company-data confirmation', () => {
  it('keeps public data isolated in a pending proposal', () => {
    const current = { prof_nif: 'B99286320' };
    const pending = buildPendingCompanyData(suggestion, 'B99286320', current)!;
    const data: Record<string, string> = {
      ...current,
      [PENDING_COMPANY_DATA_KEY]: serializePendingCompanyData(pending),
    };

    expect(data.prof_nombre_empresa).toBeUndefined();
    expect(readPendingCompanyData(data)?.proposed).toEqual({
      prof_nombre_empresa: 'DEMO EXPERT SL',
      prof_direccion_fiscal: 'Calle Mayor 1, Alicante, Alicante',
      prof_fecha_inicio: '2024-01-02',
    });
  });

  it('copies proposed fields only after acceptance and clears the proposal', () => {
    const pending = buildPendingCompanyData(suggestion, 'B99286320', {})!;
    const accepted = acceptPendingCompanyData({
      [PENDING_COMPANY_DATA_KEY]: serializePendingCompanyData(pending),
    })!;

    expect(accepted.prof_nombre_empresa).toBe('DEMO EXPERT SL');
    expect(accepted[PENDING_COMPANY_DATA_KEY]).toBeUndefined();
  });

  it('rejects by clearing the proposal without copying public fields', () => {
    const pending = buildPendingCompanyData(suggestion, 'B99286320', {})!;
    const rejected = clearPendingCompanyData({
      marker: 'keep',
      [PENDING_COMPANY_DATA_KEY]: serializePendingCompanyData(pending),
    });

    expect(rejected).toEqual({ marker: 'keep' });
  });

  it('does not propose overwriting fields already supplied by the user', () => {
    const pending = buildPendingCompanyData(suggestion, 'B99286320', {
      prof_nombre_empresa: 'NOMBRE DECLARADO',
      prof_direccion_fiscal: 'DIRECCIÓN DECLARADA',
      prof_fecha_inicio: '2020-01-01',
    });
    expect(pending).toBeNull();
  });
});
