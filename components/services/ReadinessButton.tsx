'use client';

import { useState, lazy, Suspense } from 'react';
import { CheckSquare } from 'lucide-react';
import type { ReadinessCheck } from '@/lib/data/service-readiness-checks';

const ReadinessModal = lazy(() =>
  import('./ReadinessModal').then(m => ({ default: m.ReadinessModal }))
);

interface ReadinessButtonProps {
  check        : ReadinessCheck;
  serviceSlug  : string;
  /** Called when the user completes the wizard and can proceed to checkout */
  onApproved  ?: () => void;
  className   ?: string;
}

export function ReadinessButton({ check, serviceSlug, onApproved, className }: ReadinessButtonProps) {
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
        <CheckSquare className="h-4 w-4 shrink-0 text-[#D4A017]" />
        {check.ctaLabel}
      </button>

      {open && (
        <Suspense fallback={null}>
          <ReadinessModal
            check={check}
            serviceSlug={serviceSlug}
            onApproved={onApproved}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
