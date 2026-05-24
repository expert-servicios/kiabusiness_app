import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react';
import type { KiaHealthSummary } from '@/lib/ai/kia/health/kia-health-summary';
import { KiaHealthRunButton } from './KiaHealthRunButton';

export function KiaHealthOverview({ summary }: { summary: KiaHealthSummary }) {
  const statusConfig = {
    green: { label: 'Verde', icon: CheckCircle2, className: 'border-green-200 bg-green-50 text-green-800' },
    yellow: { label: 'Amarillo', icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800' },
    red: { label: 'Rojo', icon: AlertTriangle, className: 'border-red-200 bg-red-50 text-red-800' },
    unknown: { label: 'Sin datos', icon: CircleHelp, className: 'border-[#d8cbb5] bg-white text-[#29384a]' },
  }[summary.currentStatus];
  const Icon = statusConfig.icon;

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${statusConfig.className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Kia Health</p>
            <h1 className="mt-1 font-serif text-2xl font-bold">Estado {statusConfig.label}</h1>
            <p className="mt-1 text-sm opacity-80">{summary.lastRun?.summary ?? 'Todavía no hay ejecuciones registradas.'}</p>
          </div>
        </div>
        <KiaHealthRunButton />
      </div>
    </section>
  );
}
