import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { isStaffRole } from '@/lib/auth/roles';
import { getTenantForUser } from '@/lib/auth/tenant';

const COMPANY_FORMS = ['autonomo', 'sl', 'sa', 'slne', 'cb', 'cooperativa', 'fundacion', 'otra'] as const;
const STRIPE_ID = /^cus_[A-Za-z0-9]+$/;
const STRIPE_SUBSCRIPTION_ID = /^sub_[A-Za-z0-9]+$/;

const createCompanySchema = z.object({
  action: z.literal('create_company_and_map'),
  razonSocial: z.string().trim().min(2).max(200),
  cifNif: z.string().trim().min(2).max(20),
  formaJuridica: z.enum(COMPANY_FORMS),
  stripeCustomerId: z.string().regex(STRIPE_ID),
});

const mapCustomerSchema = z.object({
  action: z.literal('map_customer'),
  companyId: z.string().uuid(),
  stripeCustomerId: z.string().regex(STRIPE_ID),
});

const importSubscriptionSchema = z.object({
  action: z.literal('import_subscription'),
  companyId: z.string().uuid(),
  stripeSubscriptionId: z.string().regex(STRIPE_SUBSCRIPTION_ID),
});

const actionSchema = z.discriminatedUnion('action', [
  createCompanySchema,
  mapCustomerSchema,
  importSubscriptionSchema,
]);

type AdminClient = ReturnType<typeof getSupabaseAdmin>;
type StaffContext = { admin: AdminClient; actorId: string };

type InvoiceEvidence = {
  id: string;
  number: string | null;
  status: string | null;
  customerName: string | null;
  customerTaxIds: string[];
  amountPaid: number;
  amountDue: number;
  currency: string;
  createdAt: string;
};

type SubscriptionEvidence = {
  id: string;
  status: Stripe.Subscription.Status;
  priceId: string | null;
  productId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  metadata: Stripe.Metadata;
};

type DeletedCustomerEvidence = { deleted: true; id: string };
type ActiveCustomerEvidence = {
  deleted: false;
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  metadata: Stripe.Metadata;
  invoices: InvoiceEvidence[];
  subscriptions: SubscriptionEvidence[];
  taxIds: string[];
  mixedTaxHistory: boolean;
};
type CustomerEvidence = DeletedCustomerEvidence | ActiveCustomerEvidence;

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

function getStripeCustomerId(customer: Stripe.Subscription['customer']): string | null {
  return typeof customer === 'string' ? customer : customer?.id ?? null;
}

function allowedSubscriptionStatus(status: Stripe.Subscription.Status) {
  const allowed = ['active', 'canceled', 'past_due', 'unpaid', 'trialing'] as const;
  return allowed.includes(status as (typeof allowed)[number])
    ? status as (typeof allowed)[number]
    : null;
}

async function loadTarget(admin: AdminClient, clientId: string) {
  const [{ data: profile }, auth] = await Promise.all([
    admin.from('profiles').select('id,full_name,email,status,tenant_id').eq('id', clientId).maybeSingle(),
    admin.auth.admin.getUserById(clientId),
  ]);
  if (!profile || !auth.data.user) return null;
  return { profile, email: auth.data.user.email ?? profile.email ?? '' };
}

async function loadMembership(admin: AdminClient, clientId: string, companyId: string) {
  const { data, error } = await admin
    .from('profile_companies')
    .select('company_id,role,company:companies(id,razon_social,nombre_comercial,cif_nif,status,stripe_customer_id,tenant_id)')
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
    entity: 'stripe_reconciliation',
    entity_id: entityId,
    metadata,
  });
  if (error) console.error('[stripe-reconciliation] audit failed', error.message);
}

