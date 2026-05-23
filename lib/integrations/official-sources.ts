export interface OfficialSource {
  title: string;
  url: string;
  snippet?: string;
}

interface OfficialSourceLookup {
  mode: 'live' | 'fallback';
  summary: string;
  sources: OfficialSource[];
}

const OFFICIAL_DOMAINS = [
  'sede.agenciatributaria.gob.es',
  'www3.agenciatributaria.gob.es',
  'agenciatributaria.gob.es',
  'aeat.es',
  'seg-social.es',
  'www.seg-social.es',
  'sede.seg-social.gob.es',
  'importass.seg-social.es',
  'sede.inclusion.gob.es',
  'inclusion.gob.es',
  'www.inclusion.gob.es',
  'boe.es',
  'www.boe.es',
  'sepe.es',
  'www.sepe.es',
  'clave.gob.es',
  'www.clave.gob.es',
  'administracion.gob.es',
  'sede.administracionespublicas.gob.es',
  'administraciondejusticia.gob.es',
  'www.administraciondejusticia.gob.es',
  'interior.gob.es',
  'www.interior.gob.es',
  'mjusticia.gob.es',
  'www.mjusticia.gob.es',
  'sede.mjusticia.gob.es',
  'justicia.es',
  'sedejudicial.justicia.es',
  'mpt.gob.es',
  'www.mpt.gob.es',
  'poderjudicial.es',
  'www.poderjudicial.es',
  'registradores.org',
  'www.registradores.org',
];

const OFFICIAL_SOURCE_TRIGGERS = [
  /\b(aeat|agencia tributaria|hacienda|irpf|renta|iva|modelo\s?\d+|sociedades|declaraci[oó]n|impuesto|tributari|verifactu|factura electr[oó]nica)\b/i,
  /\b(seguridad social|reta|aut[oó]nomo|cotizaci[oó]n|vida laboral|n[oó]mina|contrato|baja laboral|alta laboral|importass)\b/i,
  /\b(extranjer[ií]a|nie|tie|arraigo|residencia|nacionalidad|reagrupaci[oó]n|asilo|visado)\b/i,
  /\b(sepe|paro|desempleo|prestaci[oó]n|subsidio|erte)\b/i,
  /\b(certificado digital|cl@ve|clave pin|sede electr[oó]nica|notificaci[oó]n electr[oó]nica|dehu)\b/i,
  /\b(boe|real decreto|ley|orden ministerial|normativa|recurso|sanci[oó]n|denegaci[oó]n|demanda|juzgado|justicia|notificaci[oó]n judicial)\b/i,
  /\b(mercantil|registro mercantil|sociedad limitada|constituci[oó]n de sociedad|estatutos|escritura|poder notarial|apoderado|notar[ií]a|herencia|sucesi[oó]n|compraventa)\b/i,
  /[А-Яа-яЁё].*(налог|деклара|доход|рента|ипрф|ндфл|автоном|социал|страх|резиден|внж|ниэ|nie)/i,
  /\b(tax|income|tax return|social security|residence permit|digital certificate)\b/i,
];

