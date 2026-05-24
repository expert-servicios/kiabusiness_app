import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Finding {
  ruleId:      string;
  severity:    'info' | 'warning' | 'critical';
  explanation: string;
}

const ICON_MAP = { critical: AlertTriangle, warning: AlertCircle, info: Info };
const COLOR_MAP = {
  critical: 'text-red-600',
  warning:  'text-amber-600',
  info:     'text-blue-600',
};
const BG_MAP = {
  critical: 'border-red-200 bg-red-50',
  warning:  'border-amber-200 bg-amber-50',
  info:     'border-blue-100 bg-blue-50',
};

export function KiaAuditorFindingCard({ finding }: { finding: Finding }) {
  const Icon  = ICON_MAP[finding.severity];
  return (
    <div className={`rounded-xl border p-3 ${BG_MAP[finding.severity]}`}>
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${COLOR_MAP[finding.severity]}`} />
        <div>
          <p className="text-xs font-bold text-[#07111d]">{finding.ruleId}</p>
          <p className="mt-0.5 text-xs text-[#29384a]">{finding.explanation}</p>
        </div>
      </div>
    </div>
  );
}
