import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { isStaffRole } from '@/lib/auth/roles';
import { getTenantForUser } from '@/lib/auth/tenant';

const STRIPE_INVOICE_ID = /^in_[A-Za-z0-9]+$/;

const attributeSchema = z.object({
  companyId: z.string().uuid(),
  stripeInvoiceId: z.string().regex(STRIPE_INVOICE_ID),
  manualReason: z.string().trim().max(500).optional(),
});

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type StaffContext = {
  admin: AdminClient;
  actorId: string;
};

async function requireStaff(request: NextRequest): Promise<StaffContext | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'inactive' || !isStaffRole(profile.role)) return null;
  return { admin, actorId: user.id };
}

function normalizeTaxId(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, '') ?? '';
  return normalized || null;
}

function getInvoiceCustomerId(customer: Stripe.Invoice['customer']): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function getInvoiceTaxIds(invoice: Stripe.Invoice): string[] {
  return Array.from(new Set(
    (invoice.customer_tax_ids ?? [])
      .map((item) => normalizeTaxId(item.value))
      .filter((value): value is string => Boolean(value)),
  ));
}

async function loadTargetCompany(admin: AdminClient, clientId: string, companyId: string) {
  const { data, error } = await admin
    .from('profile_companies')
    .select('role,company:companies(id,razon_social,nombre_comercial,cif_nif,status,tenant_id)')
    .eq('profile_id', clientId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error || !data) return null;
  const raw = data.company;
  const company = Array.isArray(raw) ? raw[0] : raw;
  return company ? { role: data.role, company } : null;
}

async function audit(admin: AdminClient, actorId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
  const { error } = await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'stripe_invoice_attribution',
    entity_id: entityId,
    metadata,
  });
  if (error) console.error('[stripe-invoice-attribution] audit failed', error.message);
}

