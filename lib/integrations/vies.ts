/**
 * VIES — VAT Information Exchange System (EU)
 * Used exclusively for intra-EU VAT number validation.
 * NOT a source of mercantile data — use only as a format/existence check.
 *
 * REST endpoint: https://ec.europa.eu/taxation_customs/vies/rest-api/ms/{CC}/vat/{number}
 * Docs: https://ec.europa.eu/taxation_customs/vies/#/technical-information
 */

export interface ViesResult {
  valid        : boolean;
  countryCode  : string;
  vatNumber    : string;
  name        ?: string;
  address     ?: string;
  consultedAt  : string;
  error       ?: string;
}

const VIES_BASE = 'https://ec.europa.eu/taxation_customs/vies/rest-api';

/**
 * Validates an intra-EU VAT number via the VIES REST API.
 * For Spain: pass countryCode='ES' and the CIF/NIF without the ES prefix.
 *
 * Returns null on network/timeout errors so callers can gracefully degrade.
 */
export async function validateVat(
  countryCode : string,
  vatNumber   : string,
): Promise<ViesResult | null> {
  const cc  = countryCode.toUpperCase().trim();
  const vat = vatNumber.toUpperCase().replace(/\s/g, '');
  const url = `${VIES_BASE}/ms/${cc}/vat/${encodeURIComponent(vat)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal : AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return {
        valid       : false,
        countryCode : cc,
        vatNumber   : vat,
        consultedAt : new Date().toISOString(),
        error       : `VIES HTTP ${res.status}`,
      };
    }

    const data = await res.json() as {
      isValid       ?: boolean;
      valid         ?: boolean;
      name          ?: string;
      address       ?: string;
      userError     ?: string;
    };

    const isValid = data.isValid ?? data.valid ?? false;

    return {
      valid       : isValid,
      countryCode : cc,
      vatNumber   : vat,
      name        : isValid ? (data.name ?? undefined) : undefined,
      address     : isValid ? (data.address ?? undefined) : undefined,
      consultedAt : new Date().toISOString(),
      error       : data.userError ?? undefined,
    };
  } catch (err) {
    // Network / timeout — degrade gracefully
    console.warn('[vies] request failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Convenience wrapper: validates a Spanish tax ID against VIES.
 * The Spanish VAT prefix is 'ES'. Only works for CIF (companies) and
 * some NIFs; NIEs and personas físicas are not intra-EU VAT registered.
 */
export async function validateSpanishVat(taxId: string): Promise<ViesResult | null> {
  const clean = taxId.toUpperCase().replace(/\s/g, '').replace(/^ES/, '');
  return validateVat('ES', clean);
}
