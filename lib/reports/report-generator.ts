/**
 * Core report generation logic shared between the API route and the Kia tool executor.
 *
 * Fetches data from Holded + Supabase, calculates KPIs, generates an AI summary,
 * stores the result in kia_financial_reports, and returns the report ID + URL.
 */

import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveHoldedAuth, buildHoldedHeaders } from '@/lib/integrations/holded/holded-auth';
import { absoluteAppUrl } from '@/lib/utils/app-url';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceSummaryItem {
  id       : string;
  number   : string;
  date     : string;
  contact  : string;
  total    : number;
  status   : string;
}

export interface BankAccount {
  id       : string;
  name     : string;
  balance  : number;
  currency : string;
}

export interface ContactVolume {
  name  : string;
  total : number;
}

export interface Anomaly {
  id       : string;
  type     : string;
  severity : 'info' | 'warning' | 'critical';
  detail   : string;
  status   : string;
}

export interface MonthlyFlow {
  month    : string; // e.g. 'Ene 2025'
  sales    : number;
  purchases: number;
}

export interface ReportKPIs {
  totalSales      : number;
  totalPurchases  : number;
  vatCollected    : number;   // IVA repercutido estimado (21%)
  vatDeductible   : number;   // IVA soportado estimado (21%)
  vatBalance      : number;   // collectado - deducible
  totalBankBalance: number;
  unpaidInvoices  : number;   // facturas emitidas sin pagar
  pendingPurchases: number;   // facturas recibidas sin pagar
}

export interface ReportData {
  period          : string;
  generatedAt     : string;
  company         : { name: string; taxId: string | null };
  kpis            : ReportKPIs;
  bankAccounts    : BankAccount[];
  topContacts     : ContactVolume[];
  monthlyFlow     : MonthlyFlow[];
  salesInvoices   : InvoiceSummaryItem[];
  purchaseInvoices: InvoiceSummaryItem[];
  anomalies       : Anomaly[];
  aiSummary       : string;
}

export interface GenerateReportInput {
  clientId      : string;
  companyId    ?: string | null;
  integrationId : string;
  period       ?: string;
  lang          : 'es' | 'ru';
  generatedBy   : 'kia' | 'admin' | 'user';
}

