import type { KiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';

export function KiaCostLatencyChart({ summary }: { summary: KiaHealthSummary }) {
  const latencyPct = summary.latency.avgMs ? Math.min(100, Math.round((summary.latency.avgMs / 10000) * 100)) : 0;
  return (
    <section className="rounded-xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Coste y latencia</p>
      <h2 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Última ventana</h2>
      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-[#29384a]">
            <span>Latencia media</span>
            <span>{summary.latency.avgMs === null ? '—' : `${summary.latency.avgMs}ms`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f0e8d8]">
            <div className="h-full rounded-full bg-[#c88b25]" style={{ width: `${latencyPct}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f8f4eb] p-3">
            <p className="text-[11px] uppercase tracking-widest text-[#29384a]">P95</p>
            <p className="mt-1 font-serif text-xl font-bold text-[#07111d]">{summary.latency.p95Ms === null ? '—' : `${summary.latency.p95Ms}ms`}</p>
          </div>
          <div className="rounded-lg bg-[#f8f4eb] p-3">
            <p className="text-[11px] uppercase tracking-widest text-[#29384a]">Coste est.</p>
            <p className="mt-1 font-serif text-xl font-bold text-[#07111d]">{summary.cost.estimatedLastRun === null ? '—' : `€${summary.cost.estimatedLastRun}`}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
