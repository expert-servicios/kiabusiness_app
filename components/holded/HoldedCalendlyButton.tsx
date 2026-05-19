'use client';

import { type ReactNode } from 'react';
import { CalendlyButton } from '@/components/site/CalendlyButton';

const CALENDLY_DEMO_URL = process.env.NEXT_PUBLIC_CALENDLY_DEMO_URL ?? 'https://calendly.com/soy-kseniailicheva/30min';

interface Props {
  className?: string;
  children: ReactNode;
}

export function HoldedCalendlyButton({ className, children }: Props) {
  return (
    <CalendlyButton
      url={CALENDLY_DEMO_URL}
      title="Demo de Holded"
      subtitle="30 minutos · Gratuita · Sin compromiso"
      className={className}
    >
      {children}
    </CalendlyButton>
  );
}
