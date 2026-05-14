import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const HOLDED_BASE = 'https://api.holded.com/api/invoicing/v1';
const HOLDED_CRM_BASE = 'https://api.holded.com/api/crm/v1';
const HOLDED_PROJECTS_BASE = 'https://api.holded.com/api/projects/v1';

type SyncStatus = 'pending' | 'success' | 'failed' | 'skipped';
type SyncDirection = 'to_external' | 'from_external';

interface SyncEventInput {
  direction: SyncDirection;
  operation: string;
  localEntity?: string | null;
  localId?: string | null;
  externalEntity?: string | null;
  externalId?: string | null;
  status?: SyncStatus;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

function isConfigured(): boolean {
  return Boolean(process.env.HOLDED_API_KEY);
}

function getHeaders(): HeadersInit {
  const key = process.env.HOLDED_API_KEY;
  if (!key) throw new Error('HOLDED_API_KEY not configured');
  return { key, 'Content-Type': 'application/json' };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function createSyncEvent(input: SyncEventInput): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('integration_sync_events')
      .insert({
        provider: 'holded',
        direction: input.direction,
        operation: input.operation,
        local_entity: input.localEntity ?? null,
        local_id: input.localId ?? null,
        external_entity: input.externalEntity ?? null,
        external_id: input.externalId ?? null,
        status: input.status ?? 'pending',
        request_payload: input.requestPayload ?? null,
        response_payload: input.responsePayload ?? null,
        error: input.error ?? null,
        metadata: input.metadata ?? {}
      })
      .select('id')
      .single();

    if (error) {
      console.error('[holded] sync event insert failed:', error.message);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error('[holded] sync event insert failed:', errorMessage(error));
    return null;
  }
}

async function updateSyncEvent(id: string | null, input: Partial<SyncEventInput>): Promise<void> {
  if (!id) return;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('integration_sync_events')
      .update({
        ...(input.externalEntity !== undefined ? { external_entity: input.externalEntity } : {}),
        ...(input.externalId !== undefined ? { external_id: input.externalId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.responsePayload !== undefined ? { response_payload: input.responsePayload } : {}),
        ...(input.error !== undefined ? { error: input.error } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('[holded] sync event update failed:', error.message);
    }
  } catch (error) {
    console.error('[holded] sync event update failed:', errorMessage(error));
  }
}

async function holdedFetch<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  baseUrl = HOLDED_BASE
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Holded ${method} ${path} -> ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Runtime config ────────────────────────────────────────────────────────────

export function getHoldedRuntimeConfig() {
  return {
    configured: isConfigured(),
    syncEnabled: process.env.HOLDED_SYNC_ENABLED === 'true',
    dryRun: process.env.HOLDED_SYNC_DRY_RUN === 'true',
    syncQuotes: process.env.HOLDED_SYNC_QUOTES === 'true',
    createInvoicesFromStripe: process.env.HOLDED_CREATE_INVOICES_FROM_STRIPE === 'true',
    crmFunnelId: process.env.HOLDED_CRM_FUNNEL_ID ?? null,
    crmDefaultStageId: process.env.HOLDED_CRM_DEFAULT_STAGE_ID ?? null,
    projectDefaultListId: process.env.HOLDED_PROJECT_DEFAULT_LIST_ID ?? null
  };
}

// ── Listing helpers (used by status probe) ────────────────────────────────────

export async function listDocuments(
  type: 'estimate' | 'invoice' | 'proforma' | 'order',
  options?: { sort?: string; page?: number }
): Promise<unknown[]> {
  const params = new URLSearchParams();
  if (options?.sort) params.set('sort', options.sort);
  if (options?.page) params.set('page', String(options.page));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const data = await holdedFetch<unknown[] | { data?: unknown[] }>('GET', `/documents/${type}${qs}`);
  return Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);
}

export async function listFunnels(): Promise<unknown[]> {
  const data = await holdedFetch<unknown[] | { data?: unknown[] }>('GET', '/funnels', undefined, HOLDED_CRM_BASE);
  return Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);
}

export async function listProjects(): Promise<unknown[]> {
  const data = await holdedFetch<unknown[] | { data?: unknown[] }>('GET', '/projects', undefined, HOLDED_PROJECTS_BASE);
  return Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);
}

