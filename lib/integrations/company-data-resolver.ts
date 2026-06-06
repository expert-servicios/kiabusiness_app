/**
 * Company Data Resolver — main orchestrator.
 *
 * Privacy rules:
 * - Never save data automatically without explicit user confirmation.
 * - Always show source and retrieval date.
 * - Mark all data as "suggested" — not verified.
 * - For autónomos / personas físicas: skip commercial sources, BORME only.
 * - No marketing use. Log queries for admin auditability only.
 * - RGPD: data treated as business data, not personal data, when it
 *   concerns a company (CIF). For NIF/NIE (personas físicas) minimal
 *   enrichment only — no external commercial source calls.
 */

import { validateSpanishVat } from '@/lib/integrations/vies';
import { searchCompaniesByName, isOpenCorporatesEnabled } from '@/lib/integrations/opencorporates';
import { searchBormeByCompanyName, BORME_DISCLAIMER } from '@/lib/integrations/boe-borme';
import {
  searchCkanCompaniesByName,
  searchCkanCompaniesByTaxId,
} from '@/lib/integrations/ckan/ckan-company-search';
import { isCkanEnabled } from '@/lib/integrations/ckan/ckan-source-registry';

// ── Public types ──────────────────────────────────────────────────────────────

export type CompanyDataSource =
  | 'boe_borme'
  | 'registradores_opendata'
  | 'opencorporates'
  | 'vies'
  | 'ckan_open_data'
  | 'manual';

export type CompanyDataConfidence = 'high' | 'medium' | 'low';

export interface CompanySuggestion {
  name              ?: string;
  taxId             ?: string;
  vatNumber         ?: string;
  registeredAddress ?: string;
  postalCode        ?: string;
  city              ?: string;
  province          ?: string;
  country           ?: string;
  shareCapital      ?: string;
  representativeName?: string;
  representativeRole?: string;
  incorporationDate ?: string;
  companyStatus     ?: string;
  source             : CompanyDataSource;
  sourceUrl         ?: string;
  retrievedAt        : string;
  confidence         : CompanyDataConfidence;
  warnings           : string[];
}

export type SpanishTaxIdType = 'nif' | 'nie' | 'cif' | 'unknown';

export interface TaxIdValidationResult {
  valid     : boolean;
  normalized: string | null;
  type      : SpanishTaxIdType;
  error    ?: string;
}

// ── Tax ID validation ─────────────────────────────────────────────────────────

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

function nifControlLetter(digits: string): string {
  return NIF_LETTERS[parseInt(digits, 10) % 23] ?? '';
}

/**
 * Validates and normalises a Spanish NIF, NIE, or CIF.
 * Returns type + normalized form + validation result.
 */
export function validateSpanishTaxIdFormat(taxId: string): TaxIdValidationResult {
  const raw = taxId.toUpperCase().replace(/[\s.-]/g, '');

  // ── CIF (empresas): Letter[ABCDEFGHJNPQRSUVW] + 7 digits + check digit/letter
  if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/i.test(raw)) {
    const firstLetter = raw[0]!;
    const digits      = raw.slice(1, 8);
    const control     = raw[8]!;

    // CIF check algorithm
    let sumOdd = 0, sumEven = 0;
    for (let i = 0; i < 7; i++) {
      const d = parseInt(digits[i]!, 10);
      if ((i + 1) % 2 === 0) {
        sumEven += d;
      } else {
        const v = d * 2;
        sumOdd += Math.floor(v / 10) + (v % 10);
      }
    }
    const total     = (sumOdd + sumEven) % 10;
    const checkNum  = total === 0 ? 0 : 10 - total;
    const checkLetter = CIF_CONTROL_LETTERS[checkNum] ?? '';

    // Some CIF types require a letter control, others accept digit
    const letterRequired = ['K', 'P', 'Q', 'R', 'S', 'W'].includes(firstLetter);
    const digitRequired  = ['A', 'B', 'E', 'H'].includes(firstLetter);

    let valid = false;
    if (letterRequired) {
      valid = control === checkLetter;
    } else if (digitRequired) {
      valid = control === String(checkNum);
    } else {
      valid = control === checkLetter || control === String(checkNum);
    }

    return { valid, normalized: raw, type: 'cif', error: valid ? undefined : 'Dígito de control incorrecto' };
  }

  // ── NIE (extranjeros): X/Y/Z + 7 digits + letter
  if (/^[XYZ][0-9]{7}[A-Z]$/i.test(raw)) {
    const prefix  = raw[0]!;
    const digits  = ({ X: '0', Y: '1', Z: '2' }[prefix] ?? '0') + raw.slice(1, 8);
    const control = raw[8]!;
    const valid   = control === nifControlLetter(digits);
    return { valid, normalized: raw, type: 'nie', error: valid ? undefined : 'Letra de control incorrecta' };
  }

  // ── NIF (personas físicas): 8 digits + letter
  if (/^[0-9]{8}[A-Z]$/i.test(raw)) {
    const digits  = raw.slice(0, 8);
    const control = raw[8]!;
    const invalid = ['I', 'O', 'U'].includes(control); // excluded letters
    if (invalid) return { valid: false, normalized: raw, type: 'nif', error: 'Letra de control inválida' };
    const valid = control === nifControlLetter(digits);
    return { valid, normalized: raw, type: 'nif', error: valid ? undefined : 'Letra de control incorrecta' };
  }

  return { valid: false, normalized: null, type: 'unknown', error: 'Formato no reconocido como NIF, NIE o CIF español' };
}

