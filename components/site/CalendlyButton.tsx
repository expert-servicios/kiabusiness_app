'use client';

import { type ReactNode } from 'react';

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (opts: { url: string }) => void };
  }
}

interface Props {
  url       : string;
  title?    : string;
  subtitle? : string;
  className?: string;
  children  : ReactNode;
}

export function CalendlyButton({ url, className, children }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.Calendly?.initPopupWidget({ url })}
      className={className}
    >
      {children}
    </button>
  );
}
