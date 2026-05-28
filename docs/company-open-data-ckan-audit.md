# Company Open Data (CKAN) — Architecture & Audit Log

> **Last updated:** 2026-05-28  
> **Status:** Implemented — CKAN sources disabled by default (`CKAN_SOURCES_ENABLED=false`)

---

## Architecture

```
POST /api/company/resolve
        │
        ├─ validateSpanishTaxIdFormat()     ← Format check (NIF/NIE blocked)
        │
        ├─ resolveCompanyData()
        │     ├─ fromBorme()                ← BOE/BORME (always on)
        │     ├─ fromOpenCorporates()       ← Feature-flagged (OC_API_KEY)
        │     ├─ fromVies()                 ← VIES EU (CIF only)
        │     └─ searchCkanCompaniesByName/TaxId()  ← Feature-flagged (CKAN_SOURCES_ENABLED)
        │           ├─ ckan-source-registry → getActiveCkanSources()
        │           ├─ ckan-client         → createCkanClient()
        │           └─ ckan-company-normalizer → normalizeCkanCompanyRecord()
        │
        └─ mergeSuggestions()              ← Dedup by taxId, rank by score

POST /api/company/associate
        │
        ├─ Auth check (user must be logged in)
        ├─ userConfirmed: true             ← Literal gate (z.literal(true))
        ├─ Validate CIF format
        ├─ Two-step duplicate check
        │     ├─ profile_companies → company_id[]
        │     └─ companies.in(ownedIds).eq('cif_nif', ...)
        └─ INSERT companies + INSERT profile_companies
```

---

## Privacy Invariants

| Rule | Enforced where |
|------|----------------|
| NIF/NIE never enriched externally | `company-data-resolver.ts:searchCompanyByTaxId` + `ckan-company-search.ts:searchCkanCompaniesByTaxId` |
| `requiresUserConfirmation: true` always | `company-data-resolver.ts:resolveCompanyData` + `/api/company/resolve` response |
| `userConfirmed: true` literal required to save | `/api/company/associate` — `z.literal(true)` |
| CKAN confidence always `low` | `ckan-company-normalizer.ts:normalizeCkanCompanyRecord` |
| Attribution URL in every CKAN suggestion warning | `ckan-company-normalizer.ts` |
| Audit log for every resolver call | `/api/company/resolve` → `company_data_sources_log` |
| Audit log for every associate call | `/api/company/associate` → `company_data_sources_log` |

---

## CKAN Sources

| ID | Portal | Status |
|----|--------|--------|
| `datos_gob_es` | datos.gob.es | Disabled |
| `place_contratos` | PLACE Contratación | Disabled |
| `generalitat_catalunya` | Open Data Catalunya | Disabled |
| `madrid_open_data` | Datos Abiertos Madrid | Disabled |
| `fundae` | FUNDAE | Disabled |
| `ckan_custom` | CKAN_CUSTOM_BASE_URL | Enabled if env set |

**To enable:** Set `CKAN_SOURCES_ENABLED=true` in Vercel environment variables.  
**To add a custom portal:** Set `CKAN_CUSTOM_BASE_URL` + `CKAN_CUSTOM_SOURCE_NAME`.

---

## Supabase Tables

- `company_data_suggestions` — pending suggestions awaiting user confirmation
- `company_open_data_query_logs` — privacy-safe audit (SHA-256 input hash)
- `company_data_sources_log` — resolver + associate call audit
- `profile_companies` — user ↔ company link table

All tables have RLS enabled. Users can read/update their own suggestions only.
Admins access via service role (bypasses RLS).

---

## Files

| File | Purpose |
|------|---------|
| `lib/integrations/ckan/ckan-client.ts` | Generic CKAN API v3 client |
| `lib/integrations/ckan/ckan-source-registry.ts` | Known portals + feature flag |
| `lib/integrations/ckan/ckan-company-normalizer.ts` | Record → CompanySuggestion |
| `lib/integrations/ckan/ckan-company-search.ts` | Orchestrator + 24h cache |
| `lib/integrations/company-data-resolver.ts` | Main resolver (modified) |
| `app/api/company/resolve/route.ts` | POST + PATCH endpoints |
| `app/api/company/associate/route.ts` | POST — creates company after user confirms |
| `components/dashboard/company/CompanyDataLookup.tsx` | Lookup panel UI |
| `app/(protected)/dashboard/empresa/nueva/page.tsx` | Form with lookup button |
