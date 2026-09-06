'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileText, RefreshCw, ShieldAlert } from 'lucide-react';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type QueueItem = {
  id: string;
  kind: string;
  severity: Severity;
  title: string;
  detail: string;
  href: string;
  clientId: string | null;
  clientName: string | null;
  companyId: string | null;
  companyName: string | null;
  caseId: string | null;
  createdAt: string | null;
  dueDate: string | null;
};
type Payload = {
  generatedAt: string;
  thresholds: { staleCheckoutHours: number; entityScopeCutoff: string };
  summary: { total: number; critical: number; high: number; medium: number; low: number; byKind: Record<string, number> };
  items: QueueItem[];
  warnings: string[];
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

function tone(severity: Severity) {
  if (severity === 'critical') return 'border-red-300 bg-red-50 text-red-800';
  if (severity === 'high') return 'border-orange-200 bg-orange-50 text-orange-800';
  if (severity === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString('es-ES');
}

export default function AdminOperationsInboxPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | Severity>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/operations-inbox', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar la bandeja operativa');
      setData(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data.items : data.items.filter((item) => item.severity === filter);
  }, [data, filter]);

  if (loading && !data) {
    return <main className="min-h-screen bg-[#f8f4eb] p-10 text-center text-sm text-[#6b7280]"><RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin" />Cargando bandeja operativa…</main>;
  }

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-7 text-[#07111d]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Panel Admin · Control operativo</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Bandeja operativa</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#52606d]">Incidencias que requieren revisión humana. Esta vista no cierra checkouts, no reasigna entidades, no corrige pedidos y no modifica históricos.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold">Actualizar <RefreshCw className={`ml-1 inline h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {data?.warnings.length ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><AlertTriangle className="mr-1 inline h-4 w-4" />Algunas fuentes no pudieron leerse: {data.warnings.join(' · ')}</div> : null}

        {data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {([
                ['all', 'Total', data.summary.total],
                ['critical', 'Críticas', data.summary.critical],
                ['high', 'Altas', data.summary.high],
                ['medium', 'Medias', data.summary.medium],
                ['low', 'Bajas', data.summary.low],
              ] as const).map(([key, label, count]) => (
                <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-2xl border p-4 text-left transition ${filter === key ? 'border-[#c88b25] bg-[#fffaf0]' : 'border-[#d8cbb5] bg-white hover:border-[#c88b25]/60'}`}>
                  <p className="text-xs text-[#6b7280]">{label}</p>
                  <p className="mt-1 font-serif text-3xl font-bold">{count}</p>
                </button>
              ))}
            </section>

            <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold">Pendientes</h2>
                  <p className="mt-1 text-xs text-[#6b7280]">Checkout abandonado: más de {data.thresholds.staleCheckoutHours} h abierto. Calidad de datos: solo flujos nuevos posteriores al alcance por entidad.</p>
                </div>
                <p className="text-[11px] text-[#8a9aab]">Actualizado {formatDate(data.generatedAt)}</p>
              </div>

              <div className="mt-4 space-y-3">
                {visible.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-5 w-5" />No hay incidencias en este filtro.</div>
                ) : visible.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-xl border border-[#eee6d8] p-4 transition hover:border-[#c88b25] hover:bg-[#fffdf8]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.severity === 'critical' ? <ShieldAlert className="h-4 w-4 text-red-700" /> : item.kind === 'document' ? <FileText className="h-4 w-4 text-[#c88b25]" /> : <Clock3 className="h-4 w-4 text-[#c88b25]" />}
                          <p className="font-semibold">{item.title}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone(item.severity)}`}>{SEVERITY_LABELS[item.severity]}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{item.kind}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#52606d]">{item.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8a9aab]">
                          {item.clientName && <span>Cliente: {item.clientName}</span>}
                          {item.companyName && <span>Entidad: {item.companyName}</span>}
                          {item.dueDate && <span>Vence: {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('es-ES')}</span>}
                          {!item.dueDate && item.createdAt && <span>Desde: {formatDate(item.createdAt)}</span>}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[#c88b25]">Revisar →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
