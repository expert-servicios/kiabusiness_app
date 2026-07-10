import { absoluteAppUrl } from '@/lib/utils/app-url';

export type MetricoolConnectionStatus = {
  ok: boolean;
  configured: boolean;
  connected: boolean;
  blogId?: string;
  userId?: string;
  usesLegacyTokenName?: boolean;
  feedUrl: string;
  rssUrl: string;
  missing?: string[];
  profiles?: unknown[];
  error?: string;
  detail?: string;
  status?: number;
};

function getMetricoolToken() {
  const primary = process.env.METRICOOL_USER_TOKEN?.trim();
  if (primary) return { token: primary, usesLegacyTokenName: false };

  const legacy = process.env.Metricol_API?.trim() || process.env.METRICOL_API?.trim();
  if (legacy) return { token: legacy, usesLegacyTokenName: true };

  return { token: '', usesLegacyTokenName: false };
}

export async function getMetricoolConnectionStatus(): Promise<MetricoolConnectionStatus> {
  const { token, usesLegacyTokenName } = getMetricoolToken();
  const userId = process.env.METRICOOL_USER_ID?.trim();
  const blogId = process.env.METRICOOL_BLOG_ID?.trim();
  const missing = [
    !token ? 'METRICOOL_USER_TOKEN' : null,
    !userId ? 'METRICOOL_USER_ID' : null,
    !blogId ? 'METRICOOL_BLOG_ID' : null,
  ].filter(Boolean) as string[];

  const base: MetricoolConnectionStatus = {
    ok: missing.length === 0,
    configured: Boolean(token && userId),
    connected: false,
    feedUrl: absoluteAppUrl('/feed'),
    rssUrl: absoluteAppUrl('/rss'),
    ...(blogId ? { blogId } : {}),
    ...(userId ? { userId } : {}),
    ...(usesLegacyTokenName ? { usesLegacyTokenName } : {}),
    ...(missing.length ? { missing } : {}),
  };

  if (!token || !userId) {
    return {
      ...base,
      error: 'Metricool no esta configurado.',
    };
  }

  try {
    const response = await fetch(`https://app.metricool.com/api/admin/simpleProfiles?userId=${encodeURIComponent(userId)}`, {
      headers: { 'X-Mc-Auth': token },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ...base,
        status: response.status,
        error: 'Metricool rechazo la comprobacion.',
        detail: await response.text().catch(() => ''),
      };
    }

    const data = await response.json().catch(() => null);
    const profiles = Array.isArray(data) ? data : Array.isArray(data?.profiles) ? data.profiles : [];

    return {
      ...base,
      ok: missing.length === 0,
      configured: true,
      connected: true,
      profiles,
    };
  } catch (err) {
    return {
      ...base,
      error: 'No se pudo contactar con Metricool.',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
