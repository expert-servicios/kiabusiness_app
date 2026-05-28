/**
 * CKAN company record normalizer.
 *
 * Converts heterogeneous CKAN dataset records into the canonical
 * CompanySuggestion shape used by the company-data-resolver.
 *
 * Privacy:
 * - Blocks NIF/NIE — no enrichment of personas físicas from CKAN.
 * - Marks all data confidence as 'low' — CKAN is open data, not official.
 * - Never auto-saves. requiresUserConfirmation must stay true upstream.
 */

import type { CompanySuggestion }  from '@/lib/integrations/company-data-resolver';
import type { CkanFieldMapping, CkanOpenDataSource } from './ckan-source-registry';
import type { CkanDatastoreRecord } from './ckan-client';

// ── Known CIF-pattern field names (auto-detection) ─────────────────────────

const CIF_FIELD_CANDIDATES = [
  'nif', 'cif', 'nif_cif', 'cif_nif', 'tax_id', 'taxid',
  'identificacion_fiscal', 'codigo_fiscal', 'numero_identificacion',
  'nif_empresa', 'cif_empresa', 'identificador',
];

const NAME_FIELD_CANDIDATES = [
  'nombre', 'denominacion', 'razon_social', 'nombre_empresa',
  'denominacion_social', 'nom_empresa', 'empresa', 'entidad',
  'company_name', 'name',
];

const ADDRESS_FIELD_CANDIDATES = [
  'domicilio', 'domicilio_social', 'direccion', 'adreca',
  'domicilio_fiscal', 'address', 'direccion_fiscal',
];

const CITY_FIELD_CANDIDATES = [
  'municipio', 'ciudad', 'localidad', 'municipi', 'city', 'poblacion',
];

const PROVINCE_FIELD_CANDIDATES = [
  'provincia', 'province', 'comunidad_autonoma',
];

const POSTAL_FIELD_CANDIDATES = [
  'codigo_postal', 'cp', 'codigopostal', 'postal_code', 'codi_postal',
];

// ── Spanish CIF pattern ─────────────────────────────────────────────────────

const CIF_PATTERN = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/i;
const NIF_NIE_PATTERN = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$/i;

function looksLikeCif(value: string): boolean {
  const clean = value.toUpperCase().replace(/[\s.-]/g, '');
  return CIF_PATTERN.test(clean) && !NIF_NIE_PATTERN.test(clean);
}

function looksLikeNifOrNie(value: string): boolean {
  const clean = value.toUpperCase().replace(/[\s.-]/g, '');
  return NIF_NIE_PATTERN.test(clean);
}

// ── Field auto-detection ────────────────────────────────────────────────────

function firstNonEmpty(record: CkanDatastoreRecord, candidates: string[]): string | undefined {
  for (const key of candidates) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
    // Also try case-insensitive match
    const found = Object.keys(record).find((k) => k.toLowerCase() === key.toLowerCase());
    if (found) {
      const v = record[found];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return undefined;
}

/**
 * Auto-detects the tax ID field in a CKAN record.
 * Returns the field value if it looks like a CIF.
 */
export function detectTaxIdFields(record: CkanDatastoreRecord): string | undefined {
  // Use explicit mapping candidates first
  for (const key of CIF_FIELD_CANDIDATES) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) {
      const clean = val.trim().toUpperCase().replace(/[\s.-]/g, '');
      if (looksLikeCif(clean)) return clean;
    }
  }
  // Then scan all fields for CIF-shaped values
  for (const [, val] of Object.entries(record)) {
    if (typeof val === 'string') {
      const clean = val.trim().toUpperCase().replace(/[\s.-]/g, '');
      if (looksLikeCif(clean)) return clean;
    }
  }
  return undefined;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Scores a CKAN suggestion by how well it matches the original query.
 * Used for sorting results before returning them.
 */
