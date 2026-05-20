export type ServiceChecklist = {
  serviceId: string;
  serviceName: string;
  category: string;
  /** Data/information the bot must gather from the client */
  requiredData: string[];
  /** Physical or digital documents the client must provide */
  requiredDocs: string[];
  /** Key questions to ask proactively if not yet answered */
  keyQuestions: string[];
  /** Short guidance for the AI when composing messages about this service */
  botInstructions: string;
  estimatedPrice?: string;
};

export const SERVICE_CHECKLISTS: ServiceChecklist[] = [
  // ── DECLARACIONES E IMPUESTOS ────────────────────────────────────────────

  {
    serviceId: 'irpf',
    serviceName: 'Declaración de la Renta (IRPF)',
    category: 'declaraciones-impuestos',
    requiredData: [
      'Año fiscal a declarar',
      'Situación laboral (asalariado, autónomo, pensionista, desempleado)',
      'Número de referencia AEAT o Cl@ve PIN',
      'Si tiene inmuebles en propiedad o en alquiler',
      'Si tiene préstamo hipotecario (y año de compra)',
      'Si tiene hijos u otros descendientes a cargo',
      'Si tiene discapacidad reconocida',
      'Si ha realizado aportaciones a planes de pensiones',
      'Si ha tenido ganancias/pérdidas patrimoniales (venta de acciones, inmuebles, etc.)',
      'Comunidad autónoma de residencia fiscal',
      'Si es la primera declaración o si ya presentó en ejercicios anteriores',
    ],
    requiredDocs: [
      'DNI / NIE en vigor',
      'Número de referencia AEAT o acceso a Cl@ve',
      'Certificado de retenciones del empleador (o pensiones)',
      'Certificado de prestaciones del SEPE (si cobró desempleo)',
      'Datos de todos los inmuebles (referencia catastral)',
      'Contrato de arrendamiento e ingresos de alquiler (si aplica)',
      'Certificado de retenciones de alquileres (Modelo 180)',
      'Certificado bancario de intereses y cuentas (si aplica)',
      'Certificado de aportaciones a planes de pensiones',
      'Escritura y préstamo hipotecario (si compró antes de 2013)',
      'Justificante de donaciones (si aplica)',
    ],
    keyQuestions: [
      '¿Para qué año fiscal necesitas la declaración?',
      '¿Trabajas por cuenta ajena, como autónomo o tienes otros ingresos?',
      '¿Tienes acceso a la referencia de la AEAT o Cl@ve PIN?',
      '¿Tienes inmuebles en propiedad o en alquiler?',
      '¿Has vendido acciones, fondos o algún bien durante el año?',
    ],
    botInstructions:
      'Explica que el servicio cuesta 150 € + IVA y tarda 3–5 días hábiles. Pide primero el año fiscal y la situación laboral. Recuerda que la campaña de renta va de abril a junio. Ofrece cita en expertconsulting.es/cita si tiene dudas previas.',
    estimatedPrice: '150 € + IVA',
  },

  {
    serviceId: 'modelo-151',
    serviceName: 'Modelo 151 — Régimen Beckham',
    category: 'declaraciones-impuestos',
    requiredData: [
      'Año de llegada a España y fecha de inicio de actividad',
      'Si ya solicitó el Modelo 149 (opción al régimen)',
      'País de procedencia y si tenía residencia fiscal allí los 5 años previos',
      'Tipo de relación laboral (contrato con empresa española, desplazado, directivo)',
      'Ingresos brutos anuales estimados en España',
      'Si tiene rentas o bienes en el extranjero',
      'Si el cónyuge o hijos también quieren acogerse al régimen',
    ],
    requiredDocs: [
      'DNI / NIE / Pasaporte en vigor',
      'Contrato de trabajo o carta de desplazamiento',
      'Certificado de empadronamiento',
      'Número de referencia AEAT o acceso a Cl@ve',
      'Certificado de retenciones (si ya tiene nóminas en España)',
      'Modelo 149 presentado (si ya solicitó la opción al régimen)',
      'Documentación de rentas extranjeras (si aplica)',
    ],
    keyQuestions: [
      '¿Cuándo llegaste a España y cuándo empezaste a trabajar aquí?',
      '¿Ya solicitaste el Modelo 149 para activar el régimen Beckham?',
      '¿Has sido residente fiscal en España en los últimos 5 años?',
      '¿Tu contrato es con una empresa española o estás desplazado?',
    ],
    botInstructions:
      'El régimen Beckham tributa al 24% fijo sobre rentas en España hasta 600.000 €. Es fundamental verificar que el cliente NO haya sido residente en España los 5 años previos. El plazo para solicitar el Modelo 149 es de 6 meses desde el inicio de actividad. Precio: consultar según complejidad.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'no-residentes',
    serviceName: 'IRNR — No Residentes',
    category: 'declaraciones-impuestos',
    requiredData: [
      'País de residencia fiscal actual',
      'Tipo de renta española (inmueble, alquiler, dividendos, pensión, etc.)',
      'Si tiene inmuebles en España (uso propio o arrendados)',
      'Año o trimestre a declarar',
      'Si tiene Convenio de Doble Imposición con su país (reduce la tributación)',
      'Si tiene representante fiscal en España (obligatorio para no residentes fuera de UE con inmuebles)',
      'NIF español (NIE) y número fiscal del país de residencia',
    ],
    requiredDocs: [
      'NIE o pasaporte en vigor',
      'Certificado de residencia fiscal del país de origen (para aplicar convenio)',
      'Escritura o nota simple del inmueble en España',
      'Referencia catastral de los inmuebles',
      'Contrato de alquiler e ingresos percibidos (si arrienda)',
      'Gastos deducibles (IBI, comunidad, seguros, intereses hipotecarios) si es no residente UE/EEE',
    ],
    keyQuestions: [
      '¿En qué país resides fiscalmente?',
      '¿Tienes inmuebles en España? ¿Los alquilas o son para uso propio?',
      '¿Qué años o trimestres necesitas declarar?',
      '¿Tienes ya NIE español?',
    ],
    botInstructions:
      'El Modelo 210 se presenta: para imputación de inmuebles en enero del año siguiente; para alquileres, trimestralmente. No residentes fuera de la UE no pueden deducir gastos, solo el tipo fijo del 24%. Los residentes UE/EEE sí pueden deducir gastos. Verificar siempre si hay convenio de doble imposición. Precio: desde 80 € por modelo.',
    estimatedPrice: 'Desde 80 € / modelo',
  },

  {
    serviceId: 'iva-trimestral',
    serviceName: 'IVA Trimestral (Modelo 303)',
    category: 'declaraciones-impuestos',
    requiredData: [
      'Trimestre y año a liquidar',
      'Régimen de IVA (general, simplificado, recargo de equivalencia, etc.)',
      'Total de facturas emitidas e IVA repercutido',
      'Total de facturas recibidas e IVA soportado',
      'Si tiene operaciones intracomunitarias (Modelo 349)',
      'Si hay retenciones de alquiler (Modelo 115)',
    ],
    requiredDocs: [
      'Libro registro de facturas emitidas del trimestre',
      'Libro registro de facturas recibidas del trimestre',
      'Extractos bancarios del trimestre (para verificar cobros y pagos)',
      'Acceso a Cl@ve o número de referencia AEAT',
    ],
    keyQuestions: [
      '¿Qué trimestre y año necesitas liquidar?',
      '¿Tienes las facturas emitidas y recibidas ya clasificadas?',
      '¿Usas algún programa de facturación o contabilidad (Holded, etc.)?',
      '¿Tienes operaciones con clientes o proveedores de otros países de la UE?',
    ],
    botInstructions:
      'Plazos: del 1 al 20 de abril (1T), julio (2T), octubre (3T) y hasta el 30 de enero (4T). Pedir siempre las facturas con suficiente antelación. Si el cliente usa Holded, podemos extraer los datos directamente. Precio: desde 60 € / trimestre.',
    estimatedPrice: 'Desde 60 € / trimestre',
  },

  {
    serviceId: 'impuesto-sociedades',
    serviceName: 'Impuesto de Sociedades (Modelo 200)',
    category: 'declaraciones-impuestos',
    requiredData: [
      'Ejercicio fiscal a declarar (normalmente coincide con año natural)',
      'Si la contabilidad está llevada con EXPERT o por el propio cliente',
      'Resultado contable del ejercicio (beneficio o pérdida)',
      'Si tiene créditos fiscales pendientes de ejercicios anteriores (bases negativas)',
      'Si tiene deducciones especiales (I+D, creación de empleo, inversiones)',
      'Si presenta pagos fraccionados (Modelo 202)',
      'Si necesita también depositar las cuentas anuales en el Registro Mercantil',
    ],
    requiredDocs: [
      'Balance de situación y cuenta de pérdidas y ganancias del ejercicio',
      'Libro diario y libro mayor contable',
      'Facturas de gastos significativos',
      'Escrituras de la sociedad y CIF',
      'Certificados de retenciones (dividendos, alquileres, etc.)',
      'Declaraciones de trimestres anteriores (Modelo 202 pagos fraccionados)',
    ],
    keyQuestions: [
      '¿Quién lleva la contabilidad de la sociedad?',
      '¿Cuál es el resultado del ejercicio (beneficio o pérdida)?',
      '¿Necesitas también depositar cuentas en el Registro Mercantil?',
      '¿Tenéis bases imponibles negativas de ejercicios anteriores?',
    ],
    botInstructions:
      'El IS se presenta en los 25 días siguientes a los 6 meses del cierre (normalmente julio para ejercicios con cierre en diciembre). Si la contabilidad la lleva EXPERT, el IS está incluido en el plan mensual. Precio: consultar según volumen y complejidad.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'modelo-720',
    serviceName: 'Modelo 720 — Bienes en el Extranjero',
    category: 'declaraciones-impuestos',
    requiredData: [
      'Año a declarar',
      'Tipos de bienes en el extranjero: cuentas bancarias, valores/fondos/seguros, inmuebles',
      'Saldo o valor a 31 de diciembre de cada categoría',
      'Si ya presentó el Modelo 720 en ejercicios anteriores',
      'Si alguna categoría ha aumentado más de 20.000 € respecto a la última declaración',
      'País donde están los bienes y entidades titulares',
      'NIF extranjero si aplica',
    ],
    requiredDocs: [
      'DNI / NIE en vigor',
      'Extractos bancarios de cuentas extranjeras con saldo a 31/12',
      'Certificados de valores, fondos de inversión o seguros de vida (valor a 31/12)',
      'Escrituras o documentos de titularidad de inmuebles en el extranjero',
      'Número de identificación fiscal extranjero (si lo tiene)',
      'Última declaración Modelo 720 presentada (si existe)',
    ],
    keyQuestions: [
      '¿Qué tipos de bienes tienes en el extranjero? (cuentas, acciones/fondos, inmuebles)',
      '¿El valor total supera los 50.000 € en alguna categoría?',
      '¿Ya presentaste el Modelo 720 en años anteriores?',
      '¿Ha habido cambios de más de 20.000 € respecto al último año declarado?',
    ],
    botInstructions:
      'La obligación existe si el valor supera 50.000 € en al menos una de las tres categorías (cuentas, valores/fondos, inmuebles). Plazo: del 1 enero al 31 de marzo. Solo hay que presentarlo cuando se supera el umbral por primera vez, y luego cuando alguna categoría sube más de 20.000 €. Las sanciones por no presentar son muy elevadas. Precio: 190 € + IVA.',
    estimatedPrice: '190 € + IVA',
  },

  {
    serviceId: 'modelos-informativos',
    serviceName: 'Modelos Informativos (347, 349, 180, 190)',
    category: 'declaraciones-impuestos',
    requiredData: [
      'Qué modelo/s necesita presentar',
      'Ejercicio o período',
      'Si tiene operaciones con terceros >3.005,06 € anuales (Modelo 347)',
      'Si tiene operaciones intracomunitarias (Modelo 349)',
      'Si ha pagado alquileres con retención (Modelo 180)',
      'Si ha pagado nóminas o rendimientos profesionales con retención (Modelo 190)',
    ],
    requiredDocs: [
      'Datos de proveedores/clientes con operaciones anuales superiores a 3.005 €',
      'Libro de facturas emitidas y recibidas del año',
      'Contratos de arrendamiento y retenciones practicadas',
      'Nóminas y retenciones a trabajadores y profesionales',
    ],
    keyQuestions: [
      '¿Qué modelo informativo necesitas presentar?',
      '¿Tienes la contabilidad ordenada del ejercicio?',
    ],
    botInstructions:
      'Estos modelos son puramente informativos pero las sanciones por no presentarlos o presentarlos fuera de plazo son importantes. Verificar siempre el plazo específico de cada modelo. Precio: desde 50 € / modelo.',
    estimatedPrice: 'Desde 50 € / modelo',
  },

  // ── EXTRANJERÍA Y NACIONALIDAD ───────────────────────────────────────────

  {
    serviceId: 'permiso-residencia-inicial',
    serviceName: 'Permiso Inicial de Residencia',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Nacionalidad del solicitante',
      'Tiempo que lleva en España y si está empadronado',
      'Si tiene oferta de trabajo o contrato firmado',
      'Si tiene vínculos familiares con residentes o ciudadanos españoles',
      'Situación laboral actual (trabaja, busca empleo, autónomo…)',
      'Si tiene medios económicos demostrables (nóminas, ahorros)',
      'Si tiene seguro médico privado',
      'Si tiene antecedentes penales en España o en su país de origen',
      'Vía más probable: arraigo laboral, circunstancias excepcionales, reagrupación, etc.',
    ],
    requiredDocs: [
      'Pasaporte en vigor (todas las páginas)',
      'Fotografía reciente tamaño carné',
      'Formulario EX-01 o EX-02 (lo preparamos nosotros)',
      'Justificante de pago de la tasa Modelo 790 código 052',
      'Certificado de empadronamiento (mínimo 3 años continuados si es arraigo)',
      'Contrato de trabajo o oferta laboral firmada por empresa (si aplica)',
      'Nóminas o extractos bancarios con medios económicos suficientes',
      'Seguro médico privado sin copago ni carencia (si no cotiza a la SS)',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido si aplica)',
      'Certificado de antecedentes penales en España',
      'Informe de arraigo social del ayuntamiento (si aplica)',
    ],
    keyQuestions: [
      '¿Cuánto tiempo llevas en España y tienes padrón?',
      '¿Tienes oferta o contrato de trabajo?',
      '¿Tienes familiares con residencia legal o ciudadanía española?',
      '¿Tienes seguro médico privado?',
      '¿Tienes los antecedentes penales del país de origen apostillados?',
    ],
    botInstructions:
      'Primero evaluar la vía más adecuada según la situación del cliente. El plazo legal es 3 meses pero en la práctica 2–4 meses. Precio: 490 € + IVA. Ofrecer evaluación gratuita: expertconsulting.es/cita',
    estimatedPrice: '490 € + IVA',
  },

  {
    serviceId: 'arraigo-social',
    serviceName: 'Arraigo Social',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Años de permanencia en España (mínimo 3 años)',
      'Si tiene empadronamiento continuo que lo acredite',
      'Si tiene oferta de trabajo firmada por empleador',
      'Si tiene vínculos familiares con residentes o españoles',
      'Antecedentes penales en España y en el país de origen',
      'Situación de convivencia actual',
    ],
    requiredDocs: [
      'Pasaporte en vigor (todas las páginas)',
      'Certificado de empadronamiento histórico (3 años)',
      'Informe de arraigo social del ayuntamiento',
      'Contrato de trabajo o promesa de contrato (si aplica)',
      'Certificado de antecedentes penales en España',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      'Documentación de vínculos familiares si aplica (libro de familia, etc.)',
      'Fotografía tamaño carné',
      'Justificante pago tasa Modelo 790 código 052',
    ],
    keyQuestions: [
      '¿Cuántos años llevas en España? ¿Tienes el padrón que lo acredite?',
      '¿Tienes oferta de trabajo o vínculos familiares en España?',
      '¿Tienes el certificado de antecedentes del país de origen?',
      '¿El ayuntamiento ya te ha dado o pediste el informe de arraigo social?',
    ],
    botInstructions:
      'Verificar los 3 años de empadronamiento continuo es el requisito clave. El informe de arraigo del ayuntamiento suele tardar semanas — conviene pedirlo cuanto antes. Precio: 490 € + IVA. La resolución tarda 3–6 meses según delegación.',
    estimatedPrice: '490 € + IVA',
  },

  {
    serviceId: 'arraigo-familiar',
    serviceName: 'Arraigo Familiar',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Tipo de vínculo: padre/madre de menor español, cónyuge o pareja de hecho de español/residente',
      'Si el familiar español o residente tiene la documentación en vigor',
      'Tiempo de convivencia o relación demostrable',
      'Antecedentes penales del solicitante',
    ],
    requiredDocs: [
      'Pasaporte del solicitante en vigor (todas las páginas)',
      'Libro de familia o certificado de nacimiento del menor español (si aplica)',
      'Sentencia de filiación u otros documentos de parentesco',
      'DNI o NIE y documentación del familiar español/residente',
      'Certificado de empadronamiento familiar',
      'Certificado de antecedentes penales en España',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      'Fotografía tamaño carné',
      'Justificante pago tasa Modelo 790 código 052',
    ],
    keyQuestions: [
      '¿Cuál es el vínculo familiar que justifica el arraigo?',
      '¿El menor o familiar tiene documentación española en vigor?',
      '¿Tienes los antecedentes penales del país de origen?',
    ],
    botInstructions:
      'El arraigo familiar no requiere oferta de trabajo. El vínculo más común es ser padre/madre de un hijo menor con nacionalidad española. Precio: 390 € + IVA.',
    estimatedPrice: '390 € + IVA',
  },

  {
    serviceId: 'renovacion-residencia',
    serviceName: 'Renovación de Residencia',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Tipo de permiso actual (temporal, larga duración, trabajo, etc.)',
      'Fecha de caducidad del permiso actual',
      'Si sigue cumpliendo los requisitos del permiso original (trabajo, medios económicos, etc.)',
      'Cotizaciones a la Seguridad Social (meses cotizados en el período)',
      'Si ha habido ausencias del territorio español superiores a 6 meses',
      'Si ha habido cambio de empresa o actividad laboral',
    ],
    requiredDocs: [
      'TIE actual en vigor o caducado',
      'Pasaporte en vigor (todas las páginas)',
      'Certificado de empadronamiento actualizado',
      'Vida laboral actualizada de la Seguridad Social',
      'Contrato de trabajo vigente o alta de autónomo',
      'Últimas nóminas (3–6 meses) o justificante de ingresos',
      'Certificado de antecedentes penales en España (si han pasado más de 5 años desde el anterior)',
      'Fotografía tamaño carné',
      'Justificante pago tasa Modelo 790 código 052',
    ],
    keyQuestions: [
      '¿Qué tipo de permiso tienes y cuándo caduca?',
      '¿Sigues trabajando o en la misma situación que cuando lo obtuviste?',
      '¿Has estado fuera de España más de 6 meses seguidos?',
      '¿Tienes la vida laboral actualizada?',
    ],
    botInstructions:
      'Se puede presentar desde 60 días antes de la caducidad y hasta 90 días después (con posible recargo). Muy importante no dejar caducar el permiso sin renovar. Verificar que el cliente cumple los requisitos mínimos de cotización. Precio: consultar según tipo.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'nacionalidad-espanola',
    serviceName: 'Nacionalidad Española por Residencia',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Años de residencia legal en España (10 años general; 2 años iberoamericanos; 1 año casos especiales)',
      'Nacionalidad actual del solicitante (para determinar el plazo reducido)',
      'Si ha superado el examen CCSE (Instituto Cervantes)',
      'Si ha superado el examen DELE A2 (si no es hispanohablante)',
      'Si tiene antecedentes penales en España o en otro país',
      'Situación civil y si tiene cónyuge español',
      'Si ha habido ausencias prolongadas de España',
    ],
    requiredDocs: [
      'Pasaporte en vigor (todas las páginas)',
      'NIE / TIE en vigor',
      'Certificado literal de nacimiento del solicitante (apostillado y traducido)',
      'Certificado de empadronamiento histórico (todos los años de residencia)',
      'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      'Certificado de antecedentes penales en España',
      'Certificado de matrimonio si está casado/a (apostillado y traducido si es extranjero)',
      'Diploma CCSE del Instituto Cervantes',
      'Diploma DELE A2 (si aplica)',
      'Fotografía tamaño carné',
      'Justificante pago tasa Modelo 790 código 026',
    ],
    keyQuestions: [
      '¿Cuántos años llevas con residencia legal en España?',
      '¿De qué país eres? (determina si aplican plazos reducidos)',
      '¿Ya tienes el CCSE y el DELE A2 superados?',
      '¿Tienes el certificado de nacimiento apostillado y traducido?',
      '¿Ha habido períodos largos fuera de España?',
    ],
    botInstructions:
      'El examen CCSE es obligatorio para todos. El DELE A2 solo para no hispanohablantes. Los plazos reducidos: 2 años para iberoamericanos, filipinos, ecuatoguineanos, portugueses y andorranos; 1 año para casados con española/español y otros casos especiales. La resolución puede tardar 1–3 años. Ofrecer primero evaluación en expertconsulting.es/cita.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'nacionalidad-espanola-menor-nacido-en-espana',
    serviceName: 'Nacionalidad Española — Menor Nacido en España',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Fecha de nacimiento del menor y si está inscrito en el Registro Civil español',
      'Fecha de concesión del primer permiso de residencia legal del menor',
      'Si el menor lleva al menos 1 año con residencia legal continuada',
      'Si ambos progenitores están de acuerdo y pueden firmar',
      'Si alguno de los progenitores solo tiene un progenitor con patria potestad',
      'Diferencias en nombres/apellidos entre documentos (transliteración)',
    ],
    requiredDocs: [
      'Certificación literal de nacimiento española (Registro Civil)',
      'Pasaporte del menor en vigor (todas las páginas)',
      'NIE / TIE del menor',
      'Tarjeta de residencia anterior del menor (si existe)',
      'Resolución inicial de concesión de residencia del menor',
      'Certificado de empadronamiento familiar actualizado',
      'Pasaporte de ambos progenitores en vigor (todas las páginas)',
      'NIE / TIE de ambos progenitores (anverso y reverso)',
      'Fotografía del menor tamaño carné',
      'Justificante pago tasa Modelo 790 código 026 (104,05 € — no incluida en honorarios)',
    ],
    keyQuestions: [
      '¿El menor nació en España y tiene el certificado literal de nacimiento español?',
      '¿Cuándo se concedió la primera residencia legal del menor?',
      '¿Han pasado ya al menos 12 meses desde esa fecha?',
      '¿Pueden firmar ambos progenitores? ¿Ambos tienen la documentación en vigor?',
      '¿Hay alguna diferencia de nombre o apellidos entre documentos?',
    ],
    botInstructions:
      'La residencia del menor debe ser de al menos 1 año, legal, continuada e inmediatamente anterior a la solicitud. Nacer en España no da la nacionalidad automáticamente. El pasaporte caducado bloquea el expediente — verificar vigencia. La tasa de 104,05 € (Modelo 790 código 026) es aparte de los honorarios de 302,50 € IVA incluido.',
    estimatedPrice: '302,50 € IVA incluido (+ tasa 104,05 € aparte)',
  },

  {
    serviceId: 'nie-pasaporte',
    serviceName: 'NIE y Gestiones Consulares',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Si es ciudadano UE o no UE',
      'Motivo del NIE (trabajo, compraventa inmueble, trámite bancario, etc.)',
      'Si ya tiene cita o necesita que la gestionemos',
      'Si necesita acompañamiento presencial',
    ],
    requiredDocs: [
      'Pasaporte en vigor',
      'Formulario EX-15 (lo preparamos nosotros)',
      'Justificante del motivo económico o profesional (contrato, escritura, etc.)',
      'Fotografía tamaño carné',
      'Justificante pago tasa (si aplica)',
    ],
    keyQuestions: [
      '¿Eres ciudadano de la UE o de fuera de la UE?',
      '¿Para qué necesitas el NIE?',
      '¿Ya tienes cita o necesitas que la gestionemos?',
    ],
    botInstructions:
      'El NIE es imprescindible para trabajar, comprar inmuebles, abrir cuentas bancarias o iniciar cualquier actividad económica en España. Precio: desde 60 €.',
    estimatedPrice: 'Desde 60 €',
  },

  {
    serviceId: 'reagrupacion-familiar',
    serviceName: 'Reagrupación Familiar',
    category: 'extranjeria-nacionalidad',
    requiredData: [
      'Tipo de vínculo familiar (cónyuge, hijos menores, padres dependientes)',
      'Tipo de permiso del reagrupante y fecha de obtención',
      'Ingresos mensuales del reagrupante (nóminas/extractos)',
      'Metros cuadrados y habitaciones del domicilio actual',
      'País de residencia actual del familiar a reagrupar',
    ],
    requiredDocs: [
      'Pasaporte del reagrupante y TIE en vigor',
      'Libro de familia o certificados de nacimiento/matrimonio apostillados y traducidos',
      'Nóminas de los últimos 3–6 meses del reagrupante',
      'Informe de habitabilidad de la vivienda (certificado del ayuntamiento)',
      'Título de propiedad o contrato de alquiler de la vivienda',
      'Certificado de empadronamiento',
      'Pasaporte del familiar a reagrupar',
      'Antecedentes penales del familiar a reagrupar (si es mayor de edad)',
    ],
    keyQuestions: [
      '¿Qué familiar quieres reagrupar y dónde reside actualmente?',
      '¿Cuánto llevas con tu permiso de residencia?',
      '¿Tienes suficiente espacio en tu vivienda para acreditar habitabilidad?',
      '¿Tus ingresos superan el 150% del IPREM?',
    ],
    botInstructions:
      'El reagrupante debe tener al menos 1 año de residencia y haber renovado. Los ingresos mínimos son 150% del IPREM (aprox. 900 €/mes) para cónyuge; más por cada hijo. La vivienda debe pasar un informe de habitabilidad. Precio: consultar.',
    estimatedPrice: 'Consultar',
  },

  // ── EMPRESAS Y AUTÓNOMOS ─────────────────────────────────────────────────

  {
    serviceId: 'alta-autonomo',
    serviceName: 'Alta de Autónomo',
    category: 'empresas-autonomos',
    requiredData: [
      'Actividad económica que va a desarrollar',
      'Si tiene empleados o no',
      'Si va a trabajar desde casa o tiene local',
      'Si tiene previsto facturar con IVA o está exento',
      'Si tiene derecho a tarifa plana (primera vez como autónomo)',
      'Base de cotización deseada',
      'Si también es trabajador por cuenta ajena simultáneamente',
    ],
    requiredDocs: [
      'DNI / NIE en vigor',
      'Número de cuenta bancaria (IBAN) para domiciliación de cuota',
      'Datos de la actividad (epígrafe IAE aproximado)',
    ],
    keyQuestions: [
      '¿A qué te vas a dedicar? ¿Es tu primera vez como autónomo?',
      '¿Tienes clientes ya o estás empezando desde cero?',
      '¿Vas a tener empleados desde el inicio?',
      '¿Cuándo quieres que sea efectiva el alta?',
    ],
    botInstructions:
      'El alta fiscal (Hacienda) es inmediata. El alta en el RETA (Seguridad Social) tarda 1–3 días. Si es la primera vez como autónomo puede acceder a la tarifa plana reducida. El nuevo sistema de cotización por ingresos reales varía entre aprox. 200 € y 590 €/mes. Precio: 120 € + IVA.',
    estimatedPrice: '120 € + IVA',
  },

  {
    serviceId: 'constitucion-sl',
    serviceName: 'Constitución de Sociedad Limitada',
    category: 'empresas-autonomos',
    requiredData: [
      'Nombre/s propuesto/s para la sociedad (necesitamos al menos 5 opciones)',
      'Número de socios y porcentaje de participación de cada uno',
      'Capital social aportado (mínimo 1 €, recomendado 3.000 €)',
      'Objeto social (actividades de la empresa)',
      'Domicilio social',
      'Quién será el administrador (único o mancomunado)',
      'Si necesitan pacto de socios además de estatutos',
      'Si algún socio es extranjero (necesita NIE)',
    ],
    requiredDocs: [
      'DNI / NIE en vigor de todos los socios y del administrador',
      'Certificado negativo de denominación social (lo tramitamos nosotros)',
      'Justificante de ingreso del capital social en cuenta bancaria',
    ],
    keyQuestions: [
      '¿Cuántos socios sois y en qué porcentajes?',
      '¿Tenéis ya nombres propuestos para la sociedad?',
      '¿Cuánto capital social vais a aportar?',
      '¿Quién será el administrador?',
      '¿Alguno de los socios es extranjero y tiene NIE?',
    ],
    botInstructions:
      'El proceso completo tarda 7–15 días hábiles. Hay que ir al notario con todos los socios. Los gastos de notaría y registro mercantil van aparte (aprox. 400–600 €). El CIF definitivo puede tardar unos días adicionales. Precio honorarios: 490 € + IVA.',
    estimatedPrice: '490 € + IVA (+ notaría y registro ~400–600 €)',
  },

  {
    serviceId: 'contabilidad-mensual',
    serviceName: 'Contabilidad Mensual',
    category: 'empresas-autonomos',
    requiredData: [
      'Tipo de entidad (autónomo o sociedad)',
      'Volumen aproximado de facturas mensuales (emitidas y recibidas)',
      'Si usa actualmente algún software de contabilidad o facturación',
      'Si tiene empleados (nóminas)',
      'Si factura con IVA o está exento',
      'Fecha de inicio deseada',
    ],
    requiredDocs: [
      'Facturas emitidas del mes',
      'Facturas recibidas del mes',
      'Extractos bancarios del mes',
      'Alta en Hacienda (Modelo 036/037)',
      'CIF (para sociedades)',
    ],
    keyQuestions: [
      '¿Eres autónomo o tienes sociedad?',
      '¿Cuántas facturas emites y recibes aproximadamente cada mes?',
      '¿Usas Holded o algún otro programa de contabilidad?',
      '¿Tienes empleados con nóminas?',
    ],
    botInstructions:
      'Trabajamos preferentemente con Holded. Si el cliente no tiene Holded, podemos ayudar a configurarlo. El precio base es desde 80 €/mes según volumen. Incluye contabilidad, conciliación bancaria e informes de resultados. Ofrecer enlace a planes: expertconsulting.es/planes.',
    estimatedPrice: 'Desde 80 € / mes',
  },

  {
    serviceId: 'impuestos-trimestrales',
    serviceName: 'Impuestos Trimestrales',
    category: 'empresas-autonomos',
    requiredData: [
      'Si es autónomo o sociedad',
      'Modelos que aplican (303 IVA, 111 retenciones trabajadores, 115 alquileres, 130/131 IRPF)',
      'Si tiene empleados o paga alquiler de local con retención',
      'Si la contabilidad está al día',
    ],
    requiredDocs: [
      'Facturas emitidas y recibidas del trimestre',
      'Nóminas si tiene trabajadores',
      'Contrato de alquiler si paga alquiler con retención',
      'Extractos bancarios del trimestre',
    ],
    keyQuestions: [
      '¿Eres autónomo o tienes sociedad?',
      '¿Tienes trabajadores a tu cargo?',
      '¿Pagas alquiler de local o de oficina?',
      '¿Tienes las facturas del trimestre preparadas?',
    ],
    botInstructions:
      'Plazos: del 1 al 20 de los meses de abril, julio, octubre y hasta el 30 de enero. Importante enviar la documentación con suficiente antelación. Precio: desde 120 € / trimestre.',
    estimatedPrice: 'Desde 120 € / trimestre',
  },

  {
    serviceId: 'cuentas-anuales',
    serviceName: 'Cuentas Anuales',
    category: 'empresas-autonomos',
    requiredData: [
      'Ejercicio fiscal a formular (normalmente año natural)',
      'Si la contabilidad está llevada con EXPERT o por el propio cliente',
      'Resultado contable del ejercicio (beneficio o pérdida)',
      'Si la sociedad es pequeña (PYME) o grande (determina formato de cuentas)',
      'Si necesita también presentar el Impuesto de Sociedades',
      'Fecha prevista de la Junta General de aprobación',
    ],
    requiredDocs: [
      'Balance de situación al cierre del ejercicio',
      'Cuenta de pérdidas y ganancias del ejercicio',
      'Libro diario y libro mayor',
      'Escrituras de constitución y CIF',
      'Datos de socios y participaciones',
      'Acta de la Junta General aprobando las cuentas (la preparamos nosotros)',
    ],
    keyQuestions: [
      '¿Quién lleva la contabilidad? ¿Está al día?',
      '¿Cuándo quieres celebrar la Junta General?',
      '¿Necesitas también el Impuesto de Sociedades?',
      '¿La sociedad tiene auditor?',
    ],
    botInstructions:
      'El plazo para depositar las cuentas es el mes siguiente a la aprobación en Junta (normalmente hasta el 30 de julio). La falta de depósito puede generar cierre registral. Si la contabilidad la lleva EXPERT, el depósito suele estar incluido en el plan mensual. Precio: consultar.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'apoderamientos-mercantiles',
    serviceName: 'Apoderamientos y Modificaciones Mercantiles',
    category: 'empresas-autonomos',
    requiredData: [
      'Tipo de modificación: cambio de administrador, estatutos, poderes, capital, compraventa participaciones',
      'Datos de la sociedad (CIF, denominación, domicilio)',
      'Si hay acuerdo unánime de todos los socios o se necesita convocatoria de Junta',
      'Datos del nuevo administrador o apoderado (DNI/NIE, dirección)',
      'Si se quieren otorgar poderes generales o especiales (para qué actos)',
    ],
    requiredDocs: [
      'Escrituras de constitución actualizadas de la sociedad',
      'Libro de actas de la sociedad',
      'DNI/NIE de todos los socios o del administrador',
      'Nota simple del Registro Mercantil (actualizada)',
      'En compraventa de participaciones: valoración o precio acordado',
    ],
    keyQuestions: [
      '¿Qué modificación necesitas hacer en la empresa?',
      '¿Estáis de acuerdo todos los socios?',
      '¿Necesitas poderes para una gestión concreta o poderes generales?',
      '¿Hay que convocar Junta o es decisión del administrador?',
    ],
    botInstructions:
      'Muchas modificaciones requieren escritura notarial e inscripción en el Registro Mercantil. El plazo varía: notaría 1–5 días, registro 5–15 días hábiles. Para poderes simples (sin cargo registral) el proceso es más rápido. Precio: consultar según tipo de modificación.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'baja-cese-actividad',
    serviceName: 'Baja y Cese de Actividad',
    category: 'empresas-autonomos',
    requiredData: [
      'Si es baja de autónomo o disolución de sociedad',
      'Fecha prevista de cese',
      'Si tiene impuestos o cotizaciones pendientes',
      'Si tiene empleados pendientes de finiquito',
      'Para sociedades: si hay acuerdo unánime de socios y si hay deudas pendientes',
    ],
    requiredDocs: [
      'DNI / NIE en vigor',
      'Alta en Hacienda (Modelo 036/037) original',
      'Para sociedades: escrituras y libro de actas de la sociedad',
      'Última declaración del IVA e IRPF presentada',
    ],
    keyQuestions: [
      '¿Es baja de autónomo o disolución de sociedad?',
      '¿Tienes impuestos pendientes de presentar?',
      '¿Hay empleados o deudas con terceros?',
      '¿Cuándo quieres que sea efectiva la baja?',
    ],
    botInstructions:
      'La baja en el RETA se puede hacer hasta el último día del mes para no pagar ese mes. Para sociedades, el proceso de disolución y liquidación es más largo e implica notaría y registro mercantil. Precio: consultar según situación.',
    estimatedPrice: 'Consultar',
  },

  // ── TRÁFICO Y CAPITANÍA MARÍTIMA ─────────────────────────────────────────

  {
    serviceId: 'transferencia-vehiculo',
    serviceName: 'Transferencia de Vehículo',
    category: 'trafico-capitania-maritima',
    requiredData: [
      'Si es comprador o vendedor quien contacta',
      'Comunidad autónoma donde se inscribirá el vehículo (determina el ITP)',
      'Precio de venta acordado',
      'Si el vehículo tiene cargas o embargos',
      'Matrícula y datos del vehículo',
    ],
    requiredDocs: [
      'Contrato de compraventa firmado por ambas partes',
      'Permiso de circulación (comprador y vendedor)',
      'Ficha técnica del vehículo (ITV en vigor)',
      'DNI / NIE del comprador y del vendedor',
      'Justificante de pago del ITP (lo gestionamos nosotros)',
    ],
    keyQuestions: [
      '¿Eres el comprador o el vendedor?',
      '¿En qué comunidad autónoma está el vehículo?',
      '¿Cuál fue el precio de venta?',
      '¿Tienes el contrato de compraventa firmado?',
    ],
    botInstructions:
      'El ITP varía por comunidad autónoma (6–10%). La transferencia se debe hacer en un plazo de 30 días desde la compraventa. Precio del servicio: desde 80 €.',
    estimatedPrice: 'Desde 80 €',
  },

  {
    serviceId: 'matriculacion',
    serviceName: 'Matriculación de Vehículos',
    category: 'trafico-capitania-maritima',
    requiredData: [
      'Si es vehículo nuevo o importado',
      'País de origen si es importado',
      'Cilindrada, tipo de combustible y emisiones de CO₂ (para calcular IEDMT)',
      'Si tiene factura del concesionario o precio de importación',
    ],
    requiredDocs: [
      'Factura de compra del vehículo',
      'Ficha técnica homologada',
      'DNI / NIE del titular',
      'Certificado de conformidad (vehículos europeos)',
      'Documentación aduanera si es importado de fuera de la UE',
    ],
    keyQuestions: [
      '¿Es un vehículo nuevo o importado?',
      '¿De qué país proviene?',
      '¿Tienes la ficha técnica homologada?',
    ],
    botInstructions:
      'El impuesto de matriculación (IEDMT) se paga en la primera matriculación en España o si el vehículo supera ciertos límites de emisiones de CO₂. Precio: consultar según caso.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'duplicado-permiso',
    serviceName: 'Duplicado de Documentos de Tráfico',
    category: 'trafico-capitania-maritima',
    requiredData: [
      'Qué documento necesita duplicar (permiso de conducir, permiso de circulación, ficha técnica)',
      'Motivo (pérdida, robo, deterioro)',
      'Si hay denuncia de robo presentada',
    ],
    requiredDocs: [
      'DNI / NIE en vigor del titular',
      'Denuncia de robo si aplica',
      'Matrícula del vehículo (para permiso de circulación o ficha técnica)',
    ],
    keyQuestions: [
      '¿Qué documento necesitas duplicar?',
      '¿Lo has perdido, te lo han robado o está deteriorado?',
      '¿Has puesto denuncia?',
    ],
    botInstructions:
      'Mientras espera el duplicado del carnet, el titular no puede conducir salvo que tenga resguardo provisional en vigor. Precio: desde 50 €.',
    estimatedPrice: 'Desde 50 €',
  },

  {
    serviceId: 'tramites-embarcaciones',
    serviceName: 'Trámites de Embarcaciones',
    category: 'trafico-capitania-maritima',
    requiredData: [
      'Tipo de trámite (matriculación, transferencia, baja, abanderamiento)',
      'Tipo de embarcación (eslora, motor, vela, moto de agua)',
      'Capitanía Marítima de la provincia',
      'Si tiene titulación náutica el comprador/titular',
    ],
    requiredDocs: [
      'DNI / NIE del titular',
      'Contrato de compraventa (si es transferencia)',
      'Documentación técnica de la embarcación',
      'Certificado de navegabilidad',
      'Póliza de seguro obligatorio de responsabilidad civil',
    ],
    keyQuestions: [
      '¿Qué trámite necesitas?',
      '¿Dónde está la embarcación actualmente?',
      '¿Tienes toda la documentación técnica de la embarcación?',
    ],
    botInstructions:
      'Los trámites de embarcaciones dependen de la Capitanía Marítima de cada provincia. Precio: consultar según trámite.',
    estimatedPrice: 'Consultar',
  },

  // ── NOTARÍA Y PROPIEDADES ────────────────────────────────────────────────

  {
    serviceId: 'compraventa-inmueble',
    serviceName: 'Compraventa de Inmueble',
    category: 'notaria-propiedades',
    requiredData: [
      'Si es vivienda nueva o de segunda mano (determina IVA o ITP)',
      'Precio de compraventa acordado',
      'Comunidad autónoma donde se ubica el inmueble',
      'Si hay hipoteca del comprador',
      'Si hay arras firmadas y cuándo es la firma notarial prevista',
      'Si el vendedor es persona física o empresa',
      'Referencia catastral del inmueble',
    ],
    requiredDocs: [
      'DNI / NIE de comprador y vendedor',
      'Nota simple registral del inmueble (lo podemos obtener nosotros)',
      'Contrato de arras o promesa de compraventa',
      'Certificado de eficiencia energética',
      'Certificado de comunidad de propietarios al corriente de pago',
      'Último recibo del IBI',
      'Escritura de la hipoteca del vendedor si existe (para cancelarla)',
    ],
    keyQuestions: [
      '¿Es vivienda nueva o de segunda mano?',
      '¿Cuál es el precio de venta?',
      '¿En qué comunidad autónoma está el inmueble?',
      '¿Ya tienes el contrato de arras firmado?',
      '¿Hay hipoteca pendiente del vendedor?',
    ],
    botInstructions:
      'Para segunda mano: ITP (6–10% según CCAA). Para vivienda nueva: IVA 10% + AJD. El comprador tiene 30 días hábiles para liquidar el impuesto tras la escritura. Verificar siempre la nota simple para cargas. Precio: consultar según operación.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'herencia',
    serviceName: 'Herencia y Sucesión',
    category: 'notaria-propiedades',
    requiredData: [
      'Si hay testamento o fallecimiento intestado',
      'Grado de parentesco de los herederos',
      'Comunidad autónoma de residencia del fallecido y donde están los bienes',
      'Tipo de bienes (inmuebles, cuentas, vehículos, otros)',
      'Si hay acuerdo entre todos los herederos',
      'Fecha de fallecimiento (hay 6 meses para liquidar el Impuesto de Sucesiones)',
    ],
    requiredDocs: [
      'Certificado de defunción',
      'Certificado de últimas voluntades (lo tramitamos nosotros)',
      'Testamento (si lo hay) o acta de declaración de herederos',
      'DNI de todos los herederos',
      'Escrituras de inmuebles heredados',
      'Extractos bancarios y certificados de saldo de las cuentas del fallecido',
      'Documentación de otros bienes (vehículos, acciones, seguros de vida)',
      'Certificado de cobertura del seguro de vida (si aplica)',
    ],
    keyQuestions: [
      '¿Cuándo falleció? ¿Hay testamento?',
      '¿Cuántos herederos sois y estáis de acuerdo?',
      '¿Qué tipo de bienes hay en la herencia? (inmuebles, cuentas bancarias, etc.)',
      '¿En qué comunidad autónoma vivía el fallecido?',
    ],
    botInstructions:
      'El Impuesto de Sucesiones debe liquidarse en 6 meses desde el fallecimiento (prorrogables otros 6). Las reducciones varían enormemente por comunidad autónoma. La renuncia a la herencia debe hacerse ante notario. Precio: consultar según caudal hereditario.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'donacion',
    serviceName: 'Donación de Bienes',
    category: 'notaria-propiedades',
    requiredData: [
      'Qué se dona (inmueble, dinero en efectivo, acciones u otros)',
      'Valor del bien donado',
      'Grado de parentesco entre donante y donatario',
      'Comunidad autónoma donde tributa el donatario (determina las reducciones)',
      'Si hay más de un donatario',
    ],
    requiredDocs: [
      'DNI de donante y donatario',
      'Escritura del inmueble si se dona un bien inmueble',
      'Nota simple registral del inmueble',
      'Certificado bancario si se dona dinero',
    ],
    keyQuestions: [
      '¿Qué vas a donar? ¿Un inmueble, dinero u otro bien?',
      '¿Cuál es el valor aproximado?',
      '¿Qué parentesco hay entre donante y receptor?',
      '¿En qué comunidad autónoma reside quien recibe la donación?',
    ],
    botInstructions:
      'El Impuesto de Donaciones lo paga el receptor y varía mucho por CCAA. Madrid y Andalucía tienen reducciones de hasta el 99% para donaciones entre padres e hijos. Las donaciones de dinero en efectivo superiores a 2.500 € deben justificarse con transferencia bancaria. Precio: consultar.',
    estimatedPrice: 'Consultar',
  },

  {
    serviceId: 'hipoteca-cancelacion',
    serviceName: 'Cancelación de Hipoteca',
    category: 'notaria-propiedades',
    requiredData: [
      'Si el préstamo hipotecario está ya completamente pagado',
      'Entidad bancaria del préstamo',
      'Registro de la Propiedad donde está inscrita la hipoteca',
      'Si el banco ya ha emitido el certificado de deuda cero',
    ],
    requiredDocs: [
      'DNI / NIE del titular del préstamo',
      'Escritura de la hipoteca',
      'Certificado de deuda cero del banco (lo coordinamos nosotros)',
      'Nota simple registral del inmueble',
    ],
    keyQuestions: [
      '¿Ya has terminado de pagar la hipoteca?',
      '¿Sabes en qué Registro de la Propiedad está inscrita?',
      '¿El banco ya te ha dado el certificado de deuda cero?',
    ],
    botInstructions:
      'El banco solo emite el certificado de deuda cero — la cancelación registral la debe hacer el titular. Este trámite es necesario si se va a vender el inmueble o pedir otro préstamo. Precio: desde 150 €.',
    estimatedPrice: 'Desde 150 €',
  },

  // ── CERTIFICADO DIGITAL ─────────────────────────────────────────────────

  {
    serviceId: 'certificado-digital-persona-fisica',
    serviceName: 'Certificado Digital Persona Física — Camerfirma',
    category: 'certificado-digital',
    requiredData: [
      'Si prefiere la cita presencial o por videoconferencia',
      'Si tiene ordenador con Windows o macOS disponible para la instalación',
      'Si el certificado es para uso personal o profesional como autónomo',
    ],
    requiredDocs: [
      'DNI o NIE original en vigor',
      'Email activo al que tenga acceso durante la sesión',
    ],
    keyQuestions: [
      '¿Prefieres la cita presencial o por videoconferencia?',
      '¿Tienes el DNI / NIE en vigor?',
      '¿Para qué trámites necesitas el certificado digital?',
    ],
    botInstructions:
      'Somos Punto de Registro Autorizado de Camerfirma. El proceso dura menos de 15 minutos. El certificado se emite en el momento de la cita. Precio: 90 €. Validez: 2–3 años. Tras el pago online confirmamos la cita en menos de 24 horas. Ofrecer enlace de pago.',
    estimatedPrice: '90 €',
  },

  {
    serviceId: 'certificado-digital-entidad',
    serviceName: 'Certificado Digital de Entidad — Camerfirma',
    category: 'certificado-digital',
    requiredData: [
      'CIF de la entidad',
      'Nombre y cargo del representante legal',
      'Si el representante es administrador único o necesita poderes',
      'Si la entidad es SL, SA, asociación, fundación u otro tipo',
    ],
    requiredDocs: [
      'CIF de la entidad',
      'Escrituras de constitución o estatutos vigentes',
      'Poderes de representación (si el solicitante no es administrador único)',
      'DNI o NIE original en vigor del representante legal',
      'Email corporativo activo',
    ],
    keyQuestions: [
      '¿Qué tipo de entidad es? (SL, SA, asociación…)',
      '¿Eres el administrador único o necesitas poderes?',
      '¿Tienes las escrituras actualizadas?',
      '¿Para qué trámites necesita el certificado la empresa?',
    ],
    botInstructions:
      'El certificado de entidad permite actuar y firmar en nombre de la organización. Precio: 150 €. Plazo: 24–48 horas desde la verificación del representante. Somos Punto de Registro Autorizado de Camerfirma.',
    estimatedPrice: '150 €',
  },

  {
    serviceId: 'certificado-digital-sin-animo-lucro',
    serviceName: 'Certificado Digital Entidad Sin Ánimo de Lucro — Camerfirma',
    category: 'certificado-digital',
    requiredData: [
      'Tipo de entidad (asociación, fundación, ONG, comunidad religiosa…)',
      'CIF o NIF de la entidad',
      'Nombre y cargo del representante legal (presidente, secretario, etc.)',
      'Si tiene estatutos y acta de nombramiento del cargo actualizados',
      'Si prefiere la cita presencial o por videoconferencia',
    ],
    requiredDocs: [
      'CIF o NIF de la entidad',
      'Estatutos de la entidad vigentes',
      'Acta de nombramiento del representante legal en vigor',
      'DNI o NIE original en vigor del representante legal',
      'Email activo de la entidad durante el proceso',
    ],
    keyQuestions: [
      '¿Qué tipo de entidad es?',
      '¿Tienes los estatutos y el acta de nombramiento del representante actualizados?',
      '¿Para qué trámites necesita el certificado la entidad?',
      '¿Prefieres la cita presencial o por videoconferencia?',
    ],
    botInstructions:
      'El certificado de entidad sin ánimo de lucro sigue el mismo proceso que el de entidad comercial pero adaptado a la documentación de estas organizaciones (estatutos + acta en lugar de escrituras). Precio: 150 €. Plazo: 24–48 horas desde la verificación. Somos Punto de Registro Autorizado de Camerfirma.',
    estimatedPrice: '150 €',
  },

  // ── FORMACIÓN ────────────────────────────────────────────────────────────

  {
    serviceId: 'formacion-fiscal-contable',
    serviceName: 'Formación Fiscal y Contable',
    category: 'formacion',
    requiredData: [
      'Nivel de conocimientos previos del participante',
      'Tema o área específica de interés (IRPF, IVA, cierre contable, etc.)',
      'Número de participantes',
      'Preferencia: sesión online o presencial',
      'Disponibilidad horaria',
    ],
    requiredDocs: [],
    keyQuestions: [
      '¿Qué área concreta te interesa? (IRPF, IVA, contabilidad general…)',
      '¿Cuántas personas participarán?',
      '¿Prefieres sesión online o presencial?',
      '¿Cuál es tu nivel de conocimientos actuales?',
    ],
    botInstructions:
      'La formación se adapta al perfil y necesidades del cliente. Precio: 180 € por bloque de 2 horas. Se puede reservar más de un bloque. Ofrecer cita para comentar el contenido: expertconsulting.es/cita.',
    estimatedPrice: '180 € / bloque de 2 h',
  },

  {
    serviceId: 'formacion-laboral-rrhh',
    serviceName: 'Formación Laboral y RRHH',
    category: 'formacion',
    requiredData: [
      'Perfil del participante (gerente, responsable de RRHH, administrador)',
      'Tema específico (contratos, nóminas, bajas, despidos, etc.)',
      'Número de participantes',
      'Preferencia: sesión online o presencial',
    ],
    requiredDocs: [],
    keyQuestions: [
      '¿En qué área laboral necesitas formación?',
      '¿Tienes ya empleados o estás pensando en contratar?',
      '¿Cuántas personas asistirán?',
    ],
    botInstructions:
      'Formación adaptada al nivel del participante, desde básico hasta avanzado. Precio: 180 € / bloque de 2 horas. Incluye plantillas y modelos.',
    estimatedPrice: '180 € / bloque de 2 h',
  },

  {
    serviceId: 'formacion-holded',
    serviceName: 'Formación en Holded',
    category: 'formacion',
    requiredData: [
      'Si ya tiene cuenta activa en Holded',
      'Módulos que usa o quiere aprender (facturación, contabilidad, inventario, CRM, proyectos)',
      'Nivel de uso actual (nunca lo ha usado, usa básico, quiere avanzado)',
      'Número de participantes',
    ],
    requiredDocs: [],
    keyQuestions: [
      '¿Ya tienes Holded o lo estás evaluando?',
      '¿Qué módulos quieres aprender a usar?',
      '¿Cuántos bloques de 2 horas crees que necesitarías?',
    ],
    botInstructions:
      'Como Holded Solution Partner, trabajamos directamente sobre la cuenta del cliente. Si no tiene Holded, podemos ayudarle a configurarlo primero. Precio: 180 € / bloque de 2 horas. Para facturación básica suele ser suficiente 1–2 bloques; para contabilidad completa, 3–4. Ofrecer enlace Holded: expertconsulting.es/holded.',
    estimatedPrice: '180 € / bloque de 2 h',
  },
  {
    serviceId: 'formacion-administraciones-publicas',
    serviceName: 'Formación: Administraciones Públicas',
    category: 'formacion',
    requiredData: [
      'Organismos de interés (AEAT, Seguridad Social, Extranjería, DGT, etc.)',
      'Nivel de experiencia previo con la Administración electrónica',
      'Si ya tiene certificado digital o Cl@ve instalados',
      'Número de participantes',
      'Preferencia: sesión online o presencial',
    ],
    requiredDocs: [],
    keyQuestions: [
      '¿Con qué organismos necesitas relacionarte habitualmente?',
      '¿Tienes ya certificado digital o Cl@ve?',
      '¿Cuántos participantes asistirán?',
      '¿Qué nivel de conocimiento digital tienen los participantes?',
    ],
    botInstructions:
      'La formación se adapta a los organismos y necesidades del cliente (AEAT, SS, extranjería, DGT…). Precio: 180 € / bloque de 2 horas. Incluye guías de referencia.',
    estimatedPrice: '180 € / bloque de 2 h',
  },

  {
    serviceId: 'formacion-alta-autonomo-sl',
    serviceName: 'Formación: Alta de Autónomo y Constitución de SL',
    category: 'formacion',
    requiredData: [
      'Si ya está dado de alta o está en fase previa',
      'Si valora autónomo, SL o ambas opciones',
      'Actividad que va a desarrollar',
      'Número de participantes',
      'Preferencia: sesión online o presencial',
    ],
    requiredDocs: [],
    keyQuestions: [
      '¿Ya tienes claro si quieres ser autónomo o constituir una SL?',
      '¿Estás en fase previa o ya has iniciado trámites?',
      '¿Cuántas personas participarán?',
    ],
    botInstructions:
      'Formación orientada a emprendedores antes o durante el proceso de inicio de actividad. Muy práctica. Precio: 180 € / bloque de 2 horas.',
    estimatedPrice: '180 € / bloque de 2 h',
  },

  {
    serviceId: 'formacion-planificacion-fiscal',
    serviceName: 'Formación en Planificación Fiscal',
    category: 'formacion',
    requiredData: [
      'Si es autónomo, socio-administrador o empresa',
      'Nivel de ingresos aproximado (para orientar las estrategias)',
      'Áreas de interés (IRPF, IS, gastos deducibles, retribución del socio, pensiones)',
      'Número de participantes',
    ],
    requiredDocs: [],
    keyQuestions: [
      '¿Eres autónomo o tienes sociedad?',
      '¿Qué te gustaría aprender: reducir el IRPF, optimizar la retribución del socio, maximizar deducciones…?',
      '¿Cuántos bloques de formación necesitas?',
    ],
    botInstructions:
      'Formación muy valorada por autónomos y pymes que quieren reducir su carga fiscal legalmente. Muy práctica con casos reales. Precio: 180 € / bloque de 2 horas.',
    estimatedPrice: '180 € / bloque de 2 h',
  },
];

