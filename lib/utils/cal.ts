// Cal.com utility — returns https://cal.com/{link} URLs for use as hrefs or iframe src.
// CalendlyButton extracts the path internally for the popup API.

function calUrl(envVar: string | undefined): string | null {
  const link = envVar?.trim();
  return link ? `https://cal.com/${link}` : null;
}

export function getCalMeetingUrl(): string | null {
  return calUrl(process.env.NEXT_PUBLIC_CAL_REUNION_LINK);
}

export function getCalDemoUrl(): string | null {
  return calUrl(process.env.NEXT_PUBLIC_CAL_DEMO_LINK);
}

export function getCalOnboardingUrl(): string | null {
  return calUrl(process.env.NEXT_PUBLIC_CAL_ONBOARDING_LINK);
}

export function getCalFormacionUrl(): string | null {
  return calUrl(process.env.NEXT_PUBLIC_CAL_FORMACION_LINK);
}
