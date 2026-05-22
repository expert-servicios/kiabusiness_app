'use client';

import { type ReactNode } from 'react';
import { CalendlyButton } from '@/components/site/CalendlyButton';

const CALENDLY_DEMO_URL =
  'https://calendly.com/soy-kseniailicheva/30min' +
  '?hide_event_type_details=1' +
  '&hide_gdpr_banner=1' +
  '&background_color=f8f6f1' +
  '&text_color=0d1b2a' +
  '&primary_color=f2c14e';

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
