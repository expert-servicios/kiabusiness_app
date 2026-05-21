// ── Viability check definitions per service ──────────────────────────────────
// Used by: ViabilityModal (web), evaluateViability (AI), Kia PRECAL_FLOWS (WA)

export type QuestionType = 'boolean' | 'select' | 'text' | 'number';

export interface VOption {
  value: string;
  label: string;
  disqualifies?: boolean; // selecting this = NO VIABLE
  escalates?: boolean;    // selecting this = needs human review
}

export interface VQuestion {
  id: string;
  type: QuestionType;
  label: string;
  hint?: string;
  required: boolean;
  options?: VOption[];
  disqualifiesIfFalse?: boolean; // boolean: answering No = NO VIABLE
  disqualifiesIfTrue?: boolean;  // boolean: answering Sí = NO VIABLE
  escalatesIfTrue?: boolean;     // boolean: answering Sí = escalate
}

export interface VDoc {
  id: string;
  label: string;
  required: boolean;
  howToGet?: string;
}

export interface ViabilityCheck {
  serviceSlug: string;
  serviceName: string;
  intro: string;
  estimatedMinutes: number;
  questions: VQuestion[];
  docs: VDoc[];
  // Legal criteria fed to Claude for evaluation
  aiCriteria: string;
}

// ── IRPF — Declaración de la Renta ───────────────────────────────────────────

const irpf: ViabilityCheck = {
  serviceSlug: 'irpf',
  serviceName: 'Declaración de la Renta (IRPF)',
  intro: 'Comprueba en 2 minutos si tu caso es apto y qué documentación necesitas preparar.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'ejercicio',
      type: 'select',
      label: '¿Para qué ejercicio fiscal es la declaración?',
      required: true,
      options: [
        { value: '2025', label: 'Renta 2025 (campaña 2026)' },
        { value: '2024', label: 'Renta 2024' },
        { value: '2023', label: 'Renta 2023 o ejercicio anterior' },
      ],
    },
    {
      id: 'residente',
      type: 'boolean',
      label: '¿Resides habitualmente en España más de 183 días al año?',
      hint: 'Si resides menos de 183 días, tu declaración sería como no residente (IRNR), no IRPF.',
      required: true,
    },
    {
      id: 'situacion_laboral',
      type: 'select',
      label: '¿Cuál fue tu situación laboral principal durante el ejercicio?',
      required: true,
      options: [
        { value: 'empleado',    label: 'Empleado por cuenta ajena (con nómina)' },
        { value: 'autonomo',    label: 'Autónomo' },
        { value: 'pensionista', label: 'Pensionista o jubilado' },
        { value: 'desempleado', label: 'Desempleado / ERTE / prestación' },
        { value: 'mixto',       label: 'Varias fuentes de ingresos' },
        { value: 'estudiante',  label: 'Estudiante sin ingresos' },
      ],
    },
    {
      id: 'requerimiento',
      type: 'boolean',
      label: '¿Has recibido algún requerimiento o notificación de la Agencia Tributaria?',
      hint: 'Si tienes un requerimiento, la presentación es urgente y tiene plazos estrictos.',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'bienes_extranjero',
      type: 'boolean',
      label: '¿Tienes bienes, cuentas bancarias o rentas fuera de España?',
      hint: 'Cuentas en el extranjero, inmuebles, fondos de inversión, dividendos de empresas extranjeras, etc.',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'identificacion',
      type: 'select',
      label: '¿Con qué método de identificación cuentas para acceder a la Sede Electrónica de la AEAT?',
      required: true,
      options: [
        { value: 'certificado', label: 'Certificado digital (FNMT u otro)' },
        { value: 'clave',       label: 'Cl@ve PIN o Cl@ve permanente' },
        { value: 'referencia',  label: 'Número de referencia (de la renta anterior)' },
        { value: 'ninguno',     label: 'No tengo ninguno', escalates: true },
      ],
    },
  ],
  docs: [
    { id: 'dni', label: 'DNI / NIE en vigor', required: true },
    {
      id: 'identificacion_aeat',
      label: 'Referencia AEAT, Cl@ve PIN o certificado digital',
      required: false,
      howToGet: 'Puedes solicitar el número de referencia en https://sede.agenciatributaria.gob.es con tu IBAN bancario',
    },
    { id: 'cert_empresa', label: 'Certificado de ingresos de tu empresa (si eres empleado)', required: false },
    { id: 'extracto_banco', label: 'Extracto bancario (si tienes alquiler, inversiones o cuentas en el extranjero)', required: false },
  ],
  aiCriteria: `Eres un asesor fiscal experto en España. Evalúa si el caso del cliente es VIABLE para la declaración de IRPF.

NORMATIVA APLICABLE:
- Ley 35/2006 del IRPF y RD 439/2007 (Reglamento IRPF)
- Están OBLIGADOS a declarar quienes obtengan rendimientos del trabajo >22.000€ de un pagador (o >14.000€ con varios pagadores o si el segundo pagador supera 1.500€).
- También obligan: rendimientos de capital o ganancias patrimoniales >1.600€, imputaciones de renta, o cualquier cuantía si hay pérdidas patrimoniales >500€.
- Los NO residentes (menos de 183 días en España) tributan por IRNR, no por IRPF.
- Si hay bienes en el extranjero >50.000€, puede haber obligación de Modelo 720.
- Si hay requerimiento de Hacienda, la declaración es urgente y puede haber sanciones.

CRITERIOS DE VIABILIDAD:
- VIABLE: Residente en España, situación laboral clara, método de identificación disponible.
- PARCIAL: Sin método de identificación (podemos ayudar), ejercicio muy anterior (limitaciones).
- NO VIABLE: No residente en España (debe hacer IRNR, no IRPF).
- ESCALAR: Requerimiento de Hacienda, bienes en el extranjero, situaciones fiscales complejas.`,
};