export async function listTasks(): Promise<unknown[]> {
  const data = await holdedFetch<unknown[] | { data?: unknown[] }>('GET', '/tasks', undefined, HOLDED_PROJECTS_BASE);
  return Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);
}

interface HoldedContact {
  id: string;
  name: string;
  email: string;
}

interface HoldedContactList {
  contacts?: HoldedContact[];
}

export async function findContactByEmail(email: string): Promise<HoldedContact | null> {
  try {
    const data = await holdedFetch<HoldedContact[] | HoldedContactList>(
      'GET',
      `/contacts?email=${encodeURIComponent(email)}`
    );

    if (Array.isArray(data)) return data[0] ?? null;
    return data.contacts?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function createContact(params: {
  name: string;
  email: string;
  phone?: string | null;
}): Promise<string> {
  const body: Record<string, unknown> = {
    name: params.name,
    email: params.email,
    type: 1
  };

  if (params.phone) body.phone = params.phone;

  const data = await holdedFetch<{ id: string }>('POST', '/contacts', body);
  return data.id;
}

export async function upsertContact(params: {
  name: string;
  email: string;
  phone?: string | null;
}): Promise<string> {
  const existing = await findContactByEmail(params.email);
  if (existing?.id) return existing.id;
  return createContact(params);
}

interface HoldedInvoiceItem {
  name: string;
  units: number;
  subtotal: number;
}

export async function createInvoice(params: {
  contactId: string;
  description: string;
  amountEur: number;
  reference?: string;
}): Promise<string> {
  const nowUnix = Math.floor(Date.now() / 1000);
  const item: HoldedInvoiceItem = {
    name: params.description,
    units: 1,
    subtotal: params.amountEur
  };

  const body: Record<string, unknown> = {
    contactId: params.contactId,
    desc: params.description,
    date: nowUnix,
    items: [item]
  };

  if (params.reference) body.notes = `Ref: ${params.reference}`;

  const data = await holdedFetch<{ id: string }>('POST', '/documents/invoice', body);
  return data.id;
}

export interface HoldedSyncResult {
  contactId: string | null;
  invoiceId: string | null;
  syncEventId: string | null;
  error?: string;
}

export async function syncSubscriptionToHolded(params: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  planName: string;
  amountEur: number;
  subscriptionId?: string;
  localEntity?: string;
}): Promise<HoldedSyncResult> {
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_subscription_invoice',
    localEntity: params.localEntity ?? 'stripe_subscriptions',
    localId: params.subscriptionId ?? null,
    externalEntity: 'holded_invoice',
    requestPayload: {
      clientEmail: params.clientEmail,
      planName: params.planName,
      amountEur: params.amountEur,
      subscriptionId: params.subscriptionId
    }
  });

  if (!isConfigured()) {
    const error = 'HOLDED_API_KEY not set';
    await updateSyncEvent(syncEventId, { status: 'skipped', error });
    return { contactId: null, invoiceId: null, syncEventId, error };
  }

  try {
    const contactId = await upsertContact({
      name: params.clientName,
      email: params.clientEmail,
      phone: params.clientPhone
    });

    const invoiceId = await createInvoice({
      contactId,
      description: `${params.planName} - suscripcion mensual`,
      amountEur: params.amountEur,
      reference: params.subscriptionId
    });

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalId: invoiceId,
      responsePayload: { contactId, invoiceId }
    });

    return { contactId, invoiceId, syncEventId };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncSubscriptionToHolded error:', msg);
    return { contactId: null, invoiceId: null, syncEventId, error: msg };
  }
}

