import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/admin/operations-inbox/route.ts');
const page = source('app/(protected)/admin/operaciones/page.tsx');

describe('admin operational inbox', () => {
  it('is a read-only aggregation over operational sources', () => {
    expect(route).toContain("from('checkout_sessions')");
    expect(route).toContain("from('subscriptions')");
    expect(route).toContain("from('internal_tasks')");
    expect(route).toContain("from('documents')");
    expect(route).toContain("from('cases')");
    expect(route).toContain("from('client_integrations')");
    expect(route).toContain("from('orders')");
    expect(route).not.toMatch(/\.insert\s*\(/);
    expect(route).not.toMatch(/\.update\s*\(/);
    expect(route).not.toMatch(/\.delete\s*\(/);
  });

  it('treats stale open checkouts as review items without auto-expiring them', () => {
    expect(route).toContain('STALE_CHECKOUT_HOURS = 24');
    expect(route).toContain(".eq('status', 'open')");
    expect(route).toContain("title: 'Posible checkout abandonado'");
    expect(route).not.toContain('checkout.sessions.expire');
  });

  it('flags only new entityless financial rows and requires manual review', () => {
    expect(route).toContain("ENTITY_SCOPE_CUTOFF = '2026-09-04T00:00:00.000Z'");
    expect(route).toContain("title: 'Checkout nuevo sin entidad fiscal'");
    expect(route).toContain("title: 'Suscripción nueva sin entidad fiscal'");
    expect(route).toContain("title: 'Pedido nuevo sin entidad fiscal'");
    expect(route).toContain('no se corrige automáticamente');
    expect(route).toContain('revisión manual obligatoria');
  });

  it('links every queue item to a resolution surface instead of mutating it', () => {
    expect(page).toContain('Incidencias que requieren revisión humana');
    expect(page).toContain('no modifica históricos');
    expect(page).toContain('href={item.href}');
    expect(page).toContain('Revisar →');
  });
});
