'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Rule = { id: string; label: string; description: string; status: 'ok' | 'alert'; count: number };
type Issue = {
  id: string;
  rule: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence: { label: string; value: string; href?: string }[];
};
type Payload = {
  generatedAt: string;
  summary: { total: number; critical: number; high: number; medium: number; low: number; checks: number; checksOk: number };
  rules: Rule[];
  issues: Issue[];
  warnings: string[];
};

const severityLabel: Record<Severity, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export default function AdminDataQualityPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Severity>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/data-quality', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar Calidad de Datos');
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleIssues = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data.issues : data.issues.filter((issue) => issue.severity === filter);
  }, [data, filter]);

  if (loading && !data) return <div className="p-6">Cargando controles de calidad…</div>;
  if (error && !data) return <div className="p-6 text-red-700">{error}</div>;
  if (!data) return null;

  const cards = [
    ['all', 'Alertas', data.summary.total],
    ['critical', 'Críticas', data.summary.critical],
    ['high', 'Altas', data.summary.high],
    ['medium', 'Medias', data.summary.medium],
    ['low', 'Bajas', data.summary.low],
  ] as const;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calidad de Datos</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Controles de coherencia entre clientes, entidades, Stripe y la cadena comercial. Esta pantalla es de revisión: no fusiona, borra ni corrige históricos automáticamente.
          </p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
          {loading ? 'Actualizando…' : 'Actualizar controles'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([key, label, value]) => (
          <button key={key} onClick={() => setFilter(key)} className={`rounded-xl border p-4 text-left ${filter === key ? 'border-gray-900' : 'border-gray-200'}`}>
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Cobertura de controles</h2>
            <p className="text-sm text-gray-600">{data.summary.checksOk} de {data.summary.checks} controles sin incidencias.</p>
          </div>
          <Link href="/admin/operaciones" className="text-sm font-medium underline">Ir a Bandeja operativa</Link>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {data.rules.map((rule) => (
            <div key={rule.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{rule.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${rule.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
                  {rule.status === 'ok' ? 'OK' : `${rule.count} alerta${rule.count === 1 ? '' : 's'}`}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">Cobertura parcial</div>
          <ul className="mt-2 list-disc pl-5">{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      )}

      <div className="space-y-3">
        {visibleIssues.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">No hay incidencias en este filtro.</div>
        ) : visibleIssues.map((issue) => (
          <article key={issue.id} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-xs font-medium">{severityLabel[issue.severity]}</span>
                  <span className="text-xs text-gray-500">{issue.rule}</span>
                </div>
                <h3 className="mt-2 font-semibold">{issue.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{issue.detail}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {issue.evidence.map((item, index) => (
                <div key={`${issue.id}-${index}`} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="mt-1 break-all font-medium">{item.value}</div>
                  {item.href && <Link className="mt-2 inline-block text-xs underline" href={item.href}>Revisar →</Link>}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="text-xs text-gray-500">Última comprobación: {new Date(data.generatedAt).toLocaleString('es-ES')}</div>
    </div>
  );
}
