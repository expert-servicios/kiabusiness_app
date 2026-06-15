'use client';

import { type ReactNode } from 'react';

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (opts: { url: string }) => void };
  }
}

interface Props {
  url       : string | null;
  title?    : string;
  subtitle? : string;
  className?: string;
  fallbackHref?: string;
  children  : ReactNode;
}

export function CalendlyButton({ url, className, fallbackHref = '/cita', children }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        if (url && window.Calendly) {
          window.Calendly.initPopupWidget({ url });
          return;
        }
        window.location.assign(fallbackHref);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
