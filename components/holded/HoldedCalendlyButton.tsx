'use client';

import { type ReactNode } from 'react';
import { CalendlyButton } from '@/components/site/CalendlyButton';
import { getCalendlyDemoUrl } from '@/lib/utils/calendly';

const CALENDLY_DEMO_URL = getCalendlyDemoUrl();

interface Props {
  className?: string;
  children  : ReactNode;
}

export function HoldedCalendlyButton({ className, children }: Props) {
  return (
    <CalendlyButton
      url={CALENDLY_DEMO_URL}
      className={className}
    >
      {children}
    </CalendlyButton>
  );
}
