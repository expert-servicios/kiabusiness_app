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
  // Holded — documentacion oficial del software ERP
  'www.holded.com',
  'help.holded.com',
  // DGT
  'sede.dgt.gob.es',
  'www.dgt.es',
  // PAE / CIRCE
  'paeelectronico.es',
  'www.circe.es',
  // Registro Mercantil Central
  'www.rmc.es',
  'rmc.es',
  // Registros (Registro Mercantil + Propiedad) — ya cubierto por registradores.org
  // Comunidades Autonomas — tributos
  'atv.gva.es',              // Valencia
  'atc.gencat.cat',          // Cataluna
  'www.atc.gencat.cat',
  'www.madrid.org',          // Madrid
  'www.bizkaia.eus',         // Pais Vasco - Bizkaia
  'www.gipuzkoa.eus',        // Pais Vasco - Gipuzkoa
  'www.araba.eus',           // Pais Vasco - Alava
  'www.juntadeandalucia.es', // Andalucia
  // Organismos locales de recaudacion
  'www.suma.es',             // SUMA Alicante
];

const OFFICIAL_SOURCE_TRIGGERS = [
  /\b(aeat|agencia tributaria|hacienda|irpf|renta|iva|modelo\s?\d+|sociedades|declaraci[oó]n|impuesto|tributari|verifactu|factura electr[oó]nica|referencia renta|n[uú]mero de referencia|renta web|c[oó]mo.*(presentar|hacer|acceder).*(renta|declaraci[oó]n))\b/i,
  /\b(seguridad social|reta|aut[oó]nomo|cotizaci[oó]n|vida laboral|n[oó]mina|contrato|baja laboral|alta laboral|importass)\b/i,
  /\b(extranjer[ií]a|nie|tie|arraigo|residencia|nacionalidad|reagrupaci[oó]n|asilo|visado)\b/i,
  /\b(sepe|paro|desempleo|prestaci[oó]n|subsidio|erte)\b/i,
  /\b(certificado digital|cl@ve|clave pin|sede electr[oó]nica|notificaci[oó]n electr[oó]nica|dehu)\b/i,
  /\b(boe|real decreto|ley|orden ministerial|normativa|recurso|sanci[oó]n|denegaci[oó]n|demanda|juzgado|justicia|notificaci[oó]n judicial)\b/i,
  /\b(mercantil|registro mercantil|sociedad limitada|constituci[oó]n de sociedad|estatutos|escritura|poder notarial|apoderado|notar[ií]a|herencia|sucesi[oó]n|compraventa)\b/i,
  /[А-Яа-яЁё].*(налог|деклара|доход|рента|ипрф|ндфл|автоном|социал|страх|резиден|внж|ниэ|nie)/i,
  /\b(tax|income|tax return|social security|residence permit|digital certificate)\b/i,
  // Holded — preguntas sobre el software ERP
  /\bholded\b/i,
  /\b(erp|facturaci[oó]n|contabilidad holded|inventario holded|proyectos holded|crm holded|control horario|rrhh holded|conciliaci[oó]n bancaria|multiempresa)\b/i,
  /\b(pack starter|migraci[oó]n holded|formaci[oó]n holded|onboarding holded|plan supervision|plan avanzado|plan colaborativo)\b/i,
  /\b(holded academy|ayuda holded|como usar holded|configurar holded|importar holded|integrar holded)\b/i,
  /(холдед|holded)/i,
  // DGT — trafico y vehiculos
  /\b(dgt|trafico|transferencia.*vehiculo|vehiculo.*transferencia|matriculacion|canje.*permiso|permiso.*conducir|puntos.*carnet|carnet.*puntos|baja.*vehiculo|circulacion|multa.*trafico|trafico.*multa|ivtm)\b/i,
  /\b(permiso de circulacion|ficha tecnica|itv.*vehiculo|vehiculo.*itv|placa|matricula)\b/i,
  // Justicia, Registros, Apostilla
  /\b(antecedentes penales|registro civil|apostilla|certificado.*nacimiento|nacimiento.*certificado|certificado.*matrimonio|denominacion social|nota simple|registro.*propiedad|registro.*mercantil|deposito.*cuentas|cuentas.*deposito)\b/i,
  /\b(mjusticia|rmc|registradores|registro mercantil central)\b/i,
  // PAE / CIRCE — creacion de empresa online
  /\b(pae electronico|circe|crear empresa online|sl online|alta autonomo online|ventanilla unica)\b/i,
  // Tributos autonomicos — ITP, ISD, AJD, Patrimonio
  /\b(itp|transmisiones patrimoniales|isd|sucesiones.*donaciones|donaciones.*sucesiones|impuesto.*herencia|herencia.*impuesto|ajd|actos juridicos documentados|impuesto de patrimonio|plusvalia.*municipal|iivtnu|suma.*alicante|atv.*valencia|hacienda.*ccaa|hacienda.*comunidad)\b/i,
];

