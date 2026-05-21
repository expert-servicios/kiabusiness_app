export const DEFAULT_PUBLIC_APP_URL = 'https://expertconsulting.es';

export function getPublicAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) return DEFAULT_PUBLIC_APP_URL;

  try {
    const url = new URL(configuredUrl);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.origin;
    }
  } catch {
    return DEFAULT_PUBLIC_APP_URL;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function absoluteAppUrl(path: string): string {
  return new URL(path, `${getPublicAppUrl()}/`).toString();
}
