import type { KiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';

export function KiaRunHistory({ lastRun }: { lastRun: KiaHealthSummary['lastRun'] }) {
  return (
    <section className="rounded-xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Histórico</p>
      <h2 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Última ejecución</h2>
      {lastRun ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#29384a]">Tipo</dt>
            <dd className="font-semibold text-[#07111d]">{lastRun.runType}</dd>
          </div>
          <div>
            <dt className="text-[#29384a]">Estado</dt>
            <dd className="font-semibold text-[#07111d]">{lastRun.status}</dd>
          </div>
          <div>
            <dt className="text-[#29384a]">Checks</dt>
            <dd className="font-semibold text-[#07111d]">{lastRun.passedChecks}/{lastRun.totalChecks} OK</dd>
          </div>
          <div>
            <dt className="text-[#29384a]">Fecha</dt>
            <dd className="font-semibold text-[#07111d]">{new Date(lastRun.startedAt).toLocaleString('es-ES')}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-[#29384a]">Sin runs todavía.</p>
      )}
    </section>
  );
}
