'use client';

// Sends a custom event straight to GA4 via the gtag.js loaded in
// app/layout.tsx (Measurement ID G-NWTGS6DH5E). Uses window.gtag(), not a
// raw dataLayer.push of a plain object — gtag.js reads its own
// arguments-object convention, so pushing a GTM-style {event: name, ...}
// object directly to the dataLayer is silently ignored by gtag.js and never
// reaches GA4.
//
// No PII: only the fixed property set documented in
// docs/courses/gestion-laboral/STRIPE_AND_CONVERSION.md
// (program_slug, locale, cta_location, article_slug, access_level).

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
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
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, props);
}
