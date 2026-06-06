/**
 * Holded Client — unified HTTP client for per-integration API calls.
 *
 * Usage:
 *   const client = await createHoldedClient(integrationId);
 *   const invoices = await client.listSalesInvoices({ page: 1 });
 *
 * Pass integrationId=null to use the EXPERT global account (HOLDED_API_KEY).
 * Pass integrationId=<uuid> to use a specific client_integrations row (decrypts key).
 *
 * Architecture rules:
 *   - Every method is read-first (GET). Write methods require sync_mode=read_write.
 *   - Rate limiting: 150ms minimum delay between requests (Holded limit ~10 req/s).
 *   - All errors are typed (HoldedApiError subclasses).
 *   - The API key is never logged, never returned, never stored in request_payload.
 */

import { buildHoldedHeaders, resolveHoldedAuth } from './holded-auth';
import { classifyHoldedError, holdedErrorMessage } from './holded-errors';

// ── Holded response types (minimal, add fields as needed) ─────────────────────

export interface HoldedContact {
  id          : string;
  name        : string;
  email      ?: string;
  phone      ?: string;
  code       ?: string;    // NIF/CIF if stored
  type       ?: number;    // 0=proveedor, 1=cliente, 2=acreedor
  customId   ?: string;
}

export interface HoldedDocument {
  id          : string;
  docNumber   : string;
  date        : number;    // Unix timestamp
  total       : number;
  currency    : string;
  status      : string;   // paid | unpaid | partial | void
  contact     : { id: string; name: string };
  items       : HoldedDocumentItem[];
}

export interface HoldedDocumentItem {
  name      : string;
  units     : number;
  subtotal  : number;
  tax      ?: number;
  taxId    ?: string;
}

export interface HoldedTax {
  id    : string;
  name  : string;
  value : number;   // e.g. 21 for 21% IVA
}

export interface HoldedBankAccount {
  id       : string;
  name     : string;
  iban    ?: string;
  balance ?: number;
}

export interface HoldedBankMovement {
  id          : string;
  date        : number;   // Unix timestamp
  amount      : number;
  description : string;
  reference  ?: string;
  contactId  ?: string;
  documentId ?: string;
  status      : string;
}

export interface HoldedInboxDocument {
  id          : string;
  name        : string;
  date        : number;
  total      ?: number;
  status      : string;
  type       ?: string;
}

export interface HoldedPermissions {
  contacts           : boolean;
  salesInvoices      : boolean;
  purchaseInvoices   : boolean;
  taxes              : boolean;
  bankAccounts       : boolean;
  bankMovements      : boolean;
  inboxDocuments     : boolean;
  writeInbox         : boolean;
  accountingReports  : boolean;
  accountingEntries  : boolean;
}

// ── Rate-limit helper ─────────────────────────────────────────────────────────

const MIN_DELAY_MS = 150;
let lastCallAt = 0;

async function respectRateLimit(): Promise<void> {
  const now    = Date.now();
  const waited = now - lastCallAt;
  if (waited < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - waited));
  }
  lastCallAt = Date.now();
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function holdedFetch<T>(
  apiKey : string,
  method : string,
  url    : string,
  body  ?: Record<string, unknown>,
): Promise<T> {
  await respectRateLimit();

  const res = await fetch(url, {
    method,
    headers: buildHoldedHeaders(apiKey),
    body   : body ? JSON.stringify(body) : undefined,
    signal : AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw classifyHoldedError(res.status, url, text);
  }

  return res.json() as Promise<T>;
}

function listOrData<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const obj = raw as { data?: T[] };
  return obj?.data ?? [];
}

// ── Client factory ────────────────────────────────────────────────────────────

export interface HoldedClient {
  /** Verify the API key works and detect available permissions. */
  testConnection(): Promise<{ ok: boolean; permissions: HoldedPermissions; warnings: string[] }>;

  /** Detect permissions available with the current API key. */
  detectPermissions(): Promise<HoldedPermissions>;

