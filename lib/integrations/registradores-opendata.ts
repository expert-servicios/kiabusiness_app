/**
 * Registradores de España — Directorio de Sociedades
 * https://www.registradores.org
 *
 * STATUS: STUB — pending API availability investigation.
 *
 * The Colegio de Registradores operates the Mercantile Registry in Spain and
 * provides the Directorio de Sociedades portal. As of 2025, no public REST API
 * with documented, permissive terms has been confirmed for programmatic access.
 *
 * NEXT STEPS to activate this integration:
 * 1. Contact registradores.org API team: informatica@registradores.org
 * 2. Review terms of the "Punto de Acceso General" (PAG) data sharing framework.
 * 3. Check https://www.registradores.org/opendata (if published).
 * 4. If a paid/licensed API is available, add env var REGISTRADORES_API_KEY.
 * 5. Implement HTTP client following their rate limits and attribution requirements.
 *
 * DO NOT scrape the Directorio de Sociedades web without explicit authorisation.
 * Their web (https://www.registradores.org/directorio-de-sociedades) is behind
 * a CAPTCHA and is protected by their ToS.
 *
 * ALTERNATIVE: The Central Register of Companies data is partially available via
 * the e-Justice / BRIS (Business Registers Interconnection System) for cross-border
 * queries: https://e-justice.europa.eu/489/EN/business_registers
 */

export interface RegistradoresCompany {
  name              : string;
  taxId            ?: string;
  registeredAddress?: string;
  city             ?: string;
  province         ?: string;
  postalCode       ?: string;
  registryNumber   ?: string;
  companyStatus    ?: string;
  sourceUrl         : string;
}

// ── Placeholder functions ─────────────────────────────────────────────────────

export function isRegistradoresEnabled(): boolean {
  // Will return true once the API key and endpoint are confirmed.
  return Boolean(process.env.REGISTRADORES_API_KEY);
}

/**
 * TODO: Implement when official API is available.
 * Should search the Directorio de Sociedades by company name.
 */
export async function searchByName(
  _name: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<RegistradoresCompany[]> {
  if (!isRegistradoresEnabled()) return [];
  // TODO: implement API call once endpoint is confirmed
  console.info('[registradores] API not yet implemented — skipping');
  return [];
}

/**
 * TODO: Implement when official API is available.
 * Should search by CIF/NIF.
 */
export async function searchByTaxId(
  _taxId: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<RegistradoresCompany[]> {
  if (!isRegistradoresEnabled()) return [];
  // TODO: implement API call once endpoint is confirmed
  console.info('[registradores] API not yet implemented — skipping');
  return [];
}