// ── Arraigo Social ────────────────────────────────────────────────────────────

const arraigo_social: ViabilityCheck = {
  serviceSlug: 'arraigo-social',
  serviceName: 'Arraigo Social',
  intro: 'El arraigo social requiere 3 años de empadronamiento y, en la mayoría de los casos, contrato de trabajo. Verifica tu situación en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'anios_empadronado',
      type: 'select',
      label: '¿Cuántos años llevas empadronado ininterrumpidamente en España?',
      hint: 'Las ausencias de más de 90 días seguidos pueden interrumpir el cómputo.',
      required: true,
      options: [
        { value: 'menos_de_3', label: 'Menos de 3 años', disqualifies: true },
        { value: 'exactamente_3', label: 'Exactamente 3 años (o a punto de cumplirlos)' },
        { value: 'mas_de_3', label: 'Más de 3 años' },
      ],
    },
    {
      id: 'situacion_actual',
      type: 'select',
      label: '¿Cuál es tu situación migratoria actual en España?',
      required: true,
      options: [
        { value: 'sin_permiso',   label: 'Sin permiso de residencia (situación irregular)' },
        { value: 'caducado',      label: 'Permiso caducado (en renovación o no renovado)' },
        { value: 'otro_permiso',  label: 'Tengo otro tipo de permiso vigente' },
      ],
    },
    {
      id: 'contrato_trabajo',
      type: 'boolean',
      label: '¿Tienes una oferta o contrato de trabajo de al menos 30 horas semanales?',
      hint: 'Si no tienes contrato, también puede solicitarse mediante medios económicos propios, vínculos familiares u otras excepciones.',
      required: true,
    },
    {
      id: 'medios_propios',
      type: 'boolean',
      label: 'Si no tienes contrato: ¿Dispones de medios económicos propios suficientes (mínimo ~600€/mes)?',
      hint: 'Solo relevante si no tienes contrato de trabajo. Si tienes contrato, puedes omitir esta pregunta.',
      required: false,
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      hint: 'Los antecedentes penales en vigor suponen causa de denegación directa.',
      required: true,
      disqualifiesIfTrue: true,
    },
    {
      id: 'prohibicion_entrada',
      type: 'boolean',
      label: '¿Tienes alguna resolución de expulsión o prohibición de entrada en España o la UE vigente?',
      required: true,
      disqualifiesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor (todas las páginas)', required: true },
    {
      id: 'empadronamiento_historico',
      label: 'Empadronamiento histórico de los últimos 3 años',
      required: true,
      howToGet: 'Solicítalo en tu Ayuntamiento o en la sede electrónica municipal con certificado digital.',
    },
    {
      id: 'contrato_oferta',
      label: 'Contrato de trabajo u oferta laboral (firmada por empleador)',
      required: false,
    },
    {
      id: 'nominas',
      label: 'Últimas 3 nóminas (si ya trabajas)',
      required: false,
    },
    {
      id: 'antecedentes_pais_origen',
      label: 'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      required: true,
      howToGet: 'Solicítalo en el consulado o ministerio de justicia de tu país. Debe apostillarse y traducirse al español.',
    },
    { id: 'foto', label: 'Foto reciente en fondo blanco (tamaño carné)', required: true },
  ],
  aiCriteria: `Eres un experto en extranjería española. Evalúa si el caso es VIABLE para el Arraigo Social.

NORMATIVA APLICABLE:
- Art. 124 del RD 557/2011 (Reglamento de la Ley de Extranjería, modificado por RD 629/2022).
- Requisitos imprescindibles:
  1. Permanencia continuada en España de al menos 3 años (ausencias <90 días sin interrumpir el cómputo).
  2. Empadronamiento continuado durante esos 3 años.
  3. Ausencia de antecedentes penales en España y país de origen.
  4. No tener resolución de expulsión o prohibición de entrada vigente.
  5. Contrato de trabajo de mínimo 30h/semana, O bien relaciones familiares con residentes legales en España, O medios económicos propios.

CRITERIOS DE VIABILIDAD:
- VIABLE: Cumple años de empadronamiento, sin antecedentes, con contrato de trabajo o medios propios.
- PARCIAL: Cumple tiempo pero sin contrato (explorar otras vías: vínculos familiares, medios propios, arraigo familiar).
- NO VIABLE: Menos de 3 años de empadronamiento, antecedentes penales en vigor, o prohibición de entrada vigente.
- ESCALAR: Situaciones mixtas, ausencias prolongadas, historiales migratorios complejos.`,
};