async function inspectCustomer(customerId: string): Promise<CustomerEvidence> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return { deleted: true, id: customer.id };

  const [invoices, subscriptions] = await Promise.all([
    stripe.invoices.list({ customer: customerId, limit: 100 }),
    stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 }),
  ]);

  const invoiceEvidence: InvoiceEvidence[] = invoices.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number ?? null,
    status: invoice.status ?? null,
    customerName: invoice.customer_name ?? null,
    customerTaxIds: (invoice.customer_tax_ids ?? [])
      .map((item) => item.value)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
    amountPaid: Number(invoice.amount_paid ?? 0) / 100,
    amountDue: Number(invoice.amount_due ?? 0) / 100,
    currency: String(invoice.currency ?? 'eur').toUpperCase(),
    createdAt: new Date(invoice.created * 1000).toISOString(),
  }));

  const taxIds = Array.from(new Set(
    invoiceEvidence
      .flatMap((invoice) => invoice.customerTaxIds)
      .map(normalizeTaxId)
      .filter((value): value is string => Boolean(value)),
  ));

  return {
    deleted: false,
    id: customer.id,
    name: customer.name ?? null,
    email: customer.email ?? null,
    createdAt: new Date(customer.created * 1000).toISOString(),
    metadata: customer.metadata ?? {},
    invoices: invoiceEvidence,
    subscriptions: subscriptions.data.map((subscription) => {
      const firstItem = subscription.items.data[0];
      return {
        id: subscription.id,
        status: subscription.status,
        priceId: firstItem?.price.id ?? null,
        productId: typeof firstItem?.price.product === 'string' ? firstItem.price.product : firstItem?.price.product?.id ?? null,
        currentPeriodStart: firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
        currentPeriodEnd: firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
        metadata: subscription.metadata ?? {},
      };
    }),
    taxIds,
    mixedTaxHistory: taxIds.length > 1,
  };
}

function mixedHistoryResponse(evidence: ActiveCustomerEvidence) {
  return NextResponse.json({
    error: 'Este Stripe Customer contiene facturas históricas de más de un CIF/NIF. No puede mapearse a una sola empresa hasta implantar atribución por factura/periodo.',
    code: 'mixed_customer_tax_history',
    stripeTaxIds: evidence.taxIds,
  }, { status: 409 });
}