// ── Source builders ───────────────────────────────────────────────────────────

async function fromBorme(name: string, opts: { deepSearch?: boolean } = {}): Promise<CompanySuggestion[]> {
  const results = await searchBormeByCompanyName(name, { maxResults: 3, deepSearch: opts.deepSearch });
  return results.map(({ acts, bormeId }) => ({
    name              : acts.name,
    taxId             : acts.taxId,
    registeredAddress : acts.registeredAddress,
    postalCode        : acts.postalCode,
    city              : acts.city,
    province          : acts.province,
    country           : 'ES',
    shareCapital      : acts.shareCapital,
    representativeName: acts.representativeName,
    representativeRole: acts.representativeRole,
    incorporationDate : acts.incorporationDate,
    source            : 'boe_borme' as const,
    sourceUrl         : `https://www.boe.es/borme/es/busca_borme.do?q=${encodeURIComponent(name)}`,
    retrievedAt       : new Date().toISOString(),
    confidence        : 'medium' as const,
    warnings          : [BORME_DISCLAIMER, `Referencia BORME: ${bormeId}`],
  }));
}

async function fromOpenCorporates(name: string): Promise<CompanySuggestion[]> {
  if (!isOpenCorporatesEnabled()) return [];
  const companies = await searchCompaniesByName(name, 3);
  return companies.map((c) => ({
    name              : c.name,
    registeredAddress : c.registered_address
      ? [c.registered_address.street_address, c.registered_address.locality].filter(Boolean).join(', ')
      : undefined,
    postalCode        : c.registered_address?.postal_code ?? undefined,
    city              : c.registered_address?.locality    ?? undefined,
    province          : c.registered_address?.region      ?? undefined,
    country           : 'ES',
    incorporationDate : c.incorporation_date ?? undefined,
    companyStatus     : c.current_status     ?? undefined,
    source            : 'opencorporates' as const,
    sourceUrl         : c.opencorporates_url,
    retrievedAt       : new Date().toISOString(),
    confidence        : 'medium' as const,
    warnings          : [
      'Datos procedentes de OpenCorporates (fuente abierta). Confirmar antes de usar.',
      'Atribución: https://opencorporates.com',
    ],
  }));
}

async function fromVies(taxId: string): Promise<CompanySuggestion[]> {
  const validation = validateSpanishTaxIdFormat(taxId);
  if (!validation.valid || validation.type !== 'cif') return [];

  const result = await validateSpanishVat(taxId);
  if (!result || !result.valid) return [];

  return [{
    name             : result.name,
    taxId            : validation.normalized ?? taxId,
    vatNumber        : `ES${validation.normalized ?? taxId}`,
    registeredAddress: result.address,
    country          : 'ES',
    source           : 'vies' as const,
    sourceUrl        : 'https://ec.europa.eu/taxation_customs/vies/',
    retrievedAt      : result.consultedAt,
    confidence       : 'high' as const,
    warnings         : [
      'Validado en el sistema VIES de la UE. El nombre y dirección son los registrados a efectos de IVA intracomunitario — pueden diferir del Registro Mercantil.',
    ],
  }];
}