// ── Arraigo Familiar ──────────────────────────────────────────────────────────

const arraigo_familiar: ViabilityCheck = {
  serviceSlug: 'arraigo-familiar',
  serviceName: 'Arraigo Familiar',
  intro: 'El arraigo familiar se basa en vínculos con ciudadanos españoles o residentes legales. Verifica en 2 minutos si cumples los requisitos.',
  estimatedMinutes: 2,
  questions: [
    {
      id: 'vinculo',
      type: 'select',
      label: '¿Cuál es tu vínculo con el ciudadano español o el residente legal?',
      required: true,
      options: [
        { value: 'hijo_de_espanol',        label: 'Soy hijo/a de padre o madre de nacionalidad española' },
        { value: 'padre_de_hijo_espanol',  label: 'Soy padre/madre de un hijo/a con nacionalidad española' },
        { value: 'conyuge_de_espanol',     label: 'Estoy casado/a o en pareja de hecho con ciudadano/a español/a' },
        { value: 'otro',                   label: 'Otro vínculo familiar', escalates: true },
      ],
    },
    {
      id: 'familiar_acredita',
      type: 'boolean',
      label: '¿Puede el familiar acreditar la ciudadanía española o la residencia legal vigente?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'convivencia',
      type: 'boolean',
      label: '¿Convives o has convivido con ese familiar en España?',
      hint: 'No siempre es obligatorio, pero refuerza la solicitud.',
      required: false,
    },
    {
      id: 'situacion_actual',
      type: 'select',
      label: '¿Cuál es tu situación migratoria actual?',
      required: true,
      options: [
        { value: 'irregular', label: 'Sin permiso de residencia' },
        { value: 'caducado',  label: 'Permiso caducado' },
        { value: 'otro',      label: 'Tengo otro tipo de permiso vigente' },
      ],
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor (todas las páginas)', required: true },
    {
      id: 'doc_familiar',
      label: 'DNI español o TIE del familiar de referencia',
      required: true,
    },
    {
      id: 'doc_vinculo',
      label: 'Documento acreditativo del vínculo familiar (libro de familia, partida de nacimiento, certificado de matrimonio)',
      required: true,
    },
    {
      id: 'empadronamiento',
      label: 'Empadronamiento actualizado (máx. 3 meses)',
      required: true,
    },
    {
      id: 'antecedentes_pais_origen',
      label: 'Certificado de antecedentes penales del país de origen (apostillado y traducido si aplica)',
      required: false,
    },
    { id: 'foto', label: 'Foto reciente en fondo blanco (tamaño carné)', required: true },
  ],
  aiCriteria: `Eres un experto en extranjería española. Evalúa si el caso es VIABLE para el Arraigo Familiar.

NORMATIVA APLICABLE:
- Art. 125 del RD 557/2011 (Reglamento de la Ley de Extranjería, modificado por RD 629/2022).
- Supuestos de arraigo familiar:
  A) Ser padre/madre de un menor con nacionalidad española (no requiere tiempo mínimo de estancia).
  B) Ser hijo/a de padre o madre originariamente español (nacido español, no por adquisición).
  C) Ser cónyuge o pareja de hecho registrada de residente legal en España (se requiere convivencia acreditada).
- En todos los casos: ausencia de antecedentes penales y no tener orden de expulsión vigente.
- No se requiere un tiempo mínimo de empadronamiento en todos los supuestos (a diferencia del arraigo social).

CRITERIOS DE VIABILIDAD:
- VIABLE: Tiene el vínculo familiar correcto, el familiar acredita su situación legal, sin antecedentes graves.
- PARCIAL: Vínculo familiar pero dudas sobre la documentación acreditativa o la situación del familiar.
- NO VIABLE: Sin vínculo familiar acreditable, familiar sin situación legal regularizada.
- ESCALAR: Antecedentes penales, órdenes de expulsión previas, situaciones familiares complejas.`,
};

// ── Nacionalidad Española ─────────────────────────────────────────────────────

const nacionalidad: ViabilityCheck = {
  serviceSlug: 'nacionalidad-espanola',
  serviceName: 'Nacionalidad Española',
  intro: 'La nacionalidad española requiere tiempo de residencia legal, exámenes y documentación apostillada. Verifica tu situación en 4 minutos.',
  estimatedMinutes: 4,
  questions: [
    {
      id: 'via',
      type: 'select',
      label: '¿Por qué vía quieres solicitar la nacionalidad española?',
      required: true,
      options: [
        { value: '10_anos',          label: '10 años de residencia legal continuada (vía general)' },
        { value: '5_anos_asilo',     label: '5 años como refugiado o asilado en España' },
        { value: '2_anos_iberoam',   label: '2 años (ciudadanos de países iberoamericanos, Portugal, Filipinas, Guinea Ecuatorial, Andorra o Sefardíes)' },
        { value: '1_ano_casado',     label: '1 año (casado/a con español/a)' },
        { value: '1_ano_nacido',     label: '1 año (nacido/a en España)' },
        { value: 'no_se',            label: 'No sé cuál me corresponde', escalates: true },
      ],
    },
    {
      id: 'tiempo_residencia',
      type: 'boolean',
      label: '¿Llevas el tiempo de residencia legal requerido (según tu vía) sin interrupciones superiores a 90 días consecutivos?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'tie_continuo',
      type: 'boolean',
      label: '¿Has mantenido el TIE (tarjeta de identificación de extranjero) vigente durante todo el período de residencia?',
      hint: 'Períodos sin TIE válido pueden no computar como residencia legal.',
      required: true,
      escalatesIfTrue: false,
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'dele',
      type: 'select',
      label: '¿Tienes el certificado DELE A2 (o superior) de español?',
      hint: 'Obligatorio para ciudadanos de países no hispanohablantes. Los nacionales de países hispanohablantes están exentos.',
      required: true,
      options: [
        { value: 'tengo_dele',       label: 'Sí, tengo DELE A2 o superior' },
        { value: 'hispanohablante',  label: 'Soy de un país hispanohablante (exento)' },
        { value: 'en_proceso',       label: 'Estoy en proceso de obtenerlo', escalates: true },
        { value: 'ninguno',          label: 'No lo tengo aún', escalates: true },
      ],
    },
    {
      id: 'ccse',
      type: 'select',
      label: '¿Tienes el certificado CCSE (Conocimiento de la Constitución y Sociedad Española)?',
      required: true,
      options: [
        { value: 'tengo_ccse',  label: 'Sí, tengo el CCSE' },
        { value: 'en_proceso',  label: 'Estoy en proceso de obtenerlo', escalates: true },
        { value: 'ninguno',     label: 'No lo tengo aún', escalates: true },
      ],
    },
    {
      id: 'cert_nacimiento',
      type: 'boolean',
      label: '¿Tienes el certificado de nacimiento apostillado y traducido al español?',
      required: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor (todas las páginas)', required: true },
    { id: 'tie', label: 'TIE (Tarjeta de Identificación de Extranjero) vigente', required: true },
    {
      id: 'empadronamiento_historico',
      label: 'Empadronamiento histórico (desde el inicio de la residencia)',
      required: true,
      howToGet: 'Solicítalo en tu Ayuntamiento. Debe reflejar toda la residencia continuada.',
    },
    {
      id: 'antecedentes_origen',
      label: 'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      required: true,
      howToGet: 'Solicítalo en el consulado o ministerio de justicia de tu país de origen.',
    },
    {
      id: 'cert_nacimiento',
      label: 'Certificado de nacimiento (apostillado y traducido al español)',
      required: true,
      howToGet: 'Solicítalo en el registro civil de tu país. Debe llevar apostilla de La Haya y traducción jurada al español.',
    },
    { id: 'dele', label: 'Diploma DELE A2 o superior (Instituto Cervantes)', required: false },
    { id: 'ccse', label: 'Certificado CCSE (Instituto Cervantes)', required: false },
    { id: 'foto', label: 'Foto reciente en fondo blanco (tamaño carné)', required: true },
  ],
  aiCriteria: `Eres un experto en extranjería y nacionalidad española. Evalúa si el caso es VIABLE para adquirir la nacionalidad española.

NORMATIVA APLICABLE:
- Arts. 17-26 del Código Civil español (redacción vigente 2024).
- LO 4/2000 de Extranjería y su Reglamento (RD 557/2011).
- Ley 12/2015 (nacionalidad para sefardíes, ya cerrada).
- Instrucción DGRN de 26/07/2007 y circulares posteriores.

PLAZOS DE RESIDENCIA LEGAL REQUERIDOS:
- Regla general: 10 años de residencia legal continuada.
- 5 años: Refugiados y asilados.
- 2 años: Nacionales de países iberoamericanos (incluye Argentina, Bolivia, Brasil, Chile, Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Guatemala, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, República Dominicana, Uruguay, Venezuela), Portugal, Andorra, Filipinas, Guinea Ecuatorial, Sefardíes.
- 1 año: Nacido en España, casado/a con español/a (desde fecha boda), viudo/a de español/a sin separación legal, comprendido en el segundo grado de consanguinidad de originariamente español.

REQUISITOS ADICIONALES:
- Residencia legal y continuada (interrupciones >90 días seguidos pueden ser problemáticas).
- Buena conducta cívica (sin antecedentes penales relevantes en España ni en el país de origen).
- Suficiente integración en la sociedad española (DELE A2 + CCSE, salvo exenciones).
- Para no hispanohablantes: DELE A2 o superior obligatorio.
- CCSE obligatorio para todos salvo excepciones.

CRITERIOS DE VIABILIDAD:
- VIABLE: Cumple tiempo de residencia según su vía, sin antecedentes, tiene o está en proceso de DELE y CCSE.
- PARCIAL: Cumple tiempo pero faltan los certificados DELE/CCSE (podemos gestionar la tramitación mientras los obtiene).
- NO VIABLE: No cumple el tiempo mínimo de residencia requerido para su vía.
- ESCALAR: Antecedentes penales, períodos sin TIE, situaciones familiares complejas, dudas sobre la vía aplicable.`,
};

// ── Nacionalidad para menor nacido en España ──────────────────────────────────

const nacionalidad_menor: ViabilityCheck = {
  serviceSlug: 'nacionalidad-espanola-menor-nacido-en-espana',
  serviceName: 'Nacionalidad española para menor nacido en España',
  intro: 'Los menores nacidos en España de padres extranjeros pueden adquirir la nacionalidad española si alguno de los padres cumple ciertos requisitos. Verifica en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'nacido_espana',
      type: 'boolean',
      label: '¿El menor nació en España?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'padre_residencia',
      type: 'select',
      label: '¿Cuál es la situación migratoria de al menos uno de los padres en el momento del nacimiento o actualmente?',
      required: true,
      options: [
        { value: 'residente_legal',    label: 'Residente legal en España (TIE vigente)' },
        { value: 'nacido_espana',      label: 'Nacido/a en España (aunque sea extranjero)' },
        { value: 'espanol',            label: 'Ciudadano/a español/a' },
        { value: 'irregular',          label: 'Sin permiso de residencia en el momento del nacimiento', escalates: true },
      ],
    },
    {
      id: 'menor_edad',
      type: 'boolean',
      label: '¿El menor tiene menos de 18 años?',
      required: true,
    },
    {
      id: 'cert_nacimiento',
      type: 'boolean',
      label: '¿Dispones del certificado de nacimiento del menor emitido en España (Registro Civil)?',
      required: true,
    },
    {
      id: 'doc_padres',
      type: 'boolean',
      label: '¿Los padres tienen documentación en vigor (NIE, pasaporte, TIE)?',
      required: true,
    },
  ],
  docs: [
    { id: 'cert_nacimiento_espana', label: 'Certificado de nacimiento del menor (Registro Civil español)', required: true },
    { id: 'pasaporte_padres', label: 'Pasaportes de ambos progenitores', required: true },
    { id: 'tie_padres', label: 'TIE o NIE de los progenitores (si aplica)', required: false },
    { id: 'libro_familia', label: 'Libro de familia o certificado de filiación', required: true },
    { id: 'empadronamiento', label: 'Empadronamiento del menor (actualizado)', required: true },
    { id: 'foto_menor', label: 'Foto del menor en fondo blanco (tamaño carné)', required: true },
  ],
  aiCriteria: `Eres un experto en extranjería y nacionalidad española. Evalúa la viabilidad para la adquisición de la nacionalidad española de un menor nacido en España.

NORMATIVA APLICABLE:
- Art. 17.1 b) y d) del Código Civil: son españoles de origen los nacidos en España de padres extranjeros si al menos uno de ellos hubiera nacido también en España, o si el menor resultara apátrida.
- Art. 17.1 c): nacidos en España cuya filiación no resulte determinada.
- Art. 19 CC: el extranjero menor de 18 años adoptado por español adquiere la nacionalidad desde la adopción.
- Vía más común: solicitud de nacionalidad por residencia (1 año) para menores nacidos en España de padres extranjeros con residencia legal.
- También posible: declaración de nacionalidad española de origen si algún progenitor nació en España.

CRITERIOS DE VIABILIDAD:
- VIABLE: Menor nacido en España, al menos un progenitor con residencia legal o nacido en España, documentación disponible.
- PARCIAL: Menor nacido en España pero progenitores en situación irregular (explorar vías alternativas).
- ESCALAR: Situaciones familiares complejas, progenitor desconocido, riesgo de apatridia.`,
};

