import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const HOLDED_BASE = 'https://api.holded.com/api/invoicing/v1';

// Holded invoice status codes
// 0 = draft, 1 = pending/sent, 2 = paid, 4 = overdue
const STATUS_LABEL: Record<number, string> = {
  0: 'borrador',
  1: 'pendiente',
  2: 'pagada',
  4: 'vencida'
};

interface HoldedInvoice {
  id: string;
  date: number;         // unix timestamp (seconds)
  status: number;
  total?: number;
  subtotal?: number;
  totalWithTaxes?: number;
  contact?: { id?: string; name?: string };
  contactName?: string;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`;
}

async function fetchHoldedInvoices(): Promise<HoldedInvoice[]> {
  const apiKey = process.env.HOLDED_API_KEY;
  if (!apiKey) return [];

  const headers = { key: apiKey, 'Content-Type': 'application/json' };
  const allInvoices: HoldedInvoice[] = [];

  // Fetch up to 3 pages (Holded returns ~20-50 per page)
  for (let page = 1; page <= 3; page++) {
    try {
      const res = await fetch(`${HOLDED_BASE}/documents/invoice?page=${page}`, {
        headers,
        next: { revalidate: 900 } // cache 15 min
      });
      if (!res.ok) break;

      const data: unknown = await res.json();
      const items: HoldedInvoice[] = Array.isArray(data)
        ? (data as HoldedInvoice[])
        : ((data as { data?: HoldedInvoice[] }).data ?? []);

      if (items.length === 0) break;
      allInvoices.push(...items);
      if (items.length < 20) break; // last page
    } catch {
      break;
    }
  }

  return allInvoices;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await getSupabaseAdmin()
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const configured = Boolean(process.env.HOLDED_API_KEY);
    if (!configured) {
      return NextResponse.json({ configured: false, invoices: [] });
    }

    const invoices = await fetchHoldedInvoices();

    // ── Monthly revenue (last 12 months, paid invoices) ──────────────────────
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffTs = Math.floor(cutoff.getTime() / 1000);

    const monthlyMap: Record<string, number> = {};
    // Pre-fill last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = 0;
    }

    for (const inv of invoices) {
      if (inv.status !== 2) continue; // only paid
      if (inv.date < cutoffTs) continue;
      const d = new Date(inv.date * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyMap) {
        const amount = inv.totalWithTaxes ?? inv.total ?? inv.subtotal ?? 0;
        monthlyMap[key] += amount;
      }
    }

    const revenueByMonth = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month,
        label: formatMonthLabel(month),
        revenue: Math.round(revenue * 100) / 100
      }));

    // ── Invoice status breakdown (all time) ──────────────────────────────────
    const statusCounts: Record<string, number> = { borrador: 0, pendiente: 0, pagada: 0, vencida: 0 };
    const statusAmounts: Record<string, number> = { borrador: 0, pendiente: 0, pagada: 0, vencida: 0 };

    for (const inv of invoices) {
      const label = STATUS_LABEL[inv.status] ?? 'otro';
      if (!(label in statusCounts)) continue;
      statusCounts[label]++;
      statusAmounts[label] += inv.totalWithTaxes ?? inv.total ?? inv.subtotal ?? 0;
    }

    // ── Outstanding receivables ───────────────────────────────────────────────
    const outstanding = Math.round((statusAmounts.pendiente + statusAmounts.vencida) * 100) / 100;
    const totalInvoiced = Math.round(
      Object.values(statusAmounts).reduce((a, b) => a + b, 0) * 100
    ) / 100;
    const totalPaid = Math.round(statusAmounts.pagada * 100) / 100;

    // ── Top clients by invoiced amount (paid + pending) ─────────────────────
    const clientMap: Record<string, number> = {};
    for (const inv of invoices) {
      if (inv.status === 0) continue; // skip drafts
      const name = inv.contact?.name ?? inv.contactName ?? 'Desconocido';
      const amount = inv.totalWithTaxes ?? inv.total ?? inv.subtotal ?? 0;
      clientMap[name] = (clientMap[name] ?? 0) + amount;
    }

    const topClients = Object.entries(clientMap)
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return NextResponse.json({
      configured: true,
      totalInvoices: invoices.length,
      totalInvoiced,
      totalPaid,
      outstanding,
      revenueByMonth,
      statusCounts,
      statusAmounts,
      topClients
    });
  } catch (error) {
    console.error('[holded-charts]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
