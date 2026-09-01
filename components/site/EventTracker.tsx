'use client';

import { useEffect } from 'react';
import { trackAcademyEvent, type AcademyAnalyticsEvent, type AcademyAnalyticsProps } from '@/lib/utils/analytics';

// Generic mount-fire tracker for pages that are Server Components and need
// a one-shot dataLayer event on load (page/article views, gate views).
export function EventTracker({ event, eventProps }: { event: AcademyAnalyticsEvent; eventProps?: AcademyAnalyticsProps }) {
  useEffect(() => {
    trackAcademyEvent(event, eventProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
