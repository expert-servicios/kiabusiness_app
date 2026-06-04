'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Brain, DollarSign, ThumbsUp, MessageSquare, RefreshCw, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface DailyStat {
  date: string;
  decisions: number;
  cost: number;
  positiveRatings: number;
  negativeRatings: number;
}

interface TaskTypeStat { name: string; count: number; }
interface ModelStat { name: string; count: number; }

interface KiaMetricsSummary {
  totalDecisions: number;
  totalCostUsd: number;
  avgConfidence: number;
  manualReviewRate: number;
  avgLoopIterations: number;
  satisfactionRate: number | null;
  feedbackTotal: number;
  memoriesTotal: number;
}

interface KiaMetricsData {
  summary: KiaMetricsSummary;
  daily: DailyStat[];
  taskTypes: TaskTypeStat[];
  models: ModelStat[];
}

const COLORS = ['#c88b25', '#29384a', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

const TASK_TYPE_LABELS: Record<string, string> = {
  waba_reply: 'WABA Reply',
  admin_ai_compose: 'Admin Compose',
  viability_reasoning: 'Viabilidad',
  readiness_reasoning: 'Readiness',
  checkout_decision: 'Checkout',
  document_classification: 'Documentos',
  company_status_summary: 'Estado empresa',
  accounting_anomaly_review: 'Anomalías',
  next_best_action: 'Next Best Action',
  lead_client_decision: 'Lead/Cliente',
  document_extraction: 'Extracción doc.',
};

const MODEL_LABELS: Record<string, string> = {
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
  'claude-haiku-4-5': 'Haiku 4.5',
  'gpt-4o': 'GPT-4o',
  'unknown': 'Desconocido',
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-[#c88b25]' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8dcc8] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#29384a]/60">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-[#29384a]/50">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2 ${color === 'text-[#c88b25]' ? 'bg-[#fdf6ec]' : 'bg-[#f0f9ff]'}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export function KiaMetricsDashboard({ initialData }: { initialData: KiaMetricsData | null }) {
  const [data, setData] = useState<KiaMetricsData | null>(initialData);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kia-metrics', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-[#29384a]/50">
        <div className="text-center">
          <Brain className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>No hay datos disponibles</p>
          <button onClick={refresh} className="mt-3 text-sm text-[#c88b25] hover:underline">Reintentar</button>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const satisfactionPct = s.satisfactionRate !== null ? `${Math.round(s.satisfactionRate * 100)}%` : 'Sin datos';
  const confidencePct = `${Math.round(s.avgConfidence * 100)}%`;
  const reviewPct = `${Math.round(s.manualReviewRate * 100)}%`;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#07111d]">Kia AI — Métricas</h1>
          <p className="text-sm text-[#29384a]/60">Últimos 30 días</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-[#29384a] shadow-sm hover:bg-[#fdf6ec] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={MessageSquare} label="Decisiones totales" value={s.totalDecisions.toLocaleString('es')} sub="últimos 30 días" />
        <StatCard icon={DollarSign} label="Coste total" value={`$${s.totalCostUsd.toFixed(4)}`} sub="USD estimado" />
        <StatCard icon={Brain} label="Confianza media" value={confidencePct} sub={`Rev. manual: ${reviewPct}`} color={s.avgConfidence >= 0.7 ? 'text-emerald-600' : 'text-amber-600'} />
        <StatCard
          icon={ThumbsUp}
          label="Satisfacción"
          value={satisfactionPct}
          sub={`${s.feedbackTotal} valoraciones`}
          color={s.satisfactionRate !== null && s.satisfactionRate >= 0.7 ? 'text-emerald-600' : 'text-[#c88b25]'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Zap} label="Iteraciones medias" value={s.avgLoopIterations.toFixed(2)} sub="por decisión (tool loop)" color="text-[#29384a]" />
        <StatCard icon={Database} label="Memorias RAG" value={s.memoriesTotal.toLocaleString('es')} sub="almacenadas (total)" color="text-[#29384a]" />
        <StatCard icon={CheckCircle} label="Sin revisión manual" value={`${Math.round((1 - s.manualReviewRate) * 100)}%`} sub="automatizadas" color="text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Revisión manual" value={reviewPct} sub="requieren humano" color={s.manualReviewRate > 0.1 ? 'text-red-500' : 'text-[#29384a]'} />
      </div>

      {/* Daily decisions + cost chart */}
      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#07111d]">Decisiones y coste diario (últimos 14 días)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e9d8" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(val, name) => name === 'cost' ? [`$${Number(val).toFixed(4)}`, 'Coste USD'] : [val, 'Decisiones']} labelFormatter={(l) => `Día: ${l}`} />
            <Legend formatter={(v) => v === 'decisions' ? 'Decisiones' : 'Coste USD'} />
            <Line yAxisId="left" type="monotone" dataKey="decisions" stroke="#c88b25" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#29384a" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Task type distribution */}
        <div className="rounded-2xl border border-[#e8dcc8] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#07111d]">Distribución por tipo de tarea</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.taskTypes.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9d8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} tickFormatter={(v) => TASK_TYPE_LABELS[v] ?? v} />
              <Tooltip formatter={(v) => [v, 'Decisiones']} labelFormatter={(l) => TASK_TYPE_LABELS[l] ?? l} />
              <Bar dataKey="count" fill="#c88b25" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model distribution */}
        <div className="rounded-2xl border border-[#e8dcc8] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#07111d]">Distribución por modelo</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.models} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${MODEL_LABELS[name] ?? name} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false} fontSize={10}>
                {data.models.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, MODEL_LABELS[String(n)] ?? n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback ratings chart */}
      {data.daily.some((d) => d.positiveRatings + d.negativeRatings > 0) && (
        <div className="rounded-2xl border border-[#e8dcc8] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#07111d]">Valoraciones diarias</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9d8" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={(l) => `Día: ${l}`} formatter={(v, n) => [v, n === 'positiveRatings' ? 'Positivas' : 'Negativas']} />
              <Legend formatter={(v) => v === 'positiveRatings' ? 'Positivas' : 'Negativas'} />
              <Bar dataKey="positiveRatings" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="negativeRatings" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
