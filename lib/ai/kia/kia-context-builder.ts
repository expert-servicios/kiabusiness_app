import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { getService } from '@/lib/services/service-registry';
import { retrieveKiaMemories, type KiaMemory } from './kia-memory-retriever';

export interface KiaContextInput {
  channel: 'waba' | 'admin' | 'email' | 'dashboard' | 'document';
  phone?: string;
  email?: string;
  userId?: string;
  clientId?: string;
  leadId?: string;
  caseId?: string;
  companyId?: string;
  serviceSlug?: string;
  latestMessage?: string;
  selectedMessageId?: string;
  syntheticRecentMessages?: KiaContext['conversation']['recentMessages'];
  syntheticSelectedMessage?: KiaContext['conversation']['selectedMessage'];
  /** Dashboard copilot: current page path e.g. '/dashboard/empresa', '/dashboard/expedientes/abc123' */
  currentPage?: string;
  /** Dashboard copilot: what task the user is performing e.g. 'editing_company', 'viewing_case' */
  currentTask?: string;
  /** Dashboard copilot: arbitrary page-specific data (caseId, reportId, etc.) */
  pageData?: Record<string, unknown>;
}

export interface KiaContext {
  contact: {
    status: 'lead' | 'client' | 'unknown';
    name: string | null;
    email: string | null;
    phone: string | null;
    clientId: string | null;
    leadId: string | null;
    language: 'es' | 'ru';
  };
  profile: {
    profileCompleted: boolean;
    billingReady: boolean;
    habitualAddressReady: boolean;
    activeCompanyId: string | null;
  } | null;
  company: {
    id: string;
    name: string | null;
    taxId: string | null;
    hasMonthlyPlan: boolean;
    holdedConnected: boolean;
    holdedPermissions: Record<string, boolean>;
  } | null;
  service: {
    slug: string | null;
    title: string | null;
    flowType: 'viability' | 'readiness' | 'subscription_readiness' | 'direct_checkout' | 'quote' | null;
    requiresHolded: boolean;
    hasCheckout: boolean;
  } | null;
  cases: Array<{ id: string; serviceName: string; status: string; nextAction: string | null }>;
  documents: {
    pendingCount: number;
    recent: Array<{ id: string; type: string | null; status: string }>;
  };
  accounting: {
    hasSnapshot: boolean;
    latestQuarter: string | null;
    anomalyCount: number;
    criticalAnomalyCount: number;
  };
  conversation: {
    recentMessages: Array<{ role: 'user' | 'assistant' | 'admin'; text: string; createdAt: string }>;
    selectedMessage?: { id: string; text: string; direction: string; createdAt: string } | null;
  };
  memories: KiaMemory[];
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function detectLanguage(text: string | null | undefined): 'es' | 'ru' {
  return /[\u0400-\u04FF]/.test(text ?? '') ? 'ru' : 'es';
}

export async function buildKiaContext(input: KiaContextInput): Promise<KiaContext> {
  const admin = getSupabaseAdmin();
  const phone = input.phone ?? null;
  const contact = phone ? await resolveKiaContactContext(admin, phone) : null;
  const clientId = input.clientId ?? contact?.clientId ?? input.userId ?? null;
  const leadId = input.leadId ?? contact?.leadId ?? null;

  const openAiKey = (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined)?.trim() ?? '';
  const shouldLoadMemories = Boolean(openAiKey && input.latestMessage && (phone || clientId || leadId));

  const [profile, company, service, documents, conversation, selectedMessage, accounting, memories] = await Promise.all([
    loadProfile(admin, clientId, contact),
    loadCompany(admin, input.companyId, clientId),
    loadService(input.serviceSlug),
    loadDocuments(admin, clientId, input.caseId),
    loadConversation(admin, phone),
    loadSelectedMessage(admin, input.selectedMessageId),
    loadAccounting(admin, input.companyId),
    shouldLoadMemories
      ? retrieveKiaMemories({ query: input.latestMessage!, clientId, leadId, phone, openAiApiKey: openAiKey, supabase: admin }).catch(() => [] as KiaMemory[])
      : Promise.resolve([] as KiaMemory[]),
  ]);

  // For dashboard channel: load cases directly from DB when phone isn't available
  const contactCases = (contact?.openCases ?? []).slice(0, 5).map((c) => ({
    id: c.id,
    serviceName: c.service,
    status: c.state,
    nextAction: null,
  }));
  const directCases = phone ? [] : await loadCasesForClient(admin, clientId);
  const cases = contactCases.length > 0 ? contactCases : directCases;

  return {
    contact: {
      status: contact?.status ?? (clientId ? 'client' : leadId ? 'lead' : 'unknown'),
      name: contact?.name ?? profile?.name ?? null,
      email: contact?.email ?? input.email ?? profile?.email ?? null,
      phone,
      clientId,
      leadId,
      language: detectLanguage(input.latestMessage ?? conversation[conversation.length - 1]?.text),
    },
    profile: profile ? {
      profileCompleted: profile.profileCompleted,
      billingReady: profile.billingReady,
      habitualAddressReady: profile.habitualAddressReady,
      activeCompanyId: profile.activeCompanyId,
    } : contact ? {
      profileCompleted: contact.profileCompleted,
      billingReady: contact.billingReady,
      habitualAddressReady: contact.habitualAddressReady,
      activeCompanyId: null,
    } : null,
    company,
    service,
    cases,
    documents,
    accounting,
    conversation: {
      recentMessages: input.syntheticRecentMessages?.length ? input.syntheticRecentMessages : conversation,
      selectedMessage: input.syntheticSelectedMessage ?? selectedMessage,
    },
    memories,
  };
}

async function loadProfile(admin: AdminClient, clientId: string | null, contact: Awaited<ReturnType<typeof resolveKiaContactContext>> | null) {
  if (!clientId) return null;
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, profile_completed, billing_ready, habitual_address_ready, active_company_id')
    .eq('id', clientId)
    .maybeSingle();

  if (!data) {
    if (!contact) return null;
    return {
      name: contact.name,
      email: contact.email,
      profileCompleted: contact.profileCompleted,
      billingReady: contact.billingReady,
      habitualAddressReady: contact.habitualAddressReady,
      activeCompanyId: null,
    };
  }

  return {
    name: data.full_name as string | null,
    email: data.email as string | null,
    profileCompleted: Boolean(data.profile_completed),
    billingReady: Boolean(data.billing_ready),
    habitualAddressReady: Boolean(data.habitual_address_ready),
    activeCompanyId: data.active_company_id as string | null,
  };
}

async function loadCompany(admin: AdminClient, companyId: string | undefined, clientId: string | null): Promise<KiaContext['company']> {
  const resolvedCompanyId = companyId ?? await loadActiveCompanyId(admin, clientId);
  if (!resolvedCompanyId) return null;

  const [{ data: company }, { data: integrations }, { data: subscriptions }] = await Promise.all([
    admin.from('companies').select('id, razon_social, nombre_comercial, cif_nif').eq('id', resolvedCompanyId).maybeSingle(),
    admin.from('client_integrations').select('status, permissions_detected').eq('company_id', resolvedCompanyId).eq('provider', 'holded').order('created_at', { ascending: false }).limit(1),
    admin.from('subscriptions').select('id, status').eq('company_id', resolvedCompanyId).in('status', ['active', 'trialing']).limit(1),
  ]);

  const integration = integrations?.[0] as { status?: string; permissions_detected?: Record<string, boolean> } | undefined;
  return {
    id: resolvedCompanyId,
    name: (company?.nombre_comercial ?? company?.razon_social ?? null) as string | null,
    taxId: company?.cif_nif ?? null,
    hasMonthlyPlan: Boolean(subscriptions?.length),
    holdedConnected: integration?.status === 'active',
    holdedPermissions: integration?.permissions_detected ?? {},
  };
}

async function loadActiveCompanyId(admin: AdminClient, clientId: string | null): Promise<string | null> {
  if (!clientId) return null;
  const { data } = await admin.from('profiles').select('active_company_id').eq('id', clientId).maybeSingle();
  return data?.active_company_id ?? null;
}

async function loadService(serviceSlug: string | undefined): Promise<KiaContext['service']> {
  if (!serviceSlug) return null;
  const service = getService(serviceSlug);
  if (!service) return { slug: serviceSlug, title: null, flowType: null, requiresHolded: false, hasCheckout: false };
  return {
    slug: service.slug,
    title: service.name,
    flowType: service.flowType,
    requiresHolded: service.requiresHoldedApi || service.requiresHoldedLicense,
    hasCheckout: service.hasCheckout,
  };
}

async function loadDocuments(admin: AdminClient, clientId: string | null, caseId: string | undefined): Promise<KiaContext['documents']> {
  if (!clientId && !caseId) return { pendingCount: 0, recent: [] };
  let query = admin.from('documents').select('id, original_name, state, created_at').order('created_at', { ascending: false }).limit(5);
  if (caseId) query = query.eq('case_id', caseId);
  else if (clientId) query = query.eq('client_id', clientId);
  const { data } = await query;
  const rows = data ?? [];
  return {
    pendingCount: rows.filter((d: { state?: string }) => d.state === 'pendiente').length,
    recent: rows.map((d: { id: string; original_name?: string; state?: string }) => ({
      id: d.id,
      type: d.original_name?.split('.').pop() ?? null,
      status: d.state ?? 'unknown',
    })),
  };
}

async function loadConversation(admin: AdminClient, phone: string | null): Promise<KiaContext['conversation']['recentMessages']> {
  if (!phone) return [];
  const { data } = await admin
    .from('whatsapp_conversations')
    .select('direction, body, created_at, ai_responded')
    .eq('phone_number', phone)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? []).reverse().map((m: { direction: string; body: string; created_at: string; ai_responded?: boolean | null }) => ({
    role: roleForConversationMessage(m),
    text: m.body.slice(0, 1200),
    createdAt: m.created_at,
  }));
}

