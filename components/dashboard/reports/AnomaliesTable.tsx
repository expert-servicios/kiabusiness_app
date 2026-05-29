'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Anomaly } from '@/lib/reports/report-generator';

const SEV_CONFIG = {
  critical: { icon: AlertCircle,   color: 'text-red-600',  bg: 'bg-red-50',  border: 'border-red-200', label: 'Crítica' },
  warning : { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Aviso' },
  info    : { icon: Info,          color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200',  label: 'Info' },
};

interface Props { anomalies: Anomaly[] }

export function AnomaliesTable({ anomalies }: Props) {
  if (!anomalies.length) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        No se detectaron anomalías contables en este periodo. ✓
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {anomalies.map((a) => {
        const cfg  = SEV_CONFIG[a.severity] ?? SEV_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <li
            key={a.id}
            className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] text-[#a89880]">{a.type}</span>
              </div>
              <p className="mt-0.5 text-sm text-[#3d3528]">{a.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
