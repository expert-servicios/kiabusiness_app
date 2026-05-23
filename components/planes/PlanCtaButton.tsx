'use client';

import { useState, lazy, Suspense } from 'react';
import { Gift } from 'lucide-react';
import { getReadinessCheck } from '@/lib/data/service-readiness-checks';

const ReadinessModal = lazy(() =>
  import('@/components/services/ReadinessModal').then(m => ({ default: m.ReadinessModal }))
);

interface PlanCtaButtonProps {
  planSlug    : string;
  ctaLabel    : string;
  isFree      : boolean;
  loginHref  ?: string;
}

export function PlanCtaButton({ planSlug, ctaLabel, isFree, loginHref = '/auth/login' }: PlanCtaButtonProps) {
  const [open, setOpen] = useState(false);
  const readinessSlug   = `plan-${planSlug}`;
  const check           = !isFree ? (getReadinessCheck(readinessSlug) ?? null) : null;

  if (isFree) {
    return (
      <a
        href="/planes/gratuito"
        className="inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
      >
        <Gift className="h-4 w-4" />
        {ctaLabel}
      </a>
    );
  }

  function handleApproved() {
    window.location.href = `${loginHref}?plan=${planSlug}`;
  }

  if (!check) {
    return (
      <a
        href={`${loginHref}?plan=${planSlug}`}
        className="inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
      >
        {ctaLabel}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
      >
        {ctaLabel}
      </button>

      {open && (
        <Suspense fallback={null}>
          <ReadinessModal
            check={check}
            serviceSlug={readinessSlug}
            onApproved={handleApproved}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
