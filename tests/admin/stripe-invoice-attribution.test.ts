import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Stripe invoice legal-entity attribution', () => {
  const migration = source('supabase/migrations/20260907182500_add_stripe_invoice_company_attributions.sql');
  const route = source('app/api/admin/clientes/[id]/stripe-invoice-attributions/route.ts');
  const revokeRoute = source('app/api/admin/clientes/[id]/stripe-invoice-attributions/[attributionId]/route.ts');
  const operations = source('app/api/admin/clientes/[id]/operations/route.ts');
  const page = source('app/(protected)/admin/clientes/[id]/stripe/facturas/page.tsx');
  const nav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');

  it('creates a backend-only attribution table with immutable correction history', () => {
    expect(migration).toContain('create table public.stripe_invoice_company_attributions');
    expect(migration).toContain("status text not null default 'active' check (status in ('active', 'revoked'))");
    expect(migration).toContain('create unique index stripe_invoice_company_attributions_one_active_idx');
    expect(migration).toContain("where status = 'active'");
    expect(migration).toContain('alter table public.stripe_invoice_company_attributions enable row level security');
    expect(migration).toContain('grant select, insert, update on table public.stripe_invoice_company_attributions to service_role');
    expect(migration).not.toContain('grant delete on table public.stripe_invoice_company_attributions to service_role');
    expect(migration).not.toMatch(/grant\s+.*delete.*service_role/i);
  });

  it('requires exact invoice IDs and does not use email as identity', () => {
    expect(route).toContain("const STRIPE_INVOICE_ID = /^in_");
    expect(route).toContain('stripe.invoices.retrieve(stripeInvoiceId)');
    expect(route).not.toContain(".eq('email'");
    expect(route).not.toContain('lower(email)');
    expect(page).toContain('La factura manda sobre el Customer');
  });

  it('requires the selected company to belong to the resolved tenant', () => {
    expect(route).toContain("code: 'company_tenant_mismatch'");
    expect(route).toContain('companyMembership.company.tenant_id !== tenant.id');
  });

  it('uses invoice tax identity as evidence and fails closed on mismatch', () => {
    expect(route).toContain("code: 'company_tax_id_required'");
    expect(route).toContain("code: 'invoice_tax_id_mismatch'");
    expect(route).toContain("source = 'invoice_tax_id'");
    expect(route).toContain("source = 'manual_review'");
    expect(route).toContain("code: 'manual_reason_required'");
    expect(route).toContain('parsed.data.manualReason.trim().length < 10');
  });

  it('never reassigns an invoice silently', () => {
    expect(route).toContain("code: 'invoice_company_conflict'");
    expect(route).toContain('No se reasignará automáticamente');
    expect(route).not.toContain(".delete().eq('stripe_invoice_id'");
  });

  it('corrects attribution by revocation rather than deletion', () => {
    expect(revokeRoute).toContain("status: 'revoked'");
    expect(revokeRoute).toContain('revoked_by: ctx.actorId');
    expect(revokeRoute).toContain('revocation_reason: parsed.data.reason');
    expect(revokeRoute).not.toContain('.delete()');
    expect(revokeRoute).toContain("'stripe_invoice_attribution.revoked'");
    expect(route).toContain("'stripe_invoice_attribution.created'");
  });

  it('makes Client 360 prefer invoice-level legal identity over a whole Customer mapping', () => {
    expect(operations).toContain(".from('stripe_invoice_company_attributions')");
    expect(operations).toContain("type AttributionSource = 'explicit_invoice' | 'invoice_tax_id' | 'customer_mapping_fallback'");
    expect(operations).toContain('const explicitAttribution = activeAttributionByInvoiceId.get(invoice.id)');
    expect(operations).toContain("pushInvoice(invoice, company, stripeCustomerId, 'explicit_invoice')");
    expect(operations).toContain('const invoiceTaxIds = getInvoiceTaxIds(invoice)');
    expect(operations).toContain("pushInvoice(invoice, company, stripeCustomerId, 'invoice_tax_id')");
    expect(operations).toContain('stripe.invoices.retrieve(attribution.stripe_invoice_id)');
  });

  it('sees explicit attributions for mapped Customers even when they point outside this Client 360', () => {
    expect(operations).toContain(".in('stripe_customer_id', mappedCustomerIds)");
    expect(operations).toContain(".in('tenant_id', tenantIds)");
    expect(operations).toContain('if (explicitAttribution.company_id !== company.id) continue');
    expect(operations).toContain('An explicit attribution anywhere in this tenant always wins');
  });

  it('fails closed if Stripe identity or invoice attribution queries fail', () => {
    expect(operations).toContain('if (stripeMappingsRes.error)');
    expect(operations).toContain('if (companyInvoiceAttributionsRes.error)');
    expect(operations).toContain('if (customerInvoiceAttributionsRes.error)');
    expect(operations).toContain('No se pudo resolver la atribución legal');
  });

  it('exposes invoice attribution from Client 360 with confirmation and visible history', () => {
    expect(nav).toContain('href={`/admin/clientes/${clientId}/stripe/facturas`}');
    expect(page).toContain('Atribución de facturas Stripe');
    expect(page).toContain('window.confirm');
    expect(page).toContain('Historial de atribuciones');
    expect(page).toContain('La fila NO se eliminará');
  });
});
