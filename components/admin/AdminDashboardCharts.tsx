'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface RevenuePoint { month: string; revenue: number }
interface CaseStateEntry { state: string; count: number; color: string }
interface QuoteFunnelEntry { label: string; count: number; color: string }

const STATE_COLORS: Record<string, string> = {
  nuevo: '#94a3b8',
  docs_pendientes: '#f59e0b',
  docs_recibidos: '#3b82f6',
  en_tramitacion: '#8b5cf6',
  pendiente_externo: '#06b6d4',
  resolucion_recibida: '#10b981',
  entregado: '#22c55e',
  finalizado: '#6b7280',
  pendiente_documentacion: '#f59e0b',
  en_revision: '#3b82f6',
  en_proceso: '#8b5cf6',
  presentado: '#22c55e'
};

const STATE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  docs_pendientes: 'Docs pendientes',
  docs_recibidos: 'Docs recibidos',
  en_tramitacion: 'En tramitación',
  pendiente_externo: 'Espera externa',
  resolucion_recibida: 'Resolución',
  entregado: 'Entregado',
  finalizado: 'Finalizado',
  pendiente_documentacion: 'Docs pendientes',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado'
};

function formatMonth(yyyyMM: string) {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

function formatEur(value: number) {
  return `€${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;
}

// ── Revenue bar chart ────────────────────────────────────────────────────────
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#9CA3AF]">
        Sin datos de ingresos aún
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, monthLabel: formatMonth(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8dfc9" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => [formatEur(Number(value)), 'Ingresos']}
          labelStyle={{ color: '#07111d', fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #d8cbb5', fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#c88b25" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Cases donut chart ─────────────────────────────────────────────────────────
export function CasesDonut({ casesByState }: { casesByState: Record<string, number> }) {
  const entries: CaseStateEntry[] = Object.entries(casesByState)
    .filter(([, count]) => count > 0)
    .map(([state, count]) => ({
      state,
      count,
      color: STATE_COLORS[state] ?? '#d1d5db'
    }));

  const total = entries.reduce((s, e) => s + e.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#9CA3AF]">
        Sin expedientes
      </div>
    );
  }

  const pieData = entries.map((e) => ({
    name: STATE_LABELS[e.state] ?? e.state,
    value: e.count,
    color: e.color
  }));

  return (
    <div className="flex flex-col items-center gap-2">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [Number(value), 'expedientes']}
            contentStyle={{ borderRadius: 8, border: '1px solid #d8cbb5', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {pieData.map((entry, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] text-[#29384a]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            {entry.name} ({entry.value})
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Quotes funnel ─────────────────────────────────────────────────────────────
export function QuotesFunnel({ quotesByStatus }: { quotesByStatus: Record<string, number> }) {
  const stages: QuoteFunnelEntry[] = [
    { label: 'Recibidas', count: quotesByStatus.draft ?? 0, color: '#94a3b8' },
    { label: 'Enviadas', count: quotesByStatus.sent ?? 0, color: '#f59e0b' },
    { label: 'Pagadas', count: quotesByStatus.paid ?? 0, color: '#22c55e' },
    { label: 'Canceladas', count: quotesByStatus.cancelled ?? 0, color: '#ef4444' }
  ].filter((s) => s.count > 0);

  if (stages.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[#9CA3AF]">
        Sin presupuestos
      </div>
    );
  }

  const max = Math.max(...stages.map((s) => s.count));

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#07111d]">{stage.label}</span>
            <span className="font-bold text-[#29384a]">{stage.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#f0e8d8]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${max > 0 ? (stage.count / max) * 100 : 0}%`,
                backgroundColor: stage.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Email delivery mini-bar ───────────────────────────────────────────────────
export function EmailDeliveryBar({
  total, delivered, bounced, failed
}: { total: number; delivered: number; bounced: number; failed: number }) {
  if (total === 0) return <p className="text-sm text-[#9CA3AF]">Sin emails registrados</p>;

  const deliveredPct = Math.round((delivered / total) * 100);
  const bouncedPct = Math.round((bounced / total) * 100);
  const failedPct = Math.round((failed / total) * 100);
  const pendingPct = 100 - deliveredPct - bouncedPct - failedPct;

  return (
    <div>
      <div className="mb-2 overflow-hidden rounded-full" style={{ height: 12, display: 'flex' }}>
        <div style={{ width: `${deliveredPct}%`, background: '#22c55e' }} />
        <div style={{ width: `${pendingPct}%`, background: '#e8dfc9' }} />
        <div style={{ width: `${bouncedPct}%`, background: '#f59e0b' }} />
        <div style={{ width: `${failedPct}%`, background: '#ef4444' }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#29384a]">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" />{deliveredPct}% entregados ({delivered})</span>
        {bouncedPct > 0 && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />{bouncedPct}% rebotados ({bounced})</span>}
        {failedPct > 0 && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />{failedPct}% fallidos ({failed})</span>}
      </div>
    </div>
  );
}
