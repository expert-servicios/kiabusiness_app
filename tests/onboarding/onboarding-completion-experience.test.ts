import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('onboarding completion experience', () => {
  it('stores the rendered body of every EXPERT email in the audit timeline', () => {
    const send = source('lib/email/send.ts');
    expect(send).toContain('subject,\n          html,');
    expect(send).toContain('subject,\n        html,');
  });

  it('sends preparation material when an onboarding booking is created or rescheduled', () => {
    const webhook = source('app/api/webhooks/cal/route.ts');
    const templates = source('lib/email/onboarding-templates.ts');
    expect(webhook).toContain("eventType: 'onboarding.preparation'");
    expect(webhook).toContain('sendOnboardingPreparation(attendee, payload)');
    expect(webhook).toContain('payload.startTime}`.slice(0, 256)');
    expect(templates).toContain('Crear y gestionar presupuestos');
    expect(templates).toContain('Crear una factura de venta');
    expect(templates).toContain('Registrar una factura o ticket de compra');
    expect(templates).toContain('Espacio de Cliente Responsable');
  });

  it('shows Stripe invoices read-only for the authenticated active company', () => {
    const invoices = source('app/api/billing/invoices/route.ts');
    const page = source('app/(protected)/dashboard/suscripciones/page.tsx');
    expect(invoices).toContain(".from('profile_companies')");
    expect(invoices).toContain(".select('id,razon_social,stripe_customer_id')");
    expect(invoices).toContain('stripe.invoices.list');
    expect(invoices).not.toMatch(/\.from\('(?:orders|subscriptions|companies)'\)[\s\S]{0,120}\.(?:insert|update|delete)\(/);
    expect(page).toContain('Facturas y pagos');
    expect(page).toContain('amountRemaining');
    expect(page).toContain('invoicePdf');
  });

  it('repairs review compatibility additively without deleting history', () => {
    const migration = source('supabase/migrations/20260906133000_repair_review_feedback_schema.sql');
    const sql = migration.replace(/^\s*--.*$/gm, '');
    expect(migration).toContain('add column if not exists token text');
    expect(migration).toContain('add column if not exists expires_at timestamptz');
    expect(migration).toContain('add column if not exists allow_publish boolean not null default false');
    expect(migration).toContain("add column if not exists status text not null default 'pending'");
    expect(sql).not.toMatch(/\b(drop|truncate|delete|update|insert)\b/i);
  });
});
