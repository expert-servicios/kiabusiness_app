'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Euro, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HoldedData {
  configured: boolean;
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  revenueByMonth: { month: string; label: string; revenue: number }[];
  statusCounts: Record<string, number>;
  statusAmounts: Record<string, number>;
  topClients: { name: string; amount: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pagada:   '#1fae4b',
  pendiente: '#D4A017',
  vencida:  '#ef4444',
  borrador: '#d1d5db'
};

const STATUS_LABELS: Record<string, string> = {
  pagada: 'Pagada', pendiente: 'Pendiente', vencida: 'Vencida', borrador: 'Borrador'
};

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function EuroTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-[#07111d]">{label}</p>
      <p className="text-[#c88b25]">€{fmt(payload[0].value)}</p>
    </div>
  );
}

function ClientTooltip({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-[#07111d]">{payload[0].name}</p>
      <p className="text-[#c88b25]">€{fmt(payload[0].value)}</p>
    </div>
  );
}

export function HoldedCharts({ data }: { data: HoldedData }) {
  if (!data.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Holded no está configurado</p>
            <p className="text-sm text-amber-700">Añade <code className="rounded bg-amber-100 px-1">HOLDED_API_KEY</code> en las variables de entorno para ver los datos de facturación.</p>
          </div>
        </div>
      </div>
    );
  }

  // Donut data — status breakdown by count
  const donutData = Object.entries(data.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] ?? status,
      value: count,
      color: STATUS_COLORS[status] ?? '#9ca3af',
      amount: data.statusAmounts[status] ?? 0
    }));

  const maxRevenue = Math.max(...data.revenueByMonth.map((r) => r.revenue), 1);
  const maxClient = Math.max(...data.topClients.map((c) => c.amount), 1);

  return (
    <div className="space-y-6">
      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-[#1fae4b]/10 p-2.5 text-[#1fae4b]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-[#29384a]">Total facturado</p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">€{fmt(data.totalInvoiced)}</p>
          <p className="mt-0.5 text-[10px] text-[#29384a]">{data.totalInvoices} facturas</p>
        </div>

        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex rounded-xl bg-[#1fae4b]/10 p-2.5 text-[#1fae4b]">
            <Euro className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-[#29384a]">Cobrado</p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">€{fmt(data.totalPaid)}</p>
          <p className="mt-0.5 text-[10px] text-[#1fae4b]">
            {data.totalInvoiced > 0 ? Math.round((data.totalPaid / data.totalInvoiced) * 100) : 0}% del total
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${data.outstanding > 0 ? 'border-amber-200 bg-amber-50' : 'border-[#d8cbb5] bg-white'}`}>
          <div className={`mb-2 inline-flex rounded-xl p-2.5 ${data.outstanding > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#07111d]/8 text-[#07111d]'}`}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-[#29384a]">Pendiente de cobro</p>
          <p className={`mt-1 font-serif text-2xl font-bold ${data.outstanding > 0 ? 'text-amber-800' : 'text-[#07111d]'}`}>
            €{fmt(data.outstanding)}
          </p>
          <p className="mt-0.5 text-[10px] text-[#29384a]">
            {(data.statusCounts.pendiente ?? 0) + (data.statusCounts.vencida ?? 0)} facturas
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${(data.statusCounts.vencida ?? 0) > 0 ? 'border-red-200 bg-red-50' : 'border-[#d8cbb5] bg-white'}`}>
          <div className={`mb-2 inline-flex rounded-xl p-2.5 ${(data.statusCounts.vencida ?? 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-[#07111d]/8 text-[#07111d]'}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-[#29384a]">Facturas vencidas</p>
          <p className={`mt-1 font-serif text-2xl font-bold ${(data.statusCounts.vencida ?? 0) > 0 ? 'text-red-700' : 'text-[#07111d]'}`}>
            {data.statusCounts.vencida ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] text-[#29384a]">
            €{fmt(data.statusAmounts.vencida ?? 0)} sin cobrar
          </p>
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Ingresos mensuales (bar) — takes 2 cols */}
        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6 lg:col-span-2">
          <h3 className="mb-5 font-serif text-base font-bold text-[#07111d]">
            Facturación cobrada por mes (12 meses)
          </h3>
          {data.revenueByMonth.every((r) => r.revenue === 0) ? (
            <p className="text-sm text-[#29384a]">Sin facturas pagadas en los últimos 12 meses.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `€${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  width={48}
                />
                <Tooltip content={<EuroTooltip />} cursor={{ fill: '#f8f4eb' }} />
                <Bar dataKey="revenue" fill="#D4A017" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estado facturas (donut) */}
        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6">
          <h3 className="mb-5 font-serif text-base font-bold text-[#07111d]">Estado de facturas</h3>
          {donutData.length === 0 ? (
            <p className="text-sm text-[#29384a]">Sin facturas todavía.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} facturas`]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #d8cbb5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {donutData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
                      <span className="text-[#29384a]">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-[#07111d]">{entry.value} · €{fmt(entry.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Top clients (horizontal bars) ────────────────────────────────── */}
      {data.topClients.length > 0 && (
        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6">
          <h3 className="mb-5 font-serif text-base font-bold text-[#07111d]">
            Top clientes por facturación
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, data.topClients.length * 34)}>
            <BarChart
              data={data.topClients}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `€${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 11, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ClientTooltip />} cursor={{ fill: '#f8f4eb' }} />
              <Bar dataKey="amount" fill="#07111d" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