// ── Ranking / deduplication ───────────────────────────────────────────────────

function confidenceScore(s: CompanySuggestion): number {
  const base = s.confidence === 'high' ? 3 : s.confidence === 'medium' ? 2 : 1;
  const fields = [s.name, s.taxId, s.registeredAddress, s.city, s.postalCode].filter(Boolean).length;
  return base * 10 + fields;
}

function mergeSuggestions(suggestions: CompanySuggestion[]): CompanySuggestion[] {
  // Deduplicate by taxId when present, keeping the one with highest score
  const byTaxId = new Map<string, CompanySuggestion>();
  const noTaxId: CompanySuggestion[] = [];

  for (const s of suggestions) {
    if (!s.taxId) { noTaxId.push(s); continue; }
    const existing = byTaxId.get(s.taxId);
    if (!existing || confidenceScore(s) > confidenceScore(existing)) {
      byTaxId.set(s.taxId, s);
    }
  }

  const merged = [...byTaxId.values(), ...noTaxId];
  return merged.sort((a, b) => confidenceScore(b) - confidenceScore(a));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Searches for companies by name across all enabled sources.
 * Always returns "suggested" data — never auto-saves.
 */
export async function searchCompanyByName(
  name: string,
  opts: { deepSearch?: boolean } = {},
): Promise<CompanySuggestion[]> {
  const [bormeResults, ocResults, ckanResults] = await Promise.all([
    fromBorme(name, opts),
    fromOpenCorporates(name),
    isCkanEnabled() ? searchCkanCompaniesByName(name) : Promise.resolve<CompanySuggestion[]>([]),
  ]);
  return mergeSuggestions([...bormeResults, ...ocResults, ...ckanResults]);
}

/**
 * Searches for a company by Spanish tax ID (CIF/NIF/NIE).
 * For personas físicas (NIF/NIE) only uses VIES — skips commercial sources.
 */
export async function searchCompanyByTaxId(taxId: string): Promise<CompanySuggestion[]> {
  const validation = validateSpanishTaxIdFormat(taxId);
  if (!validation.valid) return [];

  // Personas físicas (NIF/NIE) — RGPD: no commercial source enrichment
  if (validation.type === 'nif' || validation.type === 'nie') {
    return []; // Only user-entered data allowed for natural persons
  }

  const [viesResults, ocResults, ckanResults] = await Promise.all([
    fromVies(taxId),
    isOpenCorporatesEnabled()
      ? fromOpenCorporates(validation.normalized ?? taxId)
      : Promise.resolve<CompanySuggestion[]>([]),
    isCkanEnabled()
      ? searchCkanCompaniesByTaxId(validation.normalized ?? taxId)
      : Promise.resolve<CompanySuggestion[]>([]),
  ]);

  return mergeSuggestions([...viesResults, ...ocResults, ...ckanResults]);
}

/**
 * Main entry point. Orchestrates all sources based on available input.
 * requiresUserConfirmation is always true — callers must not auto-save.
 */
export async function resolveCompanyData(input: {
  name      ?: string;
  taxId     ?: string;
  country   ?: string;
  deepSearch?: boolean;
}): Promise<{
  suggestions           : CompanySuggestion[];
  bestSuggestion       ?: CompanySuggestion;
  requiresUserConfirmation: true;
}> {
  const opts = { deepSearch: input.deepSearch };
  const allSuggestions: CompanySuggestion[] = [];

  if (input.taxId) {
    const byId = await searchCompanyByTaxId(input.taxId);
    allSuggestions.push(...byId);
  }

  if (input.name && allSuggestions.length < 3) {
    const byName = await searchCompanyByName(input.name, opts);
    allSuggestions.push(...byName);
  }

  const suggestions    = mergeSuggestions(allSuggestions).slice(0, 5);
  const bestSuggestion = suggestions[0];

  return { suggestions, bestSuggestion, requiresUserConfirmation: true };
}