export function scoreCkanSuggestion(
  suggestion: CompanySuggestion,
  input: { name?: string; taxId?: string },
): number {
  let score = 0;

  // Tax ID match is the strongest signal
  if (input.taxId && suggestion.taxId) {
    const a = input.taxId.toUpperCase().replace(/[\s.-]/g, '');
    const b = suggestion.taxId.toUpperCase().replace(/[\s.-]/g, '');
    if (a === b) score += 100;
  }

  // Name match
  if (input.name && suggestion.name) {
    const a = input.name.toUpperCase().replace(/\s+/g, ' ').trim();
    const b = suggestion.name.toUpperCase().replace(/\s+/g, ' ').trim();
    if (a === b) score += 50;
    else if (b.includes(a) || a.includes(b)) score += 25;
  }

  // Field completeness bonus
  const fields = [suggestion.taxId, suggestion.registeredAddress, suggestion.city, suggestion.postalCode, suggestion.province];
  score += fields.filter(Boolean).length * 2;

  return score;
}

// ── Main normalizer ─────────────────────────────────────────────────────────

/**
 * Converts a raw CKAN datastore record into a CompanySuggestion.
 *
 * Returns null if:
 * - The record appears to be a persona física (NIF/NIE) — RGPD
 * - No recognizable company name is found
 */
export function normalizeCkanCompanyRecord(
  record     : CkanDatastoreRecord,
  mapping    : CkanFieldMapping,
  source     : CkanOpenDataSource,
  sourceUrl  : string,
): CompanySuggestion | null {
  // Resolve fields using explicit mapping first, then auto-detect
  const name    = (mapping.name    ? String(record[mapping.name]    ?? '').trim() : '') || firstNonEmpty(record, NAME_FIELD_CANDIDATES);
  const taxIdRaw = (mapping.taxId  ? String(record[mapping.taxId]   ?? '').trim() : '') || detectTaxIdFields(record);
  const address  = (mapping.address ? String(record[mapping.address] ?? '').trim() : '') || firstNonEmpty(record, ADDRESS_FIELD_CANDIDATES);
  const cp       = (mapping.postalCode ? String(record[mapping.postalCode] ?? '').trim() : '') || firstNonEmpty(record, POSTAL_FIELD_CANDIDATES);
  const city     = (mapping.city   ? String(record[mapping.city]    ?? '').trim() : '') || firstNonEmpty(record, CITY_FIELD_CANDIDATES);
  const province = (mapping.province ? String(record[mapping.province] ?? '').trim() : '') || firstNonEmpty(record, PROVINCE_FIELD_CANDIDATES);
  const country  = mapping.country  ? String(record[mapping.country] ?? '').trim() : 'ES';
  const capital  = mapping.shareCapital ? String(record[mapping.shareCapital] ?? '').trim() || undefined : undefined;
  const incDate  = mapping.incorporationDate ? String(record[mapping.incorporationDate] ?? '').trim() || undefined : undefined;
  const status   = mapping.companyStatus ? String(record[mapping.companyStatus] ?? '').trim() || undefined : undefined;
  const repName  = mapping.representativeName ? String(record[mapping.representativeName] ?? '').trim() || undefined : undefined;
  const repRole  = mapping.representativeRole ? String(record[mapping.representativeRole] ?? '').trim() || undefined : undefined;

  // Must have at least a name
  if (!name) return null;

  // RGPD: block personas físicas
  if (taxIdRaw) {
    const clean = taxIdRaw.toUpperCase().replace(/[\s.-]/g, '');
    if (looksLikeNifOrNie(clean)) return null; // skip natural persons
  }

  const taxId = taxIdRaw
    ? taxIdRaw.toUpperCase().replace(/[\s.-]/g, '')
    : undefined;

  const warnings: string[] = [
    `Datos procedentes de ${source.name} (datos abiertos). No verificados — confirmar antes de usar.`,
    `Atribución: ${source.attributionUrl}`,
  ];

  return {
    name,
    taxId          : taxId || undefined,
    registeredAddress: address || undefined,
    postalCode     : cp || undefined,
    city           : city || undefined,
    province       : province || undefined,
    country        : country || 'ES',
    shareCapital   : capital,
    incorporationDate: incDate,
    companyStatus  : status,
    representativeName: repName,
    representativeRole: repRole,
    source         : 'ckan_open_data',
    sourceUrl,
    retrievedAt    : new Date().toISOString(),
    confidence     : 'low',
    warnings,
  };
}
