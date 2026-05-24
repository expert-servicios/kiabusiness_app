import type { KiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';

export function KiaProviderStatus({ summary }: { summary: KiaHealthSummary }) {
  return (
    <section className="rounded-xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Proveedor</p>
      <h2 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Router IA</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[#29384a]">Proveedor</dt>
          <dd className="font-semibold text-[#07111d]">{summary.providerStatus.provider ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#29384a]">Modelo</dt>
          <dd className="text-right font-semibold text-[#07111d]">{summary.providerStatus.model ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#29384a]">Fallback rate</dt>
          <dd className="font-semibold text-[#07111d]">
            {summary.providerStatus.fallbackRate === null ? '—' : `${Math.round(summary.providerStatus.fallbackRate * 100)}%`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
