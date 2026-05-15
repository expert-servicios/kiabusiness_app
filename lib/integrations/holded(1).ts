import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { findExternalMapping, upsertExternalMapping } from '@/lib/integrations/external-mappings';

const HOLDED_BASES = {
  crm: 'https://api.holded.com/api/crm/v1',
  invoicing: 'https://api.holded.com/api/invoicing/v1',
  projects: 'https://api.holded.com/api/projects/v1'
} as const;

type HoldedArea = keyof typeof HOLDED_BASES;
type SyncStatus = 'pending' | 'success' | 'failed' | 'skipped';
type SyncDirection = 'to_external' | 'from_external';
type HoldedSyncSource = 'stripe' | 'expert' | 'manual';

export type HoldedDocumentType =
  | 'invoice'
  | 'salesreceipt'
  | 'creditnote'
  | 'salesorder'
  | 'proform'
  | 'waybill'
  | 'estimate'
  | 'purchase'
  | 'purchaseorder'
  | 'purchaserefund';

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

interface HoldedContact {
  id: string;
  name?: string;
  email?: string;
  code?: string;
}

interface HoldedContactList {
  contacts?: HoldedContact[];
}

export interface HoldedDocumentItem {
  name: string;
  units?: number;
  subtotal: number;
  tax?: number;
  desc?: string;
  sku?: string;
  productId?: string;
}

export interface HoldedLead {
  id: string;
  name?: string;
  contactId?: string;
  contactName?: string;
  stageId?: string;
  funnelId?: string;
  [key: string]: unknown;
}

