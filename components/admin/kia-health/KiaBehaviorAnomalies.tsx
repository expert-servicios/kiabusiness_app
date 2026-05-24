'use client';

import { useRouter } from 'next/navigation';
import type { KiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';

export function KiaBehaviorAnomalies({ anomalies }: { anomalies: KiaHealthSummary['openAnomalies'] }) {
  const router = useRouter();

  const ack = async (id: string) => {
    await fetch(`/api/admin/kia/health/anomalies/${id}/ack`, { method: 'POST' });
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Anomalías</p>
      <h2 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Abiertas</h2>
      <div className="mt-4 space-y-3">
        {anomalies.length === 0 ? (
          <p className="text-sm text-[#29384a]">No hay anomalías abiertas.</p>
        ) : anomalies.map((anomaly) => (
          <div key={anomaly.id} className="rounded-lg border border-[#f0e8d8] bg-[#f8f4eb] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  anomaly.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  anomaly.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {anomaly.severity}
                </span>
                <p className="mt-2 text-sm font-semibold text-[#07111d]">{anomaly.title}</p>
                <p className="mt-1 text-xs text-[#29384a]">{anomaly.description}</p>
              </div>
              <button
                type="button"
                onClick={() => ack(anomaly.id)}
                className="shrink-0 rounded-md border border-[#d8cbb5] bg-white px-2 py-1 text-[11px] font-semibold text-[#29384a] hover:border-[#c88b25]"
              >
                Ack
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