const FALLBACK_SOURCES: Array<OfficialSource & { keywords: RegExp[] }> = [
  {
    title: 'AEAT — Como obtener el numero de referencia para la declaracion de la Renta (IRPF)',
    url: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/renta-ayuda-tecnica/obtener-referencia-renta-clave.html',
    snippet: [
      'La referencia es un codigo de 6 caracteres que permite acceder a Renta WEB y presentar la declaracion del IRPF.',
      'Solo la ultima referencia generada es valida; puedes obtener hasta 10 al dia. Es valida unicamente para la campana actual.',
      '',
      'METODO 1 — Con Cl@ve Movil (recomendado):',
      '1. Ve a https://www1.agenciatributaria.gob.es/wlpl/DABJ-REN0/ObtenerReferenciaServlet',
      '2. Selecciona "Cl@ve Movil" en la ventana de identificacion.',
      '3. Aparece un QR con validez de 5 minutos y un codigo de 3 digitos.',
      '4. Abre la app Cl@ve en tu movil, escanea el QR y verifica que la URL empieza por https://www2.agenciatributaria.gob.es',
      '5. Confirma que el codigo de 3 digitos coincide y autenticate con huella, Face ID, PIN o patron.',
      '6. La referencia de 6 caracteres aparecera en pantalla lista para copiar.',
      '',
      'METODO 2 — Con DNI/NIE sin QR (alternativa):',
      '1. En la misma URL, pulsa "continuar con autenticacion sin lectura de QR".',
      '2. Introduce tu DNI o NIE y el dato de contraste (normalmente el IBAN o casilla 505 de la declaracion anterior).',
      '3. Tras 59 segundos se activa la opcion de recibir un PIN de 6 digitos por SMS.',
      '4. Introduce el PIN recibido para completar la autenticacion y obtener la referencia.',
      '',
      'NOTA: Para declaracion conjunta, el conyuge debe obtener su propia referencia o usar sus credenciales Cl@ve.',
    ].join('\n'),
    keywords: [/referencia.*(renta|irpf|declaraci[oó]n)|renta web|n[uú]mero de referencia|c[oó]mo.*(presentar|hacer|acceder).*(renta|declaraci[oó]n)|obtener referencia|cl@ve.*(renta|irpf)|casilla 505/i],
  },
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
  // ── DGT ──────────────────────────────────────────────────────────────────────
  {
    title: 'DGT - Sede Electronica de Trafico',
    url: 'https://sede.dgt.gob.es/',
    snippet: 'Tramites DGT online: transferencias de vehiculo, matriculacion, canje de permiso de conducir extranjero, informe de puntos, baja de vehiculo, duplicados y notificaciones.',
    keywords: [/dgt|trafico|transferencia.*vehiculo|matriculacion|canje.*permiso|permiso.*conducir|puntos.*carnet|baja.*vehiculo|multa.*trafico|permiso de circulacion/i],
  },
  // ── PAE / CIRCE ───────────────────────────────────────────────────────────────
  {
    title: 'PAE Electronico / CIRCE - Creacion de empresa online',
    url: 'https://paeelectronico.es/',
    snippet: 'Portal oficial para crear una Sociedad Limitada (SL) online via CIRCE o tramitar el alta de autonomo sin desplazamientos. Requiere certificado digital.',
    keywords: [/pae|circe|crear empresa online|sl online|alta autonomo online|ventanilla unica.*empresa|constitucion.*sl.*online/i],
  },
  // ── Registro Mercantil Central ────────────────────────────────────────────────
  {
    title: 'Registro Mercantil Central - Denominacion Social',
    url: 'https://www.rmc.es/',
    snippet: 'Solicitud de certificado de denominacion social negativa (paso previo para crear una SL). Tramite online. Plazo 3-5 dias. Hasta 5 nombres alternativos por solicitud.',
    keywords: [/denominacion social|rmc|registro mercantil central|nombre.*sociedad|sociedad.*nombre/i],
  },
  // ── Justicia / Registros ──────────────────────────────────────────────────────
  {
    title: 'Ministerio de Justicia - Sede Electronica',
    url: 'https://sede.mjusticia.gob.es/',
    snippet: 'Certificado de antecedentes penales (online con certificado digital o Cl@ve, gratuito), certificados del Registro Civil (nacimiento, matrimonio, defuncion), apostilla electronica.',
    keywords: [/antecedentes penales|registro civil|apostilla|mjusticia|certificado.*nacimiento|certificado.*matrimonio/i],
  },
  {
    title: 'Registradores de Espana - Nota Simple y Registro Mercantil',
    url: 'https://www.registradores.org/',
    snippet: 'Nota simple del Registro de la Propiedad online (titularidad, cargas, hipotecas de un inmueble). Tambien notas simples del Registro Mercantil. Coste aproximado 9-12 EUR. Entrega en horas.',
    keywords: [/nota simple|registro.*propiedad|cargas.*inmueble|inmueble.*cargas|registradores|deposito.*cuentas/i],
  },
  // ── Tributos autonomicos ──────────────────────────────────────────────────────
  {
    title: 'Tributos autonomicos - ITP, ISD y AJD en España',
    url: 'https://www.agenciatributaria.es/',
    snippet: [
      'Los impuestos de transmisiones (ITP), sucesiones y donaciones (ISD) y actos juridicos documentados (AJD) son gestionados por cada CCAA.',
      'ITP en compraventas de segunda mano: 6% Madrid, 7-10% Andalucia, 10% Valencia y Cataluna, 4% Pais Vasco (aprox, verificar).',
      'ISD herencias: bonificacion 99% en Madrid y Andalucia para familiares directos; tipos significativos en Cataluna y otras CCAA.',
      'Sedes: Valencia atv.gva.es | Cataluna atc.gencat.cat | Andalucia juntadeandalucia.es | Madrid madrid.org.',
    ].join(' '),
    keywords: [/itp|transmisiones patrimoniales|isd|sucesiones|donaciones|ajd|actos juridicos|impuesto.*herencia|herencia.*impuesto|patrimonio.*ccaa/i],
  },
  {
    title: 'SUMA - Gestion Tributaria Alicante (IBI, IVTM, IAE)',
    url: 'https://www.suma.es/',
    snippet: 'Organismo de recaudacion de impuestos locales en la provincia de Alicante: IBI (impuesto sobre bienes inmuebles), IVTM (impuesto de circulacion de vehiculos) e IAE.',
    keywords: [/suma.*alicante|alicante.*suma|ibi.*alicante|alicante.*ibi|ivtm.*alicante/i],
  },
  // ── Holded ────────────────────────────────────────────────────────────────────
  {
    title: 'Holded - Funcionalidades del ERP',
    url: 'https://www.holded.com/es/funcionalidades',
    snippet: [
      'Holded es un ERP en la nube para pymes y autonomos con los siguientes modulos:',
      '• Facturacion: facturas, presupuestos, proformas, gastos, tickets de gasto.',
      '• Contabilidad: asientos automaticos, cuentas, libros oficiales (mayor, diario), modelos fiscales (303, 390, 111, 115, 347).',
      '• Inventario: almacenes, productos, variantes, pedidos de compra y venta.',
      '• Proyectos: proyectos, tareas, seguimiento de tiempo trabajado.',
      '• Equipo / RRHH: empleados, control horario (entrada/salida/pausas), ausencias, informes de presencia.',
      '• CRM: contactos, oportunidades, funnels de ventas.',
      '• Banco / Tesoreria: movimientos bancarios, conciliacion automatica, previsiones de cobros y pagos.',
      '• Multiempresa: gestion de varias sociedades desde una sola cuenta.',
    ].join('\n'),
    keywords: [/holded|erp|facturaci[oó]n holded|contabilidad holded|inventario|modulos holded|funcionalidades holded|que (tiene|incluye) holded/i],
  },
  {
    title: 'Holded - Integraciones',
    url: 'https://www.holded.com/es/integraciones',
    snippet: [
      'Holded se integra de forma nativa o via API/Zapier con:',
      '• Bancos y pagos: GoCardless (open banking), Stripe.',
      '• E-commerce: Shopify, WooCommerce, Amazon, PrestaShop.',
      '• Automatizacion: Zapier (conecta con mas de 5.000 apps).',
      '• API REST propia para integraciones personalizadas.',
      '• Importacion de datos desde Excel/CSV para migracion desde otros softwares.',
    ].join('\n'),
    keywords: [/integrac[ií][oó]n holded|holded.*integra|integra.*holded|shopify.*holded|woocommerce.*holded|stripe.*holded|gocardless.*holded|zapier.*holded|api holded/i],
  },
  {
    title: 'Holded - Precios y planes propios',
    url: 'https://www.holded.com/es/precios',
    snippet: [
      'Holded tiene planes propios del software (sin EXPERT):',
      '• Basic, Essential, Premium — desde aproximadamente 29-99 EUR/mes segun modulos y numero de usuarios.',
      '• Prueba gratuita 14 dias sin tarjeta de credito.',
      '',
      'EXPERT como Partner Oficial ofrece paquetes con Holded incluido o complementados:',
      '• Pack Starter / Onboarding Holded: 499 EUR + IVA (configuracion inicial + formacion basica).',
      '• Migracion completa sin inventario: 899 EUR + IVA.',
      '• Migracion completa con inventario: 1.199 EUR + IVA.',
      '• Formacion Holded por horas: precio segun sesiones.',
      '• Plan Supervision EXPERT: 49 EUR/mes + IVA (revision contable, sin presentacion de impuestos).',
      '• Plan Avanzado EXPERT: 99 EUR/mes + IVA (revision + impuestos basicos).',
      '• Plan Colaborativo EXPERT: 199 EUR/mes + IVA (gestion completa, informes, soporte prioritario).',
    ].join('\n'),
    keywords: [/precio.*holded|holded.*precio|cuanto cuesta holded|tarifa holded|plan.*holded|holded.*plan|pack starter|migraci[oó]n holded|supervision|avanzado|colaborativo/i],
  },
  {
    title: 'Holded Academy - Centro de ayuda',
    url: 'https://help.holded.com/es/',
    snippet: 'Documentacion oficial de Holded: guias paso a paso, tutoriales, preguntas frecuentes y novedades de todos los modulos del ERP.',
    keywords: [/holded academy|ayuda holded|como.*holded|configurar holded|tutorial holded|guia holded|help holded/i],
  },
  {
    title: 'Holded - Control horario y RRHH',
    url: 'https://www.holded.com/es/gestion-de-recursos-humanos/control-horario',
    snippet: [
      'El modulo de RRHH de Holded incluye control horario (registro de entrada/salida/pausas/ausencias) y gestion de empleados.',
      'El registro horario en Holded esta disenado para cumplimiento del registro de jornada laboral obligatorio en Espana segun el Real Decreto-ley 8/2019.',
      'Los empleados pueden fichar desde la app movil o desde "Mi zona".',
      'El administrador accede a informes de presencia, ausencias y horas trabajadas.',
      'Nota: la validez legal depende de la configuracion correcta y de las politicas internas de la empresa.',
    ].join('\n'),
    keywords: [/control horario|fichaje|holded.*rrhh|rrhh.*holded|holded.*empleado|registro horario|jornada laboral|ausencias holded|entrada.*salida holded/i],
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
