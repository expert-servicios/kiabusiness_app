import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Admin subscription visibility and follow-up', () => {
  it('shows Stripe-only subscriptions without importing or linking historical records', () => {
    const route = source('app/api/admin/subscriptions/route.ts');
    const page = source('app/(protected)/admin/suscripciones/page.tsx');

    expect(route).toContain("stripe.subscriptions.list({ status: 'all'");
    expect(route).toContain("source: 'stripe_only'");
    expect(route).toContain('requires_linking: true');
    expect(route).not.toContain(".from('subscriptions').insert(");
    expect(route).not.toContain(".from('subscriptions').update(");
    expect(page).toContain('Solo Stripe · vinculación pendiente');
    expect(page).toContain('Revisión manual necesaria antes de vincular');
  });

  it('surfaces open tasks before they become overdue', () => {
    const inbox = source('app/api/admin/operations-inbox/route.ts');
    const taskQuery = inbox.slice(inbox.indexOf(".from('internal_tasks')"), inbox.indexOf(".from('documents')"));

    expect(taskQuery).toContain(".in('status', ['pendiente', 'en_progreso'])");
    expect(taskQuery).not.toContain(".lt('due_date', today)");
    expect(inbox).toContain("overdue ? 'Tarea vencida' : 'Tarea pendiente'");
  });
});
