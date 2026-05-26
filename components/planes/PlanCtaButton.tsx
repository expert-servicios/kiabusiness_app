'use client';

import { useState, lazy, Suspense } from 'react';
import { getReadinessCheck } from '@/lib/data/service-readiness-checks';

const ReadinessModal = lazy(() =>
  import('@/components/services/ReadinessModal').then(m => ({ default: m.ReadinessModal }))
);

interface PlanCtaButtonProps {
  planSlug    : string;
  ctaLabel    : string;
  loginHref  ?: string;
}

function withPlanParam(href: string, planSlug: string): string {
  try {
    const url = new URL(href, 'https://expert.local');
    const next = url.searchParams.get('next');

    if (next) {
      const nextUrl = new URL(next, 'https://expert.local');
      nextUrl.searchParams.set('plan', planSlug);
      url.searchParams.set('next', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    } else {
      url.searchParams.set('plan', planSlug);
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}plan=${encodeURIComponent(planSlug)}`;
  }
}

export function PlanCtaButton({ planSlug, ctaLabel, loginHref = '/auth/login?next=/dashboard/suscripciones' }: PlanCtaButtonProps) {
  const [open, setOpen] = useState(false);
  const readinessSlug   = `plan-${planSlug}`;
  const check           = getReadinessCheck(readinessSlug) ?? null;

  function handleApproved() {
    window.location.href = withPlanParam(loginHref, planSlug);
  }

  if (!check) {
    return (
      <a
        href={withPlanParam(loginHref, planSlug)}
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
