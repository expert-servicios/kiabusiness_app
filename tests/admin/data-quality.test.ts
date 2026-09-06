import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const route = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/data-quality/route.ts'), 'utf8');
const page = fs.readFileSync(path.join(process.cwd(), 'app/(protected)/admin/calidad-datos/page.tsx'), 'utf8');

describe('Admin data quality', () => {
  it('is read only and never auto-corrects records', () => {
    expect(route).not.toContain('.insert(');
    expect(route).not.toContain('.update(');
    expect(route).not.toContain('.delete(');
    expect(route).toContain('automaticFixes: false');
    expect(route).toContain('historicalFinancialMutation: false');
  });

  it('detects fiscal, Stripe and membership integrity risks', () => {
    expect(route).toContain('duplicate_tax_id');
    expect(route).toContain('shared_stripe_customer');
    expect(route).toContain('duplicate_stripe_subscription');
    expect(route).toContain('duplicate_stripe_payment');
    expect(route).toContain('duplicate_checkout_session');
    expect(route).toContain('entity_membership_mismatch');
    expect(route).toContain('subscription_customer_mismatch');
  });

  it('treats financial duplicates as manual review only', () => {
    expect(route).toContain('Detener cualquier reconciliación automática');
    expect(route).toContain('no borrar, fusionar ni corregir pedidos automáticamente');
  });

  it('only flags missing company on post-cutoff financial flows', () => {
    expect(route).toContain("const ENTITY_SCOPE_CUTOFF = '2026-09-04T00:00:00.000Z'");
    expect(route).toContain("createdAt < ENTITY_SCOPE_CUTOFF || companyId");
    expect(route).toContain('no rellenar company_id por inferencia');
  });

  it('checks cross-entity commercial and document chains', () => {
    expect(route).toContain('document_case_company_mismatch');
    expect(route).toContain('commercial_chain_company_mismatch');
    expect(route).toContain('Documento y expediente pertenecen a entidades distintas');
    expect(route).toContain('Pedido y presupuesto tienen entidades distintas');
  });

  it('exposes a human review UI with no repair action', () => {
    expect(page).toContain('Calidad de Datos');
    expect(page).toContain('no fusiona, borra ni corrige históricos automáticamente');
    expect(page).toContain('Revisar →');
    expect(page).not.toContain('Corregir automáticamente');
  });
});