export interface GenerateReportResult {
  reportId : string;
  reportUrl: string;
  title    : string;
  period   : string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentQuarterLabel(): string {
  const now = new Date();
  const q   = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

function safeFetch(url: string, hdrs: HeadersInit): Promise<unknown[]> {
  return fetch(url, { headers: hdrs })
    .then((r) => r.ok ? r.json() : [])
    .then((d) => (Array.isArray(d) ? d : []))
    .catch(() => []);
}

/** Fetches all pages of a Holded document list (page=1,2,… until empty). */
async function fetchAllHoldedDocs(baseUrl: string, docType: string, hdrs: HeadersInit): Promise<RawDoc[]> {
  const all: RawDoc[] = [];
  for (let page = 1; page <= 20; page++) {   // cap at 20 pages (2000 docs) to prevent infinite loop
    const docs = await safeFetch(`${baseUrl}/documents/${docType}?page=${page}&limit=100`, hdrs) as RawDoc[];
    if (!docs.length) break;
    all.push(...docs);
    if (docs.length < 100) break;             // last page — no need to fetch next
  }
  return all;
}

type RawDoc = Record<string, unknown>;

// ── Holded field normalizers ──────────────────────────────────────────────────

/** Holded dates are Unix timestamps in seconds, not ISO strings. */
function holdedDate(val: unknown): string {
  const num = Number(val);
  if (!num || isNaN(num)) return String(val ?? '');
  return new Date(num * 1000).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/**
 * Holded invoice/purchase status:
 *   0 = draft (borrador)
 *   1 = approved — check paymentsPending to know if paid
 *   2 = partially paid (usually a floating-point rounding residual)
 * The authoritative "is paid?" check is paymentsPending <= threshold.
 */
function holdedStatus(d: RawDoc): string {
  const statusCode  = Number(d.status ?? 0);
  const pending     = Number(d.paymentsPending ?? 0);
  const total       = Number(d.total ?? 0);
  if (statusCode === 0) return 'borrador';
  if (pending <= 0.05) return 'cobrada';          // fully paid (allow 0.05€ float tolerance)
  if (pending < total) return 'parcialmente cobrada';
  return 'pendiente';
}

/** An invoice is "unpaid" when it's not a draft AND has meaningful pending amount. */
function isUnpaid(d: RawDoc): boolean {
  return Number(d.status ?? 0) !== 0 && Number(d.paymentsPending ?? 0) > 0.05;
}

function toInvoiceSummary(docs: RawDoc[]): InvoiceSummaryItem[] {
  return docs.map((d) => ({
    id     : String(d.id ?? ''),
    number : String(d.docNumber ?? d.number ?? ''),
    date   : holdedDate(d.date),
    contact: String(d.contactName ?? d.contact ?? ''),
    total  : Number(d.total ?? 0),
    status : holdedStatus(d),
  }));
}

function buildMonthlyFlow(sales: RawDoc[], purchases: RawDoc[]): MonthlyFlow[] {
  const map = new Map<string, { sales: number; purchases: number }>();

  const addDoc = (docs: RawDoc[], key: 'sales' | 'purchases') => {
    for (const d of docs) {
      const raw = String(d.date ?? '');
      if (!raw) continue;
      // date is Unix timestamp (seconds) or ISO string
      const ts  = isNaN(Number(raw)) ? new Date(raw) : new Date(Number(raw) * 1000);
      const label = ts.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      const entry = map.get(label) ?? { sales: 0, purchases: 0 };
      entry[key] += Number(d.total ?? 0);
      map.set(label, entry);
    }
  };

  addDoc(sales, 'sales');
  addDoc(purchases, 'purchases');

  return Array.from(map.entries())
    .map(([month, v]) => ({ month, ...v }))
    .slice(-6); // last 6 months
}

function buildTopContacts(sales: RawDoc[]): ContactVolume[] {
  const map = new Map<string, number>();
  for (const d of sales) {
    const name = String(d.contactName ?? d.contact ?? 'Desconocido');
    map.set(name, (map.get(name) ?? 0) + Number(d.total ?? 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, total]) => ({ name, total }));
}

function calcVat(amount: number, rate = 0.21): number {
  return Math.round((amount * rate) * 100) / 100;
}

// ── AI summary ────────────────────────────────────────────────────────────────

async function generateAiSummary(kpis: ReportKPIs, anomalies: Anomaly[], lang: 'es' | 'ru'): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return lang === 'es'
    ? 'Resumen automático no disponible (clave API no configurada).'
    : 'Автоматическое резюме недоступно.';

  const prompt = lang === 'es'
    ? `Eres Kia, asistente contable de EXPERT. Redacta un resumen ejecutivo breve (3-5 frases) del estado financiero de la empresa basándote en estos datos del periodo:
- Ventas totales: ${kpis.totalSales.toFixed(2)} €
- Gastos totales: ${kpis.totalPurchases.toFixed(2)} €
- IVA repercutido estimado: ${kpis.vatCollected.toFixed(2)} €
- IVA soportado estimado: ${kpis.vatDeductible.toFixed(2)} €
- Balance IVA (a pagar/devolver): ${kpis.vatBalance.toFixed(2)} €
- Saldo bancario total: ${kpis.totalBankBalance.toFixed(2)} €
- Facturas emitidas sin cobrar: ${kpis.unpaidInvoices}
- Alertas contables: ${anomalies.filter(a => a.severity === 'critical').length} críticas, ${anomalies.filter(a => a.severity === 'warning').length} advertencias
Sé directo, profesional y en español. No incluyas advertencias legales.`
    : `Ты Kia, бухгалтерский ассистент EXPERT. Напиши краткое резюме (3-5 предложений) финансового состояния компании на основе данных периода:
- Продажи: ${kpis.totalSales.toFixed(2)} €, Расходы: ${kpis.totalPurchases.toFixed(2)} €
- НДС к уплате: ${kpis.vatBalance.toFixed(2)} €, Банковский баланс: ${kpis.totalBankBalance.toFixed(2)} €
- Неоплаченных счетов: ${kpis.unpaidInvoices}, Критических предупреждений: ${anomalies.filter(a => a.severity === 'critical').length}
Будь кратким и профессиональным.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method : 'POST',
      headers: {
        'x-api-key'        : apiKey,
        'anthropic-version': '2023-06-01',
        'content-type'     : 'application/json',
      },
      body: JSON.stringify({
        model     : process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages  : [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json() as { content?: Array<{ text?: string }> };
    return json.content?.[0]?.text?.trim() ?? '';
  } catch {
    return lang === 'es'
      ? 'No se pudo generar el resumen automático en este momento.'
      : 'Не удалось создать автоматическое резюме.';
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateCompanyReport(input: GenerateReportInput): Promise<GenerateReportResult> {
  const admin  = getSupabaseAdmin();
  const period = input.period ?? currentQuarterLabel();
  const auth   = await resolveHoldedAuth(input.integrationId);
  const hdrs   = buildHoldedHeaders(auth.apiKey);
  const base   = auth.baseUrl;

  // ── Fetch Holded data in parallel (full pagination) ──────────────────────
  const [rawSales, rawPurchases, rawBank, rawContacts] = await Promise.all([
    fetchAllHoldedDocs(base, 'invoice', hdrs),
    fetchAllHoldedDocs(base, 'purchase', hdrs),
    safeFetch(`${base}/treasury`, hdrs)        as Promise<RawDoc[]>,
    safeFetch(`${base}/contacts?limit=100`, hdrs) as Promise<RawDoc[]>,
  ]);

  // ── Fetch internal data ────────────────────────────────────────────────────
  const { data: anomalyRows } = await admin
    .from('accounting_anomalies')
    .select('id, anomaly_type, severity, description, status')
    .eq('client_id', input.clientId)
    .in('status', ['open', 'pending'])
    .order('severity', { ascending: false })
    .limit(20);

  const { data: companyRow } = await admin
    .from('companies')
    .select('razon_social, nombre_comercial, cif_nif')
    .eq('id', input.companyId ?? '')
    .maybeSingle();

  // ── Build report data ──────────────────────────────────────────────────────
  // Exclude drafts (status=0) from financial totals — they're not real invoices yet
  const confirmedSales     = rawSales.filter(d => Number(d.status ?? 0) !== 0);
  const confirmedPurchases = rawPurchases.filter(d => Number(d.status ?? 0) !== 0);

  // Show all invoices in the table (including drafts, clearly labelled)
  const salesInvoices    = toInvoiceSummary(rawSales).slice(0, 20);
  const purchaseInvoices = toInvoiceSummary(rawPurchases).slice(0, 20);

  const totalSales     = confirmedSales.reduce((s, d) => s + Number(d.total ?? 0), 0);
  const totalPurchases = confirmedPurchases.reduce((s, d) => s + Number(d.total ?? 0), 0);
  const totalBank      = rawBank.reduce((s, a) => s + Number(a.balance ?? 0), 0);
  const unpaid         = confirmedSales.filter(isUnpaid).length;
  const pendingPurch   = confirmedPurchases.filter(isUnpaid).length;

  const kpis: ReportKPIs = {
    totalSales,
    totalPurchases,
    vatCollected    : calcVat(totalSales),
    vatDeductible   : calcVat(totalPurchases),
    vatBalance      : calcVat(totalSales) - calcVat(totalPurchases),
    totalBankBalance: totalBank,
    unpaidInvoices  : unpaid,
    pendingPurchases: pendingPurch,
  };

  const bankAccounts: BankAccount[] = rawBank.slice(0, 5).map((a) => ({
    id      : String(a.id ?? ''),
    name    : String(a.name ?? ''),
    balance : Number(a.balance ?? 0),
    currency: String(a.currency ?? 'EUR'),
  }));

  const anomalies: Anomaly[] = (anomalyRows ?? []).map((r) => ({
    id      : String(r.id),
    type    : String(r.anomaly_type ?? ''),
    severity: (r.severity as 'info' | 'warning' | 'critical') ?? 'info',
    detail  : String(r.description ?? ''),
    status  : String(r.status ?? ''),
  }));

  const topContacts  = buildTopContacts(rawSales);
  const monthlyFlow  = buildMonthlyFlow(rawSales, rawPurchases);
  const aiSummary    = await generateAiSummary(kpis, anomalies, input.lang);

  const companyName  = companyRow?.nombre_comercial ?? companyRow?.razon_social ?? 'Mi empresa';
  const title        = input.lang === 'es'
    ? `Informe de estado de empresa — ${period}`
    : `Отчёт о состоянии компании — ${period}`;

  const reportData: ReportData = {
    period,
    generatedAt     : new Date().toISOString(),
    company         : { name: companyName, taxId: companyRow?.cif_nif ?? null },
    kpis,
    bankAccounts,
    topContacts,
    monthlyFlow,
    salesInvoices,
    purchaseInvoices,
    anomalies,
    aiSummary,
  };

  // ── Persist report ─────────────────────────────────────────────────────────
  const { data: inserted, error } = await admin
    .from('kia_financial_reports')
    .insert({
      client_id   : input.clientId,
      company_id  : input.companyId ?? null,
      report_type : 'empresa_status',
      period,
      title,
      ai_summary  : aiSummary,
      data        : reportData as unknown as Record<string, unknown>,
      generated_by: input.generatedBy,
    })
    .select('id')
    .single();

  if (error || !inserted) throw new Error(`Error storing report: ${error?.message}`);

  const reportUrl = absoluteAppUrl(`/dashboard/informes/${inserted.id}`);
  return { reportId: inserted.id, reportUrl, title, period };
}
