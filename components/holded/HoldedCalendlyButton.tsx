'use client';

import { type ReactNode } from 'react';
import { CalendlyButton } from '@/components/site/CalendlyButton';
import { getCalDemoUrl } from '@/lib/utils/cal';

const CAL_DEMO_URL = getCalDemoUrl();

interface Props {
  className?: string;
  children  : ReactNode;
}

export function HoldedCalendlyButton({ className, children }: Props) {
  return (
    <CalendlyButton
      url={CAL_DEMO_URL}
      className={className}
    >
      {children}
    </CalendlyButton>
  );
}
