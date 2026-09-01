'use client';

import { type AnchorHTMLAttributes } from 'react';
import { trackAcademyEvent, type AcademyAnalyticsEvent, type AcademyAnalyticsProps } from '@/lib/utils/analytics';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: AcademyAnalyticsEvent;
  eventProps?: AcademyAnalyticsProps;
}

// Plain <a> wrapper that fires a dataLayer event on click before navigating —
// for CTAs (download, external payment link, contact) that live inside a
// server component and don't otherwise need client interactivity.
export function TrackedAnchor({ event, eventProps, onClick, ...anchorProps }: Props) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackAcademyEvent(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