  listContacts(params?: { page?: number; email?: string }): Promise<HoldedContact[]>;
  listSalesInvoices(params?: { page?: number; dateFrom?: number; dateTo?: number }): Promise<HoldedDocument[]>;
  listPurchaseInvoices(params?: { page?: number; dateFrom?: number; dateTo?: number }): Promise<HoldedDocument[]>;
  listTaxes(): Promise<HoldedTax[]>;
  listBankAccounts(): Promise<HoldedBankAccount[]>;
  listBankMovements(params?: { page?: number; dateFrom?: number; dateTo?: number }): Promise<HoldedBankMovement[]>;
  listInboxDocuments(params?: { page?: number }): Promise<HoldedInboxDocument[]>;
  getDocument(docType: 'invoice' | 'estimate' | 'proforma' | 'order', docId: string): Promise<HoldedDocument | null>;
  getContact(contactId: string): Promise<HoldedContact | null>;
}

const INVOICING_BASE = 'https://api.holded.com/api/invoicing/v1';

/** Shared factory — builds a HoldedClient from a resolved API key + base URL. */
function buildHoldedClient(apiKey: string, baseUrl: string): HoldedClient {
  const get  = <T>(path: string) => holdedFetch<T>(apiKey, 'GET', `${baseUrl}${path}`);

  // ── Permission detection ────────────────────────────────────────────────────

  async function detectPermissions(): Promise<HoldedPermissions> {
    const getAccounting = <T>(path: string) =>
      holdedFetch<T>(apiKey, 'GET', `https://api.holded.com/api/accounting/v1${path}`);

    const checks: Array<{ key: keyof HoldedPermissions; probe: () => Promise<unknown> }> = [
      { key: 'contacts',          probe: () => get('/contacts?page=1') },
      { key: 'salesInvoices',     probe: () => get('/documents/invoice?page=1') },
      { key: 'purchaseInvoices',  probe: () => get('/documents/purchase?page=1') },
      { key: 'taxes',             probe: () => get('/taxes') },
      { key: 'bankAccounts',      probe: () => get('/treasury/accounts') },
      { key: 'bankMovements',     probe: () => get('/treasury/movements?page=1') },
      { key: 'inboxDocuments',    probe: () => get('/documents/inbox?page=1') },
      { key: 'writeInbox',        probe: () => Promise.resolve(false) },
      { key: 'accountingReports', probe: () => getAccounting(`/reports/vat?year=${new Date().getFullYear()}`) },
      { key: 'accountingEntries', probe: () => getAccounting('/entries?page=1') },
    ];

    const permissions = {} as HoldedPermissions;
    for (const { key, probe } of checks) {
      try {
        await probe();
        permissions[key] = true;
      } catch {
        permissions[key] = false;
      }
    }
    return permissions;
  }

  // ── testConnection ──────────────────────────────────────────────────────────

  async function testConnection(): Promise<{ ok: boolean; permissions: HoldedPermissions; warnings: string[] }> {
    const warnings: string[] = [];
    let permissions: HoldedPermissions;

    try {
      permissions = await detectPermissions();
    } catch (err) {
      return {
        ok: false,
        permissions: {
          contacts: false, salesInvoices: false, purchaseInvoices: false,
          taxes: false, bankAccounts: false, bankMovements: false,
          inboxDocuments: false, writeInbox: false,
          accountingReports: false, accountingEntries: false,
        },
        warnings: [holdedErrorMessage(err)],
      };
    }

    if (!permissions.salesInvoices)  warnings.push('Sin acceso a facturas emitidas — necesario para resumen fiscal.');
    if (!permissions.purchaseInvoices) warnings.push('Sin acceso a facturas recibidas/compras — necesario para calcular IVA soportado.');
    if (!permissions.taxes)          warnings.push('Sin acceso a impuestos — necesario para resumen Modelo 303.');
    if (!permissions.bankAccounts)   warnings.push('Sin acceso a bancos — la conciliación no estará disponible.');

    return { ok: true, permissions, warnings };
  }

  // ── Public methods ──────────────────────────────────────────────────────────

  return {
    testConnection,
    detectPermissions,

    async listContacts({ page = 1, email } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (email) qs.set('email', email);
      const raw = await get<unknown>(`/contacts?${qs}`);
      return listOrData<HoldedContact>(raw);
    },

    async listSalesInvoices({ page = 1, dateFrom, dateTo } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (dateFrom) qs.set('dateFrom', String(dateFrom));
      if (dateTo)   qs.set('dateTo',   String(dateTo));
      const raw = await get<unknown>(`/documents/invoice?${qs}`);
      return listOrData<HoldedDocument>(raw);
    },

    async listPurchaseInvoices({ page = 1, dateFrom, dateTo } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (dateFrom) qs.set('dateFrom', String(dateFrom));
      if (dateTo)   qs.set('dateTo',   String(dateTo));
      const raw = await get<unknown>(`/documents/purchase?${qs}`);
      return listOrData<HoldedDocument>(raw);
    },

    async listTaxes() {
      const raw = await get<unknown>('/taxes');
      return listOrData<HoldedTax>(raw);
    },

    async listBankAccounts() {
      const raw = await get<unknown>('/treasury/accounts');
      return listOrData<HoldedBankAccount>(raw);
    },

    async listBankMovements({ page = 1, dateFrom, dateTo } = {}) {
      const qs = new URLSearchParams({ page: String(page) });
      if (dateFrom) qs.set('dateFrom', String(dateFrom));
      if (dateTo)   qs.set('dateTo',   String(dateTo));
      const raw = await get<unknown>(`/treasury/movements?${qs}`);
      return listOrData<HoldedBankMovement>(raw);
    },

    async listInboxDocuments({ page = 1 } = {}) {
      const raw = await get<unknown>(`/documents/inbox?page=${page}`);
      return listOrData<HoldedInboxDocument>(raw);
    },

    async getDocument(docType, docId) {
      try {
        return await get<HoldedDocument>(`/documents/${docType}/${docId}`);
      } catch {
        return null;
      }
    },

    async getContact(contactId) {
      try {
        return await get<HoldedContact>(`/contacts/${contactId}`);
      } catch {
        return null;
      }
    },
  };
}