// ── Permiso Inicial de Residencia ────────────────────────────────────────────

const permiso_residencia: ViabilityCheck = {
  serviceSlug: 'permiso-residencia-inicial',
  serviceName: 'Permiso Inicial de Residencia',
  intro: 'El primer permiso de residencia puede solicitarse por varias vías (arraigo, trabajo, familiar, etc.). Identifica la más adecuada para tu caso en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'motivo',
      type: 'select',
      label: '¿Cuál es tu principal motivo para solicitar el permiso de residencia?',
      required: true,
      options: [
        { value: 'trabajo',    label: 'Tengo una oferta de trabajo en España' },
        { value: 'familia',    label: 'Reagrupación familiar (familiar con residencia legal)' },
        { value: 'arraigo',    label: 'Llevo varios años en España (posible arraigo)' },
        { value: 'estudios',   label: 'Por estudios o formación' },
        { value: 'otros',      label: 'Otro motivo', escalates: true },
      ],
    },
    {
      id: 'tiempo_espana',
      type: 'select',
      label: '¿Cuánto tiempo llevas viviendo en España?',
      required: true,
      options: [
        { value: 'menos_1',   label: 'Menos de 1 año' },
        { value: '1_a_3',     label: 'Entre 1 y 3 años' },
        { value: 'mas_3',     label: 'Más de 3 años' },
      ],
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor', required: true },
    { id: 'empadronamiento', label: 'Empadronamiento actualizado', required: true },
    { id: 'contrato_trabajo', label: 'Contrato u oferta de trabajo (si aplica)', required: false },
    { id: 'antecedentes_origen', label: 'Certificado de antecedentes penales (apostillado)', required: false },
  ],
  aiCriteria: `Eres un experto en extranjería española. Evalúa qué vía de residencia es más adecuada para el caso del cliente.

NORMATIVA: LO 4/2000 y RD 557/2011. Las vías principales son:
- Arraigo social (art. 124): 3 años + empadronamiento + contrato trabajo o medios económicos.
- Arraigo familiar (art. 125): vínculo familiar con español o residente legal.
- Arraigo laboral (art. 123): 2 años + relación laboral irregular acreditable.
- Residencia por trabajo (art. 36-46): oferta de trabajo, cupo o situación nacional de empleo favorable.
- Residencia familiar (art. 52-60): reagrupación con familiar residente legal.

Indica la vía más adecuada según las respuestas y si el caso es viable, parcial o necesita consulta.`,
};

