/**
 * BOE / BORME — Boletín Oficial del Registro Mercantil
 * Source: https://www.boe.es/datosabiertos/api/borme/
 *
 * IMPORTANT LIMITATIONS:
 * - BORME records historical ACTS (inscriptions), NOT current company state.
 * - A company may have changed address, capital, or administrators after the
 *   last published act. Always show the warning below to users.
 * - Data is public per Art. 21 LOPD and Reglamento del Registro Mercantil.
 *
 * Required warning when surfacing BORME data:
 * "Datos extraídos de publicaciones BORME. Requieren confirmación y pueden
 *  no reflejar la situación vigente completa de la sociedad."
 */

const BORME_API = 'https://www.boe.es/datosabiertos/api/borme';

export const BORME_DISCLAIMER =
  'Datos extraídos de publicaciones BORME. Requieren confirmación y pueden no reflejar la situación vigente completa de la sociedad.';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BormeItem {
  id       : string;
  num      : string;
  provincia: string;
  actos    : string;
}

export interface BormeSummary {
  fecha   : string;
  nbo     : string;
  items   : BormeItem[];
  fetchedAt: string;
}

export interface BormeCompanyActs {
  /** Denominación social extraída del texto */
  name              ?: string;
  taxId             ?: string;
  registeredAddress ?: string;
  postalCode        ?: string;
  city              ?: string;
  province          ?: string;
  shareCapital      ?: string;
  representativeName?: string;
  representativeRole?: string;
  incorporationDate ?: string;
  actType           : string[];
  rawText           : string;
  bormeId           : string;
  fecha             : string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDateForApi(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Returns the last N working days (Mon–Fri) as YYYYMMDD strings. */
function lastWorkingDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 1); // BORME published for previous day at earliest
  while (days.length < n) {
    if (!isWeekend(d)) days.push(formatDateForApi(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetches the BORME Sección A (Sociedades Mercantiles) summary for a given date.
 * Date format: YYYYMMDD
 */
export async function fetchBormeSummary(date: string): Promise<BormeSummary | null> {
  const url = `${BORME_API}/sumario/${date}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal : AbortSignal.timeout(12_000),
    });

    if (res.status === 404) return null; // non-working day or no publication
    if (!res.ok) {
      console.warn(`[borme] HTTP ${res.status} for ${date}`);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await res.json() as any;
    const diario = raw?.data?.sumario_borme?.diario ?? raw?.data?.diario ?? null;
    if (!diario) return null;

    const fecha = (diario['@fecha'] ?? diario.fecha ?? date) as string;
    const nbo   = (diario['@nbo']   ?? diario.nbo   ?? '')   as string;

    // Section A = Sociedades Mercantiles
    const secciones: unknown[] = Array.isArray(diario.seccion)
      ? diario.seccion
      : [diario.seccion].filter(Boolean);

    const seccionA = secciones.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s?.['@num'] === 'A' || s?.num === 'A'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;

    if (!seccionA) return { fecha, nbo, items: [], fetchedAt: new Date().toISOString() };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emisores: any[] = Array.isArray(seccionA.emisor)
      ? seccionA.emisor
      : [seccionA.emisor].filter(Boolean);

    const items: BormeItem[] = [];
    for (const emisor of emisores) {
      const provincia = (emisor['@provincia'] ?? emisor.provincia ?? '') as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawItems: any[] = Array.isArray(emisor.item) ? emisor.item : [emisor.item].filter(Boolean);
      for (const it of rawItems) {
        items.push({
          id      : (it['@id']  ?? it.id  ?? '') as string,
          num     : (it['@num'] ?? it.num ?? '') as string,
          provincia,
          actos   : (it.actos  ?? it['#text'] ?? '') as string,
        });
      }
    }

    return { fecha, nbo, items, fetchedAt: new Date().toISOString() };
  } catch (err) {
    console.warn('[borme] fetch error for', date, err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Text parsing ──────────────────────────────────────────────────────────────

const ACT_TYPES_ES = [
  'CONSTITUCIÓN', 'DISOLUCIÓN', 'LIQUIDACIÓN', 'FUSIÓN', 'ESCISIÓN',
  'TRANSFORMACIÓN', 'AMPLIACIÓN DE CAPITAL', 'REDUCCIÓN DE CAPITAL',
  'CAMBIO DE DOMICILIO', 'CAMBIO DE OBJETO', 'NOMBRAMIENTO',
  'CESE', 'REVOCACIÓN', 'PRÓRROGA', 'MODIFICACIÓN',
];

/**
 * Extracts structured fields from a raw BORME act text string.
 * Best-effort — BORME format is not fully standardised across provinces.
 */
export function parseBormeCompanyActs(
  text    : string,
  bormeId : string,
  fecha   : string,
  provincia: string,
): BormeCompanyActs {
  const t = text.toUpperCase();

  // Detect act types present
  const actType = ACT_TYPES_ES.filter((a) => t.includes(a));

  // Denominación social — usually first token before a period or NIF
  const nameMatch = text.match(
    /^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑA-Za-záéíóúüñ0-9\s,.\-'"&]+?)(?:\.\s*(?:NIF|DOMICILIO|CAPITAL|CIF)|\.{2}|$)/
  );
  const name = nameMatch?.[1]?.trim().replace(/\s+/g, ' ') ?? undefined;

  // NIF/CIF
  const taxIdMatch = text.match(/\bNIF[:\s]+([A-Z][0-9]{7}[0-9A-J]|[0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])\b/i);
  const taxId = taxIdMatch?.[1]?.toUpperCase() ?? undefined;

  // Domicilio — "DOMICILIO: Calle X, 12, CIUDAD" or "DOMICILIO SOCIAL: ..."
  const domMatch = text.match(/DOMICILIO(?:\s+SOCIAL)?[:\s]+([^.]+?)\./i);
  const domText  = domMatch?.[1]?.trim() ?? undefined;
  let registeredAddress: string | undefined;
  let postalCode       : string | undefined;
  let city             : string | undefined;
  const resolvedProvince = provincia || undefined;

  if (domText) {
    const cpMatch = domText.match(/\b(\d{5})\b/);
    postalCode        = cpMatch?.[1] ?? undefined;
    registeredAddress = domText.replace(/\s+/g, ' ');
    // City is usually the last word(s) after the postal code
    if (cpMatch) {
      const afterCp = domText.slice(domText.indexOf(cpMatch[1]) + 5).trim();
      city = afterCp.split(/[,.(]/)[0]?.trim() || undefined;
    }
  }

  // Capital social
  const capMatch = text.match(/CAPITAL(?:\s+SOCIAL)?[:\s]+([0-9.,]+\s*(?:EUR|€|EUROS)?)/i);
  const shareCapital = capMatch?.[1]?.trim() ?? undefined;

  // Administrador / Gerente / Consejero
  const repMatch = text.match(
    /(ADMINISTRADOR[A]?(?:\s+(?:ÚNICO|SOLIDARIO|MANCOMUNADO))?|GERENTE|CONSEJERO(?:\s+DELEGADO)?|LIQUIDADOR)[:\s]+([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]+?)(?:\.|,|\s{2}|$)/i
  );
  const representativeRole = repMatch?.[1]?.trim() ?? undefined;
  const representativeName = repMatch?.[2]?.trim() ?? undefined;

  // Fecha de constitución
  const incMatch = text.match(/(?:FECHA\s+DE\s+CONSTITUC?IÓN|CONSTITUIDA\s+EL)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  const incorporationDate = incMatch?.[1] ?? undefined;

  return {
    name, taxId, registeredAddress, postalCode, city,
    province: resolvedProvince,
    shareCapital, representativeName, representativeRole,
    incorporationDate,
    actType: actType.length ? actType : ['ACTO REGISTRAL'],
    rawText : text,
    bormeId, fecha,
  };
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface BormeSearchResult {
  acts    : BormeCompanyActs;
  provincia: string;
  bormeId : string;
  fecha   : string;
}

/**
 * Searches BORME publications across a date range for a company name.
 * Uses parallel batch fetching — processes `batchSize` days concurrently.
 * Stops early once `maxResults` matches are found.
 *
 * Default window: 180 working days (~9 months).
 * Pass deepSearch:true or maxDays:365 for a full-year sweep.
 *
 * NOTE: This searches only published acts — companies not recently active in
 * the Registry will not appear. For older data, use OpenCorporates as fallback.
 */
export async function searchBormeByCompanyName(
  name      : string,
  options   : {
    fromDate  ?: string;
    toDate    ?: string;
    maxDays   ?: number;
    maxResults?: number;
    deepSearch?: boolean;
    batchSize ?: number;
  } = {},
): Promise<BormeSearchResult[]> {
  const {
    maxDays    = options.deepSearch ? 365 : 180,
    maxResults = 5,
    batchSize  = 20,
  } = options;

  const needle  = name.toUpperCase().replace(/\s+/g, ' ').trim();
  const days    = lastWorkingDays(maxDays);
  const results : BormeSearchResult[] = [];

  // Parallel batch fetching — batchSize days fetched concurrently per round
  for (let i = 0; i < days.length; i += batchSize) {
    if (results.length >= maxResults) break;

    const batch     = days.slice(i, i + batchSize);
    const summaries = await Promise.all(batch.map((day) => fetchBormeSummary(day)));

    for (const summary of summaries) {
      if (!summary || results.length >= maxResults) continue;
      for (const item of summary.items) {
        if (!item.actos.toUpperCase().includes(needle.slice(0, 20))) continue;
        const acts = parseBormeCompanyActs(item.actos, item.id, summary.fecha, item.provincia);
        if (!acts.name?.toUpperCase().includes(needle.slice(0, 10))) continue;
        results.push({ acts, provincia: item.provincia, bormeId: item.id, fecha: summary.fecha });
        if (results.length >= maxResults) break;
      }
    }
  }

  return results;
}