function roleForConversationMessage(message: { direction: string; body: string; ai_responded?: boolean | null }): 'user' | 'assistant' | 'admin' {
  if (message.direction === 'inbound') return 'user';
  const body = message.body.trim();
  const kiaPrefix = /^\[(Kia|Kia:AI|Kia:list|Kia:doc_select|Cat[aá]logo)/i.test(body);
  if (message.ai_responded === true || kiaPrefix) return 'assistant';
  return 'admin';
}

async function loadSelectedMessage(admin: AdminClient, selectedMessageId: string | undefined): Promise<KiaContext['conversation']['selectedMessage']> {
  if (!selectedMessageId) return null;
  const { data } = await admin
    .from('whatsapp_conversations')
    .select('id, direction, body, created_at')
    .eq('id', selectedMessageId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    text: data.body,
    direction: data.direction,
    createdAt: data.created_at,
  };
}

async function loadAccounting(admin: AdminClient, companyId: string | undefined): Promise<KiaContext['accounting']> {
  if (!companyId) return { hasSnapshot: false, latestQuarter: null, anomalyCount: 0, criticalAnomalyCount: 0 };
  try {
    const [{ data: snapshots }, { data: anomalies }] = await Promise.all([
      admin.from('accounting_period_snapshots').select('period_label, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1),
      admin.from('accounting_anomalies').select('severity').eq('company_id', companyId).in('status', ['open', 'pending']).limit(100),
    ]);
    const anomalyRows = anomalies ?? [];
    return {
      hasSnapshot: Boolean(snapshots?.length),
      latestQuarter: snapshots?.[0]?.period_label ?? null,
      anomalyCount: anomalyRows.length,
      criticalAnomalyCount: anomalyRows.filter((a: { severity?: string }) => a.severity === 'critical').length,
    };
  } catch {
    return { hasSnapshot: false, latestQuarter: null, anomalyCount: 0, criticalAnomalyCount: 0 };
  }
}

/** Direct DB case query used by dashboard channel when there is no phone-based contact. */
async function loadCasesForClient(
  admin: AdminClient,
  clientId: string | null,
): Promise<KiaContext['cases']> {
  if (!clientId) return [];
  const { data } = await admin
    .from('cases')
    .select('id, service, state, opened_at')
    .eq('client_id', clientId)
    .not('state', 'in', '("finalizado","cerrado","entregado")')
    .order('opened_at', { ascending: false })
    .limit(10);
  return (data ?? []).map((c: { id: string; service: string; state: string; opened_at: string }) => ({
    id: c.id,
    serviceName: c.service,
    status: c.state,
    nextAction: null,
  }));
}
