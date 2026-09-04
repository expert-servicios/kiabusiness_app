import { cookies } from 'next/headers';
import { KiaMetricsDashboard } from '@/components/admin/KiaMetricsDashboard';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function fetchMetrics() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/kia-metrics'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function KiaMetricsPage() {
  const data = await fetchMetrics();
  const summary = data?.summary;

  return (
    <div>
      {summary && (
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#8a9aab]">Actividad Kia — fuentes reales</p>
                <p className="mt-1 text-sm text-[#29384a]">Las métricas distinguen la ventana de 30 días del histórico para evitar mostrar ceros engañosos.</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800">Datos en vivo</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-xl bg-[#fbf8f2] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Interacciones registradas</p>
                <p className="mt-1 text-2xl font-bold text-[#07111d]">{summary.registeredInteractions ?? summary.totalDecisions ?? 0}</p>
                <p className="text-[10px] text-[#8a9aab]">últimos 30 días</p>
              </div>
              <div className="rounded-xl bg-[#fbf8f2] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Decisiones</p>
                <p className="mt-1 text-2xl font-bold text-[#07111d]">{summary.totalDecisions ?? 0}</p>
                <p className="text-[10px] text-[#8a9aab]">últimos 30 días</p>
              </div>
              <div className="rounded-xl bg-[#fbf8f2] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Decisiones históricas</p>
                <p className="mt-1 text-2xl font-bold text-[#07111d]">{summary.allTimeDecisions ?? 0}</p>
                <p className="text-[10px] text-[#8a9aab]">desde el inicio del registro</p>
              </div>
              <div className="rounded-xl bg-[#fbf8f2] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Sesiones históricas</p>
                <p className="mt-1 text-2xl font-bold text-[#07111d]">{summary.allTimeSessions ?? 0}</p>
                <p className="text-[10px] text-[#8a9aab]">kia_sessions</p>
              </div>
              <div className="rounded-xl bg-[#fbf8f2] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Health runs</p>
                <p className="mt-1 text-2xl font-bold text-[#07111d]">{summary.recentHealthRuns ?? 0}</p>
                <p className="text-[10px] text-[#8a9aab]">últimos 30 días</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <KiaMetricsDashboard initialData={data} />
    </div>
  );
}
