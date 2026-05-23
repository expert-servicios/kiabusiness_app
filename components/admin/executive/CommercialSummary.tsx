import Link from 'next/link';
import { KpiCard } from './KpiCard';
import type { CommercialMetrics } from '@/lib/admin/metrics/commercial-metrics';

export function CommercialSummary({ data }: { data: CommercialMetrics }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Comercial</p>
        <Link href="/admin/clientes" className="text-xs text-[#29384a] hover:text-[#07111d] underline underline-offset-2">
          Ver clientes →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="Leads nuevos (7d)" value={data.leadsNuevos7d} />
        <KpiCard label="Leads calientes" value={data.leadsCalientes} warn={data.leadsCalientes > 5} />
        <KpiCard label="Servicios esta semana" value={data.serviciosContratadosSemana} />
        <KpiCard label="Servicios este mes" value={data.serviciosContratadosMes} />
        <KpiCard
          label="Checkouts pendientes"
          value={data.checkoutsPendientes}
          warn={data.checkoutsPendientes > 0}
        />
        <KpiCard
          label="Abandonados > 24h"
          value={data.checkoutsAbandonados24h}
          alert={data.checkoutsAbandonados24h > 0}
          sub="Requieren seguimiento"
        />
      </div>
    </section>
  );
}
