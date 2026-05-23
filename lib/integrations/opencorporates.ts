/**
 * OpenCorporates integration — OPTIONAL fallback.
 * Only activates when OPENCORPORATES_API_KEY env var is set.
 *
 * License: https://opencorporates.com/info/licence
 * Attribution required. Do not use for marketing or mass profiling.
 * Rate limits apply — respect them.
 *
 * API docs: https://api.opencorporates.com/documentation/API-Reference
 */

const BASE_URL    = 'https://api.opencorporates.com/v0.4';
const JURISDICTION = 'es'; // Spain

export interface OcCompany {
  name              : string;
  company_number    : string;
  jurisdiction_code : string;
  incorporation_date?: string;
  dissolution_date  ?: string;
  company_type      ?: string;
  registry_url      ?: string;
  opencorporates_url : string;
  registered_address?: {
    street_address?: string;
    locality      ?: string;
    region        ?: string;
    postal_code   ?: string;
    country       ?: string;
  };
  current_status    ?: string;
}

interface OcSearchResponse {
  results: {
    companies: Array<{ company: OcCompany }>;
    total_count : number;
    page        : number;
    per_page    : number;
  };
}

function getApiKey(): string | null {
  return process.env.OPENCORPORATES_API_KEY ?? null;
}

export function isOpenCorporatesEnabled(): boolean {
  return Boolean(getApiKey());
}

function buildParams(extra: Record<string, string> = {}): URLSearchParams {
  const p: Record<string, string> = { ...extra };
  const key = getApiKey();
  if (key) p['api_token'] = key;
  return new URLSearchParams(p);
}

/**
 * Search companies by name in Spain.
 * Returns empty array if API key is not configured.
 */
export async function searchCompaniesByName(
  name     : string,
  maxResult = 5,
): Promise<OcCompany[]> {
  if (!isOpenCorporatesEnabled()) return [];

  const params = buildParams({
    q                : name,
    jurisdiction_code: JURISDICTION,
    per_page         : String(Math.min(maxResult, 10)),
  });

  try {
    const res = await fetch(`${BASE_URL}/companies/search?${params}`, {
      headers: { Accept: 'application/json' },
      signal : AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn('[opencorporates] search error HTTP', res.status);
      return [];
    }

    const data = await res.json() as OcSearchResponse;
    return (data.results?.companies ?? []).map((c) => c.company);
  } catch (err) {
    console.warn('[opencorporates] search failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Look up a company by its registration number (company_number) in Spain.
 * For Spanish companies this is usually the RM number, not the CIF.
 */
export async function getCompanyByNumber(companyNumber: string): Promise<OcCompany | null> {
  if (!isOpenCorporatesEnabled()) return null;

  const params = buildParams();
  try {
    const res = await fetch(
      `${BASE_URL}/companies/${JURISDICTION}/${encodeURIComponent(companyNumber)}?${params}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) },
    );

    if (!res.ok) return null;
    const data = await res.json() as { results: { company: OcCompany } };
    return data.results?.company ?? null;
  } catch {
    return null;
  }
}
