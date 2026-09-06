import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type QueueKind =
  | 'checkout'
  | 'subscription'
  | 'task'
  | 'document'
  | 'case'
  | 'integration'
  | 'order'
  | 'profile'
  | 'data_quality';

interface QueueItem {
  id: string;
  kind: QueueKind;
  severity: Severity;
  title: string;
  detail: string;
  href: string;
  clientId: string | null;
  clientName: string | null;
  companyId: string | null;
  companyName: string | null;
  caseId: string | null;
  createdAt: string | null;
  dueDate: string | null;
}

const ENTITY_SCOPE_CUTOFF = '2026-09-04T00:00:00.000Z';
const STALE_CHECKOUT_HOURS = 24;

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

function compact(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function metadataLabel(metadata: Record<string, unknown> | null): string {
  if (!metadata) return 'contratación';
  for (const key of ['plan_name', 'service_name', 'service_slug', 'service_slugs', 'product_type']) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'contratación';
}

export async function GET(request: NextRequest) {
  const admin = await requireStaff(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const today = new Date().toISOString().slice(0, 10);
  const staleBefore = new Date(Date.now() - STALE_CHECKOUT_HOURS * 60 * 60 * 1000).toISOString();

  const [
    checkoutsRes,
    subscriptionsRes,
    tasksRes,
    documentsRes,
    casesRes,
    integrationsRes,
    ordersRes,
    incompleteProfilesRes,
    entitylessCheckoutsRes,
    entitylessSubscriptionsRes,
    entitylessOrdersRes,
  ] = await Promise.all([
    admin
      .from('checkout_sessions')
      .select('id,stripe_session_id,user_id,company_id,status,metadata,created_at,updated_at')
      .eq('status', 'open')
      .lt('created_at', staleBefore)
      .order('created_at', { ascending: true })
      .limit(100),
    admin
      .from('subscriptions')
      .select('id,client_id,company_id,plan_name,status,created_at,updated_at')
      .in('status', ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'])
      .order('updated_at', { ascending: false })
      .limit(100),
    admin
      .from('internal_tasks')
      .select('id,title,description,status,priority,due_date,case_id,client_id,company_id,source,created_at')
      .in('status', ['pendiente', 'en_progreso'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(150),
    admin
      .from('documents')
      .select('id,client_id,company_id,case_id,original_name,title,state,created_at')
      .eq('state', 'pendiente')
      .order('created_at', { ascending: true })
      .limit(150),
    admin
      .from('cases')
      .select('id,client_id,company_id,service,state,status,priority,due_date,next_action,opened_at,updated_at')
      .neq('state', 'finalizado')
      .order('updated_at', { ascending: true })
      .limit(250),
    admin
      .from('client_integrations')
      .select('id,client_id,company_id,provider,status,last_error,updated_at')
      .not('last_error', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(100),
    admin
      .from('orders')
      .select('id,client_id,user_id,company_id,status,source,holded_sync_error,created_at,updated_at')
      .not('holded_sync_error', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(100),
    admin
      .from('profiles')
      .select('id,full_name,email,profile_completed,status,created_at')
      .eq('role', 'client')
      .eq('profile_completed', false)
      .order('created_at', { ascending: true })
      .limit(100),
    admin
      .from('checkout_sessions')
      .select('id,user_id,company_id,status,metadata,created_at')
      .gte('created_at', ENTITY_SCOPE_CUTOFF)
      .is('company_id', null)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('subscriptions')
      .select('id,client_id,company_id,plan_name,status,created_at')
      .gte('created_at', ENTITY_SCOPE_CUTOFF)
      .is('company_id', null)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('orders')
      .select('id,client_id,user_id,company_id,status,source,created_at')
      .gte('created_at', ENTITY_SCOPE_CUTOFF)
      .is('company_id', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const warnings: string[] = [];
  const resultPairs = [
    ['checkout_sessions', checkoutsRes],
    ['subscriptions', subscriptionsRes],
    ['internal_tasks', tasksRes],
    ['documents', documentsRes],
    ['cases', casesRes],
    ['client_integrations', integrationsRes],
    ['orders', ordersRes],
    ['profiles', incompleteProfilesRes],
    ['entityless_checkout_sessions', entitylessCheckoutsRes],
    ['entityless_subscriptions', entitylessSubscriptionsRes],
    ['entityless_orders', entitylessOrdersRes],
  ] as const;
  for (const [name, result] of resultPairs) {
    if (result.error) warnings.push(`${name}: ${result.error.message}`);
  }

  const problemCases = (casesRes.data ?? []).filter((item) => {
    const overdue = Boolean(item.due_date && item.due_date < today);
    const missingNextAction = !String(item.next_action ?? '').trim();
    return overdue || missingNextAction;
  });
  const integrations = (integrationsRes.data ?? []).filter((item) => Boolean(item.last_error?.trim()));
  const holdedOrders = (ordersRes.data ?? []).filter((item) => Boolean(item.holded_sync_error?.trim()));

  const clientIds = compact([
    ...(checkoutsRes.data ?? []).map((item) => item.user_id),
    ...(subscriptionsRes.data ?? []).map((item) => item.client_id),
    ...(tasksRes.data ?? []).map((item) => item.client_id),
    ...(documentsRes.data ?? []).map((item) => item.client_id),
    ...problemCases.map((item) => item.client_id),
    ...integrations.map((item) => item.client_id),
    ...holdedOrders.map((item) => item.client_id ?? item.user_id),
    ...(incompleteProfilesRes.data ?? []).map((item) => item.id),
    ...(entitylessCheckoutsRes.data ?? []).map((item) => item.user_id),
    ...(entitylessSubscriptionsRes.data ?? []).map((item) => item.client_id),
    ...(entitylessOrdersRes.data ?? []).map((item) => item.client_id ?? item.user_id),
  ]);

  const companyIds = compact([
    ...(checkoutsRes.data ?? []).map((item) => item.company_id),
    ...(subscriptionsRes.data ?? []).map((item) => item.company_id),
    ...(tasksRes.data ?? []).map((item) => item.company_id),
    ...(documentsRes.data ?? []).map((item) => item.company_id),
    ...problemCases.map((item) => item.company_id),
    ...integrations.map((item) => item.company_id),
    ...holdedOrders.map((item) => item.company_id),
  ]);

  const [profilesRes, companiesRes] = await Promise.all([
    clientIds.length
      ? admin.from('profiles').select('id,full_name,email').in('id', clientIds)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? admin.from('companies').select('id,razon_social,nombre_comercial,cif_nif').in('id', companyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profilesRes.error) warnings.push(`profiles_lookup: ${profilesRes.error.message}`);
  if (companiesRes.error) warnings.push(`companies_lookup: ${companiesRes.error.message}`);

  const clientName = new Map(
    (profilesRes.data ?? []).map((profile) => [profile.id, profile.full_name || profile.email || profile.id]),
  );
  const companyName = new Map(
    (companiesRes.data ?? []).map((company) => [
      company.id,
      company.razon_social || company.nombre_comercial || company.cif_nif || company.id,
    ]),
  );

  const items: QueueItem[] = [];
  const push = (item: Omit<QueueItem, 'clientName' | 'companyName'>) => {
    items.push({
      ...item,
      clientName: item.clientId ? clientName.get(item.clientId) ?? null : null,
      companyName: item.companyId ? companyName.get(item.companyId) ?? null : null,
    });
  };

  for (const item of checkoutsRes.data ?? []) {
    const metadata = (item.metadata ?? null) as Record<string, unknown> | null;
    push({
      id: `checkout:${item.id}`,
      kind: 'checkout',
      severity: 'medium',
      title: 'Posible checkout abandonado',
      detail: `${metadataLabel(metadata)} · abierto desde ${new Date(item.created_at).toLocaleString('es-ES')}. Revisar antes de reenviar o cerrar.`,
      href: item.user_id ? `/admin/clientes/${item.user_id}/operaciones` : '/admin/pagos',
      clientId: item.user_id,
      companyId: item.company_id,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of subscriptionsRes.data ?? []) {
    push({
      id: `subscription:${item.id}`,
      kind: 'subscription',
      severity: 'high',
      title: `Suscripción ${item.status}`,
      detail: `${item.plan_name ?? 'Plan EXPERT'} · requiere revisión de cobro/estado en Stripe antes de actuar.`,
      href: item.client_id ? `/admin/clientes/${item.client_id}/operaciones` : '/admin/suscripciones',
      clientId: item.client_id,
      companyId: item.company_id,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of tasksRes.data ?? []) {
    const overdue = Boolean(item.due_date && item.due_date < today);
    const severe = item.priority === 'alta' || item.priority === 'critica';
    push({
      id: `task:${item.id}`,
      kind: 'task',
      severity: overdue || severe ? 'high' : 'medium',
      title: `${overdue ? 'Tarea vencida' : 'Tarea pendiente'}: ${item.title}`,
      detail: `${item.priority ?? 'prioridad media'} · ${item.source ?? 'operación interna'}${item.due_date ? ` · vence ${item.due_date}` : ''}`,
      href: item.case_id
        ? `/admin/expedientes/${item.case_id}`
        : item.client_id
          ? `/admin/clientes/${item.client_id}/operaciones`
          : '/admin/tareas',
      clientId: item.client_id,
      companyId: item.company_id,
      caseId: item.case_id,
      createdAt: item.created_at,
      dueDate: item.due_date,
    });
  }

  for (const item of documentsRes.data ?? []) {
    push({
      id: `document:${item.id}`,
      kind: 'document',
      severity: 'medium',
      title: `Documento pendiente: ${item.original_name || item.title || 'Documento'}`,
      detail: item.case_id ? 'Pendiente dentro de un expediente.' : 'Pendiente de clasificación o revisión.',
      href: item.case_id
        ? `/admin/expedientes/${item.case_id}`
        : item.client_id
          ? `/admin/clientes/${item.client_id}/documentos`
          : '/admin/documentos',
      clientId: item.client_id,
      companyId: item.company_id,
      caseId: item.case_id,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of problemCases) {
    const overdue = Boolean(item.due_date && item.due_date < today);
    push({
      id: `case:${item.id}:${overdue ? 'overdue' : 'next-action'}`,
      kind: 'case',
      severity: overdue ? 'high' : 'low',
      title: overdue ? `Expediente vencido: ${item.service}` : `Expediente sin siguiente acción: ${item.service}`,
      detail: overdue
        ? `Vencimiento ${item.due_date}. Revisar prioridad y siguiente paso.`
        : 'El expediente está abierto pero no tiene next_action definido.',
      href: `/admin/expedientes/${item.id}`,
      clientId: item.client_id,
      companyId: item.company_id,
      caseId: item.id,
      createdAt: item.opened_at,
      dueDate: item.due_date,
    });
  }

  for (const item of integrations) {
    push({
      id: `integration:${item.id}`,
      kind: 'integration',
      severity: item.status === 'active' ? 'high' : 'medium',
      title: `Integración ${item.provider} con error`,
      detail: String(item.last_error).slice(0, 220),
      href: item.client_id ? `/admin/clientes/${item.client_id}/integraciones` : '/admin/configuracion',
      clientId: item.client_id,
      companyId: item.company_id,
      caseId: null,
      createdAt: item.updated_at,
      dueDate: null,
    });
  }

  for (const item of holdedOrders) {
    push({
      id: `order:${item.id}`,
      kind: 'order',
      severity: 'high',
      title: 'Pedido con error de sincronización Holded',
      detail: String(item.holded_sync_error).slice(0, 220),
      href: (item.client_id ?? item.user_id)
        ? `/admin/clientes/${item.client_id ?? item.user_id}/operaciones`
        : '/admin/pagos',
      clientId: item.client_id ?? item.user_id,
      companyId: item.company_id,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of incompleteProfilesRes.data ?? []) {
    push({
      id: `profile:${item.id}`,
      kind: 'profile',
      severity: 'low',
      title: 'Perfil de cliente incompleto',
      detail: 'Faltan datos mínimos de onboarding antes de nuevas contrataciones.',
      href: `/admin/clientes/${item.id}`,
      clientId: item.id,
      companyId: null,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of entitylessCheckoutsRes.data ?? []) {
    push({
      id: `data-quality:checkout:${item.id}`,
      kind: 'data_quality',
      severity: 'critical',
      title: 'Checkout nuevo sin entidad fiscal',
      detail: 'Creado después de activar el alcance por entidad. Requiere revisión manual; no se corrige automáticamente.',
      href: item.user_id ? `/admin/clientes/${item.user_id}/operaciones` : '/admin/pagos',
      clientId: item.user_id,
      companyId: null,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of entitylessSubscriptionsRes.data ?? []) {
    push({
      id: `data-quality:subscription:${item.id}`,
      kind: 'data_quality',
      severity: 'critical',
      title: 'Suscripción nueva sin entidad fiscal',
      detail: `${item.plan_name ?? 'Plan EXPERT'} · revisión manual obligatoria antes de cualquier corrección.`,
      href: item.client_id ? `/admin/clientes/${item.client_id}/operaciones` : '/admin/suscripciones',
      clientId: item.client_id,
      companyId: null,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  for (const item of entitylessOrdersRes.data ?? []) {
    const clientId = item.client_id ?? item.user_id;
    push({
      id: `data-quality:order:${item.id}`,
      kind: 'data_quality',
      severity: 'critical',
      title: 'Pedido nuevo sin entidad fiscal',
      detail: `${item.source ?? 'pedido'} · revisión manual obligatoria; no fusionar ni reasignar históricos automáticamente.`,
      href: clientId ? `/admin/clientes/${clientId}/operaciones` : '/admin/pagos',
      clientId,
      companyId: null,
      caseId: null,
      createdAt: item.created_at,
      dueDate: null,
    });
  }

  const rank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const severityDiff = rank[a.severity] - rank[b.severity];
    if (severityDiff !== 0) return severityDiff;
    const aDate = a.dueDate ?? a.createdAt ?? '';
    const bDate = b.dueDate ?? b.createdAt ?? '';
    return aDate.localeCompare(bDate);
  });

  const summary = {
    total: items.length,
    critical: items.filter((item) => item.severity === 'critical').length,
    high: items.filter((item) => item.severity === 'high').length,
    medium: items.filter((item) => item.severity === 'medium').length,
    low: items.filter((item) => item.severity === 'low').length,
    byKind: items.reduce<Record<string, number>>((acc, item) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    thresholds: { staleCheckoutHours: STALE_CHECKOUT_HOURS, entityScopeCutoff: ENTITY_SCOPE_CUTOFF },
    summary,
    items,
    warnings,
  });
}
