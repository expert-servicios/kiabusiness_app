import { describe, expect, it, vi } from 'vitest';
import {
  linkAcademyOrderToClient,
  persistAcademyCertificationPayment,
  persistAcademyProgramPayment,
} from '@/lib/payments/academy-fulfillment';

function client(result: { data: Record<string, unknown>[] | null; error: { message: string } | null }) {
  return { rpc: vi.fn().mockResolvedValue(result) };
}

const program = {
  paymentId: 'pi_1', sessionId: 'cs_1', clientId: 'user-1', customerEmail: 'buyer@example.com',
  programSlug: 'gestion-laboral', programName: 'Gestión Laboral', amountEur: 1200, currency: 'EUR',
};

describe('atomic Academy fulfillment RPC adapters', () => {
  it('returns created=true only for the transaction that won the race', async () => {
    const first = client({ data: [{ order_id: 'order-1', enrollment_id: 'enrollment-1', created: true }], error: null });
    const retry = client({ data: [{ order_id: 'order-1', enrollment_id: 'enrollment-1', created: false }], error: null });

    await expect(persistAcademyProgramPayment(first, program)).resolves.toEqual({
      orderId: 'order-1', enrollmentId: 'enrollment-1', created: true,
    });
    await expect(persistAcademyProgramPayment(retry, program)).resolves.toMatchObject({ created: false });
    expect(first.rpc).toHaveBeenCalledWith('fulfill_academy_program_payment', expect.objectContaining({ p_payment_id: 'pi_1' }));
  });

  it('throws on transactional failure so Stripe receives a retryable 500', async () => {
    const db = client({ data: null, error: { message: 'serialization failure' } });
    await expect(persistAcademyProgramPayment(db, program)).rejects.toThrow('serialization failure');
  });

  it('does not accept an empty RPC result as successful fulfillment', async () => {
    const db = client({ data: [], error: null });
    await expect(persistAcademyProgramPayment(db, program)).rejects.toThrow('returned no result');
  });

  it('passes enrollment ownership inputs to certification transaction', async () => {
    const db = client({ data: [{ order_id: 'order-cert', created: true }], error: null });
    await persistAcademyCertificationPayment(db, {
      paymentId: 'pi_cert', sessionId: 'cs_cert', enrollmentId: 'enrollment-1', clientId: 'user-1',
      customerEmail: 'buyer@example.com', programSlug: 'gestion-laboral', amountEur: 500, currency: 'EUR',
    });
    expect(db.rpc).toHaveBeenCalledWith('fulfill_academy_certification_payment', expect.objectContaining({
      p_enrollment_id: 'enrollment-1', p_client_id: 'user-1',
    }));
  });

  it('propagates manual-link ownership rejection without partial writes', async () => {
    const db = client({ data: null, error: { message: 'Checkout email does not match client account' } });
    await expect(linkAcademyOrderToClient(db, 'order-1', 'user-2')).rejects.toThrow('does not match');
  });
});
