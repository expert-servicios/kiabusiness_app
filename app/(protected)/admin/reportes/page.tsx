import Link from 'next/link';
import { BarChart3, Mail, CreditCard, FileText, FolderOpen } from 'lucide-react';
import { CASE_STATE_LABELS } from '@/lib/utils/case-states';
import { HoldedCharts } from '@/components/admin/HoldedCharts';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

interface ReportData {
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  casesByState: Record<string, number>;
  quotesByStatus: Record<string, number>;
  emailStats: { total: number; delivered: number; bounced: number; failed: number };
  subsByPlan: Record<string, number>;
  activeSubs: number;
  paymentIssuesCount: number;
  clientMessagesAwaitingResponse: number;
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado', paid: 'Pagado'
};


async function getReports(): Promise<ReportData | null> {
  return fetchWithCookies('/api/admin/reports');
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-[#f8f4eb]">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function AdminReportesPage() {
  const [data, holdedData] = await Promise.all([
    getReports(),
    fetchWithCookies('/api/admin/holded-charts')
  ]);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8f4eb] py-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-[#29384a]">No se pudieron cargar los reportes.</p>
        </div>
      </main>
    );
  }

  const deliveryRate = data.emailStats.total > 0
    ? Math.round((data.emailStats.delivered / data.emailStats.total) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <BarChart3 className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Volver al panel</Link>
        </div>

        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Análisis del negocio</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Reportes</h1>
        </div>

        {/* ── HOLDED ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px flex-1 bg-[#d8cbb5]" />
            <span className="rounded-full border border-[#d8cbb5] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#29384a]">
              Holded — Facturación
            </span>
            <span className="h-px flex-1 bg-[#d8cbb5]" />
          </div>
          <HoldedCharts data={holdedData ?? { configured: false, invoices: [] }} />
        </div>

        {/* ── SUPABASE ───────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-[#d8cbb5]" />
          <span className="rounded-full border border-[#d8cbb5] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#29384a]">
            Operaciones internas
          </span>
          <span className="h-px flex-1 bg-[#d8cbb5]" />
        </div>

        {/* KPI row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Suscripciones activas', value: String(data.activeSubs), icon: <CreditCard className="h-5 w-5" />, color: 'text-[#c88b25] bg-[#c88b25]/10' },
            { label: 'Pagos con incidencia', value: String(data.paymentIssuesCount ?? 0), icon: <CreditCard className="h-5 w-5" />, color: 'text-red-600 bg-red-50' },
            { label: 'Mensajes sin responder', value: String(data.clientMessagesAwaitingResponse ?? 0), icon: <Mail className="h-5 w-5" />, color: 'text-amber-700 bg-amber-50' },
            { label: 'Tasa de entrega email', value: `${deliveryRate}%`, icon: <Mail className="h-5 w-5" />, color: 'text-[#07111d] bg-[#07111d]/10' }
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${kpi.color}`}>{kpi.icon}</div>
              <p className="text-xs font-semibold text-[#29384a]">{kpi.label}</p>
              <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Cases by state */}
          <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 font-serif text-lg font-bold text-[#07111d]">
              <FolderOpen className="h-4 w-4 text-[#d7a33a]" /> Expedientes por estado
            </h2>
            {Object.keys(data.casesByState).length === 0 ? (
              <p className="text-sm text-[#29384a]">Sin expedientes todavía.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.casesByState).map(([state, count]) => {
                  const total = Object.values(data.casesByState).reduce((a, b) => a + b, 0);
                  return (
                    <div key={state}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[#29384a]">{CASE_STATE_LABELS[state] ?? state}</span>
                        <span className="font-semibold text-[#07111d]">{count}</span>
                      </div>
                      <Bar value={count} max={total} color="bg-[#061321]" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quotes funnel */}
          <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 font-serif text-lg font-bold text-[#07111d]">
              <FileText className="h-4 w-4 text-[#d7a33a]" /> Embudo de presupuestos
            </h2>
            {Object.keys(data.quotesByStatus).length === 0 ? (
              <p className="text-sm text-[#29384a]">Sin presupuestos todavía.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.quotesByStatus).map(([status, count]) => {
                  const total = Object.values(data.quotesByStatus).reduce((a, b) => a + b, 0);
                  const colors: Record<string, string> = {
                    paid: 'bg-[#1fae4b]', accepted: 'bg-[#d7a33a]',
                    sent: 'bg-[#c88b25]', draft: 'bg-[#d8cbb5]', rejected: 'bg-red-300'
                  };
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[#29384a]">{QUOTE_STATUS_LABELS[status] ?? status}</span>
                        <span className="font-semibold text-[#07111d]">{count}</span>
                      </div>
                      <Bar value={count} max={total} color={colors[status] ?? 'bg-[#d7a33a]'} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email stats */}
          <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 font-serif text-lg font-bold text-[#07111d]">
              <Mail className="h-4 w-4 text-[#d7a33a]" /> Emails — últimos 500
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Enviados', value: data.emailStats.total, color: 'text-[#07111d]' },
                { label: 'Entregados', value: data.emailStats.delivered, color: 'text-[#1fae4b]' },
                { label: 'Rebotados', value: data.emailStats.bounced, color: 'text-[#c88b25]' },
                { label: 'Fallidos', value: data.emailStats.failed, color: 'text-red-600' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-[#f8f4eb] p-4">
                  <p className="text-xs text-[#29384a]">{stat.label}</p>
                  <p className={`mt-1 font-serif text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[#29384a]">Tasa de entrega</span>
                <span className="font-semibold text-[#07111d]">{deliveryRate}%</span>
              </div>
              <Bar value={deliveryRate} max={100} color="bg-[#1fae4b]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
