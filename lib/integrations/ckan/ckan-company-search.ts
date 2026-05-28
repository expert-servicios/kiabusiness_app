/**
 * CKAN company search orchestrator.
 *
 * Searches up to MAX_SOURCES active CKAN portals in parallel,
 * normalizes results, deduplicates, and returns at most MAX_RESULTS
 * CompanySuggestion objects.
 *
 * Caching: 24 h in-process cache per (sourceId, inputType, input) tuple.
 * Privacy:
 * - NIF/NIE inputs are rejected immediately.
 * - Results are always marked confidence:'low'.
 * - Never auto-saves. requiresUserConfirmation enforced upstream.
 *
 * Feature flag: returns [] if CKAN_SOURCES_ENABLED !== 'true'.
 */

import type { CompanySuggestion } from '@/lib/integrations/company-data-resolver';
import { isCkanEnabled, getActiveCkanSources } from './ckan-source-registry';
import { createCkanClient }                     from './ckan-client';
import {
  normalizeCkanCompanyRecord,
  scoreCkanSuggestion,
  detectTaxIdFields,
}                                               from './ckan-company-normalizer';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_SOURCES  = 3;
const MAX_RESULTS  = 5;
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000; // 24 h
const CACHE_MAX    = 500;                   // max entries — prevents OOM on unauthenticated spam

// ── Simple in-memory cache ───────────────────────────────────────────────────

