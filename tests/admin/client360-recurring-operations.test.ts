import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const historical = (file: string) => source(`supabase/migration-history-archive/pre-baseline-20260912/${file}`);

describe('Client 360 recurring operations', () => {
  const operationsApi = source('app/api/admin/clientes/[id]/operations/route.ts');
  const operationsPage = source('app/(protected)/admin/clientes/[id]/operaciones/page.tsx');
  const operationsNav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');
  const clientLayout = source('app/(protected)/admin/clientes/[id]/layout.tsx');
  const tasksPage = source('app/(protected)/admin/tareas/page.tsx');
  const documentsRoute = source('app/api/cases/[id]/documents/route.ts');
  const companyStripeMigration = historical('20260907175500_add_company_stripe_customer_mappings.sql');

  it('aggregates recurring operations from canonical sources without mutating them', () => {
    expect(operationsApi).toContain(".from('internal_tasks')");
    expect(operationsApi).toContain(".from('cases')");
    expect(operationsApi).toContain(".from('subscriptions')");
    expect(operationsApi).toContain(".from('orders')");
    expect(operationsApi).toContain(".from('obligations_calendar')");
    expect(operationsApi).toContain(".from('client_integrations')");
    expect(operationsApi).toContain(".from('documents')");
    expect(operationsApi).toContain('stripe.invoices.list');
    expect(operationsApi).not.toContain(".update({");
    expect(operationsApi).not.toContain(".insert({");
    expect(operationsApi).not.toContain(".delete()");
  });

  it('scopes Stripe identity and subscriptions by company instead of shared email', () => {
    expect(companyStripeMigration).toContain('create table public.company_stripe_customers');
    expect(companyStripeMigration).toContain('unique (tenant_id, stripe_customer_id)');
    expect(companyStripeMigration).toContain('company_stripe_customers_one_primary_active_idx');
    expect(companyStripeMigration).not.toContain('stripe_email');
    expect(operationsApi).toContain(".from('company_stripe_customers')");
    expect(operationsApi).toContain(".in('company_id', companyIds)");
    expect(operationsApi).toContain(".in('status', ['active', 'historical'])");
    expect(operationsApi).toContain("stripeIdentitySource: mappedIds.length ? 'company_stripe_customers'");
    expect(operationsApi).toContain('legacyStripeCustomerId');
    expect(operationsApi).toContain('const subscriptions = [...(clientSubsRes.data ?? []), ...(companySubsRes.data ?? [])]');
    expect(operationsApi).toContain('stripeCustomerIds');
    expect(operationsApi).not.toContain('lower(email)');
  });

  it('keeps Stripe invoice documents distinct from local EXPERT orders', () => {
    expect(operationsApi).toContain('stripeInvoices');
    expect(operationsApi).toContain('localOrders');
    expect(operationsApi).toContain('hostedInvoiceUrl');
    expect(operationsApi).toContain('invoicePdf');
    expect(operationsPage).toContain('Facturas Stripe');
    expect(operationsPage).toContain('registros EXPERT');
  });

  it('exposes tasks, cases, documents, deadlines and integrations from Client 360 navigation', () => {
    expect(operationsNav).toContain('href={`/admin/clientes/${clientId}/operaciones`}');
    expect(operationsNav).toContain('href={`/admin/clientes/${clientId}/documentos`}');
    expect(operationsNav).toContain('href={`/admin/tareas?clientId=${clientId}`}');
    expect(operationsNav).toContain('href={`/admin/clientes/${clientId}/integraciones`}');
    expect(clientLayout).toContain('<ClientOperationsNav clientId={id} />');
    expect(operationsPage).toContain('Tareas y próximos pasos');
    expect(operationsPage).toContain('Plazos y calendario');
    expect(operationsPage).toContain('Documentación');
    expect(operationsPage).toContain('Integraciones');
  });

  it('makes the Admin task workspace honor the Client 360 clientId context', () => {
    expect(tasksPage).toContain("const clientId = searchParams.get('clientId')");
    expect(tasksPage).toContain("params.set('clientId', clientId)");
    expect(tasksPage).toContain('clientId: clientId || null');
    expect(tasksPage).toContain('href={`/admin/clientes/${clientId}/operaciones`}');
  });

  it('persists case documents using the real production schema and safe company scope', () => {
    expect(documentsRoute).toContain(".select('id,client_id,company_id,service')");
    expect(documentsRoute).toContain('company_id: companyId');
    expect(documentsRoute).toContain("owner_type: 'case'");
    expect(documentsRoute).toContain('owner_id: caseId');
    expect(documentsRoute).toContain("kind: 'client_document'");
    expect(documentsRoute).toContain('mime_type: validation.contentType');
    expect(documentsRoute).toContain("code: 'case_company_required'");
    expect(documentsRoute).toContain('.update({ drive_file_id: driveResult.fileId })');
    expect(documentsRoute).not.toContain('.update({ metadata:');
  });

  it('cleans up Storage if the database document record cannot be created', () => {
    expect(documentsRoute).toContain(".from('client-documents').remove([uploadData.path])");
  });
});