export interface HoldedFunnel {
  id: string;
  name?: string;
  stages?: Array<{ id?: string; name?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface HoldedProject {
  id: string;
  name?: string;
  status?: number;
  [key: string]: unknown;
}

export interface HoldedTask {
  id: string;
  name?: string;
  projectId?: string;
  listId?: string;
  [key: string]: unknown;
}

export interface HoldedSyncResult {
  contactId: string | null;
  invoiceId: string | null;
  syncEventId: string | null;
  documentId?: string | null;
  documentType?: HoldedDocumentType;
  error?: string;
}

export interface HoldedEntitySyncResult {
  externalId: string | null;
  syncEventId: string | null;
  skipped?: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

function envFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function isHoldedSyncEnabled(): boolean {
  return envFlag('HOLDED_SYNC_ENABLED', true);
}

export function canCreateHoldedInvoicesFromStripe(): boolean {
  return envFlag('HOLDED_CREATE_INVOICES_FROM_STRIPE', false);
}

export function canSyncHoldedQuotes(): boolean {
  return envFlag('HOLDED_SYNC_QUOTES', true);
}

function isConfigured(): boolean {
  return Boolean(process.env.HOLDED_API_KEY);
}

export function getHoldedRuntimeConfig() {
  return {
    configured: isConfigured(),
    syncEnabled: isHoldedSyncEnabled(),
    syncQuotes: canSyncHoldedQuotes(),
    createInvoicesFromStripe: canCreateHoldedInvoicesFromStripe(),
    defaultQuoteDocType: process.env.HOLDED_DEFAULT_QUOTE_DOC_TYPE || 'estimate',
    hasCrmFunnelId: Boolean(process.env.HOLDED_CRM_FUNNEL_ID),
    hasCrmDefaultStageId: Boolean(process.env.HOLDED_CRM_DEFAULT_STAGE_ID),
    hasProjectDefaultListId: Boolean(process.env.HOLDED_PROJECT_DEFAULT_LIST_ID),
    hasDefaultTaxId: Boolean(process.env.HOLDED_DEFAULT_TAX_ID),
    hasDefaultNumSerieId: Boolean(process.env.HOLDED_DEFAULT_NUM_SERIE_ID),
    hasDefaultSalesChannelId: Boolean(process.env.HOLDED_DEFAULT_SALES_CHANNEL_ID),
    hasDefaultBankId: Boolean(process.env.HOLDED_DEFAULT_BANK_ID)
  };
}

function getHeaders(): HeadersInit {
  const key = process.env.HOLDED_API_KEY;
  if (!key) throw new Error('HOLDED_API_KEY not configured');
  return { key, 'Content-Type': 'application/json' };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

function withQuery(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
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
  area: HoldedArea,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${HOLDED_BASES[area]}${path}`, {
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

function invoiceCreationAllowedForSource(source: HoldedSyncSource): boolean {
  return source !== 'stripe' || canCreateHoldedInvoicesFromStripe();
}

async function skipSync(syncEventId: string | null, error: string): Promise<HoldedSyncResult> {
  await updateSyncEvent(syncEventId, { status: 'skipped', error });
  return { contactId: null, invoiceId: null, syncEventId, error };
}

async function skipEntitySync(syncEventId: string | null, error: string): Promise<HoldedEntitySyncResult> {
  await updateSyncEvent(syncEventId, { status: 'skipped', error });
  return { externalId: null, syncEventId, skipped: true, error };
}

export async function listContacts(): Promise<HoldedContact[]> {
  const data = await holdedFetch<HoldedContact[] | HoldedContactList>('invoicing', 'GET', '/contacts');
  if (Array.isArray(data)) return data;
  return data.contacts ?? [];
}

export async function findContactByEmail(email: string): Promise<HoldedContact | null> {
  try {
    const contacts = await listContacts();
    return contacts.find((contact) => contact.email?.toLowerCase() === email.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

export async function createContact(params: {
  name: string;
  email: string;
  phone?: string | null;
  customId?: string | null;
  taxId?: string | null;
}): Promise<string> {
  const body: Record<string, unknown> = {
    name: params.name,
    email: params.email,
    type: 'client'
  };

  if (params.phone) body.phone = params.phone;
  if (params.customId) body.CustomId = params.customId;
  if (params.taxId) body.code = params.taxId;

  const data = await holdedFetch<{ id: string }>('invoicing', 'POST', '/contacts', body);
  return data.id;
}

export async function upsertContact(params: {
  name: string;
  email: string;
  phone?: string | null;
  customId?: string | null;
  taxId?: string | null;
}): Promise<string> {
  const existing = await findContactByEmail(params.email);
  if (existing?.id) return existing.id;
  return createContact(params);
}

export async function createDocument(params: {
  type: HoldedDocumentType;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  description: string;
  items: HoldedDocumentItem[];
  dateUnix?: number;
  dueDateUnix?: number;
  notes?: string;
  reference?: string;
  numSerieId?: string;
  salesChannelId?: string;
  currency?: string;
  tags?: string[];
  approveDoc?: boolean;
  customFields?: Array<Record<string, unknown>>;
}): Promise<string> {
  const notes = [params.notes, params.reference ? `Ref: ${params.reference}` : null]
    .filter(Boolean)
    .join('\n');

  const body: Record<string, unknown> = {
    desc: params.description,
    date: params.dateUnix ?? nowUnix(),
    items: params.items.map((item) => ({
      name: item.name,
      units: item.units ?? 1,
      subtotal: item.subtotal,
      ...(item.tax !== undefined ? { tax: item.tax } : {}),
      ...(item.desc ? { desc: item.desc } : {}),
      ...(item.sku ? { sku: item.sku } : {}),
      ...(item.productId ? { productId: item.productId } : {})
    }))
  };

  if (params.contactId) body.contactId = params.contactId;
  if (params.contactName) body.contactName = params.contactName;
  if (params.contactEmail) body.contactEmail = params.contactEmail;
  if (notes) body.notes = notes;
  if (params.dueDateUnix) body.dueDate = params.dueDateUnix;
  if (params.numSerieId) body.numSerieId = params.numSerieId;
  if (params.salesChannelId) body.salesChannelId = params.salesChannelId;
  if (params.currency) body.currency = params.currency;
  if (params.tags?.length) body.tags = params.tags;
  if (params.approveDoc !== undefined) body.approveDoc = params.approveDoc;
  if (params.customFields?.length) body.customFields = params.customFields;

  const data = await holdedFetch<{ id: string }>('invoicing', 'POST', `/documents/${params.type}`, body);
  return data.id;
}

export async function getDocument<T = Record<string, unknown>>(
  type: HoldedDocumentType,
  documentId: string
): Promise<T> {
  return holdedFetch<T>('invoicing', 'GET', `/documents/${type}/${documentId}`);
}

export async function listDocuments<T = Record<string, unknown>[]>(
  type: HoldedDocumentType,
  query?: {
    starttmp?: string | number;
    endtmp?: string | number;
    contactid?: string;
    paid?: 0 | 1 | 2;
    billed?: 0 | 1;
    sort?: 'created-asc' | 'created-desc';
  }
): Promise<T> {
  return holdedFetch<T>('invoicing', 'GET', withQuery(`/documents/${type}`, query));
}

export async function createInvoice(params: {
  contactId: string;
  description: string;
  amountEur: number;
  reference?: string;
}): Promise<string> {
  return createDocument({
    type: 'invoice',
    contactId: params.contactId,
    description: params.description,
    reference: params.reference,
    items: [{ name: params.description, units: 1, subtotal: params.amountEur }]
  });
}

export async function createQuoteDocument(params: {
  contactId: string;
  description: string;
  amountEur: number;
  reference?: string;
  type?: Extract<HoldedDocumentType, 'estimate' | 'proform'>;
}): Promise<string> {
  const type = params.type ?? (process.env.HOLDED_DEFAULT_QUOTE_DOC_TYPE as 'estimate' | 'proform') ?? 'estimate';
  return createDocument({
    type,
    contactId: params.contactId,
    description: params.description,
    reference: params.reference,
    items: [{ name: params.description, units: 1, subtotal: params.amountEur }]
  });
}

export async function listFunnels(): Promise<HoldedFunnel[]> {
  return holdedFetch<HoldedFunnel[]>('crm', 'GET', '/funnels');
}

export async function listLeads(): Promise<HoldedLead[]> {
  return holdedFetch<HoldedLead[]>('crm', 'GET', '/leads');
}

export async function createLead(params: {
  name: string;
  funnelId?: string;
  contactId?: string;
  contactName?: string;
  value?: number;
  potential?: number;
  dueDate?: number;
  stageId?: string;
}): Promise<string> {
  const body: Record<string, unknown> = { name: params.name };
  if (params.funnelId) body.funnelId = params.funnelId;
  if (params.contactId) body.contactId = params.contactId;
  if (params.contactName) body.contactName = params.contactName;
  if (params.value !== undefined) body.value = params.value;
  if (params.potential !== undefined) body.potential = params.potential;
  if (params.dueDate) body.dueDate = params.dueDate;
  if (params.stageId) body.stageId = params.stageId;

  const data = await holdedFetch<{ id: string }>('crm', 'POST', '/leads', body);
  return data.id;
}

export async function updateLeadStage(leadId: string, stageId: string): Promise<void> {
  await holdedFetch('crm', 'PUT', `/leads/${leadId}/stages`, { stageId });
}

export async function listProjects(): Promise<HoldedProject[]> {
  return holdedFetch<HoldedProject[]>('projects', 'GET', '/projects');
}

export async function createProject(params: {
  name: string;
  desc?: string;
  contactName?: string;
  date?: number;
  dueDate?: number;
  tags?: string[];
}): Promise<string> {
  const body: Record<string, unknown> = { name: params.name };
  if (params.desc) body.desc = params.desc;
  if (params.contactName) body.contactName = params.contactName;
  if (params.date) body.date = params.date;
  if (params.dueDate) body.dueDate = params.dueDate;
  if (params.tags?.length) body.tags = params.tags;

  const data = await holdedFetch<{ id: string }>('projects', 'POST', '/projects', body);
  return data.id;
}

export async function updateProject(
  projectId: string,
  params: {
    name?: string;
    desc?: string;
    contactName?: string;
    date?: number;
    dueDate?: number;
    status?: number;
    tags?: string[];
    lists?: Array<Record<string, unknown>>;
    labels?: Array<Record<string, unknown>>;
  }
): Promise<void> {
  await holdedFetch('projects', 'PUT', `/projects/${projectId}`, params);
}

export async function getProjectSummary<T = Record<string, unknown>>(projectId: string): Promise<T> {
  return holdedFetch<T>('projects', 'GET', `/projects/${projectId}/summary`);
}

export async function listTasks(): Promise<HoldedTask[]> {
  return holdedFetch<HoldedTask[]>('projects', 'GET', '/tasks');
}

export async function createTask(params: {
  projectId: string;
  listId: string;
  name: string;
}): Promise<string> {
  const data = await holdedFetch<{ id: string }>('projects', 'POST', '/tasks', params);
  return data.id;
}

export async function syncLeadToHolded(params: {
  leadId: string;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  category?: string | null;
  value?: number;
  stageId?: string;
  funnelId?: string;
  localEntity?: 'leads' | 'saas_leads';
}): Promise<HoldedEntitySyncResult> {
  const localEntity = params.localEntity ?? 'leads';
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_crm_lead',
    localEntity,
    localId: params.leadId,
    externalEntity: 'holded_lead',
    requestPayload: {
      leadId: params.leadId,
      email: params.email,
      service: params.service,
      category: params.category,
      value: params.value
    }
  });

  if (!isHoldedSyncEnabled()) return skipEntitySync(syncEventId, 'HOLDED_SYNC_ENABLED=false');
  if (!isConfigured()) return skipEntitySync(syncEventId, 'HOLDED_API_KEY not set');

  try {
    const existing = await findExternalMapping({
      provider: 'holded',
      localEntity,
      localId: params.leadId,
      externalEntity: 'holded_lead'
    });

    if (existing) {
      await updateSyncEvent(syncEventId, {
        status: 'success',
        externalId: existing.external_id,
        responsePayload: { leadId: existing.external_id, fromMapping: true }
      });
      return { externalId: existing.external_id, syncEventId, metadata: { fromMapping: true } };
    }

    const contactId = await upsertContact({
      name: params.name,
      email: params.email,
      phone: params.phone,
      customId: `expert_${localEntity}_${params.leadId}`
    });
    const stageId = params.stageId ?? process.env.HOLDED_CRM_DEFAULT_STAGE_ID;
    const funnelId = params.funnelId ?? process.env.HOLDED_CRM_FUNNEL_ID;
    const holdedLeadId = await createLead({
      name: params.service ? `${params.service} - ${params.name}` : params.name,
      contactId,
      contactName: params.name,
      value: params.value,
      stageId,
      funnelId
    });

    await upsertExternalMapping({
      provider: 'holded',
      localEntity,
      localId: params.leadId,
      externalEntity: 'holded_lead',
      externalId: holdedLeadId,
      metadata: { contactId, stageId, funnelId }
    });

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalId: holdedLeadId,
      responsePayload: { contactId, holdedLeadId, stageId, funnelId }
    });

    return { externalId: holdedLeadId, syncEventId, metadata: { contactId, stageId, funnelId } };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncLeadToHolded error:', msg);
    return { externalId: null, syncEventId, error: msg };
  }
}

export async function syncProjectToHolded(params: {
  caseId: string;
  service: string;
  category: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  state?: string | null;
  docsChecklist?: string[];
}): Promise<HoldedEntitySyncResult> {
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_project',
    localEntity: 'cases',
    localId: params.caseId,
    externalEntity: 'holded_project',
    requestPayload: {
      caseId: params.caseId,
      service: params.service,
      category: params.category,
      state: params.state,
      docsChecklist: params.docsChecklist
    }
  });

  if (!isHoldedSyncEnabled()) return skipEntitySync(syncEventId, 'HOLDED_SYNC_ENABLED=false');
  if (!isConfigured()) return skipEntitySync(syncEventId, 'HOLDED_API_KEY not set');

  try {
    const existing = await findExternalMapping({
      provider: 'holded',
      localEntity: 'cases',
      localId: params.caseId,
      externalEntity: 'holded_project'
    });

    if (existing) {
      await updateSyncEvent(syncEventId, {
        status: 'success',
        externalId: existing.external_id,
        responsePayload: { projectId: existing.external_id, fromMapping: true }
      });
      return { externalId: existing.external_id, syncEventId, metadata: { fromMapping: true } };
    }

    const projectId = await createProject({
      name: `${params.service} - ${params.clientName}`,
      desc: `Expediente EXPERT ${params.caseId}`,
      contactName: params.clientName,
      tags: ['EXPERT', params.category, params.state ?? 'nuevo'].filter(Boolean)
    });

    await upsertExternalMapping({
      provider: 'holded',
      localEntity: 'cases',
      localId: params.caseId,
      externalEntity: 'holded_project',
      externalId: projectId,
      metadata: {
        state: params.state,
        category: params.category,
        clientEmail: params.clientEmail
      }
    });

    const listId = process.env.HOLDED_PROJECT_DEFAULT_LIST_ID;
    const createdTasks: string[] = [];
    if (listId && params.docsChecklist?.length) {
      for (const [index, item] of params.docsChecklist.entries()) {
        const localTaskId = `${params.caseId}:${index}`;
        const existingTask = await findExternalMapping({
          provider: 'holded',
          localEntity: 'case_checklist_items',
          localId: localTaskId,
          externalEntity: 'holded_task'
        });
        if (existingTask) continue;

        const taskId = await createTask({
          projectId,
          listId,
          name: `Solicitar/revisar: ${item}`
        });
        createdTasks.push(taskId);
        await upsertExternalMapping({
          provider: 'holded',
          localEntity: 'case_checklist_items',
          localId: localTaskId,
          externalEntity: 'holded_task',
          externalId: taskId,
          metadata: { caseId: params.caseId, item }
        });
      }
    }

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalId: projectId,
      responsePayload: { projectId, createdTasks }
    });

    return { externalId: projectId, syncEventId, metadata: { createdTasks } };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncProjectToHolded error:', msg);
    return { externalId: null, syncEventId, error: msg };
  }
}

export async function syncQuoteToHolded(params: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  description: string;
  amountEur: number;
  quoteId?: string;
  documentType?: Extract<HoldedDocumentType, 'estimate' | 'proform'>;
  localEntity?: string;
}): Promise<HoldedSyncResult> {
  const localEntity = params.localEntity ?? 'quotes';
  const documentType = params.documentType ?? (process.env.HOLDED_DEFAULT_QUOTE_DOC_TYPE as 'estimate' | 'proform') ?? 'estimate';
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_quote_document',
    localEntity,
    localId: params.quoteId ?? null,
    externalEntity: 'holded_document',
    requestPayload: {
      clientEmail: params.clientEmail,
      description: params.description,
      amountEur: params.amountEur,
      quoteId: params.quoteId,
      documentType
    }
  });

  if (!isHoldedSyncEnabled()) return skipSync(syncEventId, 'HOLDED_SYNC_ENABLED=false');
  if (!canSyncHoldedQuotes()) return skipSync(syncEventId, 'HOLDED_SYNC_QUOTES=false');
  if (!isConfigured()) return skipSync(syncEventId, 'HOLDED_API_KEY not set');

  try {
    if (params.quoteId) {
      const existing = await findExternalMapping({
        provider: 'holded',
        localEntity,
        localId: params.quoteId,
        externalEntity: `holded_${documentType}`
      });

      if (existing) {
        await updateSyncEvent(syncEventId, {
          status: 'success',
          externalEntity: existing.external_entity,
          externalId: existing.external_id,
          responsePayload: { documentId: existing.external_id, documentType, fromMapping: true }
        });
        return {
          contactId: null,
          invoiceId: null,
          documentId: existing.external_id,
          documentType,
          syncEventId
        };
      }
    }

    const contactId = await upsertContact({
      name: params.clientName,
      email: params.clientEmail,
      phone: params.clientPhone,
      customId: params.quoteId ? `expert_quote_${params.quoteId}` : null
    });
    const documentId = await createQuoteDocument({
      contactId,
      description: params.description,
      amountEur: params.amountEur,
      reference: params.quoteId,
      type: documentType
    });

    if (params.quoteId) {
      await upsertExternalMapping({
        provider: 'holded',
        localEntity,
        localId: params.quoteId,
        externalEntity: `holded_${documentType}`,
        externalId: documentId,
        metadata: { contactId, documentType }
      });
    }

    await updateSyncEvent(syncEventId, {
      status: 'success',
      externalEntity: `holded_${documentType}`,
      externalId: documentId,
      responsePayload: { contactId, documentId, documentType }
    });

    return { contactId, invoiceId: null, documentId, documentType, syncEventId };
  } catch (error) {
    const msg = errorMessage(error);
    await updateSyncEvent(syncEventId, { status: 'failed', error: msg });
    console.error('[holded] syncQuoteToHolded error:', msg);
    return { contactId: null, invoiceId: null, documentId: null, syncEventId, error: msg };
  }
}

export async function syncSubscriptionToHolded(params: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  planName: string;
  amountEur: number;
  subscriptionId?: string;
  localEntity?: string;
  source?: HoldedSyncSource;
}): Promise<HoldedSyncResult> {
  const source = params.source ?? 'stripe';
  const localEntity = params.localEntity ?? 'stripe_subscriptions';
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_subscription_invoice',
    localEntity,
    localId: params.subscriptionId ?? null,
    externalEntity: 'holded_invoice',
    requestPayload: {
      clientEmail: params.clientEmail,
      planName: params.planName,
      amountEur: params.amountEur,
      subscriptionId: params.subscriptionId,
      source
    }
  });

  if (!isHoldedSyncEnabled()) return skipSync(syncEventId, 'HOLDED_SYNC_ENABLED=false');
  if (!isConfigured()) return skipSync(syncEventId, 'HOLDED_API_KEY not set');
  if (!invoiceCreationAllowedForSource(source)) {
    return skipSync(syncEventId, 'HOLDED_CREATE_INVOICES_FROM_STRIPE=false');
  }

  try {
    if (params.subscriptionId) {
      const existing = await findExternalMapping({
        provider: 'holded',
        localEntity,
        localId: params.subscriptionId,
        externalEntity: 'holded_invoice'
      });

      if (existing) {
        await updateSyncEvent(syncEventId, {
          status: 'success',
          externalId: existing.external_id,
          responsePayload: { invoiceId: existing.external_id, fromMapping: true }
        });
        return { contactId: null, invoiceId: existing.external_id, syncEventId };
      }
    }

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

    if (params.subscriptionId) {
      await upsertExternalMapping({
        provider: 'holded',
        localEntity,
        localId: params.subscriptionId,
        externalEntity: 'holded_invoice',
        externalId: invoiceId,
        metadata: { contactId, source }
      });
    }

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
  source?: HoldedSyncSource;
}): Promise<HoldedSyncResult> {
  const source = params.source ?? 'stripe';
  const localEntity = params.localEntity ?? 'orders';
  const syncEventId = await createSyncEvent({
    direction: 'to_external',
    operation: 'sync_order_invoice',
    localEntity,
    localId: params.orderId ?? null,
    externalEntity: 'holded_invoice',
    requestPayload: {
      clientEmail: params.clientEmail,
      description: params.description,
      amountEur: params.amountEur,
      orderId: params.orderId,
      source
    }
  });

  if (!isHoldedSyncEnabled()) return skipSync(syncEventId, 'HOLDED_SYNC_ENABLED=false');
  if (!isConfigured()) return skipSync(syncEventId, 'HOLDED_API_KEY not set');
  if (!invoiceCreationAllowedForSource(source)) {
    return skipSync(syncEventId, 'HOLDED_CREATE_INVOICES_FROM_STRIPE=false');
  }

  try {
    if (params.orderId) {
      const existing = await findExternalMapping({
        provider: 'holded',
        localEntity,
        localId: params.orderId,
        externalEntity: 'holded_invoice'
      });

      if (existing) {
        await updateSyncEvent(syncEventId, {
          status: 'success',
          externalId: existing.external_id,
          responsePayload: { invoiceId: existing.external_id, fromMapping: true }
        });
        return { contactId: null, invoiceId: existing.external_id, syncEventId };
      }
    }

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

    if (params.orderId) {
      await upsertExternalMapping({
        provider: 'holded',
        localEntity,
        localId: params.orderId,
        externalEntity: 'holded_invoice',
        externalId: invoiceId,
        metadata: { contactId, source }
      });
    }

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