function taxMismatchResponse(taxIds: string[]) {
  return NextResponse.json({
    error: 'El CIF/NIF de la empresa no coincide con la evidencia fiscal disponible en Stripe.',
    code: 'stripe_tax_id_mismatch',
    stripeTaxIds: taxIds,
  }, { status: 409 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const target = await loadTarget(ctx.admin, clientId);
  if (!target) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { data: memberships, error: membershipsError } = await ctx.admin
    .from('profile_companies')
    .select('role,company:companies(id,razon_social,nombre_comercial,cif_nif,status,stripe_customer_id,tenant_id)')
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
      legacyStripeCustomerId: company.stripe_customer_id ?? null,
      tenantId: company.tenant_id ?? null,
    }] : [];
  });
  const companyIds = companies.map((company) => company.id);

  const [mappingsRes, subscriptionsRes] = await Promise.all([
    companyIds.length
      ? ctx.admin.from('company_stripe_customers').select('id,company_id,stripe_customer_id,is_primary,status,source,metadata,created_at,updated_at').in('company_id', companyIds).order('created_at')
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? ctx.admin.from('subscriptions').select('id,client_id,company_id,stripe_subscription_id,stripe_customer_id,stripe_price_id,plan_name,status,current_period_start,current_period_end,created_at').in('company_id', companyIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (mappingsRes.error || subscriptionsRes.error) {
    return NextResponse.json({ error: 'No se pudo cargar la reconciliación existente' }, { status: 500 });
  }

  const exactCustomerId = request.nextUrl.searchParams.get('stripeCustomerId')?.trim() ?? '';
  let evidence: CustomerEvidence | null = null;
  let evidenceError: string | null = null;
  if (exactCustomerId) {
    if (!STRIPE_ID.test(exactCustomerId)) evidenceError = 'Stripe Customer ID inválido';
    else {
      try {
        evidence = await inspectCustomer(exactCustomerId);
      } catch (error) {
        evidenceError = error instanceof Error ? error.message.slice(0, 220) : 'No se pudo consultar Stripe';
      }
    }
  }

  return NextResponse.json({
    client: {
      id: clientId,
      name: target.profile.full_name ?? target.email,
      email: target.email,
      status: target.profile.status,
    },
    companies,
    mappings: mappingsRes.data ?? [],
    subscriptions: subscriptionsRes.data ?? [],
    evidence,
    evidenceError,
    rules: { emailIsIdentity: false, automaticMerge: false, exactStripeIdRequired: true },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const target = await loadTarget(ctx.admin, clientId);
  if (!target) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

  const tenant = await getTenantForUser(clientId);
  if (!tenant?.id) return NextResponse.json({ error: 'No se pudo resolver el tenant del cliente' }, { status: 409 });

  if (parsed.data.action === 'create_company_and_map') {
    const customerId = parsed.data.stripeCustomerId;
    let evidence: CustomerEvidence;
    try {
      evidence = await inspectCustomer(customerId);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Stripe Customer no encontrado' }, { status: 400 });
    }
    if (evidence.deleted) return NextResponse.json({ error: 'El Stripe Customer está eliminado' }, { status: 409 });
    if (evidence.mixedTaxHistory) return mixedHistoryResponse(evidence);

    const normalizedTaxId = normalizeTaxId(parsed.data.cifNif);
    if (evidence.taxIds.length === 1 && normalizedTaxId !== evidence.taxIds[0]) return taxMismatchResponse(evidence.taxIds);

    const { data: existingTaxId, error: duplicateError } = await ctx.admin
      .from('companies')
      .select('id,razon_social,cif_nif')
      .eq('cif_nif', normalizedTaxId)
      .limit(10);
    if (duplicateError) return NextResponse.json({ error: 'No se pudo comprobar el CIF/NIF' }, { status: 500 });
    if ((existingTaxId ?? []).length > 0) {
      return NextResponse.json({
        error: 'Ya existe una empresa con este CIF/NIF. Debe revisarse y vincularse explícitamente; no se creará un duplicado.',
        code: 'tax_id_conflict',
        existingCompanyIds: (existingTaxId ?? []).map((row) => row.id),
      }, { status: 409 });
    }

    const { data: existingMapping } = await ctx.admin
      .from('company_stripe_customers')
      .select('id,company_id,status')
      .eq('tenant_id', tenant.id)
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (existingMapping) {
      return NextResponse.json({
        error: 'Este Stripe Customer ya está asociado a otra entidad. Revisión manual necesaria.',
        code: 'stripe_customer_conflict',
        existingCompanyId: existingMapping.company_id,
      }, { status: 409 });
    }

    const { data: company, error: companyError } = await ctx.admin
      .from('companies')
      .insert({
        user_id: clientId,
        tenant_id: tenant.id,
        name: parsed.data.razonSocial,
        company_name: parsed.data.razonSocial,
        razon_social: parsed.data.razonSocial,
        cif_nif: normalizedTaxId,
        vat_id: normalizedTaxId,
        forma_juridica: parsed.data.formaJuridica,
        status: 'active',
      })
      .select('id,razon_social,cif_nif')
      .single();
    if (companyError || !company) return NextResponse.json({ error: 'No se pudo crear la empresa' }, { status: 500 });

    const { error: membershipError } = await ctx.admin.from('profile_companies').insert({
      profile_id: clientId,
      company_id: company.id,
      role: 'owner',
    });
    if (membershipError) {
      await ctx.admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'No se pudo vincular la empresa al usuario; el alta parcial se ha revertido.' }, { status: 500 });
    }

    const { data: mapping, error: mappingError } = await ctx.admin
      .from('company_stripe_customers')
      .insert({
        company_id: company.id,
        tenant_id: tenant.id,
        stripe_customer_id: customerId,
        is_primary: true,
        status: 'active',
        source: 'admin_manual_review',
        metadata: {
          verified_at: new Date().toISOString(),
          verified_by: ctx.actorId,
          stripe_name: evidence.name,
          stripe_email: evidence.email,
          stripe_invoice_tax_ids: evidence.taxIds,
        },
      })
      .select('id,company_id,stripe_customer_id,is_primary,status')
      .single();
    if (mappingError || !mapping) {
      await ctx.admin.from('profile_companies').delete().eq('profile_id', clientId).eq('company_id', company.id);
      await ctx.admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'No se pudo asociar Stripe; la empresa creada se ha revertido.' }, { status: 500 });
    }

    await audit(ctx.admin, ctx.actorId, 'stripe_reconciliation.company_created_and_customer_mapped', company.id, {
      client_id: clientId,
      company_id: company.id,
      stripe_customer_id: customerId,
      tax_id: normalizedTaxId,
    });
    return NextResponse.json({ ok: true, company, mapping }, { status: 201 });
  }

  if (parsed.data.action === 'map_customer') {
    const membership = await loadMembership(ctx.admin, clientId, parsed.data.companyId);
    if (!membership) return NextResponse.json({ error: 'La empresa no pertenece a este usuario' }, { status: 404 });

    let evidence: CustomerEvidence;
    try {
      evidence = await inspectCustomer(parsed.data.stripeCustomerId);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Stripe Customer no encontrado' }, { status: 400 });
    }
    if (evidence.deleted) return NextResponse.json({ error: 'El Stripe Customer está eliminado' }, { status: 409 });
    if (evidence.mixedTaxHistory) return mixedHistoryResponse(evidence);

    const companyTaxId = normalizeTaxId(membership.company.cif_nif);
    if (evidence.taxIds.length === 1 && companyTaxId && companyTaxId !== evidence.taxIds[0]) return taxMismatchResponse(evidence.taxIds);

    const { data: existing } = await ctx.admin
      .from('company_stripe_customers')
      .select('id,company_id,stripe_customer_id,is_primary,status')
      .eq('tenant_id', tenant.id)
      .eq('stripe_customer_id', parsed.data.stripeCustomerId)
      .maybeSingle();

    if (existing?.company_id === parsed.data.companyId) return NextResponse.json({ ok: true, mapping: existing, idempotent: true });
    if (existing) {
      return NextResponse.json({
        error: 'Este Stripe Customer ya está asociado a otra empresa. No se ha modificado nada.',
        code: 'stripe_customer_conflict',
        existingCompanyId: existing.company_id,
      }, { status: 409 });
    }

    if (membership.company.stripe_customer_id && membership.company.stripe_customer_id !== parsed.data.stripeCustomerId) {
      return NextResponse.json({
        error: 'La empresa tiene un Stripe Customer legado distinto. Debe revisarse antes de añadir otro Customer activo.',
        code: 'legacy_customer_conflict',
        legacyStripeCustomerId: membership.company.stripe_customer_id,
      }, { status: 409 });
    }

    const { data: currentPrimary } = await ctx.admin
      .from('company_stripe_customers')
      .select('id')
      .eq('company_id', parsed.data.companyId)
      .eq('status', 'active')
      .eq('is_primary', true)
      .maybeSingle();

    const { data: mapping, error: mappingError } = await ctx.admin
      .from('company_stripe_customers')
      .insert({
        company_id: parsed.data.companyId,
        tenant_id: tenant.id,
        stripe_customer_id: parsed.data.stripeCustomerId,
        is_primary: !currentPrimary,
        status: 'active',
        source: 'admin_manual_review',
        metadata: {
          verified_at: new Date().toISOString(),
          verified_by: ctx.actorId,
          stripe_name: evidence.name,
          stripe_email: evidence.email,
          stripe_invoice_tax_ids: evidence.taxIds,
        },
      })
      .select('id,company_id,stripe_customer_id,is_primary,status')
      .single();
    if (mappingError || !mapping) return NextResponse.json({ error: 'No se pudo guardar la asociación Stripe' }, { status: 500 });

    await audit(ctx.admin, ctx.actorId, 'stripe_reconciliation.customer_mapped', mapping.id, {
      client_id: clientId,
      company_id: parsed.data.companyId,
      stripe_customer_id: parsed.data.stripeCustomerId,
      is_primary: mapping.is_primary,
    });
    return NextResponse.json({ ok: true, mapping }, { status: 201 });
  }

  const membership = await loadMembership(ctx.admin, clientId, parsed.data.companyId);
  if (!membership) return NextResponse.json({ error: 'La empresa no pertenece a este usuario' }, { status: 404 });

  const stripe = getStripeClient();
  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(parsed.data.stripeSubscriptionId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Suscripción Stripe no encontrada' }, { status: 400 });
  }

  const customerId = getStripeCustomerId(subscription.customer);
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id ?? null;
  const status = allowedSubscriptionStatus(subscription.status);
  if (!customerId || !priceId || !status) {
    return NextResponse.json({ error: 'La suscripción no tiene un estado/Customer/Price importable de forma segura' }, { status: 409 });
  }

  const { data: customerMapping } = await ctx.admin
    .from('company_stripe_customers')
    .select('id,status')
    .eq('company_id', parsed.data.companyId)
    .eq('stripe_customer_id', customerId)
    .in('status', ['active', 'historical'])
    .maybeSingle();
  if (!customerMapping) {
    return NextResponse.json({
      error: 'Antes de importar la suscripción, su Stripe Customer debe estar asociado explícitamente a esta empresa.',
      code: 'customer_mapping_required',
      stripeCustomerId: customerId,
    }, { status: 409 });
  }

  const { data: existingSubscription } = await ctx.admin
    .from('subscriptions')
    .select('id,client_id,company_id,stripe_subscription_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (existingSubscription) {
    if (existingSubscription.client_id !== clientId) {
      return NextResponse.json({ error: 'La suscripción ya pertenece a otro usuario. Revisión manual necesaria.', code: 'subscription_client_conflict' }, { status: 409 });
    }
    if (existingSubscription.company_id && existingSubscription.company_id !== parsed.data.companyId) {
      return NextResponse.json({ error: 'La suscripción ya pertenece a otra empresa. Revisión manual necesaria.', code: 'subscription_company_conflict' }, { status: 409 });
    }
    if (existingSubscription.company_id === parsed.data.companyId) {
      return NextResponse.json({ ok: true, subscription: existingSubscription, idempotent: true });
    }

    const { data: linked, error: linkError } = await ctx.admin
      .from('subscriptions')
      .update({ company_id: parsed.data.companyId, updated_at: new Date().toISOString() })
      .eq('id', existingSubscription.id)
      .is('company_id', null)
      .select('id,client_id,company_id,stripe_subscription_id')
      .maybeSingle();
    if (linkError || !linked) return NextResponse.json({ error: 'No se pudo vincular la suscripción existente' }, { status: 409 });

    await audit(ctx.admin, ctx.actorId, 'stripe_reconciliation.subscription_linked', linked.id, {
      client_id: clientId,
      company_id: parsed.data.companyId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
    });
    return NextResponse.json({ ok: true, subscription: linked });
  }

  let planName = subscription.metadata?.plan_name || 'Suscripción';
  const productId = typeof firstItem.price.product === 'string' ? firstItem.price.product : firstItem.price.product?.id;
  if (productId) {
    try {
      const product = await stripe.products.retrieve(productId);
      if (product.name) planName = product.name;
    } catch {
      // Cosmetic lookup only. A verified subscription import must not depend on the product label.
    }
  }

  const periodStart = firstItem.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null;
  const periodEnd = firstItem.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null;
  const { data: imported, error: importError } = await ctx.admin
    .from('subscriptions')
    .insert({
      client_id: clientId,
      company_id: parsed.data.companyId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_name: planName,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      trial_status: subscription.status === 'trialing' ? 'trialing' : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: {
        ...subscription.metadata,
        reconciliation_source: 'admin_manual_review',
        reconciled_at: new Date().toISOString(),
        reconciled_by: ctx.actorId,
      },
    })
    .select('id,client_id,company_id,stripe_subscription_id,stripe_customer_id,stripe_price_id,plan_name,status,current_period_start,current_period_end')
    .single();
  if (importError || !imported) return NextResponse.json({ error: 'No se pudo importar la suscripción a EXPERT' }, { status: 500 });

  await audit(ctx.admin, ctx.actorId, 'stripe_reconciliation.subscription_imported', imported.id, {
    client_id: clientId,
    company_id: parsed.data.companyId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
  });
  return NextResponse.json({ ok: true, subscription: imported }, { status: 201 });
}
