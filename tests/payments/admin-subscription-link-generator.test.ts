import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin subscription link generator', () => {
  const page = source('app/(protected)/admin/suscripciones/generar/page.tsx');
  const route = source('app/api/admin/subscriptions/send-link/route.ts');

  it('generates a checkout for an existing client without sending email', () => {
    expect(page).toContain("fetch('/api/admin/subscriptions/send-link'");
    expect(page).toContain('sendEmail: false');
    expect(page).toContain('Generar enlace sin enviar');
    expect(page).toContain("fetch('/api/admin/clientes')");
  });

  it('keeps server-side duplicate and tax safeguards authoritative', () => {
    expect(route).toContain("code: 'subscription_exists'");
    expect(route).toContain("code: 'checkout_exists'");
    expect(route).toContain('automatic_tax: { enabled: true }');
    expect(route).toContain("tax_behavior: 'exclusive'");
  });
});
