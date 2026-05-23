import { Sparkles } from 'lucide-react';

interface KiaInsightsCardProps {
  insight: string | null;
}

export function KiaInsightsCard({ insight }: KiaInsightsCardProps) {
  if (!insight) return null;

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#c88b25]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Resumen de Kia</p>
      </div>
      <p className="text-sm leading-relaxed text-[#29384a]">{insight}</p>
    </div>
  );
}