interface CacheEntry {
  results  : CompanySuggestion[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(sourceId: string, inputType: 'name' | 'taxId', input: string): string {
  return `${sourceId}:${inputType}:${input.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

function getCached(key: string): CompanySuggestion[] | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.results;
}

function setCached(key: string, results: CompanySuggestion[]): void {
  // Evict oldest entries when cap is reached
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { results, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Builds a safe dataset URL. pkg.name comes from the CKAN API and must be
 * validated before being embedded in a URL that gets stored in the DB and
 * rendered in the UI — a compromised source could inject path-traversal or
 * protocol-relative segments.
 */
function safeDatasetUrl(baseUrl: string, pkgName: string): string {
  // Accept only alphanumeric, hyphens, underscores, dots — standard CKAN slug chars
  const safe = /^[a-z0-9_\-\.]{1,200}$/i.test(pkgName);
  if (!safe) return baseUrl;
  return `${baseUrl}/dataset/${encodeURIComponent(pkgName)}`;
}

// ── Source query ─────────────────────────────────────────────────────────────

/**
 * Queries a single CKAN source for companies matching a name.
 * Tries package_search first, then falls back to datastore_search on known datasets.
 */
async function querySourceByName(
  source : ReturnType<typeof getActiveCkanSources>[number],
  name   : string,
): Promise<CompanySuggestion[]> {
  const key = cacheKey(source.id, 'name', name);
  const hit = getCached(key);
  if (hit) return hit;

  const client = createCkanClient({ baseUrl: source.baseUrl, sourceName: source.name });
  const results: CompanySuggestion[] = [];

  try {
    // Strategy 1: package_search — find datasets about this company
    const pkgResult = await client.packageSearch({ q: name, rows: 5 });
    for (const pkg of pkgResult.results) {
      for (const resource of pkg.resources) {
        if (!resource.datastore_active) continue;
        const dsResult = await client.datastoreSearch({
          resource_id: resource.id,
          q          : name,
          limit      : 5,
        });
        for (const record of dsResult.records) {
          const suggestion = normalizeCkanCompanyRecord(
            record,
            source.fieldMapping,
            source,
            safeDatasetUrl(source.baseUrl, pkg.name),
          );
          if (suggestion) results.push(suggestion);
        }
      }
    }

    // Strategy 2: query known dataset IDs directly
    if (results.length === 0 && source.datasetIds?.length) {
      for (const resourceId of source.datasetIds) {
        const dsResult = await client.datastoreSearch({
          resource_id: resourceId,
          q          : name,
          limit      : 5,
        });
        for (const record of dsResult.records) {
          const suggestion = normalizeCkanCompanyRecord(
            record,
            source.fieldMapping,
            source,
            `${source.baseUrl}/resource/${resourceId}`,
          );
          if (suggestion) results.push(suggestion);
        }
      }
    }
  } catch {
    // Silently swallow — CKAN is optional enrichment, never blocking
    return [];
  }

  // Sort by relevance
  results.sort((a, b) => scoreCkanSuggestion(b, { name }) - scoreCkanSuggestion(a, { name }));
  const top = results.slice(0, MAX_RESULTS);
  setCached(key, top);
  return top;
}

/**
 * Queries a single CKAN source for companies matching a CIF.
 */
async function querySourceByTaxId(
  source : ReturnType<typeof getActiveCkanSources>[number],
  taxId  : string,
): Promise<CompanySuggestion[]> {
  const key = cacheKey(source.id, 'taxId', taxId);
  const hit = getCached(key);
  if (hit) return hit;

  const client  = createCkanClient({ baseUrl: source.baseUrl, sourceName: source.name });
  const results : CompanySuggestion[] = [];

  // Determine which field to filter on
  const taxIdField = source.fieldMapping.taxId ?? 'nif';

  try {
    // Strategy 1: package_search with tax ID
    const pkgResult = await client.packageSearch({ q: taxId, rows: 5 });
    for (const pkg of pkgResult.results) {
      for (const resource of pkg.resources) {
        if (!resource.datastore_active) continue;
        const dsResult = await client.datastoreSearch({
          resource_id: resource.id,
          filters    : { [taxIdField]: taxId },
          limit      : 3,
        });
        for (const record of dsResult.records) {
          const suggestion = normalizeCkanCompanyRecord(
            record,
            source.fieldMapping,
            source,
            safeDatasetUrl(source.baseUrl, pkg.name),
          );
          if (suggestion) results.push(suggestion);
        }
      }
    }

    // Strategy 2: scan known datasets
    if (results.length === 0 && source.datasetIds?.length) {
      for (const resourceId of source.datasetIds) {
        const dsResult = await client.datastoreSearch({
          resource_id: resourceId,
          filters    : { [taxIdField]: taxId },
          limit      : 3,
        });
        for (const record of dsResult.records) {
          const suggestion = normalizeCkanCompanyRecord(
            record,
            source.fieldMapping,
            source,
            `${source.baseUrl}/resource/${resourceId}`,
          );
          if (suggestion) results.push(suggestion);
        }
      }
    }
  } catch {
    return [];
  }

  results.sort((a, b) => scoreCkanSuggestion(b, { taxId }) - scoreCkanSuggestion(a, { taxId }));
  const top = results.slice(0, MAX_RESULTS);
  setCached(key, top);
  return top;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Searches all active CKAN sources by company name.
 * Returns [] if CKAN is disabled or no sources are active.
 */
export async function searchCkanCompaniesByName(name: string): Promise<CompanySuggestion[]> {
  if (!isCkanEnabled()) return [];
  const sources = getActiveCkanSources().slice(0, MAX_SOURCES);
  if (sources.length === 0) return [];

  const perSource = await Promise.all(sources.map((s) => querySourceByName(s, name)));
  const all = perSource.flat();
  all.sort((a, b) => scoreCkanSuggestion(b, { name }) - scoreCkanSuggestion(a, { name }));
  return all.slice(0, MAX_RESULTS);
}

/**
 * Searches all active CKAN sources by CIF.
 * NIF/NIE inputs are rejected (RGPD — no external enrichment for natural persons).
 */
export async function searchCkanCompaniesByTaxId(taxId: string): Promise<CompanySuggestion[]> {
  if (!isCkanEnabled()) return [];

  // Block NIF/NIE
  const clean = taxId.toUpperCase().replace(/[\s.-]/g, '');
  const isNifNie = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$/i.test(clean);
  if (isNifNie) return [];

  const sources = getActiveCkanSources().slice(0, MAX_SOURCES);
  if (sources.length === 0) return [];

  const perSource = await Promise.all(sources.map((s) => querySourceByTaxId(s, clean)));
  const all = perSource.flat();
  all.sort((a, b) => scoreCkanSuggestion(b, { taxId: clean }) - scoreCkanSuggestion(a, { taxId: clean }));
  return all.slice(0, MAX_RESULTS);
}

/**
 * Discovers datasets in a CKAN source that are likely to contain company data.
 * Used by admin health-check and onboarding tools.
 */
export async function discoverCompanyDatasets(
  source : ReturnType<typeof getActiveCkanSources>[number],
  query  : string = 'empresa OR sociedad OR mercantil OR registro',
): Promise<string[]> {
  const client = createCkanClient({ baseUrl: source.baseUrl, sourceName: source.name });
  try {
    const result = await client.packageSearch({ q: query, rows: 10 });
    return result.results
      .flatMap((pkg) => pkg.resources.filter((r) => r.datastore_active).map((r) => r.id))
      .slice(0, 10);
  } catch {
    return [];
  }
}

// Re-export for convenience
export { detectTaxIdFields } from './ckan-company-normalizer';
