import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type RuleStatus = 'ok' | 'alert';

type Evidence = {
  label: string;
  value: string;
  href?: string;
};

type QualityIssue = {
  id: string;
  rule: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence: Evidence[];
  clientId?: string | null;
  companyId?: string | null;
  createdAt?: string | null;
};

type RuleSummary = {
  id: string;
  label: string;
  description: string;
  status: RuleStatus;
  count: number;
};

const ENTITY_SCOPE_CUTOFF = '2026-09-04T00:00:00.000Z';
const LIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']);
const MAX_ROWS = 5000;

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive' || !isStaffRole(profile?.role)) return null;
  return admin;
}

function normalizeTaxId(value: string | null | undefined): string {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function present(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const value = key(row);
    if (!value) continue;
    const current = groups.get(value) ?? [];
    current.push(row);
    groups.set(value, current);
  }
  return groups;
}

function companyLabel(company: { id: string; razon_social: string | null; nombre_comercial: string | null; cif_nif: string | null }): string {
  return company.razon_social || company.nombre_comercial || company.cif_nif || company.id;
}

export async function GET(request: NextRequest) {
  const admin = await requireStaff(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const [
    companiesRes,
    profilesRes,
    membershipsRes,
    subscriptionsRes,
    ordersRes,
    checkoutsRes,
    casesRes,
    documentsRes,
    integrationsRes,
    quotesRes,
  ] = await Promise.all([
    admin.from('companies').select('id,razon_social,nombre_comercial,cif_nif,stripe_customer_id,status,created_at').limit(MAX_ROWS),
    admin.from('profiles').select('id,full_name,email,role,status,active_company_id,created_at').limit(MAX_ROWS),
    admin.from('profile_companies').select('profile_id,company_id,role,created_at').limit(MAX_ROWS),
    admin.from('subscriptions').select('id,client_id,company_id,stripe_subscription_id,stripe_customer_id,plan_name,status,created_at').limit(MAX_ROWS),
    admin.from('orders').select('id,client_id,user_id,company_id,stripe_payment_id,stripe_session_id,status,source,quote_id,case_id,created_at').limit(MAX_ROWS),
    admin.from('checkout_sessions').select('id,user_id,company_id,stripe_session_id,status,created_at').limit(MAX_ROWS),
    admin.from('cases').select('id,client_id,company_id,quote_id,service,state,created_at').limit(MAX_ROWS),
    admin.from('documents').select('id,client_id,company_id,case_id,original_name,title,kind,state,created_at').limit(MAX_ROWS),
    admin.from('client_integrations').select('id,client_id,company_id,provider,status,created_at').limit(MAX_ROWS),
    admin.from('quotes').select('id,client_id,company_id,title,status,created_at').limit(MAX_ROWS),
  ]);

  const warnings: string[] = [];
  const sources = [
    ['companies', companiesRes],
    ['profiles', profilesRes],
    ['profile_companies', membershipsRes],
    ['subscriptions', subscriptionsRes],
    ['orders', ordersRes],
    ['checkout_sessions', checkoutsRes],
    ['cases', casesRes],
    ['documents', documentsRes],
    ['client_integrations', integrationsRes],
    ['quotes', quotesRes],
  ] as const;

  for (const [name, result] of sources) {
    if (result.error) warnings.push(`${name}: ${result.error.message}`);
    if ((result.data?.length ?? 0) >= MAX_ROWS) warnings.push(`${name}: alcanzado límite de ${MAX_ROWS} filas; revisar paginación antes de considerar el chequeo exhaustivo.`);
  }

  const companies = companiesRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const memberships = membershipsRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const checkouts = checkoutsRes.data ?? [];
  const cases = casesRes.data ?? [];
  const documents = documentsRes.data ?? [];
  const integrations = integrationsRes.data ?? [];
  const quotes = quotesRes.data ?? [];

  const companyById = new Map(companies.map((item) => [item.id, item]));
  const profileById = new Map(profiles.map((item) => [item.id, item]));
  const caseById = new Map(cases.map((item) => [item.id, item]));
  const quoteById = new Map(quotes.map((item) => [item.id, item]));
  const membershipKeys = new Set(memberships.map((item) => `${item.profile_id}:${item.company_id}`));

  const issues: QualityIssue[] = [];

  const financialRefsByCompany = new Map<string, number>();
  for (const row of subscriptions) if (row.company_id) financialRefsByCompany.set(row.company_id, (financialRefsByCompany.get(row.company_id) ?? 0) + 1);
  for (const row of orders) if (row.company_id) financialRefsByCompany.set(row.company_id, (financialRefsByCompany.get(row.company_id) ?? 0) + 1);
  for (const row of checkouts) if (row.company_id) financialRefsByCompany.set(row.company_id, (financialRefsByCompany.get(row.company_id) ?? 0) + 1);

  const taxGroups = groupBy(companies.filter((item) => present(item.cif_nif)), (item) => normalizeTaxId(item.cif_nif));
  for (const [taxId, rows] of taxGroups) {
    if (rows.length < 2) continue;
    const hasFinancialRefs = rows.some((row) => (financialRefsByCompany.get(row.id) ?? 0) > 0);
    issues.push({
      id: `duplicate-tax:${taxId}`,
      rule: 'duplicate_tax_id',
      severity: hasFinancialRefs ? 'high' : 'medium',
      title: `NIF/CIF repetido en ${rows.length} entidades`,
      detail: hasFinancialRefs
        ? 'Alguna entidad afectada tiene referencias financieras. Revisión manual obligatoria antes de cualquier cambio.'
        : 'No se debe fusionar ni borrar automáticamente. Confirmar si son registros duplicados o una relación intencionada.',
      evidence: rows.flatMap((row) => [
        { label: companyLabel(row), value: `${row.cif_nif ?? taxId} · ${row.id}`, href: '/admin/empresas' },
      ]),
      companyId: rows[0]?.id ?? null,
      createdAt: rows.map((row) => row.created_at).sort()[0] ?? null,
    });
  }

  const companyStripeGroups = groupBy(companies.filter((item) => present(item.stripe_customer_id)), (item) => item.stripe_customer_id ?? '');
  for (const [customerId, rows] of companyStripeGroups) {
    if (rows.length < 2) continue;
    issues.push({
      id: `shared-stripe-customer:${customerId}`,
      rule: 'shared_stripe_customer',
      severity: 'critical',
      title: 'Stripe Customer compartido entre entidades',
      detail: 'Dos o más entidades fiscales apuntan al mismo Stripe Customer. No reasignar ni sincronizar automáticamente.',
      evidence: rows.map((row) => ({ label: companyLabel(row), value: `${customerId} · ${row.id}`, href: '/admin/empresas' })),
      companyId: rows[0]?.id ?? null,
    });
  }

  const subscriptionIdGroups = groupBy(subscriptions.filter((item) => present(item.stripe_subscription_id)), (item) => item.stripe_subscription_id ?? '');
  for (const [stripeId, rows] of subscriptionIdGroups) {
    if (rows.length < 2) continue;
    issues.push({
      id: `duplicate-subscription:${stripeId}`,
      rule: 'duplicate_stripe_subscription',
      severity: 'critical',
      title: 'Stripe Subscription ID duplicado',
      detail: 'El mismo identificador Stripe aparece en varios registros locales. Detener cualquier reconciliación automática.',
      evidence: rows.map((row) => ({ label: row.plan_name || 'Suscripción', value: `${stripeId} · ${row.id}`, href: row.client_id ? `/admin/clientes/${row.client_id}/operaciones` : '/admin/suscripciones' })),
      clientId: rows[0]?.client_id ?? null,
      companyId: rows[0]?.company_id ?? null,
    });
  }

  const paymentIdGroups = groupBy(orders.filter((item) => present(item.stripe_payment_id)), (item) => item.stripe_payment_id ?? '');
  for (const [paymentId, rows] of paymentIdGroups) {
    if (rows.length < 2) continue;
    issues.push({
      id: `duplicate-payment:${paymentId}`,
      rule: 'duplicate_stripe_payment',
      severity: 'critical',
      title: 'Stripe Payment ID duplicado en pedidos',
      detail: 'Posible duplicidad financiera. Revisión manual obligatoria; no borrar, fusionar ni corregir pedidos automáticamente.',
      evidence: rows.map((row) => ({ label: row.source || 'Pedido', value: `${paymentId} · ${row.id}`, href: (row.client_id ?? row.user_id) ? `/admin/clientes/${row.client_id ?? row.user_id}/operaciones` : '/admin/pagos' })),
      clientId: rows[0]?.client_id ?? rows[0]?.user_id ?? null,
      companyId: rows[0]?.company_id ?? null,
    });
  }

  const checkoutIdGroups = groupBy(checkouts.filter((item) => present(item.stripe_session_id)), (item) => item.stripe_session_id ?? '');
  for (const [sessionId, rows] of checkoutIdGroups) {
    if (rows.length < 2) continue;
    issues.push({
      id: `duplicate-checkout:${sessionId}`,
      rule: 'duplicate_checkout_session',
      severity: 'critical',
      title: 'Stripe Checkout Session duplicada localmente',
      detail: 'La misma sesión Stripe aparece varias veces. Revisar antes de generar pedidos o reintentar sincronizaciones.',
      evidence: rows.map((row) => ({ label: row.status || 'checkout', value: `${sessionId} · ${row.id}`, href: row.user_id ? `/admin/clientes/${row.user_id}/operaciones` : '/admin/pagos' })),
      clientId: rows[0]?.user_id ?? null,
      companyId: rows[0]?.company_id ?? null,
    });
  }

  const liveByCompany = groupBy(subscriptions.filter((item) => item.company_id && LIVE_SUBSCRIPTION_STATUSES.has(item.status)), (item) => item.company_id ?? '');
  for (const [companyId, rows] of liveByCompany) {
    if (rows.length < 2) continue;
    const company = companyById.get(companyId);
    issues.push({
      id: `multiple-live-subscriptions:${companyId}`,
      rule: 'multiple_live_subscriptions',
      severity: 'high',
      title: 'Varias suscripciones vivas para una misma entidad',
      detail: 'El flujo nuevo bloquea este caso. Si aparece, revisar Stripe y el histórico antes de decidir cuál corresponde.',
      evidence: rows.map((row) => ({ label: row.plan_name || row.status, value: `${row.status} · ${row.stripe_subscription_id}`, href: row.client_id ? `/admin/clientes/${row.client_id}/operaciones` : '/admin/suscripciones' })),
      companyId,
      clientId: rows[0]?.client_id ?? null,
      createdAt: rows.map((row) => row.created_at).sort()[0] ?? null,
    });
    if (company) {
      issues[issues.length - 1].evidence.unshift({ label: 'Entidad', value: companyLabel(company), href: '/admin/empresas' });
    }
  }

  for (const profile of profiles) {
    if (!profile.active_company_id) continue;
    if (membershipKeys.has(`${profile.id}:${profile.active_company_id}`)) continue;
    issues.push({
      id: `invalid-active-company:${profile.id}`,
      rule: 'invalid_active_company',
      severity: 'high',
      title: 'Entidad activa fuera de las memberships del perfil',
      detail: 'El perfil apunta a una entidad que no figura en profile_companies. No cambiarla automáticamente.',
      evidence: [
        { label: profile.full_name || profile.email || profile.id, value: profile.id, href: `/admin/clientes/${profile.id}` },
        { label: 'active_company_id', value: profile.active_company_id, href: '/admin/empresas' },
      ],
      clientId: profile.id,
      companyId: profile.active_company_id,
      createdAt: profile.created_at,
    });
  }

  for (const subscription of subscriptions) {
    if (!subscription.company_id) continue;
    const company = companyById.get(subscription.company_id);
    if (!company || !present(company.stripe_customer_id) || !present(subscription.stripe_customer_id)) continue;
    if (company.stripe_customer_id === subscription.stripe_customer_id) continue;
    issues.push({
      id: `subscription-customer-mismatch:${subscription.id}`,
      rule: 'subscription_customer_mismatch',
      severity: 'high',
      title: 'Suscripción y entidad apuntan a Stripe Customers distintos',
      detail: 'No sincronizar ni reasignar automáticamente. Confirmar en Stripe qué Customer es el contractual.',
      evidence: [
        { label: 'Entidad', value: `${companyLabel(company)} · ${company.stripe_customer_id}`, href: '/admin/empresas' },
        { label: 'Suscripción', value: `${subscription.plan_name ?? subscription.id} · ${subscription.stripe_customer_id}`, href: subscription.client_id ? `/admin/clientes/${subscription.client_id}/operaciones` : '/admin/suscripciones' },
      ],
      clientId: subscription.client_id,
      companyId: subscription.company_id,
      createdAt: subscription.created_at,
    });
  }

  const checkMembership = (input: {
    rowType: string;
    rowId: string;
    clientId: string | null;
    companyId: string | null;
    title: string;
    href: string;
    createdAt?: string | null;
  }) => {
    if (!input.clientId || !input.companyId) return;
    if (membershipKeys.has(`${input.clientId}:${input.companyId}`)) return;
    issues.push({
      id: `membership-mismatch:${input.rowType}:${input.rowId}`,
      rule: 'entity_membership_mismatch',
      severity: 'high',
      title: `${input.title}: entidad no vinculada al cliente`,
      detail: 'El registro tiene client/user + company explícitos, pero esa relación no existe en profile_companies. Revisión manual obligatoria.',
      evidence: [
        { label: 'Registro', value: `${input.rowType} · ${input.rowId}`, href: input.href },
        { label: 'Cliente', value: profileById.get(input.clientId)?.full_name || profileById.get(input.clientId)?.email || input.clientId, href: `/admin/clientes/${input.clientId}` },
        { label: 'Entidad', value: companyById.get(input.companyId) ? companyLabel(companyById.get(input.companyId)!) : input.companyId, href: '/admin/empresas' },
      ],
      clientId: input.clientId,
      companyId: input.companyId,
      createdAt: input.createdAt ?? null,
    });
  };

  for (const row of subscriptions) checkMembership({ rowType: 'subscription', rowId: row.id, clientId: row.client_id, companyId: row.company_id, title: 'Suscripción', href: row.client_id ? `/admin/clientes/${row.client_id}/operaciones` : '/admin/suscripciones', createdAt: row.created_at });
  for (const row of checkouts) checkMembership({ rowType: 'checkout', rowId: row.id, clientId: row.user_id, companyId: row.company_id, title: 'Checkout', href: row.user_id ? `/admin/clientes/${row.user_id}/operaciones` : '/admin/pagos', createdAt: row.created_at });
  for (const row of orders) {
    const clientId = row.client_id ?? row.user_id;
    checkMembership({ rowType: 'order', rowId: row.id, clientId, companyId: row.company_id, title: 'Pedido', href: clientId ? `/admin/clientes/${clientId}/operaciones` : '/admin/pagos', createdAt: row.created_at });
  }
  for (const row of cases) checkMembership({ rowType: 'case', rowId: row.id, clientId: row.client_id, companyId: row.company_id, title: 'Expediente', href: `/admin/expedientes/${row.id}`, createdAt: row.created_at });
  for (const row of documents) checkMembership({ rowType: 'document', rowId: row.id, clientId: row.client_id, companyId: row.company_id, title: 'Documento', href: row.client_id ? `/admin/clientes/${row.client_id}/documentos` : '/admin/documentos', createdAt: row.created_at });
  for (const row of integrations) checkMembership({ rowType: 'integration', rowId: row.id, clientId: row.client_id, companyId: row.company_id, title: `Integración ${row.provider}`, href: row.client_id ? `/admin/clientes/${row.client_id}/integraciones` : '/admin/configuracion', createdAt: row.created_at });
  for (const row of quotes) checkMembership({ rowType: 'quote', rowId: row.id, clientId: row.client_id, companyId: row.company_id, title: 'Presupuesto', href: row.client_id ? `/admin/clientes/${row.client_id}/operaciones` : '/admin/presupuestos', createdAt: row.created_at });

  for (const document of documents) {
    if (!document.case_id || !document.company_id) continue;
    const relatedCase = caseById.get(document.case_id);
    if (!relatedCase?.company_id || relatedCase.company_id === document.company_id) continue;
    issues.push({
      id: `document-case-company-mismatch:${document.id}`,
      rule: 'document_case_company_mismatch',
      severity: 'high',
      title: 'Documento y expediente pertenecen a entidades distintas',
      detail: 'La reasignación documental debe conservar entidad. Revisar el histórico antes de tocar el documento o el expediente.',
      evidence: [
        { label: 'Documento', value: `${document.original_name || document.title || document.id} · ${document.company_id}`, href: document.client_id ? `/admin/clientes/${document.client_id}/documentos` : '/admin/documentos' },
        { label: 'Expediente', value: `${relatedCase.service} · ${relatedCase.company_id}`, href: `/admin/expedientes/${relatedCase.id}` },
      ],
      clientId: document.client_id,
      companyId: document.company_id,
      createdAt: document.created_at,
    });
  }

  const quoteCompanyFor = (quoteId: string | null) => quoteId ? quoteById.get(quoteId)?.company_id ?? null : null;
  for (const row of cases) {
    const quoteCompanyId = quoteCompanyFor(row.quote_id);
    if (!row.company_id || !quoteCompanyId || row.company_id === quoteCompanyId) continue;
    issues.push({
      id: `case-quote-company-mismatch:${row.id}`,
      rule: 'commercial_chain_company_mismatch',
      severity: 'high',
      title: 'Expediente y presupuesto tienen entidades distintas',
      detail: 'La cadena comercial debe mantener la entidad contractual. Revisar manualmente antes de corregir.',
      evidence: [
        { label: 'Expediente', value: `${row.service} · ${row.company_id}`, href: `/admin/expedientes/${row.id}` },
        { label: 'Presupuesto', value: `${row.quote_id} · ${quoteCompanyId}`, href: `/admin/presupuestos/${row.quote_id}` },
      ],
      clientId: row.client_id,
      companyId: row.company_id,
      createdAt: row.created_at,
    });
  }
  for (const row of orders) {
    const quoteCompanyId = quoteCompanyFor(row.quote_id);
    if (!row.company_id || !quoteCompanyId || row.company_id === quoteCompanyId) continue;
    const clientId = row.client_id ?? row.user_id;
    issues.push({
      id: `order-quote-company-mismatch:${row.id}`,
      rule: 'commercial_chain_company_mismatch',
      severity: 'critical',
      title: 'Pedido y presupuesto tienen entidades distintas',
      detail: 'Posible inconsistencia financiera de atribución. No corregir automáticamente.',
      evidence: [
        { label: 'Pedido', value: `${row.id} · ${row.company_id}`, href: clientId ? `/admin/clientes/${clientId}/operaciones` : '/admin/pagos' },
        { label: 'Presupuesto', value: `${row.quote_id} · ${quoteCompanyId}`, href: `/admin/presupuestos/${row.quote_id}` },
      ],
      clientId,
      companyId: row.company_id,
      createdAt: row.created_at,
    });
  }

  const checkMissingNewEntity = (rowType: string, rowId: string, createdAt: string, companyId: string | null, clientId: string | null, href: string) => {
    if (createdAt < ENTITY_SCOPE_CUTOFF || companyId) return;
    issues.push({
      id: `missing-new-entity:${rowType}:${rowId}`,
      rule: 'new_record_without_company',
      severity: 'critical',
      title: `${rowType} nuevo sin entidad fiscal`,
      detail: 'Creado después de activar el alcance multi-entidad. Revisión manual obligatoria; no rellenar company_id por inferencia.',
      evidence: [{ label: 'Registro', value: `${rowType} · ${rowId}`, href }],
      clientId,
      companyId: null,
      createdAt,
    });
  };
  for (const row of checkouts) checkMissingNewEntity('Checkout', row.id, row.created_at, row.company_id, row.user_id, row.user_id ? `/admin/clientes/${row.user_id}/operaciones` : '/admin/pagos');
  for (const row of subscriptions) checkMissingNewEntity('Suscripción', row.id, row.created_at, row.company_id, row.client_id, row.client_id ? `/admin/clientes/${row.client_id}/operaciones` : '/admin/suscripciones');
  for (const row of orders) {
    const clientId = row.client_id ?? row.user_id;
    checkMissingNewEntity('Pedido', row.id, row.created_at, row.company_id, clientId, clientId ? `/admin/clientes/${clientId}/operaciones` : '/admin/pagos');
  }

  const ruleDefinitions = [
    ['duplicate_tax_id', 'NIF/CIF duplicado', 'Entidades distintas con el mismo identificador fiscal normalizado.'],
    ['shared_stripe_customer', 'Stripe Customer compartido', 'Un mismo Customer de Stripe usado por más de una entidad.'],
    ['duplicate_stripe_subscription', 'Stripe Subscription duplicada', 'Un mismo subscription ID en varios registros locales.'],
    ['duplicate_stripe_payment', 'Stripe Payment duplicado', 'Un mismo payment ID en varios pedidos.'],
    ['duplicate_checkout_session', 'Checkout Session duplicada', 'Una misma sesión Checkout en varios registros locales.'],
    ['multiple_live_subscriptions', 'Varias suscripciones vivas', 'Más de una suscripción activa/trialing/past_due/unpaid para la misma entidad.'],
    ['invalid_active_company', 'Entidad activa inválida', 'active_company_id no pertenece a profile_companies.'],
    ['subscription_customer_mismatch', 'Customer de suscripción inconsistente', 'Stripe Customer de la suscripción no coincide con el de la entidad.'],
    ['entity_membership_mismatch', 'Relación cliente-entidad inconsistente', 'Un registro operativo usa una entidad no vinculada al cliente.'],
    ['document_case_company_mismatch', 'Documento/expediente cross-entity', 'Documento y expediente tienen company_id distintos.'],
    ['commercial_chain_company_mismatch', 'Cadena comercial cross-entity', 'Presupuesto, expediente o pedido no conservan la misma entidad.'],
    ['new_record_without_company', 'Registro nuevo sin entidad', 'Checkout, suscripción o pedido nuevo sin company_id tras el corte multi-entidad.'],
  ] as const;

  const rules: RuleSummary[] = ruleDefinitions.map(([id, label, description]) => {
    const count = issues.filter((issue) => issue.rule === id).length;
    return { id, label, description, count, status: count ? 'alert' : 'ok' };
  });

  const rank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => rank[a.severity] - rank[b.severity] || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    entityScopeCutoff: ENTITY_SCOPE_CUTOFF,
    summary: {
      total: issues.length,
      critical: issues.filter((issue) => issue.severity === 'critical').length,
      high: issues.filter((issue) => issue.severity === 'high').length,
      medium: issues.filter((issue) => issue.severity === 'medium').length,
      low: issues.filter((issue) => issue.severity === 'low').length,
      checks: rules.length,
      checksOk: rules.filter((rule) => rule.status === 'ok').length,
    },
    rules,
    issues,
    warnings,
    policy: {
      readOnly: true,
      automaticFixes: false,
      historicalFinancialMutation: false,
    },
  });
}
