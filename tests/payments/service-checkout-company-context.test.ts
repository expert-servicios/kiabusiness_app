import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/api/services/checkout/route.ts'), 'utf8');

describe('one-time service checkout company context', () => {
  it('uses company Stripe customer and metadata', () => {
    expect(source).toContain(".select('stripe_customer_id,razon_social,cif_nif,direccion,ciudad,codigo_postal,pais')");
    expect(source).toContain('const stripeCustomerId = company.stripe_customer_id ?? null');
    expect(source).toContain('company_id: companyId');
  });
});
