import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface Props {
  avgScore:      number;
  totalReviews:  number;
  criticalFails: number;
}

export function KiaAuditorOverview({ avgScore, totalReviews, criticalFails }: Props) {
  const status = criticalFails > 0 ? 'fail' : avgScore >= 80 ? 'pass' : 'warning';
  const Icon   = status === 'pass' ? CheckCircle2 : status === 'fail' ? XCircle : AlertTriangle;
  const color  = status === 'pass' ? 'text-emerald-600' : status === 'fail' ? 'text-red-600' : 'text-amber-600';
  const bg     = status === 'pass' ? 'bg-emerald-50 border-emerald-200' : status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const label  = status === 'pass' ? 'Todo correcto' : status === 'fail' ? 'Fallos críticos detectados' : 'Advertencias activas';

  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className={`text-sm font-bold ${color}`}>{label}</p>
          <p className="text-xs text-[#29384a]">
            Score medio: <strong>{avgScore}/100</strong> · {totalReviews} revisiones (7 días) · {criticalFails} fallos críticos
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-white/60 px-3 py-1">
          <Activity className="h-3.5 w-3.5 text-[#c88b25]" />
          <span className="text-xs font-bold text-[#07111d]">{avgScore}/100</span>
        </div>
      </div>
    </div>
  );
}
