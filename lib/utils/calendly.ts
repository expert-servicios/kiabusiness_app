const CALENDLY_PARAMS: Record<string, string> = {
  hide_event_type_details: '1',
  hide_gdpr_banner: '1',
  background_color: 'f8f6f1',
  text_color: '0d1b2a',
  primary_color: 'f2c14e',
};

function buildCalendlyUrl(baseUrl: string | undefined, extraParams: Record<string, string> = {}) {
  if (!baseUrl?.trim()) return null;

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:') return null;

    for (const [key, value] of Object.entries({ ...CALENDLY_PARAMS, ...extraParams })) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function getCalendlyMeetingUrl() {
  return buildCalendlyUrl(process.env.NEXT_PUBLIC_CALENDLY_REUNION_URL);
}

export function getCalendlyDemoUrl() {
  return buildCalendlyUrl(process.env.NEXT_PUBLIC_CALENDLY_DEMO_URL);
}