// ── Generic fallback (all other services) ────────────────────────────────────

const generic: ViabilityCheck = {
  serviceSlug: '_generic',
  serviceName: 'Servicio',
  intro: 'Cuéntanos brevemente tu situación para que podamos evaluar si tu caso es apto para este servicio.',
  estimatedMinutes: 2,
  questions: [
    {
      id: 'tiene_dni',
      type: 'boolean',
      label: '¿Tienes tu DNI o NIE en vigor?',
      required: true,
    },
    {
      id: 'situacion',
      type: 'text',
      label: 'Describe brevemente tu situación y lo que necesitas (2-3 frases):',
      hint: 'Por ejemplo: "Llevo 4 años en España, quiero regularizarme" o "Quiero dar de alta mi actividad de autónomo".',
      required: true,
    },
    {
      id: 'urgencia',
      type: 'select',
      label: '¿Tienes algún plazo o urgencia?',
      required: false,
      options: [
        { value: 'urgente',    label: 'Sí, es urgente (hay un plazo próximo)', escalates: true },
        { value: 'pronto',     label: 'Querría resolverlo pronto (próximo mes)' },
        { value: 'sin_prisa',  label: 'Sin urgencia especial' },
      ],
    },
  ],
  docs: [
    { id: 'dni_nie', label: 'DNI / NIE / Pasaporte en vigor', required: true },
  ],
  aiCriteria: `Eres un asesor fiscal y legal de EXPERT, asesoría española especializada en extranjería, fiscalidad y derecho mercantil. Evalúa si el caso descrito por el cliente es viable para el servicio solicitado. Usa criterios de viabilidad general: documentación básica disponible, situación legal regularizable, ausencia de impedimentos legales evidentes. Si el caso es complejo o requiere análisis profundo, recomienda una consulta con el equipo de EXPERT.`,
};