const FALLBACK_SOURCES: Array<OfficialSource & { keywords: RegExp[] }> = [
  {
    title: 'Agencia Tributaria - Sede electronica',
    url: 'https://sede.agenciatributaria.gob.es/',
    snippet: 'Tramites, declaraciones, modelos, notificaciones y ayuda oficial de la AEAT.',
    keywords: [/aeat|agencia tributaria|hacienda|irpf|renta|iva|modelo|impuesto|declaraci|tributari|verifactu/i],
  },
  {
    title: 'Seguridad Social - Portal oficial',
    url: 'https://www.seg-social.es/wps/portal/wss/internet/Inicio',
    snippet: 'Informacion oficial sobre afiliacion, cotizacion, prestaciones y tramites de Seguridad Social.',
    keywords: [/seguridad social|reta|cotizaci|vida laboral|n[oó]mina|contrato|prestaci|baja laboral|alta laboral/i],
  },
  {
    title: 'Importass - Tesoreria General de la Seguridad Social',
    url: 'https://importass.seg-social.es/',
    snippet: 'Portal oficial para vida laboral, altas, bajas, cuotas y tramites de la TGSS.',
    keywords: [/importass|reta|aut[oó]nomo|vida laboral|alta|baja|cuota|cotizaci/i],
  },
  {
    title: 'Sede Electronica de Inclusion, Seguridad Social y Migraciones',
    url: 'https://sede.inclusion.gob.es/',
    snippet: 'Sede oficial del Ministerio de Inclusion, Seguridad Social y Migraciones.',
    keywords: [/seguridad social|migraciones|extranjer|residencia|nie|tie|arraigo/i],
  },
  {
    title: 'Ministerio - Migraciones',
    url: 'https://www.inclusion.gob.es/web/migraciones',
    snippet: 'Informacion oficial sobre extranjeria, inmigracion y migraciones.',
    keywords: [/extranjer|nie|tie|arraigo|residencia|nacionalidad|reagrupaci|asilo|visado/i],
  },
  {
    title: 'SEPE - Servicio Publico de Empleo Estatal',
    url: 'https://www.sepe.es/HomeSepe',
    snippet: 'Informacion oficial sobre prestaciones, subsidios, empleo y formacion.',
    keywords: [/sepe|paro|desempleo|prestaci|subsidio|erte|empleo/i],
  },
  {
    title: 'BOE - Busqueda legislativa',
    url: 'https://www.boe.es/buscar/',
    snippet: 'Busqueda oficial de leyes, reales decretos, ordenes y normativa publicada.',
    keywords: [/boe|real decreto|ley|orden ministerial|normativa|reglamento|sanci|recurso|denegaci|mercantil|laboral|juridic/i],
  },
  {
    title: 'Ministerio de Justicia',
    url: 'https://www.mjusticia.gob.es/',
    snippet: 'Informacion oficial sobre tramites de justicia, registros, certificados y servicios al ciudadano.',
    keywords: [/justicia|registro civil|certificado|recurso|juzgado|demanda|herencia|sucesi|notar/i],
  },
  {
    title: 'Administracion de Justicia - Sede judicial electronica',
    url: 'https://sedejudicial.justicia.es/',
    snippet: 'Acceso oficial a tramites y servicios de la Administracion de Justicia.',
    keywords: [/juzgado|demanda|notificaci|justicia|procedimiento judicial|expediente judicial/i],
  },
  {
    title: 'Registradores de Espana',
    url: 'https://www.registradores.org/',
    snippet: 'Informacion y servicios oficiales de Registro Mercantil, Propiedad y Bienes Muebles.',
    keywords: [/registradores|registro mercantil|mercantil|sociedad limitada|sl|propiedad|bien inmueble|nota simple|compraventa/i],
  },
  {
    title: 'Cl@ve - Identidad electronica',
    url: 'https://clave.gob.es/',
    snippet: 'Informacion oficial sobre Cl@ve, certificados e identificacion electronica.',
    keywords: [/cl@ve|clave pin|certificado digital|identificaci[oó]n|sede electr[oó]nica/i],
  },
];

export function shouldUseOfficialSources(text: string): boolean {
  if (process.env.OFFICIAL_SEARCH_ENABLED?.toLowerCase() === 'false') return false;
  return OFFICIAL_SOURCE_TRIGGERS.some((pattern) => pattern.test(text));
}

export async function buildOfficialSourceContext(query: string): Promise<string> {
  if (!shouldUseOfficialSources(query)) return '';

  const lookup = await lookupOfficialSources(query);
  if (!lookup || lookup.sources.length === 0) return '';

  const sourceLines = lookup.sources
    .slice(0, 5)
    .map((source) => `- ${source.title}: ${source.url}${source.snippet ? `\n  ${source.snippet}` : ''}`)
    .join('\n');

  const status =
    lookup.mode === 'live'
      ? 'Busqueda en vivo limitada a dominios oficiales.'
      : 'Busqueda en vivo no disponible; enlaces oficiales de referencia seleccionados por tema.';

  return `FUENTES OFICIALES DISPONIBLES:
${status}

Resumen/documentacion encontrada:
${lookup.summary}

Enlaces oficiales:
${sourceLines}

Reglas de uso de fuentes:
- Usa estas fuentes como apoyo para orientar con pasos practicos y criterio profesional.
- Si das informacion administrativa, incluye 1 o 2 enlaces oficiales relevantes.
- No inventes plazos, importes, requisitos ni documentos si no aparecen en el contexto oficial.
- Si la consulta exige presentar escritos, representar al usuario o revisar documentacion sensible, recomienda cita o revision profesional.`;
}

