import { createHoldedClient, type HoldedDocument } from '@/lib/integrations/holded/holded-client';

export interface MonthlySnapshot {
  month: string;
  sales: number;
  purchases: number;
}

export interface RecentInvoice {
  docNumber: string;
  date: number;
  total: number;
  contact: string;
  status?: string;
}

export interface QuarterSummary {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  salesTotal: number;
  purchasesTotal: number;
  vatRepercutido: number;
  vatSoportado: number;
  vatResult: number;
  salesCount: number;
  purchasesCount: number;
  recentSales: RecentInvoice[];
  recentPurchases: RecentInvoice[];
  monthlyData: MonthlySnapshot[];
  syncedAt: string;
}

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function quarterToUnix(year: number, quarter: number): { from: number; to: number } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end   = new Date(year, startMonth + 3, 0, 23, 59, 59);
  return { from: Math.floor(start.getTime() / 1000), to: Math.floor(end.getTime() / 1000) };
}

function extractVat(doc: HoldedDocument): number {
  const base = doc.items.reduce((s, item) => s + (item.subtotal ?? 0), 0);
  return Math.max(0, doc.total - base);
}

export async function fetchQuarterData(
  integrationId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4,
): Promise<QuarterSummary> {
  const { from, to } = quarterToUnix(year, quarter);
  const client = await createHoldedClient(integrationId);

  const [sales, purchases] = await Promise.all([
    client.listSalesInvoices({ dateFrom: from, dateTo: to }).catch((): HoldedDocument[] => []),
    client.listPurchaseInvoices({ dateFrom: from, dateTo: to }).catch((): HoldedDocument[] => []),
  ]);

  const salesTotal     = sales.reduce((s, d) => s + d.total, 0);
  const purchasesTotal = purchases.reduce((s, d) => s + d.total, 0);
  const vatRepercutido = sales.reduce((s, d) => s + extractVat(d), 0);
  const vatSoportado   = purchases.reduce((s, d) => s + extractVat(d), 0);

  const startMonth = (quarter - 1) * 3;
  const monthlyData: MonthlySnapshot[] = [0, 1, 2].map((offset) => {
    const mi    = startMonth + offset;
    const mFrom = new Date(year, mi, 1).getTime() / 1000;
    const mTo   = new Date(year, mi + 1, 0, 23, 59, 59).getTime() / 1000;
    return {
      month:     MONTH_LABELS[mi],
      sales:     sales.filter((d) => d.date >= mFrom && d.date <= mTo).reduce((s, d) => s + d.total, 0),
      purchases: purchases.filter((d) => d.date >= mFrom && d.date <= mTo).reduce((s, d) => s + d.total, 0),
    };
  });

  return {
    year, quarter,
    salesTotal, purchasesTotal, vatRepercutido, vatSoportado,
    vatResult: vatRepercutido - vatSoportado,
    salesCount: sales.length,
    purchasesCount: purchases.length,
    recentSales: sales.slice(0, 5).map((d) => ({
      docNumber: d.docNumber, date: d.date, total: d.total,
      contact: d.contact.name, status: d.status,
    })),
    recentPurchases: purchases.slice(0, 5).map((d) => ({
      docNumber: d.docNumber, date: d.date, total: d.total, contact: d.contact.name,
    })),
    monthlyData,
    syncedAt: new Date().toISOString(),
  };
}

export function currentQuarter(): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const now = new Date();
  return {
    year:    now.getFullYear(),
    quarter: Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4,
  };
}
