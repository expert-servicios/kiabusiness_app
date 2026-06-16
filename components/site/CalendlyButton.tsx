'use client';

import { type ReactNode } from 'react';

declare global {
  interface Window {
    Cal?: (action: string, opts?: Record<string, unknown>) => void;
  }
}

interface Props {
  url         : string | null; // https://cal.com/username/event-type
  title?      : string;
  subtitle?   : string;
  className?  : string;
  fallbackHref?: string;
  children    : ReactNode;
}

function toCalLink(url: string): string {
  try { return new URL(url).pathname.slice(1); } catch { return url; }
}

export function CalendlyButton({ url, className, fallbackHref = '/cita', children }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        if (url && window.Cal) {
          window.Cal('modal', { calLink: toCalLink(url), config: { layout: 'month_view' } });
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
