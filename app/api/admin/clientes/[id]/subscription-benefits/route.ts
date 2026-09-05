import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const BENEFIT_TYPES = ['included_entity', 'discount_percent', 'discount_amount', 'free_months'] as const;
const COVERAGE_SCOPES = ['recurring_management', 'subscription_fee', 'custom'] as const;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive' || !['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return { admin, actorId: user.id };
}

function companyName(company: { razon_social: string | null; nombre_comercial: string | null; id: string }) {
  return company.razon_social || company.nombre_comercial || company.id;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const { admin } = auth;

  const [profileRes, membershipsRes, subscriptionsRes, checkoutsRes, entitlementsRes] = await Promise.all([
    admin.from('profiles').select('id,full_name,email,status').eq('id', clientId).maybeSingle(),
    admin
      .from('profile_companies')
      .select('company_id,role,company:companies(id,razon_social,nombre_comercial,cif_nif,status)')
      .eq('profile_id', clientId),
    admin
      .from('subscriptions')
      .select('id,plan_name,status,company_id,current_period_start,current_period_end,created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
    admin
      .from('checkout_sessions')
      .select('id,stripe_session_id,status,company_id,metadata,created_at,updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false }),
    admin
      .from('subscription_entitlements')
      .select('id,client_id,subscription_id,checkout_session_id,feature_key,tier,active,valid_from,valid_until,granted_by,revoked_at,revoked_by,metadata,created_at,updated_at,primary_company_id,beneficiary_company_id,benefit_value,coverage_scope,excluded_services')
      .eq('client_id', clientId)
      .in('feature_key', [...BENEFIT_TYPES])
      .order('created_at', { ascending: false }),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }
  if (membershipsRes.error || subscriptionsRes.error || checkoutsRes.error || entitlementsRes.error) {
    return NextResponse.json({ error: 'No se pudo cargar la configuración comercial del cliente' }, { status: 500 });
  }

  const companies = (membershipsRes.data ?? []).flatMap((row) => {
    const raw = row.company;
    const company = Array.isArray(raw) ? raw[0] : raw;
    return company ? [{
      id: company.id,
      name: companyName(company),
      nif: company.cif_nif,
      status: company.status,
      role: row.role,
    }] : [];
  });
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const entitlementIds = (entitlementsRes.data ?? []).map((row) => row.id);

  const { data: auditRows } = entitlementIds.length
    ? await admin
        .from('audit_logs')
        .select('entity_id,action,actor_id,metadata,created_at')
        .eq('entity', 'subscription_entitlements')
        .in('entity_id', entitlementIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const createdAuditByEntitlement = new Map<string, { actor_id: string | null; metadata: Record<string, unknown>; created_at: string }>();
  for (const row of auditRows ?? []) {
    if (row.action !== 'subscription.benefit.created' || !row.entity_id || createdAuditByEntitlement.has(row.entity_id)) continue;
    createdAuditByEntitlement.set(row.entity_id, {
      actor_id: row.actor_id,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      created_at: row.created_at,
    });
  }

  const benefits = (entitlementsRes.data ?? []).map((row) => {
    const audit = createdAuditByEntitlement.get(row.id);
    return {
      ...row,
      primaryCompanyName: row.primary_company_id ? companyById.get(row.primary_company_id)?.name ?? null : null,
      beneficiaryCompanyName: row.beneficiary_company_id ? companyById.get(row.beneficiary_company_id)?.name ?? null : null,
      adminMeta: audit ? {
        actorId: audit.actor_id,
        reason: typeof audit.metadata.reason === 'string' ? audit.metadata.reason : null,
        notes: typeof audit.metadata.notes === 'string' ? audit.metadata.notes : null,
        sourceType: typeof audit.metadata.source_type === 'string' ? audit.metadata.source_type : null,
        createdAt: audit.created_at,
      } : null,
    };
  });

  return NextResponse.json({
    client: profileRes.data,
    companies,
    subscriptions: subscriptionsRes.data ?? [],
    checkoutSessions: checkoutsRes.data ?? [],
    benefits,
  });
}

const createSchema = z.object({
  sourceType: z.enum(['subscription', 'checkout']),
  sourceId: z.string().uuid(),
  primaryCompanyId: z.string().uuid(),
  beneficiaryCompanyId: z.string().uuid(),
  benefitType: z.enum(BENEFIT_TYPES),
  value: z.number().nonnegative().optional().nullable(),
  coverageScope: z.enum(COVERAGE_SCOPES).optional(),
  excludedServices: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  reason: z.string().trim().min(3).max(500),
  notes: z.string().trim().max(1500).optional().nullable(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { admin, actorId } = auth;
  const input = parsed.data;

  const membershipCompanyIds = [...new Set([input.primaryCompanyId, input.beneficiaryCompanyId])];
  const { data: memberships, error: membershipError } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId)
    .in('company_id', membershipCompanyIds);
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
  if (new Set((memberships ?? []).map((row) => row.company_id)).size !== membershipCompanyIds.length) {
    return NextResponse.json({ error: 'La entidad contratante y la beneficiaria deben pertenecer al cliente' }, { status: 400 });
  }

  if (input.benefitType === 'included_entity' && input.primaryCompanyId === input.beneficiaryCompanyId) {
    return NextResponse.json({ error: 'La entidad incluida debe ser distinta de la entidad contratante' }, { status: 400 });
  }

  let subscriptionId: string | null = null;
  let checkoutSessionId: string | null = null;

  if (input.sourceType === 'subscription') {
    const { data: source, error } = await admin
      .from('subscriptions')
      .select('id,client_id,company_id,status')
      .eq('id', input.sourceId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!source || source.client_id !== clientId || source.company_id !== input.primaryCompanyId) {
      return NextResponse.json({ error: 'La suscripción no corresponde a este cliente y entidad' }, { status: 400 });
    }
    if (!['active', 'trialing', 'past_due'].includes(source.status)) {
      return NextResponse.json({ error: 'La suscripción no está en un estado válido para añadir beneficios' }, { status: 409 });
    }
    subscriptionId = source.id;
  } else {
    const { data: source, error } = await admin
      .from('checkout_sessions')
      .select('id,user_id,company_id,status')
      .eq('id', input.sourceId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!source || source.user_id !== clientId || source.company_id !== input.primaryCompanyId) {
      return NextResponse.json({ error: 'El Checkout no corresponde a este cliente y entidad' }, { status: 400 });
    }
    if (source.status !== 'open') {
      return NextResponse.json({ error: 'Solo se pueden añadir beneficios a un Checkout todavía abierto' }, { status: 409 });
    }
    checkoutSessionId = source.id;
  }

  const value = input.value ?? null;
  if (input.benefitType === 'discount_percent' && (!(value && value > 0) || value > 100)) {
    return NextResponse.json({ error: 'El descuento porcentual debe ser mayor que 0 y no superar el 100%' }, { status: 400 });
  }
  if (input.benefitType === 'discount_amount' && !(value && value > 0)) {
    return NextResponse.json({ error: 'El descuento por importe debe ser mayor que 0' }, { status: 400 });
  }
  if (input.benefitType === 'free_months' && (!(value && value >= 1) || !Number.isInteger(value))) {
    return NextResponse.json({ error: 'Los meses gratis deben ser un número entero igual o superior a 1' }, { status: 400 });
  }

  const coverageScope = input.coverageScope ?? (input.benefitType === 'included_entity' ? 'recurring_management' : 'subscription_fee');
  const excludedServices = input.excludedServices ?? (input.benefitType === 'included_entity' ? ['annual_irpf'] : []);
  const validFrom = input.validFrom ? `${input.validFrom}T00:00:00.000Z` : new Date().toISOString();
  const validUntil = input.validUntil ? `${input.validUntil}T23:59:59.999Z` : null;
  if (validUntil && new Date(validUntil).getTime() < new Date(validFrom).getTime()) {
    return NextResponse.json({ error: 'La fecha fin no puede ser anterior a la fecha de inicio' }, { status: 400 });
  }

  const { data: created, error: insertError } = await admin
    .from('subscription_entitlements')
    .insert({
      client_id: clientId,
      subscription_id: subscriptionId,
      checkout_session_id: checkoutSessionId,
      feature_key: input.benefitType,
      tier: coverageScope,
      active: true,
      valid_from: validFrom,
      valid_until: validUntil,
      granted_by: 'admin',
      metadata: {},
      primary_company_id: input.primaryCompanyId,
      beneficiary_company_id: input.beneficiaryCompanyId,
      benefit_value: input.benefitType === 'included_entity' ? null : value,
      coverage_scope: coverageScope,
      excluded_services: excludedServices,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un beneficio activo equivalente para esta contratación' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action: 'subscription.benefit.created',
    entity: 'subscription_entitlements',
    entity_id: created.id,
    metadata: {
      client_id: clientId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      primary_company_id: input.primaryCompanyId,
      beneficiary_company_id: input.beneficiaryCompanyId,
      benefit_type: input.benefitType,
      value: input.benefitType === 'included_entity' ? null : value,
      coverage_scope: coverageScope,
      excluded_services: excludedServices,
      valid_from: validFrom,
      valid_until: validUntil,
      reason: input.reason,
      notes: input.notes ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

const patchSchema = z.object({
  benefitId: z.string().uuid(),
  action: z.literal('deactivate'),
  reason: z.string().trim().min(3).max(500),
  notes: z.string().trim().max(1500).optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id: clientId } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { admin, actorId } = auth;
  const now = new Date().toISOString();
  const { data: current, error: currentError } = await admin
    .from('subscription_entitlements')
    .select('id,active,client_id')
    .eq('id', parsed.data.benefitId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'Beneficio no encontrado' }, { status: 404 });
  if (!current.active) return NextResponse.json({ ok: true, alreadyInactive: true });

  const { error: updateError } = await admin
    .from('subscription_entitlements')
    .update({ active: false, revoked_at: now, revoked_by: actorId, updated_at: now })
    .eq('id', current.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action: 'subscription.benefit.deactivated',
    entity: 'subscription_entitlements',
    entity_id: current.id,
    metadata: {
      client_id: clientId,
      reason: parsed.data.reason,
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
