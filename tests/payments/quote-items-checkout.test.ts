import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { quoteItemsSubtotal, resolveQuoteItems } from '@/lib/quotes/quote-items';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('itemized quote checkout', () => {
  it('prices 11 Holded migration employees plus one training module from the server catalog', () => {
    const items = resolveQuoteItems([
      { serviceSlug: 'holded-migracion-laboral', quantity: 11 },
      { serviceSlug: 'holded-modulo-formacion', quantity: 1 },
    ]);

    expect(items[0]).toMatchObject({
      serviceSlug: 'holded-migracion-laboral',
      stripePriceId: 'price_1UDKyMLeYwwgvux40YFzyVwi',
      quantity: 11,
      unitAmountEur: 50,
    });
    expect(items[1]).toMatchObject({
      serviceSlug: 'holded-modulo-formacion',
      stripePriceId: 'price_1SyB8ULeYwwgvux4sZbYod1B',
      quantity: 1,
      unitAmountEur: 180,
    });
    expect(quoteItemsSubtotal(items)).toBe(730);
  });

  it('enforces migration minimum and integer quantities', () => {
    expect(() => resolveQuoteItems([
      { serviceSlug: 'holded-migracion-laboral', quantity: 4 },
    ])).toThrow(/entre 5 y 200/);

    expect(() => resolveQuoteItems([
      { serviceSlug: 'holded-migracion-laboral', quantity: 5.5 },
    ])).toThrow(/entero/);
  });

  it('does not allow arbitrary quantity for fixed services', () => {
    expect(() => resolveQuoteItems([
      { serviceSlug: 'holded-modulo-formacion', quantity: 2 },
    ])).toThrow(/cantidad 1/);
  });

  it('persists quote lines behind quote ownership RLS', () => {
    const migration = source('supabase/migrations/20260908190000_quote_items_checkout.sql');
    expect(migration).toContain('create table if not exists public.quote_items');
    expect(migration).toContain("client view own quote items");
    expect(migration).toContain('q.client_id = auth.uid()');
    expect(migration).toContain('tenant_admin select quote items');
  });

  it('admin checkout ignores browser totals for structured lines and uses Stripe prices', () => {
    const route = source('app/api/admin/quotes/route.ts');
    expect(route).toContain('resolveQuoteItems(parsed.data.items)');
    expect(route).toContain('quoteItemsSubtotal(resolvedItems)');
    expect(route).toContain('El importe no coincide con las líneas del catálogo.');
    expect(route).toContain('price: item.stripePriceId, quantity: item.quantity');
    expect(route).toContain("automatic_tax: { enabled: true }");
    expect(route).toContain("employee_count: String(resolvedItems.find((item) => item.serviceSlug === 'holded-migracion-laboral')?.quantity ?? '')");
  });

  it('client re-checkout validates ownership, company and persisted subtotal', () => {
    const route = source('app/api/quotes/[id]/checkout/route.ts');
    expect(route).toContain('quote.client_id !== user.id');
    expect(route).toContain(".eq('company_id', quote.company_id)");
    expect(route).toContain('structuredSubtotal');
    expect(route).toContain('El presupuesto necesita revisión antes del pago.');
    expect(route).toContain('await stripe.checkout.sessions.expire(session.id)');
  });
});
