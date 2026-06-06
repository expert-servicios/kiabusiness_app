/**
 * CKAN source registry.
 *
 * Defines known Spanish open-data CKAN portals.
 * Sources are ENABLED by default. Set CKAN_SOURCES_ENABLED=false to disable.
 * Individual sources can also be toggled via their `enabled` flag.
 *
 * Custom portal: CKAN_CUSTOM_BASE_URL + CKAN_CUSTOM_SOURCE_NAME
 */

export interface CkanFieldMapping {
  /** Field in the CKAN record that holds the company name */
  name?       : string;
  /** Field that holds the tax ID (CIF/NIF/NIE) */
  taxId?      : string;
  /** Field that holds the registered address */
  address?    : string;
  postalCode? : string;
  city?       : string;
  province?   : string;
  country?    : string;
  shareCapital?: string;
  incorporationDate?: string;
  companyStatus?: string;
  representativeName?: string;
  representativeRole?: string;
}

export interface CkanOpenDataSource {
  /** Unique identifier for this source */
  id: string;
  /** Display name for attribution */
  name: string;
  /** CKAN portal base URL */
  baseUrl: string;
  /** Whether this source is currently active */
  enabled: boolean;
  /** CKAN dataset/resource IDs to query for company data */
  datasetIds?: string[];
  /** Field mapping from CKAN record fields → CompanySuggestion fields */
  fieldMapping: CkanFieldMapping;
  /** Attribution URL to display in warnings */
  attributionUrl: string;
  /** Free-text description for operators */
  description: string;
}

// ── Known Spanish CKAN portals ──────────────────────────────────────────────

const KNOWN_SOURCES: CkanOpenDataSource[] = [
  {
    id             : 'datos_gob_es',
    name           : 'datos.gob.es (Portal Datos Abiertos del Gobierno de España)',
    baseUrl        : 'https://datos.gob.es',
    enabled        : true,
    attributionUrl : 'https://datos.gob.es',
    description    : 'Portal nacional de datos abiertos. Contiene datasets del Registro Mercantil Central y otros organismos.',
    fieldMapping   : {
      name             : 'denominacion',
      taxId            : 'nif',
      address          : 'domicilio_social',
      postalCode       : 'codigo_postal',
      city             : 'municipio',
      province         : 'provincia',
      shareCapital     : 'capital_social',
      incorporationDate: 'fecha_constitucion',
      companyStatus    : 'situacion',
    },
  },
  {
    id             : 'place_contratos',
    name           : 'PLACE — Plataforma de Contratación del Sector Público',
    baseUrl        : 'https://contrataciondelestado.es',
    enabled        : true,
    attributionUrl : 'https://contrataciondelestado.es',
    description    : 'Contiene empresas licitadoras en contratos públicos. Útil para verificar existencia y actividad comercial.',
    fieldMapping   : {
      name             : 'razon_social',
      taxId            : 'nif_cif',
      city             : 'municipio',
      province         : 'provincia',
    },
  },
  {
    id             : 'generalitat_catalunya',
    name           : 'Open Data Catalunya (Generalitat de Catalunya)',
    baseUrl        : 'https://analisi.transparenciacatalunya.cat',
    enabled        : false,
    attributionUrl : 'https://analisi.transparenciacatalunya.cat',
    description    : 'Datos abiertos de la Generalitat de Catalunya. Incluye datasets de empresas.',
    fieldMapping   : {
      name             : 'nom_empresa',
      taxId            : 'cif',
      address          : 'adreca',
      city             : 'municipi',
      province         : 'provincia',
    },
  },
  {
    id             : 'madrid_open_data',
    name           : 'Portal de Datos Abiertos del Ayuntamiento de Madrid',
    baseUrl        : 'https://datos.madrid.es',
    enabled        : false,
    attributionUrl : 'https://datos.madrid.es',
    description    : 'Datos abiertos del Ayuntamiento de Madrid. Contiene licencias de actividad y actividades económicas.',
    fieldMapping   : {
      name             : 'denominacion_social',
      taxId            : 'nif',
      address          : 'domicilio',
      city             : 'municipio',
    },
  },
  {
    id             : 'fundae',
    name           : 'FUNDAE — Fundación Estatal para la Formación en el Empleo',
    baseUrl        : 'https://opendata.fundae.es',
    enabled        : false,
    attributionUrl : 'https://opendata.fundae.es',
    description    : 'Datos de empresas que participan en formación bonificada. Útil para verificar actividad.',
    fieldMapping   : {
      name             : 'denominacion',
      taxId            : 'nif',
      city             : 'municipio',
      province         : 'provincia',
    },
  },
];

// ── Feature flag ──────────────────────────────────────────────────────────────

/** CKAN sources enabled by default. Set CKAN_SOURCES_ENABLED=false to disable. */
export function isCkanEnabled(): boolean {
  return process.env.CKAN_SOURCES_ENABLED !== 'false';
}

// ── Custom portal injection ───────────────────────────────────────────────────

function buildCustomSource(): CkanOpenDataSource | null {
  const url  = process.env.CKAN_CUSTOM_BASE_URL?.trim();
  const name = process.env.CKAN_CUSTOM_SOURCE_NAME?.trim() ?? 'Custom CKAN Portal';
  if (!url) return null;
  return {
    id             : 'ckan_custom',
    name,
    baseUrl        : url,
    enabled        : true,
    attributionUrl : url,
    description    : 'Portal CKAN personalizado configurado via variable de entorno.',
    fieldMapping   : {
      // Generic fallbacks — normalizer also auto-detects common field names
      name             : 'nombre',
      taxId            : 'nif',
      address          : 'domicilio',
      city             : 'municipio',
      province         : 'provincia',
    },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Returns active CKAN sources.
 * Includes custom portal if CKAN_CUSTOM_BASE_URL is set.
 * Returns empty array if CKAN is disabled.
 */
export function getActiveCkanSources(): CkanOpenDataSource[] {
  if (!isCkanEnabled()) return [];
  const active = KNOWN_SOURCES.filter((s) => s.enabled);
  const custom = buildCustomSource();
  if (custom) active.push(custom);
  return active;
}

/**
 * Returns all configured CKAN sources (active and inactive),
 * plus the custom portal if configured.
 * Used by admin health checks.
 */
export function getAllCkanSources(): CkanOpenDataSource[] {
  const all = [...KNOWN_SOURCES];
  const custom = buildCustomSource();
  if (custom) all.push(custom);
  return all;
}

export type { CkanOpenDataSource as CkanSource };