async function lookupOfficialSources(query: string): Promise<OfficialSourceLookup | null> {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  if (openAiKey) {
    try {
      const live = await searchOfficialSourcesWithOpenAi(query, openAiKey);
      if (live && (live.summary || live.sources.length > 0)) return live;
    } catch (error) {
      console.error('[Official sources] OpenAI web search failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const fallback = getFallbackSources(query);
  if (fallback.length === 0) return null;

  return {
    mode: 'fallback',
    summary:
      'No se ha podido obtener contenido actualizado mediante busqueda en vivo. Usa estos portales oficiales como punto de partida y evita afirmar que el dato esta verificado hoy.',
    sources: fallback,
  };
}

async function searchOfficialSourcesWithOpenAi(query: string, apiKey: string): Promise<OfficialSourceLookup | null> {
  let lastError: Error | null = null;

  for (const toolType of ['web_search', 'web_search_preview'] as const) {
    try {
      const data = await callOpenAiOfficialSearch(query, apiKey, toolType);
      const summary = extractResponseText(data);
      const sources = extractCitations(data).filter((source) => isAllowedOfficialUrl(source.url));

      if (toolType === 'web_search_preview' && sources.length === 0) {
        return null;
      }

      return {
        mode: 'live',
        summary: summary || 'Busqueda oficial realizada, pero no se obtuvo un resumen textual claro.',
        sources: sources.length > 0 ? sources : getFallbackSources(query),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OpenAI web search error');
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

async function callOpenAiOfficialSearch(query: string, apiKey: string, toolType: 'web_search' | 'web_search_preview'): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const tool =
    toolType === 'web_search'
      ? {
          type: 'web_search',
          filters: { allowed_domains: OFFICIAL_DOMAINS },
          external_web_access: true,
        }
      : { type: 'web_search_preview' };

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OFFICIAL_SEARCH_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini',
        max_output_tokens: 900,
        tools: [tool],
        input: [
          {
            role: 'system',
            content:
              'Eres un buscador documental para una gestoria espanola. Busca solo en dominios oficiales espanoles permitidos. Resume en espanol lo encontrado con prudencia. Prioriza AEAT, Seguridad Social, BOE, SEPE, Cl@ve, Migraciones y sedes electronicas oficiales. No des asesoramiento personalizado.',
          },
          {
            role: 'user',
            content: `Consulta del cliente en WhatsApp: ${query}`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(extractApiError(data, response.status));
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function getFallbackSources(query: string): OfficialSource[] {
  const matches = FALLBACK_SOURCES.filter((source) => source.keywords.some((pattern) => pattern.test(query)));
  const selected = matches.length > 0 ? matches : FALLBACK_SOURCES.slice(0, 4);
  return selected.slice(0, 5).map(({ keywords: _keywords, ...source }) => source);
}

function extractResponseText(data: unknown): string {
  if (!isRecord(data) || !Array.isArray(data.output)) return '';

  for (const item of data.output) {
    if (!isRecord(item) || item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === 'string') {
        return content.text.trim();
      }
    }
  }

  return '';
}

function extractCitations(data: unknown): OfficialSource[] {
  if (!isRecord(data) || !Array.isArray(data.output)) return [];

  const citations: OfficialSource[] = [];

  for (const item of data.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content) || !Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        if (!isRecord(annotation) || annotation.type !== 'url_citation') continue;
        const url = typeof annotation.url === 'string' ? annotation.url : '';
        if (!url) continue;
        citations.push({
          title: typeof annotation.title === 'string' && annotation.title ? annotation.title : getHostLabel(url),
          url,
        });
      }
    }
  }

  return dedupeSources(citations);
}

function dedupeSources(sources: OfficialSource[]): OfficialSource[] {
  const seen = new Set<string>();
  const unique: OfficialSource[] = [];

  for (const source of sources) {
    const key = normalizeUrl(source.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(source);
  }

  return unique;
}

function isAllowedOfficialUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OFFICIAL_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function getHostLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'Fuente oficial';
  }
}

function extractApiError(data: unknown, status: number): string {
  if (isRecord(data) && isRecord(data.error) && typeof data.error.message === 'string') {
    return `HTTP ${status}: ${data.error.message}`;
  }

  return `HTTP ${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
