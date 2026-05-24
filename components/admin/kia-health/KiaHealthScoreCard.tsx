import type { LucideIcon } from 'lucide-react';

export function KiaHealthScoreCard({
  title,
  score,
  subtitle,
  icon: Icon,
}: {
  title: string;
  score: number | null;
  subtitle?: string;
  icon: LucideIcon;
}) {
  const pct = score === null ? null : Math.round(score * 100);
  const color = pct === null ? 'text-[#29384a]' : pct >= 95 ? 'text-green-600' : pct >= 85 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="rounded-xl border border-[#d8cbb5] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-lg bg-[#c88b25]/10 p-2 text-[#c88b25]">
          <Icon className="h-4 w-4" />
        </div>
        <p className={`font-serif text-2xl font-bold tabular-nums ${color}`}>
          {pct === null ? '—' : `${pct}%`}
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#07111d]">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-[#29384a]">{subtitle}</p> : null}
    </div>
  );
}
