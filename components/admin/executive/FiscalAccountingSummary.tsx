import Link from 'next/link';
import { KpiCard } from './KpiCard';
import type { FiscalMetrics } from '@/lib/admin/metrics/fiscal-metrics';

export function FiscalAccountingSummary({ data }: { data: FiscalMetrics }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Contable / Fiscal</p>
        <Link href="/admin/integraciones" className="text-xs text-[#29384a] hover:text-[#07111d] underline underline-offset-2">
          Ver integraciones →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="Clientes plan mensual" value={data.clientesPlanMensual} />
        <KpiCard label="Holded conectados" value={data.holdedConectados} />
        <KpiCard label="Holded con error" value={data.holdedConError} alert={data.holdedConError > 0} />
        <KpiCard label="Sin sync reciente (7d)" value={data.holdedSinSyncReciente} warn={data.holdedSinSyncReciente > 0} />
        <KpiCard label="Anomalías críticas" value={data.anomaliasCriticas} alert={data.anomaliasCriticas > 0} />
        <KpiCard label="Docs contables pendientes" value={data.documentosContablesPendientes} warn={data.documentosContablesPendientes > 0} />
      </div>
    </section>
  );
}
