"use client";

const STATUS_BADGE: Record<string, string> = {
  rentable: "bg-emerald-100 text-emerald-800",
  ajustado: "bg-blue-100 text-blue-800",
  revisar_precio: "bg-amber-100 text-amber-800",
  perdida: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  rentable: "Rentable",
  ajustado: "Ajustado",
  revisar_precio: "Revisar precio",
  perdida: "Pérdida",
};

interface SnapshotRow {
  service_id: string;
  period: string;
  total_revenue_eur: number | null;
  total_minutes: number | null;
  total_cost_eur: number | null;
  margin_eur: number | null;
  margin_pct: number | null;
  margin_status: string | null;
  generated_at: string | null;
}

interface Props {
  snapshots: SnapshotRow[];
  period: string;
}

export function ProfitabilityTable({ snapshots, period }: Props) {
  if (snapshots.length === 0) {
    return (
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#29384a]">
          Sin datos para {period}
        </p>
        <p className="mt-1 text-xs text-[#29384a]/60">
          Registra eventos de rentabilidad o pulsa &quot;Recalcular&quot; para
          generar el snapshot.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white overflow-hidden">
      <div className="border-b border-[#d8cbb5] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">
          Por servicio
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0e9da] text-left">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Servicio
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Ingresos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Minutos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Coste
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Margen
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Margen %
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#29384a]/60">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((row) => {
              const marginPct = Number(row.margin_pct ?? 0);
              const marginEur = Number(row.margin_eur ?? 0);
              const status = row.margin_status ?? "revisar_precio";
              return (
                <tr
                  key={row.service_id}
                  className="border-b border-[#f8f4eb] hover:bg-[#faf8f3] transition"
                >
                  <td className="px-5 py-3 font-medium text-[#07111d]">
                    {row.service_id.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-right text-[#29384a]">
                    {Number(row.total_revenue_eur ?? 0).toLocaleString(
                      "es-ES",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}{" "}
                    €
                  </td>
                  <td className="px-4 py-3 text-right text-[#29384a]">
                    {Number(row.total_minutes ?? 0).toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-right text-[#29384a]">
                    {Number(row.total_cost_eur ?? 0).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${marginEur >= 0 ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {marginEur >= 0 ? "+" : ""}
                    {marginEur.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${marginPct >= 20 ? "text-emerald-700" : marginPct >= 0 ? "text-amber-700" : "text-red-700"}`}
                  >
                    {marginPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[status] ?? STATUS_BADGE.revisar_precio}`}
                    >
                      {STATUS_LABEL[status] ?? status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