// ── Arraigo Laboral ───────────────────────────────────────────────────────────

const arraigo_laboral: ViabilityCheck = {
  serviceSlug: 'arraigo-laboral',
  serviceName: 'Arraigo Laboral',
  intro: 'El arraigo laboral requiere 2 años de permanencia y una relación laboral irregular acreditada por la Inspección de Trabajo. Verifica tu situación en 2 minutos.',
  estimatedMinutes: 2,
  questions: [
    {
      id: 'tiempo_espana',
      type: 'boolean',
      label: '¿Llevas al menos 2 años de permanencia continuada en España?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'acta_inspeccion',
      type: 'select',
      label: '¿Dispones de resolución que acredite la relación laboral irregular?',
      required: true,
      options: [
        { value: 'acta_itss',   label: 'Sí, tengo acta de la Inspección de Trabajo (ITSS)' },
        { value: 'sentencia',   label: 'Sí, tengo sentencia judicial firme' },
        { value: 'sepe',        label: 'Sí, tengo resolución del SEPE' },
        { value: 'no',          label: 'No tengo ninguno de estos documentos', disqualifies: true },
        { value: 'tramitando',  label: 'Estoy en proceso de obtenerlo', escalates: true },
      ],
    },
    {
      id: 'meses_laboral',
      type: 'select',
      label: '¿Cuántos meses de relación laboral acredita el documento?',
      required: true,
      options: [
        { value: 'menos_6', label: 'Menos de 6 meses', disqualifies: true },
        { value: '6_o_mas', label: '6 meses o más' },
      ],
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor', required: true },
    { id: 'acta_itss', label: 'Acta de la Inspección de Trabajo, sentencia judicial o resolución del SEPE', required: true },
    { id: 'empadronamiento', label: 'Certificado de empadronamiento histórico (2 años)', required: true },
    { id: 'antecedentes_espana', label: 'Certificado de antecedentes penales de España', required: true },
    { id: 'antecedentes_origen', label: 'Certificado de antecedentes penales del país de origen (apostillado)', required: true },
  ],
  aiCriteria: `Evalúa si el caso es VIABLE para el Arraigo Laboral (art. 123 RD 557/2011).
REQUISITOS: 2 años de permanencia + relación laboral irregular acreditable durante al menos 6 meses mediante acta de la ITSS, sentencia judicial o resolución del SEPE. Sin antecedentes penales.
VIABLE: cumple 2 años y tiene documento válido con ≥6 meses. PARCIAL: tiene el documento pero con período inferior o hay dudas sobre continuidad. NO VIABLE: sin acta/sentencia/resolución, o menos de 2 años de permanencia.`,
};

// ── Reagrupación Familiar ─────────────────────────────────────────────────────

const reagrupacion_familiar: ViabilityCheck = {
  serviceSlug: 'reagrupacion-familiar',
  serviceName: 'Reagrupación Familiar',
  intro: 'La reagrupación familiar exige residencia legal, ingresos suficientes y vivienda adecuada. Verifica si cumples los requisitos en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'residencia_reagrupante',
      type: 'select',
      label: '¿Cuánto tiempo llevas con permiso de residencia legal en España?',
      required: true,
      options: [
        { value: 'menos_1', label: 'Menos de 1 año', disqualifies: true },
        { value: '1_a_2',   label: 'Entre 1 y 2 años' },
        { value: 'mas_2',   label: 'Más de 2 años' },
      ],
    },
    {
      id: 'parentesco',
      type: 'select',
      label: '¿Qué familiar quieres reagrupar?',
      required: true,
      options: [
        { value: 'conyuge',    label: 'Cónyuge o pareja de hecho inscrita' },
        { value: 'hijo_menor', label: 'Hijo/a menor de 18 años' },
        { value: 'ascendiente', label: 'Padre o madre dependiente económicamente' },
        { value: 'otro',       label: 'Otro familiar', escalates: true },
      ],
    },
    {
      id: 'ingresos',
      type: 'select',
      label: '¿Cuáles son tus ingresos netos mensuales aproximados?',
      required: true,
      hint: 'Necesitas al menos 150 % del IPREM mensual (~1.200 €) por el primer familiar.',
      options: [
        { value: 'menos_1200', label: 'Menos de 1.200 € al mes', disqualifies: true },
        { value: '1200_1800',  label: 'Entre 1.200 € y 1.800 € al mes' },
        { value: 'mas_1800',   label: 'Más de 1.800 € al mes' },
      ],
    },
    {
      id: 'vivienda',
      type: 'boolean',
      label: '¿Tienes una vivienda con habitabilidad suficiente para el familiar que quieres reagrupar?',
      hint: 'El Ayuntamiento emite un informe de habitabilidad según el número de ocupantes y m².',
      required: true,
    },
  ],
  docs: [
    { id: 'tie_reagrupante', label: 'TIE del reagrupante en vigor', required: true },
    { id: 'pasaporte_reagrupante', label: 'Pasaporte del reagrupante', required: true },
    { id: 'nominas', label: 'Últimas 3–6 nóminas o justificantes de ingresos', required: true },
    { id: 'informe_vivienda', label: 'Informe de habitabilidad de la vivienda (Ayuntamiento)', required: true, howToGet: 'Solicítalo en el Ayuntamiento donde resides.' },
    { id: 'doc_parentesco', label: 'Certificado de matrimonio, libro de familia o acta de pareja de hecho (apostillado y traducido si es extranjero)', required: true },
    { id: 'pasaporte_familiar', label: 'Pasaporte del familiar a reagrupar', required: true },
  ],
  aiCriteria: `Evalúa si el caso es VIABLE para la Reagrupación Familiar (arts. 52-60 LO 4/2000, RD 557/2011).
REQUISITOS DEL REAGRUPANTE: ≥1 año de residencia legal, renovable al menos otro año. Ingresos ≥150 % IPREM por el primer familiar (~1.200 €/mes en 2025) + 50 % adicional por cada extra. Vivienda con informe de habitabilidad. FAMILIARES REAGRUPABLES: cónyuge/pareja, hijos <18, ascendientes dependientes.
VIABLE: cumple ingresos, vivienda y residencia. PARCIAL: ingresos limítrofes o vivienda pendiente de informe. NO VIABLE: <1 año de residencia o ingresos claramente insuficientes.`,
};

