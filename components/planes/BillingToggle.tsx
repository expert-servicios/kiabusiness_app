'use client';

import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';

interface BillingToggleProps {
  isAnnual : boolean;
  basePath ?: string;
}

export function BillingToggle({ isAnnual, basePath = '/planes' }: BillingToggleProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center gap-1 rounded-none border border-[#D4A017]/30 bg-white p-1">
      <button
        type="button"
        onClick={() => router.push(basePath)}
        className={`px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
          !isAnnual
            ? 'bg-[#0D1B2A] text-[#F8F6F1]'
            : 'text-[#9CA3AF] hover:text-[#0D1B2A]'
        }`}
      >
        Mensual
      </button>
      <button
        type="button"
        onClick={() => router.push(`${basePath}?billing=anual`)}
        className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
          isAnnual
            ? 'bg-[#D4A017] text-[#0D1B2A]'
            : 'text-[#9CA3AF] hover:text-[#0D1B2A]'
        }`}
      >
        <Gift className="h-3.5 w-3.5" />
        Anual — 2 meses gratis
      </button>
    </div>
  );
}