export async function syncOrderToHolded(params: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  description: string;
  amountEur: number;
  orderId?: string;
  localEntity?: string;
  source?: string;
}): Promise<HoldedSyncResult> {
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_order_invoice',
    localEntity: params.localEntity ?? 'orders',
    localId: params.orderId ?? null,
    externalEntity: 'holded_invoice',
    requestPayload: {
      clientEmail: params.clientEmail,
      description: params.description,
      amountEur: params.amountEur,
      orderId: params.orderId
    }
  });

  if (!isConfigured()) {
    const error = 'HOLDED_API_KEY not set';
    await updateSyncEvent(syncEventId, { status: 'skipped', error });
    return { contactId: null, invoiceId: null, syncEventId, error };
  }

  try {
    const contactId = await upsertContact({
      name: params.clientName,
      email: params.clientEmail,
      phone: params.clientPhone
    });

    const invoiceId = await createInvoice({
      contactId,
      description: params.description,
      amountEur: params.amountEur,
      reference: params.orderId
    });

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalId: invoiceId,
      responsePayload: { contactId, invoiceId }
    });

    return { contactId, invoiceId, syncEventId };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncOrderToHolded error:', msg);
    return { contactId: null, invoiceId: null, syncEventId, error: msg };
  }
}

// Alias: sync-quote route uses quote data but the underlying operation is identical
// to syncOrderToHolded — upsert contact + create estimate in Holded invoicing.
export const syncQuoteToHolded = syncOrderToHolded;

export async function syncLeadToHolded(params: {
  leadId: string;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  category?: string | null;
  localEntity?: string;
}): Promise<HoldedSyncResult> {
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_lead_contact',
    localEntity: params.localEntity ?? 'leads',
    localId: params.leadId,
    externalEntity: 'holded_contact',
    requestPayload: { email: params.email, name: params.name }
  });

  if (!isConfigured()) {
    const error = 'HOLDED_API_KEY not set';
    await updateSyncEvent(syncEventId, { status: 'skipped', error });
    return { contactId: null, invoiceId: null, syncEventId, error };
  }

  try {
    const contactId = await upsertContact({
      name: params.name,
      email: params.email,
      phone: params.phone
    });

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalId: contactId,
      responsePayload: { contactId }
    });

    return { contactId, invoiceId: null, syncEventId };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncLeadToHolded error:', msg);
    return { contactId: null, invoiceId: null, syncEventId, error: msg };
  }
}

export async function syncProjectToHolded(params: {
  caseId: string;
  service: string;
  category: string;
  state: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone?: string | null;
  docsChecklist?: string[];
}): Promise<HoldedSyncResult> {
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_case_project',
    localEntity: 'cases',
    localId: params.caseId,
    externalEntity: 'holded_project',
    requestPayload: { service: params.service, category: params.category, state: params.state }
  });

  if (!isConfigured()) {
    const error = 'HOLDED_API_KEY not set';
    await updateSyncEvent(syncEventId, { status: 'skipped', error });
    return { contactId: null, invoiceId: null, syncEventId, error };
  }

  try {
    let contactId: string | null = null;
    if (params.clientEmail) {
      contactId = await upsertContact({
        name: params.clientName ?? params.clientEmail.split('@')[0],
        email: params.clientEmail,
        phone: params.clientPhone
      });
    }

    const listId = process.env.HOLDED_PROJECT_DEFAULT_LIST_ID;
    const projectBody: Record<string, unknown> = {
      name: `[${params.category}] ${params.service}`,
      desc: `Expediente ${params.caseId} — estado: ${params.state}`,
      ...(listId ? { listId } : {})
    };

    const projectData = await holdedFetch<{ id: string }>(
      'POST', '/projects', projectBody, HOLDED_PROJECTS_BASE
    );

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalId: projectData.id,
      responsePayload: { contactId, projectId: projectData.id }
    });

    return { contactId, invoiceId: null, syncEventId };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncProjectToHolded error:', msg);
    return { contactId: null, invoiceId: null, syncEventId, error: msg };
  }
}
