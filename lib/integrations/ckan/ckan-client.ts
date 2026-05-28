/**
 * Generic CKAN API v3 client.
 *
 * Supports datos.gob.es, PLACE (contratos), Catalunya Open Data,
 * Madrid Open Data, Fundae, and any custom CKAN endpoint.
 *
 * Rate limit: 200 ms between requests (per client instance).
 * Timeout: 15 s per request.
 * Retry: 1 automatic retry on transient 5xx or network error.
 */

export interface CkanClientConfig {
  /** Base URL of the CKAN portal, e.g. https://datos.gob.es */
  baseUrl: string;
  /** Human-readable name for logs / attribution */
  sourceName: string;
  /** Optional API key (some portals require it) */
  apiKey?: string;
  /** Request timeout in ms (default 15 000) */
  timeoutMs?: number;
  /** Min gap between requests in ms (default 200) */
  rateLimitMs?: number;
}

export interface CkanPackageSearchParams {
  q?: string;
  fq?: string;
  rows?: number;
  start?: number;
  sort?: string;
}

export interface CkanResourceSearchParams {
  query: string;
  fields?: string;
  order_by?: string;
  limit?: number;
  offset?: number;
}

export interface CkanDatastoreSearchParams {
  resource_id: string;
  q?: string | Record<string, string>;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  fields?: string[];
  sort?: string;
}

export interface CkanPackage {
  id: string;
  name: string;
  title: string;
  notes?: string;
  resources: CkanResource[];
  organization?: { name: string; title: string } | null;
  tags?: Array<{ name: string }>;
  extras?: Array<{ key: string; value: string }>;
  [key: string]: unknown;
}

export interface CkanResource {
  id: string;
  name?: string;
  description?: string;
  format?: string;
  url?: string;
  datastore_active?: boolean;
  [key: string]: unknown;
}

export interface CkanDatastoreRecord {
  [field: string]: unknown;
}

export interface CkanPackageSearchResult {
  count: number;
  results: CkanPackage[];
}

export interface CkanDatastoreSearchResult {
  resource_id: string;
  fields: Array<{ id: string; type: string }>;
  records: CkanDatastoreRecord[];
  total: number;
}

export class CkanApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'CkanApiError';
  }
}

export interface CkanClient {
  packageSearch(params: CkanPackageSearchParams): Promise<CkanPackageSearchResult>;
  resourceSearch(params: CkanResourceSearchParams): Promise<{ count: number; results: CkanResource[] }>;
  datastoreSearch(params: CkanDatastoreSearchParams): Promise<CkanDatastoreSearchResult>;
  datastoreInfo(resourceId: string): Promise<{ schema: Record<string, string> }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createCkanClient(config: CkanClientConfig): CkanClient {
  const base        = config.baseUrl.replace(/\/$/, '');
  const timeout     = config.timeoutMs  ?? 15_000;
  const rateLimit   = config.rateLimitMs ?? 200;
  let lastCall      = 0;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'EXPERT-Kia/1.0 (https://expertconsulting.es; info@expertconsulting.es)',
  };
  if (config.apiKey) headers['Authorization'] = config.apiKey;

  async function callApi<T>(action: string, params: Record<string, unknown>): Promise<T> {
    // Rate limit
    const now = Date.now();
    const gap = rateLimit - (now - lastCall);
    if (gap > 0) await sleep(gap);
    lastCall = Date.now();

    const url = `${base}/api/3/action/${action}`;

    async function attempt(retry: boolean): Promise<T> {
      // Each fetch leg (POST + optional GET fallback) gets its own controller
      // so that a slow-but-valid POST response doesn't exhaust the timeout
      // budget before the GET fallback can even start.
      const deadline = Date.now() + timeout;

      async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new CkanApiError(`CKAN ${config.sourceName} timeout`, 'timeout');
        const ctrl   = new AbortController();
        const timer  = setTimeout(() => ctrl.abort(), remaining);
        try {
          return await fetch(input, { ...init, signal: ctrl.signal });
        } finally {
          clearTimeout(timer);
        }
      }

      try {
        // Try POST first (preferred for complex queries), fall back to GET
        let res = await fetchWithTimeout(url, {
          method : 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body   : JSON.stringify(params),
        });

        // Some portals only accept GET
        if (res.status === 405) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) {
              qs.set(k, typeof v === 'string' ? v : JSON.stringify(v));
            }
          }
          res = await fetchWithTimeout(`${url}?${qs.toString()}`, {
            method : 'GET',
            headers,
          });
        }

        if (!res.ok) {
          if ((res.status >= 500 || res.status === 429) && retry) {
            await sleep(1_000);
            return attempt(false);
          }
          throw new CkanApiError(
            `CKAN ${config.sourceName} returned ${res.status}`,
            'http_error',
            res.status,
          );
        }

        const json = (await res.json()) as { success: boolean; result?: T; error?: { message?: string; __type?: string } };
        if (!json.success) {
          throw new CkanApiError(
            json.error?.message ?? `CKAN action ${action} failed`,
            json.error?.__type ?? 'api_error',
          );
        }
        return json.result as T;

      } catch (err) {
        if (err instanceof CkanApiError) throw err;
        if (err instanceof Error && err.name === 'AbortError') {
          throw new CkanApiError(`CKAN ${config.sourceName} timeout after ${timeout}ms`, 'timeout');
        }
        if (retry) {
          await sleep(1_000);
          return attempt(false);
        }
        throw new CkanApiError(
          err instanceof Error ? err.message : 'Unknown network error',
          'network_error',
        );
      }
    }

    return attempt(true);
  }

  return {
    async packageSearch(params) {
      return callApi<CkanPackageSearchResult>('package_search', {
        q   : params.q ?? '*:*',
        fq  : params.fq,
        rows: params.rows ?? 10,
        start: params.start ?? 0,
        sort: params.sort,
      });
    },

    async resourceSearch(params) {
      return callApi<{ count: number; results: CkanResource[] }>('resource_search', {
        query   : params.query,
        fields  : params.fields,
        order_by: params.order_by,
        limit   : params.limit ?? 10,
        offset  : params.offset ?? 0,
      });
    },

    async datastoreSearch(params) {
      return callApi<CkanDatastoreSearchResult>('datastore_search', {
        resource_id: params.resource_id,
        q          : params.q,
        filters    : params.filters,
        limit      : params.limit ?? 10,
        offset     : params.offset ?? 0,
        fields     : params.fields?.join(','),
        sort       : params.sort,
      });
    },

    async datastoreInfo(resourceId) {
      const result = await callApi<{ schema: Record<string, string> }>('datastore_info', { id: resourceId });
      return result;
    },
  };
}