/**
 * Creates a Holded HTTP client bound to a specific integration.
 *
 * @param integrationId - UUID of client_integrations row, or null for the EXPERT global account.
 */
export async function createHoldedClient(integrationId: string | null): Promise<HoldedClient> {
  const auth = await resolveHoldedAuth(integrationId);
  return buildHoldedClient(auth.apiKey, auth.baseUrl);
}

/**
 * Creates a Holded client from a raw API key (no DB lookup).
 * Used only in the /api/integrations/holded/test route to verify a key before saving.
 * The raw key is NEVER logged or stored here.
 */
export function createHoldedClientFromRawKey(rawApiKey: string): HoldedClient {
  return buildHoldedClient(rawApiKey.trim(), INVOICING_BASE);
}

/**
 * Convenience: creates a client for the EXPERT global account.
 * Equivalent to createHoldedClient(null).
 */
export function createExpertHoldedClient(): Promise<HoldedClient> {
  return createHoldedClient(null);
}

/**
 * Returns true if SECRET_ENCRYPTION_KEY is set (required for client integrations).
 * The EXPERT global account only requires HOLDED_API_KEY.
 */
export function isEncryptionConfigured(): boolean {
  const key = process.env.SECRET_ENCRYPTION_KEY;
  if (!key) return false;
  try {
    const buf = Buffer.from(key, 'hex');
    return buf.length === 32;
  } catch {
    return false;
  }
}

/**
 * Validate minimum permissions for a monthly management plan.
 * Returns the list of missing permissions (empty = all good).
 */
export function getMissingPlanPermissions(permissions: HoldedPermissions): string[] {
  const missing: string[] = [];
  if (!permissions.salesInvoices)    missing.push('Facturas emitidas');
  if (!permissions.purchaseInvoices) missing.push('Facturas recibidas / compras');
  if (!permissions.taxes)            missing.push('Impuestos');
  return missing;
}
