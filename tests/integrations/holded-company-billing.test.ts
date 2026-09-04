import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'lib/integrations/holded.ts'), 'utf8');

describe('Holded company billing contact isolation', () => {
  it('does not touch contacts while Stripe invoice creation is disabled', () => {
    const guardPosition = source.indexOf("if (!createInvoices) {");
    const companyContactPosition = source.indexOf('resolveCompanyBillingContact({');
    expect(guardPosition).toBeGreaterThan(-1);
    expect(companyContactPosition).toBeGreaterThan(guardPosition);
    expect(source).toContain("reason: 'HOLDED_CREATE_INVOICES_FROM_STRIPE=false'");
    expect(source).toContain('contactId: null');
  });

  it('resolves company identity from the persisted Stripe subscription', () => {
    expect(source).toContain(".from('subscriptions')");
    expect(source).toContain(".eq('stripe_subscription_id', subscriptionId)");
    expect(source).toContain(".from('companies')");
    expect(source).toContain(".select('razon_social,email,telefono')");
  });

  it('uses external mappings as the stable company-to-Holded contact identity', () => {
    expect(source).toContain(".eq('local_entity', 'companies')");
    expect(source).toContain(".eq('external_entity', 'holded_contact')");
    expect(source).toContain("local_entity: 'companies'");
    expect(source).toContain('company_id: params.companyId');
  });

  it('stops for manual review when an unmapped email already exists in Holded', () => {
    expect(source).toContain('findContactsByEmail');
    expect(source).toContain('existingContacts.length > 0');
    expect(source).toContain('requires manual review');
    expect(source).toContain('already exists without an entity mapping');
  });

  it('creates a new contact only after proving there is no email collision', () => {
    const collisionGuard = source.indexOf('existingContacts.length > 0');
    const scopedCreate = source.indexOf('const contactId = await createContact', collisionGuard);
    expect(collisionGuard).toBeGreaterThan(-1);
    expect(scopedCreate).toBeGreaterThan(collisionGuard);
  });
});
