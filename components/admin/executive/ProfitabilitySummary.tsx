import type { ProfitabilityRow } from '@/lib/admin/metrics/profitability-metrics';

const STATUS_STYLES: Record<string, string> = {
  rentable:      'bg-emerald-100 text-emerald-800',
  ajustado:      'bg-amber-100 text-amber-800',
  no_rentable:   'bg-red-100 text-red-800',
  revisar_precio:'bg-orange-100 text-orange-800',
};
const STATUS_LABELS: Record<string, string> = {
  rentable:      'Rentable',
  ajustado:      'Ajustado',
  no_rentable:   'No rentable',
  revisar_precio:'Revisar precio',
};

function fmt(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function ProfitabilitySummary({ data }: { data: ProfitabilityRow[] }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Rentabilidad por servicio</p>
      {data.length === 0 ? (
        <p className="text-sm text-[#29384a]">Sin datos de rentabilidad aún. Se generan al finalizar expedientes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#d8cbb5] text-left text-[#29384a]">
                <th className="pb-2 font-semibold">Servicio</th>
                <th className="pb-2 font-semibold text-right">Ingresos</th>
                <th className="pb-2 font-semibold text-right">Mins.</th>
                <th className="pb-2 font-semibold text-right">Margen</th>
                <th className="pb-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e9da]">
              {data.map((row) => (
                <tr key={`${row.serviceId}-${row.period}`}>
                  <td className="py-2 font-medium text-[#07111d]">{row.serviceId}</td>
                  <td className="py-2 text-right text-[#07111d]">{fmt(row.revenueEur)}</td>
                  <td className="py-2 text-right text-[#29384a]">{row.totalMinutes}</td>
                  <td className="py-2 text-right font-semibold text-[#07111d]">
                    {row.marginPct.toFixed(0)}%
                  </td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[row.marginStatus] ?? STATUS_STYLES.revisar_precio}`}>
                      {STATUS_LABELS[row.marginStatus] ?? row.marginStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