async function inspectInvoice(stripeInvoiceId: string) {
  const stripe = getStripeClient();
  const invoice = await stripe.invoices.retrieve(stripeInvoiceId);
  const customerId = getInvoiceCustomerId(invoice.customer);
  const taxIds = getInvoiceTaxIds(invoice);

  return {
    invoice,
    evidence: {
      id: invoice.id,
      number: invoice.number ?? null,
      status: invoice.status ?? null,
      customerId,
      customerName: invoice.customer_name ?? null,
      customerEmail: invoice.customer_email ?? null,
      taxIds,
      amountDue: Number(invoice.amount_due ?? 0) / 100,
      amountPaid: Number(invoice.amount_paid ?? 0) / 100,
      currency: String(invoice.currency ?? 'eur').toUpperCase(),
      createdAt: new Date(invoice.created * 1000).toISOString(),
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    },
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const [{ data: profile }, auth] = await Promise.all([
    ctx.admin.from('profiles').select('id,full_name,email,status').eq('id', clientId).maybeSingle(),
    ctx.admin.auth.admin.getUserById(clientId),
  ]);
  if (!profile || !auth.data.user) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { data: memberships, error: membershipsError } = await ctx.admin
    .from('profile_companies')
    .select('role,company:companies(id,razon_social,nombre_comercial,cif_nif,status,tenant_id)')
    .eq('profile_id', clientId);
  if (membershipsError) return NextResponse.json({ error: 'No se pudieron cargar las empresas' }, { status: 500 });

  const companies = (memberships ?? []).flatMap((row) => {
    const raw = row.company;
    const company = Array.isArray(raw) ? raw[0] : raw;
    return company ? [{
      id: company.id,
      name: company.razon_social || company.nombre_comercial || company.id,
      nif: company.cif_nif ?? null,
      status: company.status,
      role: row.role,
      tenantId: company.tenant_id ?? null,
    }] : [];
  });

  const companyIds = companies.map((company) => company.id);
  const { data: attributions, error: attributionError } = companyIds.length
    ? await ctx.admin
      .from('stripe_invoice_company_attributions')
      .select('id,tenant_id,company_id,stripe_invoice_id,stripe_customer_id,invoice_tax_id,source,status,evidence,created_by,created_at,revoked_by,revoked_at,revocation_reason')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })
    : { data: [], error: null };

  if (attributionError) return NextResponse.json({ error: 'No se pudieron cargar las atribuciones' }, { status: 500 });

  const exactInvoiceId = request.nextUrl.searchParams.get('stripeInvoiceId')?.trim() ?? '';
  let evidence: Awaited<ReturnType<typeof inspectInvoice>>['evidence'] | null = null;
  let evidenceError: string | null = null;
  if (exactInvoiceId) {
    if (!STRIPE_INVOICE_ID.test(exactInvoiceId)) {
      evidenceError = 'Stripe Invoice ID inválido';
    } else {
      try {
        const inspected = await inspectInvoice(exactInvoiceId);
        evidence = inspected.evidence;
      } catch (error) {
        evidenceError = error instanceof Error ? error.message.slice(0, 220) : 'No se pudo consultar la factura Stripe';
      }
    }
  }

  return NextResponse.json({
    client: {
      id: clientId,
      name: profile.full_name ?? auth.data.user.email ?? profile.email ?? clientId,
      email: auth.data.user.email ?? profile.email ?? '',
      status: profile.status,
    },
    companies,
    attributions: attributions ?? [],
    evidence,
    evidenceError,
    rules: {
      emailIsIdentity: false,
      invoiceTaxIdIsEvidence: true,
      automaticReassignment: false,
      correctionsAreRevocations: true,
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const { data: profile } = await ctx.admin.from('profiles').select('id,status').eq('id', clientId).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const parsed = attributeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

  const companyMembership = await loadTargetCompany(ctx.admin, clientId, parsed.data.companyId);
  if (!companyMembership) return NextResponse.json({ error: 'La empresa no pertenece a este usuario' }, { status: 404 });
  if (companyMembership.company.status === 'inactive') return NextResponse.json({ error: 'La empresa está inactiva' }, { status: 409 });

  const tenant = await getTenantForUser(clientId);
  if (!tenant?.id) return NextResponse.json({ error: 'No se pudo resolver el tenant del cliente' }, { status: 409 });
  if (!companyMembership.company.tenant_id || companyMembership.company.tenant_id !== tenant.id) {
    return NextResponse.json({
      error: 'La empresa no tiene un tenant consistente con el usuario. Debe revisarse antes de atribuir facturas.',
      code: 'company_tenant_mismatch',
    }, { status: 409 });
  }

  let inspected: Awaited<ReturnType<typeof inspectInvoice>>;
  try {
    inspected = await inspectInvoice(parsed.data.stripeInvoiceId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Factura Stripe no encontrada' }, { status: 400 });
  }

  const { evidence } = inspected;
  if (!evidence.customerId) return NextResponse.json({ error: 'La factura no tiene Stripe Customer identificable' }, { status: 409 });

  const companyTaxId = normalizeTaxId(companyMembership.company.cif_nif);
  let source: 'invoice_tax_id' | 'manual_review';
  let invoiceTaxId: string | null = null;

  if (evidence.taxIds.length > 0) {
    if (!companyTaxId) {
      return NextResponse.json({
        error: 'La factura contiene CIF/NIF, pero la empresa no tiene CIF/NIF normalizado. Debe completarse antes de atribuir.',
        code: 'company_tax_id_required',
        stripeTaxIds: evidence.taxIds,
      }, { status: 409 });
    }
    if (!evidence.taxIds.includes(companyTaxId)) {
      return NextResponse.json({
        error: 'El CIF/NIF de la factura no coincide con la empresa seleccionada. No se ha modificado nada.',
        code: 'invoice_tax_id_mismatch',
        stripeTaxIds: evidence.taxIds,
        companyTaxId,
      }, { status: 409 });
    }
    source = 'invoice_tax_id';
    invoiceTaxId = companyTaxId;
  } else {
    if (!parsed.data.manualReason || parsed.data.manualReason.trim().length < 10) {
      return NextResponse.json({
        error: 'La factura no contiene CIF/NIF. Para una atribución manual debes indicar un motivo de al menos 10 caracteres.',
        code: 'manual_reason_required',
      }, { status: 409 });
    }
    source = 'manual_review';
  }

  const { data: existing, error: existingError } = await ctx.admin
    .from('stripe_invoice_company_attributions')
    .select('id,company_id,stripe_invoice_id,status,source')
    .eq('tenant_id', tenant.id)
    .eq('stripe_invoice_id', evidence.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: 'No se pudo comprobar la atribución existente' }, { status: 500 });
  if (existing?.company_id === parsed.data.companyId) {
    return NextResponse.json({ ok: true, attribution: existing, idempotent: true });
  }
  if (existing) {
    return NextResponse.json({
      error: 'La factura ya está atribuida a otra empresa. No se reasignará automáticamente; primero debe revisarse y revocarse la atribución anterior.',
      code: 'invoice_company_conflict',
      existingCompanyId: existing.company_id,
      existingAttributionId: existing.id,
    }, { status: 409 });
  }

  const { data: attribution, error: insertError } = await ctx.admin
    .from('stripe_invoice_company_attributions')
    .insert({
      tenant_id: tenant.id,
      company_id: parsed.data.companyId,
      stripe_invoice_id: evidence.id,
      stripe_customer_id: evidence.customerId,
      invoice_tax_id: invoiceTaxId,
      source,
      status: 'active',
      evidence: {
        stripe_invoice_number: evidence.number,
        stripe_invoice_status: evidence.status,
        stripe_customer_name: evidence.customerName,
        stripe_customer_email: evidence.customerEmail,
        stripe_tax_ids: evidence.taxIds,
        amount_due: evidence.amountDue,
        amount_paid: evidence.amountPaid,
        currency: evidence.currency,
        created_at: evidence.createdAt,
        period_start: evidence.periodStart,
        period_end: evidence.periodEnd,
        manual_reason: source === 'manual_review' ? parsed.data.manualReason?.trim() : null,
      },
      created_by: ctx.actorId,
    })
    .select('id,tenant_id,company_id,stripe_invoice_id,stripe_customer_id,invoice_tax_id,source,status,evidence,created_by,created_at')
    .single();

  if (insertError || !attribution) return NextResponse.json({ error: 'No se pudo guardar la atribución de la factura' }, { status: 500 });

  await audit(ctx.admin, ctx.actorId, 'stripe_invoice_attribution.created', attribution.id, {
    client_id: clientId,
    company_id: parsed.data.companyId,
    stripe_invoice_id: evidence.id,
    stripe_customer_id: evidence.customerId,
    source,
    invoice_tax_id: invoiceTaxId,
  });

  return NextResponse.json({ ok: true, attribution }, { status: 201 });
}
