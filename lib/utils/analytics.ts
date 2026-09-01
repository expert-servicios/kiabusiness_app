'use client';

// Pushes a custom event to the dataLayer that Google Tag Manager (GTM-MKZ522HP,
// see app/layout.tsx) already listens to. Do NOT add a standalone gtag.js —
// GTM manages GA4 internally, a second gtag.js causes double-tracking.
// GTM needs a GA4 event tag configured per event name to actually forward
// these to GA4; this only pushes to the dataLayer.
//
// No PII: only the fixed property set documented in
// docs/courses/gestion-laboral/STRIPE_AND_CONVERSION.md
// (program_slug, locale, cta_location, article_slug, access_level).

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type AcademyAnalyticsEvent =
  | 'course_view'
  | 'course_payment_click'
  | 'course_contact_click'
  | 'course_meeting_click'
  | 'course_program_download'
  | 'course_lead_submit'
  | 'course_checkout_success'
  | 'knowledge_article_view'
  | 'knowledge_student_gate_view';

export interface AcademyAnalyticsProps {
  program_slug?: string;
  locale?: string;
  cta_location?: string;
  article_slug?: string;
  access_level?: 'public' | 'student';
}

export function trackAcademyEvent(event: AcademyAnalyticsEvent, props: AcademyAnalyticsProps = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...props });
}
