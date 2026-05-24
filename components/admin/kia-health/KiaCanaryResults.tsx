import type { KiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';

export function KiaCanaryResults({ failures }: { failures: KiaHealthSummary['recentFailures'] }) {
  return (
    <section className="rounded-xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Canarios</p>
          <h2 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Fallos recientes</h2>
        </div>
        <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-xs font-semibold text-[#29384a]">{failures.length}</span>
      </div>
      <div className="mt-4 divide-y divide-[#f0e8d8]">
        {failures.length === 0 ? (
          <p className="py-4 text-sm text-[#29384a]">Sin fallos o warnings recientes.</p>
        ) : failures.slice(0, 8).map((failure) => (
          <div key={failure.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#07111d]">{failure.checkId}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                failure.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {failure.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#29384a]">{failure.error ?? 'Sin detalle'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
