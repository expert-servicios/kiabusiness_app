'use client';

import { useState, lazy, Suspense } from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { ViabilityCheck } from '@/lib/data/viability-checks';

const ViabilityModal = lazy(() =>
  import('./ViabilityModal').then(m => ({ default: m.ViabilityModal }))
);

interface ViabilityButtonProps {
  check: ViabilityCheck;
  serviceSlug: string;
  className?: string;
}

export function ViabilityButton({ check, serviceSlug, className }: ViabilityButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'inline-flex items-center gap-2 rounded-xl border border-[#D4A017]/40 bg-white/8 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-[#D4A017] hover:bg-[#D4A017]/10 hover:text-white'
        }
      >
        <ClipboardCheck className="h-4 w-4 shrink-0 text-[#D4A017]" />
        ¿Cumples los requisitos? — Comprueba gratis
      </button>

      {open && (
        <Suspense fallback={null}>
          <ViabilityModal
            check={check}
            serviceSlug={serviceSlug}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