/** Returns the checklist for a given service ID, or undefined if not found */
export function getServiceChecklist(serviceId: string): ServiceChecklist | undefined {
  return SERVICE_CHECKLISTS.find((c) => c.serviceId === serviceId);
}

/** Returns checklists for all services in a given category */
export function getChecklistsByCategory(category: string): ServiceChecklist[] {
  return SERVICE_CHECKLISTS.filter((c) => c.category === category);
}

/** Formats a checklist into a concise text block for AI prompt injection */
export function formatChecklistForPrompt(checklist: ServiceChecklist): string {
  const lines: string[] = [
    `SERVICIO: ${checklist.serviceName}`,
    `Precio estimado: ${checklist.estimatedPrice ?? 'Consultar'}`,
    '',
    'Datos que debemos obtener del cliente:',
    ...checklist.requiredData.map((d) => `- ${d}`),
    '',
    'Documentos necesarios:',
    ...(checklist.requiredDocs.length > 0
      ? checklist.requiredDocs.map((d) => `- ${d}`)
      : ['(Sin documentación inicial requerida)']),
    '',
    'Preguntas clave a hacer si no se han respondido:',
    ...checklist.keyQuestions.map((q) => `- ${q}`),
    '',
    `Instrucciones para el asesor virtual: ${checklist.botInstructions}`,
  ];
  return lines.join('\n');
}
