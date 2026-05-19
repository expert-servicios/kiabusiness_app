export const categories = [
  {
    slug: 'declaraciones-impuestos',
    name: 'Declaraciones e Impuestos',
    description: 'Renta, IVA, Sociedades y planificación fiscal anual para personas físicas y empresas.',
    imageUrl: '/catalog/fiscal.png'
  },
  {
    slug: 'extranjeria-nacionalidad',
    name: 'Extranjería y Nacionalidad',
    description: 'Arraigo, permisos, renovaciones y expedientes de nacionalidad española.',
    imageUrl: '/catalog/extranjeria.png'
  },
  {
    slug: 'empresas-autonomos',
    name: 'Empresas y Autónomos',
    description: 'Alta de actividad, asesoría contable y obligaciones recurrentes de negocio.',
    imageUrl: '/catalog/empresa.png'
  },
  {
    slug: 'trafico-capitania-maritima',
    name: 'Tráfico y Capitanía Marítima',
    description: 'Gestiones de tráfico, matriculaciones y trámites de embarcaciones.',
    imageUrl: '/catalog/trafico.png'
  },
  {
    slug: 'notaria-propiedades',
    name: 'Notaría y Propiedades',
    description: 'Compraventas, escrituras, herencias y fiscalidad inmobiliaria.',
    imageUrl: '/catalog/notaria.png'
  },
  {
    slug: 'gestiones-especializadas',
    name: 'Gestiones Especializadas',
    description: 'Certificados digitales Camerfirma para personas físicas y entidades. Punto de Registro Autorizado.',
    imageUrl: '/catalog/certificados.png'
  },
  {
    slug: 'formacion',
    name: 'Formación',
    description:
      'Formación fiscal, contable, legal, mercantil, laboral, RRHH y uso de Holded. Bloques de 2 horas desde 180 euros.',
    imageUrl: '/catalog/formacion.png'
  }
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export type Service = {
  slug: string;
  categoria: CategorySlug;
  name: string;
  shortDescription: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  price?: string;
  duration?: string;
  officialFee?: string;
  servicePriceDetail?: string;
  stripePriceId?: string;
  checkoutLabel?: string;
  checkoutLegal?: string;
  audience?: string[];
  requirements?: string[];
  keyPoints?: { title: string; text: string }[];
  documents?: { title: string; items: string[] }[];
  process?: { title: string; text: string }[];
  notIncluded?: string[];
  reviewBeforeHiring?: string[];
  finalCta?: { title: string; text: string };
  includes: string[];
  requiredDocs?: string[];
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  // ── Declaraciones e Impuestos ─────────────────────────────────────────────
  {
    slug: 'irpf',
    categoria: 'declaraciones-impuestos',
    name: 'Declaración de la Renta (IRPF)',
    shortDescription: 'Preparación y presentación del IRPF con revisión fiscal completa.',
    description:
      'Gestionamos tu declaración de la renta de principio a fin: revisamos tu situación fiscal, identificamos deducciones aplicables, preparamos el borrador, lo validamos contigo y lo presentamos ante la AEAT. Servicio para residentes, trabajadores por cuenta ajena, autónomos y propietarios de inmuebles.',
    price: '150 € + IVA',
    stripePriceId: 'price_1TXMmGLeYwwgvux4wIhcfhEF',
    duration: '3–5 días hábiles',
    includes: [
      'Revisión completa de datos fiscales',
      'Identificación de deducciones y bonificaciones',
      'Preparación y validación del borrador',
      'Presentación telemática ante la AEAT',
      'Justificante de presentación'
    ],
    faqs: [
      { q: '¿Necesito ir a ningún sitio?', a: 'No. Todo el proceso se realiza de forma online. Tú envías la documentación y nosotros gestionamos la presentación.' },
      { q: '¿Qué documentos necesito aportar?', a: 'DNI/NIE, número de referencia AEAT o Cl@ve, certificados de retenciones, datos de inmuebles, préstamos e inversiones si los hay.' },
      { q: '¿Cuándo empieza la campaña de renta?', a: 'La campaña de IRPF arranca en abril y cierra a finales de junio. Te recomendamos no esperar al último momento para evitar saturación.' }
    ]
  },
  {
    slug: 'modelo-151',
    categoria: 'declaraciones-impuestos',
    name: 'Modelo 151 — Régimen Beckham',
    shortDescription: 'Tributación especial para expatriados desplazados a España.',
    description:
      'El régimen especial de impatriados (popularmente conocido como Ley Beckham) permite tributar al tipo fijo del 24% sobre rentas obtenidas en España durante los primeros años de residencia. Gestionamos la solicitud de activación del régimen y la declaración anual del Modelo 151.',
    price: 'Consultar',
    duration: '5–10 días hábiles',
    includes: [
      'Evaluación de elegibilidad y requisitos',
      'Tramitación del Modelo 149 (opción al régimen)',
      'Declaración anual Modelo 151',
      'Asesoramiento fiscal internacional',
      'Presentación telemática y justificante'
    ],
    faqs: [
      { q: '¿Quién puede acogerse al régimen Beckham?', a: 'Trabajadores y directivos desplazados a España que no hayan sido residentes los 5 años anteriores, bajo determinadas condiciones.' },
      { q: '¿Cuánto tiempo dura el régimen?', a: 'Hasta 5 años desde la activación, renovable en algunas circunstancias.' },
      { q: '¿Cubre también a mi familia?', a: 'El régimen es individual, aunque el cónyuge e hijos pueden acogerse bajo ciertos requisitos.' }
    ]
  },
  {
    slug: 'no-residentes',
    categoria: 'declaraciones-impuestos',
    name: 'IRNR — No Residentes',
    shortDescription: 'Declaraciones fiscales para personas no residentes con bienes o rentas en España.',
    description:
      'Si tienes inmuebles, inversiones o percibes rentas de fuente española sin ser residente fiscal, debes presentar el Impuesto sobre la Renta de No Residentes (IRNR). Gestionamos los modelos 210, 211 y 213 adaptados a tu situación.',
    price: 'Desde 80 € / modelo',
    duration: '3–5 días hábiles',
    includes: [
      'Análisis de tu situación como no residente',
      'Preparación del Modelo 210 / 211 / 213',
      'Cálculo de cuota y retenciones',
      'Presentación telemática',
      'Asesoramiento sobre convenios de doble imposición'
    ],
    faqs: [
      { q: '¿Cuándo debo presentar el Modelo 210?', a: 'Depende del tipo de renta. Para imputaciones de inmuebles, en enero del año siguiente. Para alquileres, trimestralmente.' },
      { q: '¿Necesito representante fiscal?', a: 'Sí, si eres no residente en la UE con propiedades en España, es obligatorio tener un representante fiscal en España.' }
    ]
  },
  {
    slug: 'iva-trimestral',
    categoria: 'declaraciones-impuestos',
    name: 'IVA Trimestral',
    shortDescription: 'Presentación del Modelo 303 y liquidación trimestral del IVA.',
    description:
      'Preparamos y presentamos tu declaración trimestral de IVA (Modelo 303), el resumen anual (Modelo 390) y cualquier otro modelo relacionado. Incluye revisión de facturas emitidas y recibidas para garantizar la correcta liquidación.',
    price: 'Desde 60 € / trimestre',
    duration: '2–3 días hábiles',
    includes: [
      'Revisión de facturas emitidas y recibidas',
      'Preparación Modelo 303',
      'Presentación dentro de plazo',
      'Resumen anual Modelo 390',
      'Alerta de plazos y recordatorios'
    ],
    faqs: [
      { q: '¿Cuáles son los plazos trimestrales?', a: 'Del 1 al 20 de los meses de abril, julio, octubre y enero (este último hasta el 30).' },
      { q: '¿Puedo llevar yo las facturas y que solo presentéis?', a: 'Sí, puedes enviarnos el registro de facturas y nos encargamos de la liquidación y presentación.' }
    ]
  },
  {
    slug: 'impuesto-sociedades',
    categoria: 'declaraciones-impuestos',
    name: 'Impuesto de Sociedades',
    shortDescription: 'Declaración anual del IS para sociedades limitadas y anónimas.',
    description:
      'Realizamos el cierre contable del ejercicio y preparamos la declaración del Impuesto sobre Sociedades (Modelo 200), incluyendo ajustes fiscales, deducciones aplicables y conciliación contable-fiscal.',
    price: 'Consultar',
    duration: '7–15 días hábiles',
    includes: [
      'Cierre contable del ejercicio',
      'Ajustes y conciliaciones fiscales',
      'Preparación del Modelo 200',
      'Liquidación y revisión de pagos fraccionados',
      'Presentación telemática y depósito de cuentas'
    ],
    faqs: [
      { q: '¿Cuándo hay que presentarlo?', a: 'En los 25 días naturales siguientes a los 6 meses posteriores al cierre del ejercicio (normalmente en julio para ejercicios que cierran en diciembre).' },
      { q: '¿Necesito también llevar la contabilidad con vosotros?', a: 'No es imprescindible, pero facilita el proceso. Si llevas la contabilidad con nosotros, el precio del IS está incluido en el plan mensual.' }
    ]
  },
  {
    slug: 'modelos-informativos',
    categoria: 'declaraciones-impuestos',
    name: 'Modelos Informativos',
    shortDescription: 'Presentación de modelos 347, 349, 180, 190 y otros declarativos.',
    description:
      'Gestionamos la preparación y presentación de los principales modelos informativos anuales: operaciones con terceros (Modelo 347), operaciones intracomunitarias (Modelo 349), retenciones de alquileres (180), retenciones de trabajo (190), entre otros.',
    price: 'Desde 50 € / modelo',
    duration: '2–4 días hábiles',
    includes: [
      'Revisión y cruce de datos con contabilidad',
      'Preparación del modelo correspondiente',
      'Presentación en plazo ante la AEAT',
      'Copia de justificante de presentación'
    ],
    faqs: [
      { q: '¿Qué pasa si presento un modelo informativo fuera de plazo?', a: 'Existe un régimen sancionador por presentación extemporánea. Te avisamos con antelación para evitar recargos.' }
    ]
  },
  {
    slug: 'modelo-720',
    categoria: 'declaraciones-impuestos',
    name: 'Modelo 720 — Bienes en el Extranjero',
    shortDescription: 'Declaración de bienes y derechos situados en el extranjero ante la AEAT.',
    description:
      'El Modelo 720 es una declaración informativa obligatoria para residentes fiscales en España que posean bienes o derechos en el extranjero por valor superior a 50.000 € en alguna de sus tres categorías: cuentas bancarias, valores e inmuebles. Analizamos tu obligación de declarar, preparamos el modelo y lo presentamos en plazo para evitar sanciones.',
    price: '190 € + IVA',
    stripePriceId: 'price_1TXMmVLeYwwgvux4e9hXI90o',
    duration: '3–5 días hábiles',
    includes: [
      'Análisis de obligación de declarar',
      'Revisión de bienes y derechos en el extranjero',
      'Preparación del Modelo 720 / 721',
      'Presentación telemática ante la AEAT',
      'Justificante de presentación'
    ],
    requiredDocs: [
      'DNI/NIE en vigor',
      'Extractos bancarios de cuentas en el extranjero (saldo a 31/12)',
      'Certificados de valores, fondos o seguros (valor a 31/12)',
      'Escrituras o documentos de titularidad de inmuebles en el extranjero',
      'Número de identificación fiscal extranjero (si aplica)'
    ],
    faqs: [
      { q: '¿Quién está obligado a presentar el Modelo 720?', a: 'Personas físicas y jurídicas residentes en España que tengan bienes o derechos en el extranjero cuyo valor supere los 50.000 € en alguna de las tres categorías (cuentas, valores o inmuebles).' },
      { q: '¿Cuándo hay que presentarlo?', a: 'Entre el 1 de enero y el 31 de marzo del año siguiente al ejercicio que se declara.' },
      { q: '¿Qué pasa si no lo presento?', a: 'Las sanciones por no presentar o presentar incorrectamente pueden ser muy elevadas. Es imprescindible declarar si se supera el umbral.' },
      { q: '¿Tengo que presentarlo cada año?', a: 'Solo en el año en que se supera el umbral por primera vez, y posteriormente cuando alguna categoría experimente un incremento superior a 20.000 € respecto al último ejercicio declarado.' }
    ]
  },

  // ── Extranjería y Nacionalidad ─────────────────────────────────────────────
  {
    slug: 'arraigo-social',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Social',
    shortDescription: 'Autorización de residencia por arraigo social en España.',
    description:
      'El arraigo social permite obtener un permiso de residencia temporal para personas que llevan al menos 3 años empadronadas en España, tienen vínculos familiares con residentes legales o disponen de una oferta de empleo. Preparamos toda la documentación y gestionamos el expediente.',
    price: '490 € + IVA',
    stripePriceId: 'price_1TXMmQLeYwwgvux4ivP7Uhn8',
    duration: 'Variable (3–6 meses según Delegación)',
    includes: [
      'Evaluación previa de elegibilidad',
      'Preparación y revisión de documentación',
      'Elaboración del informe de arraigo',
      'Presentación del expediente',
      'Seguimiento y respuesta a requerimientos'
    ],
    faqs: [
      { q: '¿Cuánto tiempo tengo que llevar en España?', a: 'Mínimo 3 años de permanencia continuada y acreditada.' },
      { q: '¿Necesito contrato de trabajo?', a: 'Para el arraigo social mediante oferta de empleo, sí. Para el arraigo familiar, no es necesario.' }
    ]
  },
  {
    slug: 'arraigo-familiar',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Familiar',
    shortDescription: 'Residencia por vínculos familiares con ciudadanos españoles o residentes.',
    description:
      'Si eres padre o madre de un menor español, o cónyuge/pareja de hecho de un ciudadano español o residente legal, puedes solicitar la autorización de residencia por arraigo familiar. Gestionamos el expediente desde la evaluación inicial hasta la resolución.',
    price: '390 € + IVA',
    stripePriceId: 'price_1TXMmTLeYwwgvux4OvsyKGL2',
    duration: 'Variable',
    includes: [
      'Evaluación de requisitos y vínculo familiar',
      'Preparación de documentación',
      'Presentación ante Extranjería',
      'Seguimiento del expediente'
    ],
    faqs: [
      { q: '¿Cómo acredito el vínculo familiar?', a: 'Mediante libro de familia, certificado de nacimiento, sentencia de filiación u otros documentos según el caso.' }
    ]
  },
  {
    slug: 'renovacion-residencia',
    categoria: 'extranjeria-nacionalidad',
    name: 'Renovación de Residencia',
    shortDescription: 'Renovación de permisos de residencia temporal y larga duración.',
    description:
      'Gestionamos la renovación de tu autorización de residencia (temporal o larga duración) en los plazos adecuados para evitar situaciones de irregularidad sobrevenida. Revisamos tus requisitos, preparamos la documentación y presentamos la solicitud.',
    price: 'Consultar',
    duration: '1–3 meses',
    includes: [
      'Revisión de requisitos para la renovación',
      'Preparación de solicitud y documentación',
      'Presentación electrónica',
      'Seguimiento y atención a requerimientos',
      'Obtención de la nueva tarjeta TIE'
    ],
    faqs: [
      { q: '¿Cuándo debo presentar la renovación?', a: 'Se puede presentar 60 días antes de la caducidad y hasta 90 días después (con posible recargo).' }
    ]
  },
  {
    slug: 'nacionalidad-espanola',
    categoria: 'extranjeria-nacionalidad',
    name: 'Nacionalidad Española',
    shortDescription: 'Expediente de nacionalidad española por residencia o por origen.',
    description:
      'Acompañamos el proceso completo para la obtención de la nacionalidad española por residencia: desde la preparación de la documentación y los exámenes CCSE y DELE hasta la presentación del expediente en el Registro Civil o notaría. Seguimiento continuado hasta la resolución.',
    price: 'Consultar',
    duration: '1–3 años (según expediente)',
    includes: [
      'Revisión del tiempo de residencia y requisitos',
      'Preparación de documentación completa',
      'Orientación para exámenes CCSE y DELE A2',
      'Presentación del expediente',
      'Seguimiento periódico y respuesta a requerimientos'
    ],
    faqs: [
      { q: '¿Cuántos años de residencia necesito?', a: 'En general 10 años, reducibles a 5 (refugiados), 2 (nacionales de países iberoamericanos, Filipinas, Guinea Ecuatorial, Portugal o Andorra) o 1 año en casos especiales.' },
      { q: '¿Tengo que hacer exámenes?', a: 'Sí: el CCSE (conocimientos constitucionales y socioculturales) y el DELE A2 de español si no eres hispanohablante.' }
    ]
  },
  {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    categoria: 'extranjeria-nacionalidad',
    name: 'Nacionalidad española para menor nacido en España',
    shortDescription:
      'Preparación y presentación de solicitud de nacionalidad española por residencia para menores nacidos en España.',
    description:
      'Si tu hijo o hija ha nacido en España y ya cuenta con residencia legal, puede solicitar la nacionalidad española por residencia con el plazo reducido de 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud. Revisamos la viabilidad del caso, preparamos la documentación y presentamos el expediente ante el Ministerio de Justicia cuando proceda.',
    metaTitle: 'Nacionalidad española para menor nacido en España | Ksenia Ilicheva',
    metaDescription:
      'Servicio de preparación y presentación de solicitud de nacionalidad española por residencia para menores nacidos en España. Revisión documental, expediente, formularios y presentación ante el Ministerio de Justicia. Precio: 302,50 € IVA incluido.',
    price: '302,50 € IVA incluido',
    duration: 'Preparación según documentación; resolución legal hasta 1 año',
    officialFee: 'Tasa administrativa 790-026: 104,05 € no incluida',
    servicePriceDetail: 'Honorarios profesionales: 250,00 € + IVA 21 % = 302,50 €',
    stripePriceId: 'price_1TQn6XLeYwwgvux4PQCePaoa',
    checkoutLabel: 'Contratar servicio - 302,50 €',
    checkoutLegal:
      'El pago corresponde exclusivamente a los honorarios profesionales por la preparación y presentación del expediente. La tasa administrativa del Ministerio de Justicia, actualmente 104,05 €, no está incluida y se abonará aparte.',
    keyPoints: [
      {
        title: 'Plazo reducido de 1 año',
        text:
          'El artículo 22 del Código Civil permite solicitar la nacionalidad por residencia con 1 año de residencia para quienes han nacido en territorio español. La residencia debe ser legal, continuada e inmediatamente anterior a la solicitud.'
      },
      {
        title: 'Firma de representantes legales',
        text:
          'Para menores de 14 años, cuando existe acuerdo y firman ambos representantes legales, el Ministerio de Justicia informa que no se exige la autorización previa del Encargado del Registro Civil tras la Ley 8/2021. Si hay discrepancia o solo firma un progenitor sin justificación suficiente, revisamos el caso antes de presentar.'
      },
      {
        title: 'Fecha de residencia legal',
        text:
          'Nacer en España no equivale a obtener la nacionalidad automáticamente. Antes de presentar revisamos la concesión de residencia, TIE, tarjetas anteriores y continuidad para evitar solicitudes prematuras.'
      }
    ],
    audience: [
      'Menor nacido en España e inscrito en el Registro Civil español.',
      'Menor con NIE/TIE o autorización de residencia legal en España.',
      'Familias que ya han cumplido, o están próximas a cumplir, 1 año de residencia legal del menor.',
      'Ambos progenitores o representantes legales están dispuestos a firmar la solicitud.',
      'Familias que quieren evitar errores documentales, requerimientos y retrasos innecesarios.'
    ],
    requirements: [
      'Nacimiento en España inscrito en el Registro Civil español.',
      'Residencia legal del menor en España.',
      'Al menos 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud.',
      'Solicitud firmada por los progenitores o representantes legales que correspondan.',
      'Pago de la tasa administrativa del Ministerio de Justicia mediante modelo 790 código 026.',
      'Documentación exigida por el Ministerio de Justicia digitalizada y revisada.'
    ],
    includes: [
      'Revisión previa de viabilidad del caso',
      'Comprobación del plazo de 1 año de residencia legal del menor',
      'Revisión de NIE/TIE, pasaportes, certificado de nacimiento, empadronamiento y documentación familiar',
      'Preparación del expediente documental',
      'Cumplimentación de formularios oficiales',
      'Instrucciones para el pago de la tasa administrativa 790-026',
      'Presentación telemática ante el Ministerio de Justicia, cuando proceda',
      'Entrega del justificante de presentación y número de expediente',
      'Seguimiento básico inicial del expediente',
      'Orientación sobre requerimientos ordinarios'
    ],
    documents: [
      {
        title: 'Documentación del menor',
        items: [
          'Certificación literal de nacimiento española expedida por el Registro Civil',
          'Pasaporte completo y en vigor, con copia de todas las páginas',
          'NIE/TIE o documento acreditativo de residencia legal en España',
          'Tarjeta de residencia anterior, si existe',
          'Resolución inicial de concesión de residencia o protección temporal, si existe',
          'Certificado de empadronamiento familiar o colectivo actualizado',
          'Certificado de guardería o centro infantil, solo si el menor asiste a un centro'
        ]
      },
      {
        title: 'Documentación de los progenitores',
        items: [
          'Pasaporte completo y en vigor de ambos progenitores',
          'NIE/TIE de ambos progenitores por ambas caras',
          'Certificado de empadronamiento familiar, si no se aporta por separado',
          'Datos de contacto: teléfono, correo electrónico y domicilio actual',
          'Firma de ambos progenitores como representantes legales del menor',
          'Documentación adicional si solo uno de los progenitores puede firmar'
        ]
      }
    ],
    process: [
      {
        title: 'Pago del servicio',
        text: 'El cliente contrata el servicio mediante pago online seguro.'
      },
      {
        title: 'Envío de documentación',
        text: 'Después del pago, se envía la documentación necesaria por WhatsApp o correo electrónico.'
      },
      {
        title: 'Revisión de viabilidad',
        text: 'Comprobamos el requisito de 1 año de residencia legal y revisamos si el expediente está completo.'
      },
      {
        title: 'Preparación del expediente',
        text: 'Preparamos la solicitud, formularios y documentación digitalizada.'
      },
      {
        title: 'Pago de tasa administrativa',
        text: 'Cuando el expediente está preparado, indicamos cómo abonar la tasa oficial del Ministerio de Justicia.'
      },
      {
        title: 'Presentación de la solicitud',
        text: 'Presentamos la solicitud ante el Ministerio de Justicia o dejamos el expediente preparado para su presentación, según el caso contratado.'
      },
      {
        title: 'Justificante y seguimiento inicial',
        text: 'Entregamos el justificante de presentación, el número de expediente y una primera orientación de seguimiento.'
      }
    ],
    notIncluded: [
      'Tasa administrativa del Ministerio de Justicia: 104,05 €',
      'Traducciones juradas, si fueran necesarias',
      'Apostillas o legalizaciones, si fueran necesarias',
      'Certificados oficiales que deban solicitarse aparte',
      'Actuaciones extraordinarias por requerimientos complejos',
      'Recursos administrativos o judiciales en caso de denegación',
      'Trámites posteriores no incluidos expresamente'
    ],
    reviewBeforeHiring: [
      'El menor aún no tiene clara la fecha de inicio de residencia legal.',
      'Solo uno de los progenitores puede firmar.',
      'Existen diferencias en nombres, apellidos o transliteraciones entre documentos.',
      'El pasaporte está caducado.',
      'No existe certificado literal de nacimiento español.',
      'La residencia se ha concedido recientemente.',
      'Hay cambios de domicilio no reflejados en el empadronamiento.',
      'Hay documentación extranjera sin traducir o sin legalizar.'
    ],
    finalCta: {
      title: '¿Tu hijo nació en España y ya tiene residencia legal?',
      text:
        'Podemos ayudarte a preparar y presentar su solicitud de nacionalidad española por residencia, revisando previamente si cumple el plazo legal de 1 año y si la documentación está completa.'
    },
    faqs: [
      {
        q: '¿Mi hijo obtiene la nacionalidad automáticamente por haber nacido en España?',
        a:
          'No. Nacer en España puede reducir el plazo exigido para solicitar la nacionalidad por residencia a 1 año, pero no concede automáticamente la nacionalidad española en todos los casos.'
      },
      {
        q: '¿Cuándo se puede presentar la solicitud?',
        a:
          'Cuando el menor haya cumplido 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud.'
      },
      {
        q: '¿Sirve la residencia de los padres?',
        a:
          'No basta con la residencia legal de los padres. Hay que verificar la residencia legal del menor.'
      },
      {
        q: '¿La tasa está incluida en el precio?',
        a:
          'No. La tasa administrativa del Ministerio de Justicia, actualmente 104,05 €, se paga aparte.'
      },
      {
        q: '¿Pueden pagar ustedes la tasa por mí?',
        a:
          'Sí, podemos gestionarla en nombre del cliente cuando el expediente esté preparado, avisando previamente y cumplimentando los datos a nombre del menor solicitante.'
      },
      {
        q: '¿Tienen que firmar los dos progenitores?',
        a:
          'Si ambos ejercen la patria potestad, lo recomendable es que firmen ambos progenitores como representantes legales del menor. Si solo puede firmar uno, revisamos la documentación que justifica la representación suficiente.'
      },
      {
        q: '¿Hace falta autorización previa del Registro Civil?',
        a:
          'Si ambos progenitores están de acuerdo y firman la solicitud, conforme a la nota informativa del Ministerio de Justicia tras la Ley 8/2021, no debería exigirse autorización previa del Encargado del Registro Civil. Si hay discrepancia, debe estudiarse el caso concreto.'
      },
      {
        q: '¿El menor tiene que hacer examen CCSE o DELE?',
        a:
          'En menores de edad no se exige realizar las pruebas de adultos en los términos ordinarios. La integración se valora conforme a la edad y circunstancias del menor.'
      },
      {
        q: '¿Qué pasa si falta algún documento?',
        a:
          'Te indicaremos qué documento falta y cómo obtenerlo. No recomendamos presentar expedientes incompletos salvo estrategia justificada, porque suele terminar en requerimientos.'
      }
    ]
  },
  {
    slug: 'nie-pasaporte',
    categoria: 'extranjeria-nacionalidad',
    name: 'NIE y Gestiones Consulares',
    shortDescription: 'Obtención del Número de Identificación de Extranjero (NIE) y gestiones consulares.',
    description:
      'Tramitamos la obtención del NIE (para ciudadanos de la UE o no UE), así como gestiones relacionadas con el Consulado: citas, documentación para visados, certificados de registro y otras diligencias consulares en España.',
    price: 'Desde 60 €',
    duration: '1–4 semanas',
    includes: [
      'Gestión de cita previa',
      'Preparación de formularios y documentación',
      'Tramitación del Modelo EX-15',
      'Acompañamiento si es necesario'
    ],
    faqs: [
      { q: '¿Para qué necesito el NIE?', a: 'Para firmar contratos, abrir cuentas bancarias, comprar un inmueble, trabajar o iniciar cualquier actividad económica en España.' }
    ]
  },
  {
    slug: 'reagrupacion-familiar',
    categoria: 'extranjeria-nacionalidad',
    name: 'Reagrupación Familiar',
    shortDescription: 'Autorización de residencia para familiares de residentes legales en España.',
    description:
      'Si eres residente legal en España y quieres traer a tu cónyuge, hijos menores o ascendientes dependientes, gestionamos el expediente de reagrupación familiar completo: desde los requisitos económicos y de vivienda hasta la presentación y seguimiento.',
    price: 'Consultar',
    duration: '3–6 meses',
    includes: [
      'Evaluación de requisitos (vivienda, ingresos, parentesco)',
      'Preparación del expediente completo',
      'Presentación en Extranjería',
      'Seguimiento del expediente'
    ],
    faqs: [
      { q: '¿Qué familiares puedo reagrupar?', a: 'Cónyuge o pareja de hecho, hijos menores de 18 años (o mayores dependientes), y padres mayores dependientes económicamente.' }
    ]
  },
  {
    slug: 'permiso-residencia-inicial',
    categoria: 'extranjeria-nacionalidad',
    name: 'Permiso Inicial de Residencia',
    shortDescription: 'Obtención del primer permiso de residencia legal en España para ciudadanos extracomunitarios.',
    description:
      'El permiso inicial de residencia es el primer paso para regularizar tu situación en España de forma legal. Gestionamos el expediente completo: evaluamos tu situación personal, determinamos la vía más adecuada (arraigo laboral, circunstancias excepcionales, reagrupación, trabajo…), preparamos toda la documentación y la presentamos ante la Oficina de Extranjería. Te acompañamos en cada fase hasta recibir la resolución favorable y recoger tu TIE.',
    price: '490 € + IVA',
    duration: '2–4 meses',
    stripePriceId: 'price_1TX3epLeYwwgvux4mspOiVLg',
    includes: [
      'Evaluación gratuita de la vía más adecuada a tu situación',
      'Revisión y guía de aportación de documentación',
      'Cumplimentación del formulario EX-01 o EX-02 según proceda',
      'Presentación telemática o presencial ante la Oficina de Extranjería',
      'Seguimiento activo del expediente y atención a requerimientos',
      'Notificación de resolución y pasos para recoger el TIE'
    ],
    requiredDocs: [
      'Pasaporte en vigor (con copia de todas las páginas)',
      'Formulario de solicitud (EX-01 o EX-02) cumplimentado',
      'Fotografía reciente en color tamaño carné',
      'Justificante de pago de la tasa (Modelo 790 código 052)',
      'Certificado de empadronamiento (mínimo 3 años continuados si aplica arraigo)',
      'Contrato de trabajo o oferta laboral firmada (si aplica)',
      'Medios económicos suficientes (nóminas, extractos bancarios o similar)',
      'Seguro médico privado sin copago y sin carencia (si no cotiza a SS)',
      'Antecedentes penales del país de origen apostillados y traducidos',
      'Certificado de antecedentes penales de España'
    ],
    faqs: [
      { q: '¿Cuánto tarda el permiso inicial de residencia?', a: 'El plazo legal de resolución es de 3 meses desde la presentación. En la práctica, en la mayoría de oficinas de extranjería el tiempo oscila entre 2 y 4 meses, aunque puede alargarse en provincias con mayor carga de trabajo.' },
      { q: '¿Qué pasa si no resuelven en el plazo legal?', a: 'Si la Administración no resuelve en 3 meses, opera el silencio administrativo negativo. Sin embargo, esto abre la vía de recurso. Te orientamos sobre cómo actuar en ese caso.' },
      { q: '¿Puedo trabajar mientras tramito el permiso inicial?', a: 'Depende de la vía. Con el arraigo laboral, al presentar la solicitud se puede solicitar un permiso provisional de trabajo. En otras vías no está permitido trabajar durante la tramitación.' },
      { q: '¿Qué es el TIE?', a: 'La Tarjeta de Identidad de Extranjero (TIE) es el documento físico que acredita tu permiso de residencia. Se solicita en comisaría una vez recibida la resolución favorable y se entrega en un plazo aproximado de 30–45 días.' },
      { q: '¿Necesito venir en persona a vuestras oficinas?', a: 'No. Toda la gestión se realiza de forma online. Tú nos envías la documentación escaneada y nosotros preparamos y presentamos el expediente. Solo necesitarás acudir presencialmente a la Oficina de Extranjería si es obligatorio para tu vía concreta.' }
    ]
  },

  // ── Empresas y Autónomos ───────────────────────────────────────────────────
  {
    slug: 'alta-autonomo',
    categoria: 'empresas-autonomos',
    name: 'Alta de Autónomo',
    shortDescription: 'Tramitación del alta en el RETA y gestión de la actividad económica.',
    description:
      'Gestionamos tu alta como autónomo en la Agencia Tributaria (Modelo 036/037) y en la Seguridad Social (RETA), con asesoramiento sobre el epígrafe de actividad más adecuado, cuota de autónomos, tarifa plana y obligaciones fiscales desde el inicio.',
    price: '120 € + IVA',
    stripePriceId: 'price_1TXMmKLeYwwgvux4oXpYh27g',
    duration: '1–3 días hábiles',
    includes: [
      'Modelo 036/037 — Alta en Hacienda',
      'Alta en el RETA (Seguridad Social)',
      'Asesoramiento sobre epígrafe y base de cotización',
      'Información sobre tarifa plana y bonificaciones',
      'Guía de obligaciones fiscales del autónomo'
    ],
    faqs: [
      { q: '¿Cuánto tarda el alta?', a: 'El alta fiscal es inmediata. El alta en el RETA puede tardar 1–3 días.' },
      { q: '¿Cuál es la cuota de autónomos en 2025?', a: 'Con el nuevo sistema de cotización por ingresos reales, la cuota varía entre 200 € y 590 € aproximadamente según el tramo de rendimientos netos.' }
    ]
  },
  {
    slug: 'constitucion-sl',
    categoria: 'empresas-autonomos',
    name: 'Constitución de Sociedad Limitada',
    shortDescription: 'Creación de una SL con capital mínimo, estatutos y alta fiscal.',
    description:
      'Acompañamos todo el proceso de constitución de una Sociedad Limitada: denominación social, redacción de estatutos, elevación a escritura pública, inscripción en el Registro Mercantil y alta fiscal en Hacienda. Incluye asesoramiento sobre estructura societaria y fiscal.',
    price: '490 € + IVA',
    stripePriceId: 'price_1TXMmNLeYwwgvux4hIk84Aug',
    duration: '7–15 días hábiles',
    includes: [
      'Certificado de denominación social (BORME)',
      'Redacción de estatutos y pacto de socios',
      'Escritura pública notarial',
      'Inscripción en Registro Mercantil',
      'Alta en Hacienda (Modelo 036)',
      'Obtención del CIF definitivo'
    ],
    faqs: [
      { q: '¿Cuánto capital mínimo se necesita?', a: 'Desde 1 euro, aunque lo habitual es un capital inicial de 3.000 €.' },
      { q: '¿Puedo constituir una SL yo solo?', a: 'Sí, se puede constituir una SL unipersonal con un único socio.' }
    ]
  },
  {
    slug: 'contabilidad-mensual',
    categoria: 'empresas-autonomos',
    name: 'Contabilidad Mensual',
    shortDescription: 'Llevanza de contabilidad y registro contable para autónomos y sociedades.',
    description:
      'Nos encargamos de la contabilidad mensual de tu empresa o actividad: registro de facturas, conciliaciones bancarias, informes mensuales de resultados y balance. Trabajamos con Holded para mayor visibilidad y control.',
    price: 'Desde 80 € / mes',
    duration: 'Servicio recurrente mensual',
    includes: [
      'Registro de facturas emitidas y recibidas',
      'Conciliación bancaria',
      'Informes de pérdidas y ganancias mensuales',
      'Balance de situación trimestral',
      'Acceso a Holded con datos actualizados'
    ],
    faqs: [
      { q: '¿Necesito Holded para contratar este servicio?', a: 'No es obligatorio, pero trabajamos preferentemente con Holded. Si no lo tienes, podemos ayudarte a migrarlo.' },
      { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, con un preaviso de 30 días.' }
    ]
  },
  {
    slug: 'impuestos-trimestrales',
    categoria: 'empresas-autonomos',
    name: 'Impuestos Trimestrales',
    shortDescription: 'Presentación trimestral de IVA, IRPF y otros modelos recurrentes.',
    description:
      'Gestionamos la presentación trimestral de tus impuestos: IVA (Modelo 303), retenciones a trabajadores (Modelo 111), retenciones de alquileres (Modelo 115) y pagos fraccionados del IRPF (Modelo 130/131). Todo en plazo y con revisión previa.',
    price: 'Desde 120 € / trimestre',
    duration: 'Servicio recurrente trimestral',
    includes: [
      'Revisión de datos contables del trimestre',
      'Modelos 303, 111, 115 y 130/131 según aplique',
      'Presentación telemática en plazo',
      'Informe de liquidación'
    ],
    faqs: [
      { q: '¿Qué pasa si no presento los impuestos a tiempo?', a: 'Hacienda aplica recargos e intereses de demora. Con nuestro servicio recibes aviso previo para evitarlo.' }
    ]
  },
  {
    slug: 'baja-cese-actividad',
    categoria: 'empresas-autonomos',
    name: 'Baja y Cese de Actividad',
    shortDescription: 'Tramitación de la baja de autónomo o disolución de sociedad.',
    description:
      'Gestionamos la baja fiscal y en la Seguridad Social del autónomo, o el proceso completo de disolución y liquidación de una sociedad: acuerdos de socios, escritura, liquidación de impuestos pendientes e inscripción registral del cierre.',
    price: 'Consultar',
    duration: 'Variable',
    includes: [
      'Baja en Hacienda (Modelo 036/037)',
      'Baja en el RETA',
      'Liquidación de impuestos pendientes',
      'Para sociedades: acta de disolución, escritura e inscripción registral'
    ],
    faqs: [
      { q: '¿Cuándo conviene darse de baja como autónomo?', a: 'Cuando cesan de forma definitiva los ingresos de la actividad. La baja en el RETA se puede hacer hasta el último día del mes para no pagar ese mes.' }
    ]
  },

  // ── Tráfico y Capitanía Marítima ───────────────────────────────────────────
  {
    slug: 'transferencia-vehiculo',
    categoria: 'trafico-capitania-maritima',
    name: 'Transferencia de Vehículo',
    shortDescription: 'Gestión del cambio de titular en la DGT para compraventas de vehículos.',
    description:
      'Tramitamos la transferencia de titularidad de vehículos de segunda mano ante la DGT: verificamos documentación, liquidamos el impuesto de transmisiones (ITP), presentamos la solicitud y obtenemos el nuevo permiso de circulación a nombre del comprador.',
    price: 'Desde 80 €',
    duration: '3–7 días hábiles',
    includes: [
      'Verificación del contrato de compraventa',
      'Liquidación del ITP (Impuesto de Transmisiones)',
      'Presentación de la transferencia en DGT',
      'Obtención del permiso de circulación'
    ],
    faqs: [
      { q: '¿Qué documentos necesito para la transferencia?', a: 'Contrato de compraventa firmado, ficha técnica del vehículo, permisos de circulación, DNI/NIE de ambas partes.' },
      { q: '¿Tengo que pagar impuestos al comprar un coche de segunda mano?', a: 'Sí, el Impuesto de Transmisiones Patrimoniales (ITP), cuyo porcentaje varía según la comunidad autónoma.' }
    ]
  },
  {
    slug: 'matriculacion',
    categoria: 'trafico-capitania-maritima',
    name: 'Matriculación de Vehículos',
    shortDescription: 'Primera matriculación de vehículos nuevos e importados.',
    description:
      'Gestionamos la primera matriculación de vehículos nuevos o importados: liquidación del IEDMT (impuesto de matriculación), presentación de documentación ante la DGT, obtención de placas y entrega del permiso de circulación definitivo.',
    price: 'Consultar',
    duration: '5–10 días hábiles',
    includes: [
      'Verificación de documentación técnica',
      'Liquidación del IEDMT',
      'Tramitación de matrícula ante la DGT',
      'Obtención de placas y permiso de circulación'
    ],
    faqs: [
      { q: '¿Cuándo debo pagar el impuesto de matriculación?', a: 'En la primera matriculación en España o cuando el vehículo supera ciertos límites de emisiones de CO₂.' }
    ]
  },
  {
    slug: 'duplicado-permiso',
    categoria: 'trafico-capitania-maritima',
    name: 'Duplicado de Documentos de Tráfico',
    shortDescription: 'Obtención de duplicados del permiso de conducir, de circulación o ficha técnica.',
    description:
      'Tramitamos duplicados de permiso de conducir, permiso de circulación o ficha técnica del vehículo por pérdida, robo o deterioro ante la DGT o la prefectura correspondiente.',
    price: 'Desde 50 €',
    duration: '2–5 días hábiles',
    includes: [
      'Gestión de la solicitud ante la DGT',
      'Obtención del duplicado correspondiente'
    ],
    faqs: [
      { q: '¿Puedo conducir mientras espero el duplicado del carnet?', a: 'No, necesitas tener el permiso físico o el resguardo provisional en vigor para circular legalmente.' }
    ]
  },
  {
    slug: 'tramites-embarcaciones',
    categoria: 'trafico-capitania-maritima',
    name: 'Trámites de Embarcaciones',
    shortDescription: 'Matriculación, transferencias y gestiones ante Capitanía Marítima.',
    description:
      'Gestionamos los trámites de embarcaciones de recreo ante Capitanía Marítima: matriculación, cambio de titularidad, despachos, abanderamiento y documentación para titulaciones náuticas. También tramitamos bajas y transferencias de motos de agua.',
    price: 'Consultar',
    duration: '5–15 días hábiles',
    includes: [
      'Matriculación de embarcaciones',
      'Transferencia de titularidad',
      'Abanderamiento y despachos',
      'Tramitación de bajas'
    ],
    faqs: [
      { q: '¿Dónde se tramitan los permisos de embarcaciones en España?', a: 'Ante la Capitanía Marítima de la provincia correspondiente, dependiente de la Dirección General de la Marina Mercante.' }
    ]
  },

  // ── Notaría y Propiedades ──────────────────────────────────────────────────
  {
    slug: 'compraventa-inmueble',
    categoria: 'notaria-propiedades',
    name: 'Compraventa de Inmueble',
    shortDescription: 'Soporte fiscal y documental en la compraventa de viviendas y locales.',
    description:
      'Ofrecemos acompañamiento fiscal y documental en operaciones de compraventa inmobiliaria: revisión del contrato de arras, cálculo de impuestos (ITP o IVA+AJD), representación ante notaría y liquidación de impuestos ante la Hacienda autonómica.',
    price: 'Consultar',
    duration: 'Variable según operación',
    includes: [
      'Revisión del contrato de arras o promesa de compraventa',
      'Cálculo de ITP o IVA+AJD según tipología',
      'Soporte en firma ante notaría',
      'Liquidación de impuestos ante la Hacienda autonómica',
      'Inscripción en el Registro de la Propiedad'
    ],
    faqs: [
      { q: '¿Qué impuestos paga el comprador de un piso de segunda mano?', a: 'El Impuesto de Transmisiones Patrimoniales (ITP), cuyo tipo varía según la comunidad autónoma (entre el 6% y el 10% del precio).' },
      { q: '¿Y si compro una vivienda nueva?', a: 'En vivienda nueva pagas IVA (10%) más Actos Jurídicos Documentados (AJD, entre el 0,5% y el 1,5% según CCAA).' }
    ]
  },
  {
    slug: 'herencia',
    categoria: 'notaria-propiedades',
    name: 'Herencia y Sucesión',
    shortDescription: 'Tramitación de herencias: declaración, liquidación y adjudicación.',
    description:
      'Acompañamos el proceso de aceptación y adjudicación de herencias: obtención del certificado de defunción y últimas voluntades, liquidación del Impuesto de Sucesiones y Donaciones, adjudicación notarial de bienes e inscripción registral.',
    price: 'Consultar',
    duration: '1–6 meses',
    includes: [
      'Certificado de últimas voluntades y seguro de vida',
      'Inventario del caudal hereditario',
      'Liquidación del Impuesto de Sucesiones y Donaciones',
      'Escritura de adjudicación de herencia',
      'Inscripción en Registro de la Propiedad y otras gestiones'
    ],
    faqs: [
      { q: '¿Cuánto tiempo tengo para aceptar la herencia?', a: 'No hay plazo para aceptar, pero el Impuesto de Sucesiones debe liquidarse en 6 meses (prorrogable otros 6).' },
      { q: '¿Puedo renunciar a la herencia?', a: 'Sí, la renuncia es pura y simple, y puede hacerse ante notario.' }
    ]
  },
  {
    slug: 'donacion',
    categoria: 'notaria-propiedades',
    name: 'Donación de Bienes',
    shortDescription: 'Tramitación fiscal y documental de donaciones de inmuebles, dinero o bienes.',
    description:
      'Gestionamos la fiscalidad de las donaciones: cálculo del Impuesto sobre Sucesiones y Donaciones (a cargo del donatario), escritura pública de donación y liquidación ante la Hacienda autonómica. Asesoramos sobre optimización fiscal según el grado de parentesco.',
    price: 'Consultar',
    duration: '2–4 semanas',
    includes: [
      'Cálculo del Impuesto de Donaciones',
      'Escritura pública de donación',
      'Liquidación ante Hacienda',
      'Inscripción registral si hay inmuebles'
    ],
    faqs: [
      { q: '¿Cuánto se paga por una donación entre padres e hijos?', a: 'Depende de la comunidad autónoma. Algunas tienen reducciones muy significativas (hasta el 99% en Madrid o Andalucía para ciertas donaciones).' }
    ]
  },
  {
    slug: 'hipoteca-cancelacion',
    categoria: 'notaria-propiedades',
    name: 'Cancelación de Hipoteca',
    shortDescription: 'Cancelación registral de la hipoteca una vez pagado el préstamo.',
    description:
      'Cuando terminas de pagar la hipoteca, el banco no cancela automáticamente la carga en el Registro de la Propiedad. Gestionamos la obtención del certificado de deuda cero, la firma notarial de la escritura de cancelación y la inscripción registral.',
    price: 'Desde 150 €',
    duration: '2–4 semanas',
    includes: [
      'Obtención del certificado de saldo cero del banco',
      'Escritura notarial de cancelación',
      'Presentación en el Registro de la Propiedad',
      'Nota simple registral actualizada'
    ],
    faqs: [
      { q: '¿Por qué el banco no cancela la hipoteca por su cuenta?', a: 'El banco solo emite el certificado de deuda cero. La cancelación registral debe tramitarla el titular del préstamo.' }
    ]
  },

  // ── Gestiones Especializadas ───────────────────────────────────────────────
  {
    slug: 'certificado-digital-persona-fisica',
    categoria: 'gestiones-especializadas',
    name: 'Certificado Digital Persona Física — Camerfirma',
    shortDescription: 'Obtén tu certificado digital cualificado Camerfirma. Válido ante AEAT, Seguridad Social y todos los organismos públicos.',
    description:
      'Somos Punto de Registro Autorizado de Camerfirma. Tramitamos la obtención o renovación de tu certificado digital cualificado de persona física, imprescindible para firmar documentos electrónicamente y relacionarte con la AEAT, Seguridad Social, Notarías y cualquier organismo público o privado. El proceso es inmediato: verificación de identidad presencial o por videoconferencia, emisión y instalación en el mismo acto.',
    price: '90 €',
    duration: 'Inmediato (presencial o videoconferencia)',
    stripePriceId: 'price_1NUpXWLeYwwgvux4QhANaiJf',
    checkoutLabel: 'Solicitar certificado digital',
    metaTitle: 'Certificado Digital Persona Física Camerfirma · 90 € | EXPERT Asesoría',
    metaDescription: 'Obtén tu certificado digital Camerfirma para persona física desde 90 €. Tramitación inmediata presencial o por videoconferencia. Punto de Registro Autorizado.',
    keyPoints: [
      { title: 'Reconocido oficialmente', text: 'Válido ante AEAT, Seguridad Social, Notarías y todos los organismos públicos y privados.' },
      { title: 'Inmediato', text: 'Emisión en el mismo acto, presencialmente o por videoconferencia sin desplazamiento.' },
      { title: 'Vigencia 2–3 años', text: 'Certificado con larga validez. Te avisamos cuando se aproxime la renovación.' },
      { title: 'Instalación incluida', text: 'Te ayudamos a instalarlo y probarlo en tu equipo para que funcione desde el primer minuto.' },
    ],
    audience: [
      'Personas físicas que gestionan trámites con la AEAT o la Seguridad Social',
      'Autónomos que necesitan firmar electrónicamente',
      'Particulares que realizan trámites online frecuentes con organismos públicos',
      'Ciudadanos que quieren evitar desplazamientos a oficinas presenciales',
    ],
    requirements: [
      'DNI o NIE en vigor',
      'Correo electrónico activo',
      'Ordenador con Windows o macOS para la instalación',
    ],
    includes: [
      'Verificación de identidad presencial o por videoconferencia',
      'Emisión del certificado digital cualificado Camerfirma',
      'Instalación y configuración en tu equipo',
      'Prueba de funcionamiento antes de finalizar',
      'Soporte técnico ante incidencias durante 30 días',
    ],
    documents: [
      {
        title: 'Documentación necesaria',
        items: [
          'DNI o NIE original en vigor',
          'Email activo al que tengas acceso durante la sesión',
        ],
      },
    ],
    process: [
      { title: 'Solicita y paga online', text: 'Completa el formulario y realiza el pago. Recibirás confirmación inmediata.' },
      { title: 'Confirmamos la cita', text: 'Te contactamos en menos de 24 h para fijar la cita presencial o por videoconferencia.' },
      { title: 'Verificación de identidad', text: 'Verificamos tu DNI/NIE. El proceso dura menos de 15 minutos.' },
      { title: 'Emisión e instalación', text: 'El certificado se genera en el momento y te ayudamos a instalarlo y probarlo.' },
    ],
    notIncluded: [
      'Renovación al vencer el certificado (se tramita aparte, mismo precio)',
      'Soporte técnico general del equipo o sistema operativo',
    ],
    reviewBeforeHiring: [
      'Asegúrate de tener el DNI/NIE vigente antes de la cita',
      'El certificado se instala en el equipo que uses en la sesión — lleva el que uses habitualmente',
    ],
    finalCta: {
      title: '¿Listo para tener tu certificado digital hoy?',
      text: 'Solicítalo ahora y te llamamos para fijar la cita. En menos de 24 horas tienes tu certificado instalado y funcionando.',
    },
    faqs: [
      { q: '¿Qué diferencia hay entre el certificado de persona física y el de entidad?', a: 'El de persona física te identifica a ti como individuo. El de entidad identifica a tu empresa o sociedad y permite actuar en su nombre.' },
      { q: '¿Puedo hacerlo por videoconferencia sin ir a vuestra oficina?', a: 'Sí. Ofrecemos ambas modalidades. Por videoconferencia solo necesitas DNI/NIE y conexión a internet.' },
      { q: '¿Cuánto dura el certificado Camerfirma?', a: 'Entre 2 y 3 años según el tipo. Te avisamos con tiempo para renovarlo sin interrupciones.' },
      { q: '¿Es válido para todos los organismos?', a: 'Sí. Camerfirma es una Autoridad de Certificación reconocida y su certificado es válido en AEAT, Seguridad Social, DGT, Notarías y cualquier organismo público o privado.' },
      { q: '¿Qué pasa si ya tengo uno caducado?', a: 'Sin problema. Lo renovamos con el mismo proceso. El precio es el mismo: 90 €.' },
    ],
  },
  {
    slug: 'certificado-digital-entidad',
    categoria: 'gestiones-especializadas',
    name: 'Certificado Digital de Entidad — Camerfirma',
    shortDescription: 'Certificado digital cualificado para tu empresa, asociación o entidad. Actúa digitalmente en nombre de tu organización.',
    description:
      'Como Punto de Registro Autorizado de Camerfirma, tramitamos el certificado digital de entidad (persona jurídica) para que tu empresa, asociación o cualquier organización pueda firmar documentos electrónicamente y relacionarse de forma segura con la AEAT, Seguridad Social, Registros y cualquier organismo público o privado. El proceso incluye la verificación del representante legal y la emisión e instalación en 24–48 horas.',
    price: '150 €',
    duration: '24–48 h desde la verificación',
    stripePriceId: 'price_1NTp8WLeYwwgvux4RmwY4Hso',
    checkoutLabel: 'Solicitar certificado de entidad',
    metaTitle: 'Certificado Digital de Entidad Camerfirma · 150 € | EXPERT Asesoría',
    metaDescription: 'Certificado digital Camerfirma para empresas y entidades desde 150 €. Tramitación en 24–48 h. Punto de Registro Autorizado. Válido ante AEAT, SS y todos los organismos.',
    keyPoints: [
      { title: 'Para cualquier entidad', text: 'Válido para SL, SA, asociaciones, fundaciones, comunidades de propietarios y cualquier persona jurídica.' },
      { title: 'Firma en nombre de la empresa', text: 'Permite actuar y firmar electrónicamente en nombre de tu organización ante cualquier organismo.' },
      { title: 'Tramitación ágil', text: 'Emisión en 24–48 h desde la verificación del representante legal.' },
      { title: 'Instalación incluida', text: 'Configuramos el certificado en el equipo del representante y verificamos su correcto funcionamiento.' },
    ],
    audience: [
      'Sociedades limitadas (SL) y anónimas (SA)',
      'Asociaciones, fundaciones y ONG',
      'Comunidades de propietarios',
      'Cualquier persona jurídica con obligaciones digitales ante organismos públicos',
    ],
    requirements: [
      'CIF de la entidad',
      'DNI o NIE en vigor del representante legal',
      'Escrituras de constitución o poderes de representación',
      'Email corporativo activo',
      'Ordenador con Windows o macOS para la instalación',
    ],
    includes: [
      'Verificación documental de la entidad y del representante legal',
      'Emisión del certificado digital de entidad Camerfirma',
      'Instalación y configuración en el equipo del representante',
      'Prueba de funcionamiento antes de finalizar',
      'Soporte técnico ante incidencias durante 30 días',
    ],
    documents: [
      {
        title: 'Documentación de la entidad',
        items: [
          'CIF de la entidad',
          'Escrituras de constitución o estatutos vigentes',
          'Poderes de representación si el solicitante no es administrador único',
        ],
      },
      {
        title: 'Documentación del representante',
        items: [
          'DNI o NIE original en vigor del representante legal',
          'Email corporativo activo durante el proceso',
        ],
      },
    ],
    process: [
      { title: 'Solicita y paga online', text: 'Completa el formulario con los datos de la entidad y realiza el pago. Recibirás confirmación inmediata.' },
      { title: 'Envío de documentación', text: 'Nos envías las escrituras y el DNI/NIE del representante para la verificación previa.' },
      { title: 'Verificación del representante', text: 'Verificamos la identidad del representante legal presencialmente o por videoconferencia.' },
      { title: 'Emisión e instalación', text: 'Emitimos el certificado en 24–48 h y te ayudamos a instalarlo y probarlo.' },
    ],
    notIncluded: [
      'Renovación al vencer (se tramita aparte, mismo precio)',
      'Gestión de obligaciones tributarias o contables de la entidad',
      'Soporte técnico general del equipo o sistema operativo',
    ],
    reviewBeforeHiring: [
      'El solicitante debe ser el representante legal o tener poderes suficientes',
      'Ten preparadas las escrituras actualizadas antes de iniciar el proceso',
    ],
    finalCta: {
      title: '¿Tu empresa necesita certificado digital?',
      text: 'Solicítalo ahora. En 24–48 horas tu entidad puede firmar electrónicamente y operar con cualquier organismo sin desplazamientos.',
    },
    faqs: [
      { q: '¿Quién puede solicitar el certificado de entidad?', a: 'El representante legal de la entidad (administrador, presidente, apoderado con poderes suficientes).' },
      { q: '¿Qué diferencia hay con el certificado de persona física?', a: 'El de entidad identifica a la organización y permite actuar en su nombre. El de persona física solo identifica al individuo.' },
      { q: '¿Cuánto tiempo tarda?', a: '24–48 horas desde que verificamos la documentación y la identidad del representante.' },
      { q: '¿Cuánto dura el certificado?', a: 'Entre 2 y 3 años. Te avisamos con antelación para renovarlo sin interrupciones.' },
      { q: '¿Es válido para todos los organismos?', a: 'Sí. Camerfirma es reconocida por AEAT, Seguridad Social, Registros Mercantiles, Notarías y cualquier organismo público o privado.' },
    ],
  },

  // ── Formación ──────────────────────────────────────────────────────────────
  {
    slug: 'formacion-fiscal-contable',
    categoria: 'formacion',
    name: 'Formación Fiscal y Contable',
    shortDescription: 'Sesiones prácticas sobre fiscalidad, contabilidad y obligaciones tributarias.',
    description:
      'Impartimos formación práctica en materia fiscal y contable para autónomos, pymes y equipos de administración: IRPF, IVA, cierre contable, modelos tributarios, declaraciones y planificación fiscal. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión online o presencial (según disponibilidad)',
      'Material didáctico y resumen escrito',
      'Ejercicios prácticos sobre casos reales',
      'Resolución de dudas en directo',
      'Grabación de la sesión (si es online)'
    ],
    faqs: [
      { q: '¿Puedo solicitar un tema específico?', a: 'Sí. La formación se adapta a tus necesidades concretas: cierre fiscal, IVA de importaciones, IRPF de expatriados, etc.' },
      { q: '¿Es posible hacer la formación para un equipo?', a: 'Sí, podemos adaptar el contenido y el formato para equipos de hasta 10 personas.' }
    ]
  },
  {
    slug: 'formacion-laboral-rrhh',
    categoria: 'formacion',
    name: 'Formación Laboral y RRHH',
    shortDescription: 'Formación sobre contratos, nóminas, gestión laboral y recursos humanos.',
    description:
      'Formación práctica para responsables de administración, gerentes y equipos de RRHH: tipos de contratos, nóminas, altas y bajas en Seguridad Social, gestión de ausencias, despidos y documentación laboral. Bloques de 2 horas desde 180 €.',
    price: 'Desde 180 € / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión online o presencial',
      'Material didáctico adaptado',
      'Casos prácticos de gestión laboral',
      'Resolución de dudas',
      'Acceso a plantillas y modelos'
    ],
    faqs: [
      { q: '¿Es apta para personas sin formación previa en RRHH?', a: 'Sí, adaptamos el nivel al perfil del participante.' }
    ]
  },
  {
    slug: 'formacion-holded',
    categoria: 'formacion',
    name: 'Formación en Holded',
    shortDescription: 'Aprende a gestionar tu contabilidad, facturación y CRM en Holded.',
    description:
      'Como Holded Solution Partner, impartimos formación específica en el uso de Holded: módulos de facturación, contabilidad, inventario, proyectos y CRM. Sesiones de 2 horas adaptadas a tu nivel y caso de uso real. Precio: 180 € por bloque.',
    price: '180 € / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'Sesión práctica sobre tu propio entorno Holded',
      'Recorrido por los módulos que uses',
      'Configuración de automatizaciones básicas',
      'Guía personalizada de uso',
      'Soporte post-sesión por email (7 días)'
    ],
    faqs: [
      { q: '¿Necesito tener Holded contratado para hacer la formación?', a: 'Sí, trabajamos directamente sobre tu cuenta. Si aún no tienes Holded, podemos ayudarte a configurarlo antes.' },
      { q: '¿Cuántos bloques de formación necesito?', a: 'Depende del módulo. Para facturación básica suele ser suficiente con 1–2 bloques. Para contabilidad completa, 3–4 bloques.' }
    ]
  }
];

export function getServicesByCategory(categoria: CategorySlug): Service[] {
  return services.filter((s) => s.categoria === categoria);
}

export function getService(categoria: CategorySlug, slug: string): Service | undefined {
  return services.find((s) => s.categoria === categoria && s.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
