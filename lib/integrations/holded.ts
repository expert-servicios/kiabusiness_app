const HOLDED_BASE = 'https://api.holded.com/api/invoicing/v1';

function isConfigured(): boolean {
  return Boolean(process.env.HOLDED_API_KEY);
}

function getHeaders(): HeadersInit {
  const key = process.env.HOLDED_API_KEY;
  if (!key) throw new Error('HOLDED_API_KEY not configured');
  return { key, 'Content-Type': 'application/json' };
}

async function holdedFetch<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${HOLDED_BASE}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Holded ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Contacts ──────────────────────────────────────────────────────────────────

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
    // Holded returns the array directly, not wrapped in { contacts: [] }
    const data = await holdedFetch<HoldedContact[] | HoldedContactList>('GET', `/contacts?email=${encodeURIComponent(email)}`);
    if (Array.isArray(data)) return data[0] ?? null;
    return (data as HoldedContactList).contacts?.[0] ?? null;
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
    type: 1 // 1 = client
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

// ── Invoices ──────────────────────────────────────────────────────────────────

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

// ── High-level sync ───────────────────────────────────────────────────────────

export interface HoldedSyncResult {
  contactId: string | null;
  invoiceId: string | null;
  error?: string;
}

export async function syncSubscriptionToHolded(params: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  planName: string;
  amountEur: number;
  subscriptionId?: string;
}): Promise<HoldedSyncResult> {
  if (!isConfigured()) {
    return { contactId: null, invoiceId: null, error: 'HOLDED_API_KEY not set' };
  }
  try {
    const contactId = await upsertContact({
      name: params.clientName,
      email: params.clientEmail,
      phone: params.clientPhone
    });
    const invoiceId = await createInvoice({
      contactId,
      description: `${params.planName} — suscripción mensual`,
      amountEur: params.amountEur,
      reference: params.subscriptionId
    });
    return { contactId, invoiceId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[holded] syncSubscriptionToHolded error:', msg);
    return { contactId: null, invoiceId: null, error: msg };
  }
}

export async function syncOrderToHolded(params: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  description: string;
  amountEur: number;
  orderId?: string;
}): Promise<HoldedSyncResult> {
  if (!isConfigured()) {
    return { contactId: null, invoiceId: null, error: 'HOLDED_API_KEY not set' };
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

    return { contactId, invoiceId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[holded] syncOrderToHolded error:', msg);
    return { contactId: null, invoiceId: null, error: msg };
  }
}
