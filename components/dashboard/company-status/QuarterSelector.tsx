'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuarterSelectorProps {
  currentYear: number;
  currentQuarter: 1 | 2 | 3 | 4;
}

const QUARTER_LABELS = ['T1 Ene–Mar', 'T2 Abr–Jun', 'T3 Jul–Sep', 'T4 Oct–Dic'];

export function QuarterSelector({ currentYear, currentQuarter }: QuarterSelectorProps) {
  const router  = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const maxYear    = now.getFullYear();
  const maxQuarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;

  function navigate(year: number, quarter: 1 | 2 | 3 | 4) {
    router.push(`${pathname}?year=${year}&quarter=${quarter}`);
  }

  function prev() {
    if (currentQuarter === 1) navigate(currentYear - 1, 4);
    else navigate(currentYear, (currentQuarter - 1) as 1 | 2 | 3 | 4);
  }

  function next() {
    if (currentYear > maxYear) return;
    if (currentYear === maxYear && currentQuarter >= maxQuarter) return;
    if (currentQuarter === 4) navigate(currentYear + 1, 1);
    else navigate(currentYear, (currentQuarter + 1) as 1 | 2 | 3 | 4);
  }

  const isLatest = currentYear === maxYear && currentQuarter === maxQuarter;
  const isOldest = currentYear <= maxYear - 1 && currentQuarter === 1;

  return (
    <div className="flex items-center gap-1 rounded-xl border border-[#d8cbb5] bg-white px-3 py-2">
      <button
        onClick={prev}
        disabled={isOldest}
        className="rounded p-1 text-[#29384a] hover:bg-[#f8f4eb] disabled:opacity-30"
        aria-label="Trimestre anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[120px] text-center text-sm font-semibold text-[#07111d]">
        {QUARTER_LABELS[currentQuarter - 1]} {currentYear}
      </span>
      <button
        onClick={next}
        disabled={isLatest}
        className="rounded p-1 text-[#29384a] hover:bg-[#f8f4eb] disabled:opacity-30"
        aria-label="Trimestre siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
