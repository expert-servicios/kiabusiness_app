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
          'inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white'
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
