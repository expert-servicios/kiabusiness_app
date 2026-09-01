'use client';

import { type ReactNode } from 'react';
import { trackAcademyEvent, type AcademyAnalyticsEvent, type AcademyAnalyticsProps } from '@/lib/utils/analytics';

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
  /**
   * Analytics event fired before opening the booking modal/fallback. Takes
   * primitive event name + props (not a callback) because this component is
   * often rendered from a Server Component — functions can't cross that
   * boundary as props, but strings/objects can.
   */
  analyticsEvent?: AcademyAnalyticsEvent;
  analyticsProps?: AcademyAnalyticsProps;
}

function toCalLink(url: string): string {
  try { return new URL(url).pathname.slice(1); } catch { return url; }
}

export function CalendlyButton({ url, className, fallbackHref = '/cita', children, analyticsEvent, analyticsProps }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        if (analyticsEvent) trackAcademyEvent(analyticsEvent, analyticsProps);
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
