import { describe, expect, it } from 'vitest';
import { legacyOrderFields, requireCreatedOrderId } from '@/lib/payments/non-academy-order';

describe('non-Academy order persistence', () => {
  it('mirrors amount_eur into the legacy amount field and normalizes pack_name', () => {
    expect(legacyOrderFields(90, '  Consulta fiscal  ')).toEqual({
      amount: 90,
      pack_name: 'Consulta fiscal',
    });
  });

  it('uses a safe non-empty fallback for legacy pack_name', () => {
    expect(legacyOrderFields(180, '   ')).toEqual({
      amount: 180,
      pack_name: 'Servicio EXPERT',
    });
  });

  it('returns the created order id when persistence succeeded', () => {
    expect(requireCreatedOrderId('quote', null, 'order-123')).toBe('order-123');
  });

  it('throws on database insert errors so Stripe can retry the event', () => {
    expect(() => requireCreatedOrderId('catalog', { message: 'not-null violation' }, null)).toThrow(
      'catalog order insert failed: not-null violation',
    );
  });

  it('throws when Supabase reports no error but returns no order id', () => {
    expect(() => requireCreatedOrderId('quote', null, null)).toThrow(
      'quote order insert returned no id',
    );
  });
});
