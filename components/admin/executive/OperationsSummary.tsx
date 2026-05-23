import Link from 'next/link';
import { KpiCard } from './KpiCard';
import type { OperationalMetrics } from '@/lib/admin/metrics/operational-metrics';

export function OperationsSummary({ data }: { data: OperationalMetrics }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Operativo</p>
        <Link href="/admin/expedientes" className="text-xs text-[#29384a] hover:text-[#07111d] underline underline-offset-2">
          Ver expedientes →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="Nuevos" value={data.casesNuevo} warn={data.casesNuevo > 0} />
        <KpiCard label="Pendiente cliente" value={data.casesPendienteCliente} />
        <KpiCard label="En revisión" value={data.casesEnRevision} />
        <KpiCard label="Listo para presentar" value={data.casesListoParaPresentar} warn={data.casesListoParaPresentar > 0} sub="Acción requerida" />
        <KpiCard label="Bloqueados" value={data.casesBloqueados} alert={data.casesBloqueados > 0} />
        <KpiCard label="Presentados (mes)" value={data.casesPresentadosMes} />
        <KpiCard label="Finalizados (mes)" value={data.casesFinalizadosMes} />
        <KpiCard label="Tareas vencidas" value={data.tareasVencidas} alert={data.tareasVencidas > 0} />
        <KpiCard label="Tareas próximos 7d" value={data.tareasProximas7d} warn={data.tareasProximas7d > 3} />
        <KpiCard label="Docs pendientes" value={data.documentosPendientes} warn={data.documentosPendientes > 0} />
      </div>
    </section>
  );
}