// ── Renovación de Residencia ──────────────────────────────────────────────────

const renovacion_residencia: ViabilityCheck = {
  serviceSlug: 'renovacion-residencia',
  serviceName: 'Renovación de Residencia',
  intro: 'Verifica si tu situación es apta para renovar tu permiso de residencia y qué documentación necesitas.',
  estimatedMinutes: 2,
  questions: [
    {
      id: 'tipo_permiso',
      type: 'select',
      label: '¿Qué tipo de autorización de residencia tienes actualmente?',
      required: true,
      options: [
        { value: 'arraigo',      label: 'Arraigo (social, familiar o laboral)' },
        { value: 'trabajo',      label: 'Residencia y trabajo por cuenta ajena' },
        { value: 'reagrupacion', label: 'Residencia por reagrupación familiar' },
        { value: 'otras',        label: 'Otra (circunstancias excepcionales, estudiante…)', escalates: true },
      ],
    },
    {
      id: 'caducidad',
      type: 'select',
      label: '¿En qué situación está tu autorización actual?',
      required: true,
      options: [
        { value: 'vigente',       label: 'Vigente — caduca en menos de 60 días' },
        { value: 'muy_vigente',   label: 'Vigente — caduca en más de 60 días' },
        { value: 'recien_caducada', label: 'Caducada hace menos de 90 días' },
        { value: 'mas_90',        label: 'Caducada hace más de 90 días', escalates: true },
      ],
    },
    {
      id: 'mantiene_requisitos',
      type: 'boolean',
      label: '¿Sigues manteniendo los requisitos que motivaron el permiso inicial (contrato, ingresos, vínculo familiar…)?',
      required: true,
      escalatesIfTrue: false,
    },
  ],
  docs: [
    { id: 'tie', label: 'TIE actual (por ambas caras)', required: true },
    { id: 'pasaporte', label: 'Pasaporte en vigor', required: true },
    { id: 'empadronamiento', label: 'Certificado de empadronamiento actualizado (máx. 3 meses)', required: true },
    { id: 'justificante_ingresos', label: 'Nóminas, contrato o justificante de ingresos (según tipo de permiso)', required: false },
  ],
  aiCriteria: `Evalúa si el caso es VIABLE para la Renovación de Residencia. VIABLE si tiene permiso vigente o caducado hace <90 días y mantiene requisitos. PARCIAL si mantiene requisitos pero está al límite del plazo o tiene algún cambio de circunstancias. ESCALAR si caducó hace >90 días (puede requerir nuevo expediente) o si cambió radicalmente su situación laboral/familiar.`,
};

// ── Registry ──────────────────────────────────────────────────────────────────

const VIABILITY_CHECKS: Record<string, ViabilityCheck> = {
  'irpf':                                          irpf,
  'arraigo-social':                                arraigo_social,
  'arraigo-familiar':                              arraigo_familiar,
  'arraigo-laboral':                               arraigo_laboral,
  'reagrupacion-familiar':                         reagrupacion_familiar,
  'renovacion-residencia':                         renovacion_residencia,
  'nacionalidad-espanola':                         nacionalidad,
  'nacionalidad-espanola-menor-nacido-en-espana':  nacionalidad_menor,
  'permiso-residencia-inicial':                    permiso_residencia,
};

export function getViabilityCheck(serviceSlug: string): ViabilityCheck {
  return VIABILITY_CHECKS[serviceSlug] ?? { ...generic, serviceSlug, serviceName: serviceSlug };
}

export function hasSpecificViabilityCheck(serviceSlug: string): boolean {
  return serviceSlug in VIABILITY_CHECKS;
}

export { VIABILITY_CHECKS };
