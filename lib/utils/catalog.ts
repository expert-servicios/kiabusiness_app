export const categories = [
  {
    slug: 'declaraciones-impuestos',
    name: 'Declaraciones e Impuestos',
    description: 'Renta, IVA, Sociedades y planificaciÃ³n fiscal anual para personas fÃ­sicas y empresas.'
  },
  {
    slug: 'extranjeria-nacionalidad',
    name: 'ExtranjerÃ­a y Nacionalidad',
    description: 'Arraigo, permisos, renovaciones y expedientes de nacionalidad espaÃ±ola.'
  },
  {
    slug: 'empresas-autonomos',
    name: 'Empresas y AutÃ³nomos',
    description: 'Alta de actividad, asesorÃ­a contable y obligaciones recurrentes de negocio.'
  },
  {
    slug: 'trafico-capitania-maritima',
    name: 'TrÃ¡fico y CapitanÃ­a MarÃ­tima',
    description: 'Gestiones de trÃ¡fico, matriculaciones y trÃ¡mites de embarcaciones.'
  },
  {
    slug: 'notaria-propiedades',
    name: 'NotarÃ­a y Propiedades',
    description: 'Compraventas, escrituras, herencias y fiscalidad inmobiliaria.'
  },
  {
    slug: 'gestiones-especializadas',
    name: 'Gestiones Especializadas',
    description: 'TrÃ¡mites estratÃ©gicos con enfoque legal-administrativo de alta complejidad.'
  },
  {
    slug: 'formacion',
    name: 'FormaciÃ³n',
    description:
      'FormaciÃ³n fiscal, contable, legal, mercantil, laboral, RRHH y uso de Holded. Bloques de 2 horas desde 180 euros.'
  }
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export type Service = {
  slug: string;
  categoria: CategorySlug;
  name: string;
  shortDescription: string;
  description: string;
  price?: string;
  duration?: string;
  includes: string[];
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  // â”€â”€ Declaraciones e Impuestos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'irpf',
    categoria: 'declaraciones-impuestos',
    name: 'DeclaraciÃ³n de la Renta (IRPF)',
    shortDescription: 'PreparaciÃ³n y presentaciÃ³n del IRPF con revisiÃ³n fiscal completa.',
    description:
      'Gestionamos tu declaraciÃ³n de la renta de principio a fin: revisamos tu situaciÃ³n fiscal, identificamos deducciones aplicables, preparamos el borrador, lo validamos contigo y lo presentamos ante la AEAT. Servicio para residentes, trabajadores por cuenta ajena, autÃ³nomos y propietarios de inmuebles.',
    price: 'Desde 90 â‚¬',
    duration: '3â€“5 dÃ­as hÃ¡biles',
    includes: [
      'RevisiÃ³n completa de datos fiscales',
      'IdentificaciÃ³n de deducciones y bonificaciones',
      'PreparaciÃ³n y validaciÃ³n del borrador',
      'PresentaciÃ³n telemÃ¡tica ante la AEAT',
      'Justificante de presentaciÃ³n'
    ],
    faqs: [
      { q: 'Â¿Necesito ir a ningÃºn sitio?', a: 'No. Todo el proceso se realiza de forma online. TÃº envÃ­as la documentaciÃ³n y nosotros gestionamos la presentaciÃ³n.' },
      { q: 'Â¿QuÃ© documentos necesito aportar?', a: 'DNI/NIE, nÃºmero de referencia AEAT o Cl@ve, certificados de retenciones, datos de inmuebles, prÃ©stamos e inversiones si los hay.' },
      { q: 'Â¿CuÃ¡ndo empieza la campaÃ±a de renta?', a: 'La campaÃ±a de IRPF arranca en abril y cierra a finales de junio. Te recomendamos no esperar al Ãºltimo momento para evitar saturaciÃ³n.' }
    ]
  },
  {
    slug: 'modelo-151',
    categoria: 'declaraciones-impuestos',
    name: 'Modelo 151 â€” RÃ©gimen Beckham',
    shortDescription: 'TributaciÃ³n especial para expatriados desplazados a EspaÃ±a.',
    description:
      'El rÃ©gimen especial de impatriados (popularmente conocido como Ley Beckham) permite tributar al tipo fijo del 24% sobre rentas obtenidas en EspaÃ±a durante los primeros aÃ±os de residencia. Gestionamos la solicitud de activaciÃ³n del rÃ©gimen y la declaraciÃ³n anual del Modelo 151.',
    price: 'Consultar',
    duration: '5â€“10 dÃ­as hÃ¡biles',
    includes: [
      'EvaluaciÃ³n de elegibilidad y requisitos',
      'TramitaciÃ³n del Modelo 149 (opciÃ³n al rÃ©gimen)',
      'DeclaraciÃ³n anual Modelo 151',
      'Asesoramiento fiscal internacional',
      'PresentaciÃ³n telemÃ¡tica y justificante'
    ],
    faqs: [
      { q: 'Â¿QuiÃ©n puede acogerse al rÃ©gimen Beckham?', a: 'Trabajadores y directivos desplazados a EspaÃ±a que no hayan sido residentes los 5 aÃ±os anteriores, bajo determinadas condiciones.' },
      { q: 'Â¿CuÃ¡nto tiempo dura el rÃ©gimen?', a: 'Hasta 5 aÃ±os desde la activaciÃ³n, renovable en algunas circunstancias.' },
      { q: 'Â¿Cubre tambiÃ©n a mi familia?', a: 'El rÃ©gimen es individual, aunque el cÃ³nyuge e hijos pueden acogerse bajo ciertos requisitos.' }
    ]
  },
  {
    slug: 'no-residentes',
    categoria: 'declaraciones-impuestos',
    name: 'IRNR â€” No Residentes',
    shortDescription: 'Declaraciones fiscales para personas no residentes con bienes o rentas en EspaÃ±a.',
    description:
      'Si tienes inmuebles, inversiones o percibes rentas de fuente espaÃ±ola sin ser residente fiscal, debes presentar el Impuesto sobre la Renta de No Residentes (IRNR). Gestionamos los modelos 210, 211 y 213 adaptados a tu situaciÃ³n.',
    price: 'Desde 80 â‚¬ / modelo',
    duration: '3â€“5 dÃ­as hÃ¡biles',
    includes: [
      'AnÃ¡lisis de tu situaciÃ³n como no residente',
      'PreparaciÃ³n del Modelo 210 / 211 / 213',
      'CÃ¡lculo de cuota y retenciones',
      'PresentaciÃ³n telemÃ¡tica',
      'Asesoramiento sobre convenios de doble imposiciÃ³n'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ndo debo presentar el Modelo 210?', a: 'Depende del tipo de renta. Para imputaciones de inmuebles, en enero del aÃ±o siguiente. Para alquileres, trimestralmente.' },
      { q: 'Â¿Necesito representante fiscal?', a: 'SÃ­, si eres no residente en la UE con propiedades en EspaÃ±a, es obligatorio tener un representante fiscal en EspaÃ±a.' }
    ]
  },
  {
    slug: 'iva-trimestral',
    categoria: 'declaraciones-impuestos',
    name: 'IVA Trimestral',
    shortDescription: 'PresentaciÃ³n del Modelo 303 y liquidaciÃ³n trimestral del IVA.',
    description:
      'Preparamos y presentamos tu declaraciÃ³n trimestral de IVA (Modelo 303), el resumen anual (Modelo 390) y cualquier otro modelo relacionado. Incluye revisiÃ³n de facturas emitidas y recibidas para garantizar la correcta liquidaciÃ³n.',
    price: 'Desde 60 â‚¬ / trimestre',
    duration: '2â€“3 dÃ­as hÃ¡biles',
    includes: [
      'RevisiÃ³n de facturas emitidas y recibidas',
      'PreparaciÃ³n Modelo 303',
      'PresentaciÃ³n dentro de plazo',
      'Resumen anual Modelo 390',
      'Alerta de plazos y recordatorios'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡les son los plazos trimestrales?', a: 'Del 1 al 20 de los meses de abril, julio, octubre y enero (este Ãºltimo hasta el 30).' },
      { q: 'Â¿Puedo llevar yo las facturas y que solo presentÃ©is?', a: 'SÃ­, puedes enviarnos el registro de facturas y nos encargamos de la liquidaciÃ³n y presentaciÃ³n.' }
    ]
  },
  {
    slug: 'impuesto-sociedades',
    categoria: 'declaraciones-impuestos',
    name: 'Impuesto de Sociedades',
    shortDescription: 'DeclaraciÃ³n anual del IS para sociedades limitadas y anÃ³nimas.',
    description:
      'Realizamos el cierre contable del ejercicio y preparamos la declaraciÃ³n del Impuesto sobre Sociedades (Modelo 200), incluyendo ajustes fiscales, deducciones aplicables y conciliaciÃ³n contable-fiscal.',
    price: 'Consultar',
    duration: '7â€“15 dÃ­as hÃ¡biles',
    includes: [
      'Cierre contable del ejercicio',
      'Ajustes y conciliaciones fiscales',
      'PreparaciÃ³n del Modelo 200',
      'LiquidaciÃ³n y revisiÃ³n de pagos fraccionados',
      'PresentaciÃ³n telemÃ¡tica y depÃ³sito de cuentas'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ndo hay que presentarlo?', a: 'En los 25 dÃ­as naturales siguientes a los 6 meses posteriores al cierre del ejercicio (normalmente en julio para ejercicios que cierran en diciembre).' },
      { q: 'Â¿Necesito tambiÃ©n llevar la contabilidad con vosotros?', a: 'No es imprescindible, pero facilita el proceso. Si llevas la contabilidad con nosotros, el precio del IS estÃ¡ incluido en el plan mensual.' }
    ]
  },
  {
    slug: 'modelos-informativos',
    categoria: 'declaraciones-impuestos',
    name: 'Modelos Informativos',
    shortDescription: 'PresentaciÃ³n de modelos 347, 349, 180, 190 y otros declarativos.',
    description:
      'Gestionamos la preparaciÃ³n y presentaciÃ³n de los principales modelos informativos anuales: operaciones con terceros (Modelo 347), operaciones intracomunitarias (Modelo 349), retenciones de alquileres (180), retenciones de trabajo (190), entre otros.',
    price: 'Desde 50 â‚¬ / modelo',
    duration: '2â€“4 dÃ­as hÃ¡biles',
    includes: [
      'RevisiÃ³n y cruce de datos con contabilidad',
      'PreparaciÃ³n del modelo correspondiente',
      'PresentaciÃ³n en plazo ante la AEAT',
      'Copia de justificante de presentaciÃ³n'
    ],
    faqs: [
      { q: 'Â¿QuÃ© pasa si presento un modelo informativo fuera de plazo?', a: 'Existe un rÃ©gimen sancionador por presentaciÃ³n extemporÃ¡nea. Te avisamos con antelaciÃ³n para evitar recargos.' }
    ]
  },

  // â”€â”€ ExtranjerÃ­a y Nacionalidad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'arraigo-social',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Social',
    shortDescription: 'AutorizaciÃ³n de residencia por arraigo social en EspaÃ±a.',
    description:
      'El arraigo social permite obtener un permiso de residencia temporal para personas que llevan al menos 3 aÃ±os empadronadas en EspaÃ±a, tienen vÃ­nculos familiares con residentes legales o disponen de una oferta de empleo. Preparamos toda la documentaciÃ³n y gestionamos el expediente.',
    price: 'Consultar',
    duration: 'Variable (3â€“6 meses segÃºn DelegaciÃ³n)',
    includes: [
      'EvaluaciÃ³n previa de elegibilidad',
      'PreparaciÃ³n y revisiÃ³n de documentaciÃ³n',
      'ElaboraciÃ³n del informe de arraigo',
      'PresentaciÃ³n del expediente',
      'Seguimiento y respuesta a requerimientos'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡nto tiempo tengo que llevar en EspaÃ±a?', a: 'MÃ­nimo 3 aÃ±os de permanencia continuada y acreditada.' },
      { q: 'Â¿Necesito contrato de trabajo?', a: 'Para el arraigo social mediante oferta de empleo, sÃ­. Para el arraigo familiar, no es necesario.' }
    ]
  },
  {
    slug: 'arraigo-familiar',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Familiar',
    shortDescription: 'Residencia por vÃ­nculos familiares con ciudadanos espaÃ±oles o residentes.',
    description:
      'Si eres padre o madre de un menor espaÃ±ol, o cÃ³nyuge/pareja de hecho de un ciudadano espaÃ±ol o residente legal, puedes solicitar la autorizaciÃ³n de residencia por arraigo familiar. Gestionamos el expediente desde la evaluaciÃ³n inicial hasta la resoluciÃ³n.',
    price: 'Consultar',
    duration: 'Variable',
    includes: [
      'EvaluaciÃ³n de requisitos y vÃ­nculo familiar',
      'PreparaciÃ³n de documentaciÃ³n',
      'PresentaciÃ³n ante ExtranjerÃ­a',
      'Seguimiento del expediente'
    ],
    faqs: [
      { q: 'Â¿CÃ³mo acredito el vÃ­nculo familiar?', a: 'Mediante libro de familia, certificado de nacimiento, sentencia de filiaciÃ³n u otros documentos segÃºn el caso.' }
    ]
  },
  {
    slug: 'renovacion-residencia',
    categoria: 'extranjeria-nacionalidad',
    name: 'RenovaciÃ³n de Residencia',
    shortDescription: 'RenovaciÃ³n de permisos de residencia temporal y larga duraciÃ³n.',
    description:
      'Gestionamos la renovaciÃ³n de tu autorizaciÃ³n de residencia (temporal o larga duraciÃ³n) en los plazos adecuados para evitar situaciones de irregularidad sobrevenida. Revisamos tus requisitos, preparamos la documentaciÃ³n y presentamos la solicitud.',
    price: 'Consultar',
    duration: '1â€“3 meses',
    includes: [
      'RevisiÃ³n de requisitos para la renovaciÃ³n',
      'PreparaciÃ³n de solicitud y documentaciÃ³n',
      'PresentaciÃ³n electrÃ³nica',
      'Seguimiento y atenciÃ³n a requerimientos',
      'ObtenciÃ³n de la nueva tarjeta TIE'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ndo debo presentar la renovaciÃ³n?', a: 'Se puede presentar 60 dÃ­as antes de la caducidad y hasta 90 dÃ­as despuÃ©s (con posible recargo).' }
    ]
  },
  {
    slug: 'nacionalidad-espanola',
    categoria: 'extranjeria-nacionalidad',
    name: 'Nacionalidad EspaÃ±ola',
    shortDescription: 'Expediente de nacionalidad espaÃ±ola por residencia o por origen.',
    description:
      'AcompaÃ±amos el proceso completo para la obtenciÃ³n de la nacionalidad espaÃ±ola por residencia: desde la preparaciÃ³n de la documentaciÃ³n y los exÃ¡menes CCSE y DELE hasta la presentaciÃ³n del expediente en el Registro Civil o notarÃ­a. Seguimiento continuado hasta la resoluciÃ³n.',
    price: 'Consultar',
    duration: '1â€“3 aÃ±os (segÃºn expediente)',
    includes: [
      'RevisiÃ³n del tiempo de residencia y requisitos',
      'PreparaciÃ³n de documentaciÃ³n completa',
      'OrientaciÃ³n para exÃ¡menes CCSE y DELE A2',
      'PresentaciÃ³n del expediente',
      'Seguimiento periÃ³dico y respuesta a requerimientos'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ntos aÃ±os de residencia necesito?', a: 'En general 10 aÃ±os, reducibles a 5 (refugiados), 2 (nacionales de paÃ­ses iberoamericanos, Filipinas, Guinea Ecuatorial, Portugal o Andorra) o 1 aÃ±o en casos especiales.' },
      { q: 'Â¿Tengo que hacer exÃ¡menes?', a: 'SÃ­: el CCSE (conocimientos constitucionales y socioculturales) y el DELE A2 de espaÃ±ol si no eres hispanohablante.' }
    ]
  },
  {
    slug: 'nie-pasaporte',
    categoria: 'extranjeria-nacionalidad',
    name: 'NIE y Gestiones Consulares',
    shortDescription: 'ObtenciÃ³n del NÃºmero de IdentificaciÃ³n de Extranjero (NIE) y gestiones consulares.',
    description:
      'Tramitamos la obtenciÃ³n del NIE (para ciudadanos de la UE o no UE), asÃ­ como gestiones relacionadas con el Consulado: citas, documentaciÃ³n para visados, certificados de registro y otras diligencias consulares en EspaÃ±a.',
    price: 'Desde 60 â‚¬',
    duration: '1â€“4 semanas',
    includes: [
      'GestiÃ³n de cita previa',
      'PreparaciÃ³n de formularios y documentaciÃ³n',
      'TramitaciÃ³n del Modelo EX-15',
      'AcompaÃ±amiento si es necesario'
    ],
    faqs: [
      { q: 'Â¿Para quÃ© necesito el NIE?', a: 'Para firmar contratos, abrir cuentas bancarias, comprar un inmueble, trabajar o iniciar cualquier actividad econÃ³mica en EspaÃ±a.' }
    ]
  },
  {
    slug: 'reagrupacion-familiar',
    categoria: 'extranjeria-nacionalidad',
    name: 'ReagrupaciÃ³n Familiar',
    shortDescription: 'AutorizaciÃ³n de residencia para familiares de residentes legales en EspaÃ±a.',
    description:
      'Si eres residente legal en EspaÃ±a y quieres traer a tu cÃ³nyuge, hijos menores o ascendientes dependientes, gestionamos el expediente de reagrupaciÃ³n familiar completo: desde los requisitos econÃ³micos y de vivienda hasta la presentaciÃ³n y seguimiento.',
    price: 'Consultar',
    duration: '3â€“6 meses',
    includes: [
      'EvaluaciÃ³n de requisitos (vivienda, ingresos, parentesco)',
      'PreparaciÃ³n del expediente completo',
      'PresentaciÃ³n en ExtranjerÃ­a',
      'Seguimiento del expediente'
    ],
    faqs: [
      { q: 'Â¿QuÃ© familiares puedo reagrupar?', a: 'CÃ³nyuge o pareja de hecho, hijos menores de 18 aÃ±os (o mayores dependientes), y padres mayores dependientes econÃ³micamente.' }
    ]
  },

  // â”€â”€ Empresas y AutÃ³nomos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'alta-autonomo',
    categoria: 'empresas-autonomos',
    name: 'Alta de AutÃ³nomo',
    shortDescription: 'TramitaciÃ³n del alta en el RETA y gestiÃ³n de la actividad econÃ³mica.',
    description:
      'Gestionamos tu alta como autÃ³nomo en la Agencia Tributaria (Modelo 036/037) y en la Seguridad Social (RETA), con asesoramiento sobre el epÃ­grafe de actividad mÃ¡s adecuado, cuota de autÃ³nomos, tarifa plana y obligaciones fiscales desde el inicio.',
    price: 'Desde 120 â‚¬',
    duration: '1â€“3 dÃ­as hÃ¡biles',
    includes: [
      'Modelo 036/037 â€” Alta en Hacienda',
      'Alta en el RETA (Seguridad Social)',
      'Asesoramiento sobre epÃ­grafe y base de cotizaciÃ³n',
      'InformaciÃ³n sobre tarifa plana y bonificaciones',
      'GuÃ­a de obligaciones fiscales del autÃ³nomo'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡nto tarda el alta?', a: 'El alta fiscal es inmediata. El alta en el RETA puede tardar 1â€“3 dÃ­as.' },
      { q: 'Â¿CuÃ¡l es la cuota de autÃ³nomos en 2025?', a: 'Con el nuevo sistema de cotizaciÃ³n por ingresos reales, la cuota varÃ­a entre 200 â‚¬ y 590 â‚¬ aproximadamente segÃºn el tramo de rendimientos netos.' }
    ]
  },
  {
    slug: 'constitucion-sl',
    categoria: 'empresas-autonomos',
    name: 'ConstituciÃ³n de Sociedad Limitada',
    shortDescription: 'CreaciÃ³n de una SL con capital mÃ­nimo, estatutos y alta fiscal.',
    description:
      'AcompaÃ±amos todo el proceso de constituciÃ³n de una Sociedad Limitada: denominaciÃ³n social, redacciÃ³n de estatutos, elevaciÃ³n a escritura pÃºblica, inscripciÃ³n en el Registro Mercantil y alta fiscal en Hacienda. Incluye asesoramiento sobre estructura societaria y fiscal.',
    price: 'Desde 490 â‚¬',
    duration: '7â€“15 dÃ­as hÃ¡biles',
    includes: [
      'Certificado de denominaciÃ³n social (BORME)',
      'RedacciÃ³n de estatutos y pacto de socios',
      'Escritura pÃºblica notarial',
      'InscripciÃ³n en Registro Mercantil',
      'Alta en Hacienda (Modelo 036)',
      'ObtenciÃ³n del CIF definitivo'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡nto capital mÃ­nimo se necesita?', a: 'Desde 1 euro, aunque lo habitual es un capital inicial de 3.000 â‚¬.' },
      { q: 'Â¿Puedo constituir una SL yo solo?', a: 'SÃ­, se puede constituir una SL unipersonal con un Ãºnico socio.' }
    ]
  },
  {
    slug: 'contabilidad-mensual',
    categoria: 'empresas-autonomos',
    name: 'Contabilidad Mensual',
    shortDescription: 'Llevanza de contabilidad y registro contable para autÃ³nomos y sociedades.',
    description:
      'Nos encargamos de la contabilidad mensual de tu empresa o actividad: registro de facturas, conciliaciones bancarias, informes mensuales de resultados y balance. Trabajamos con Holded para mayor visibilidad y control.',
    price: 'Desde 80 â‚¬ / mes',
    duration: 'Servicio recurrente mensual',
    includes: [
      'Registro de facturas emitidas y recibidas',
      'ConciliaciÃ³n bancaria',
      'Informes de pÃ©rdidas y ganancias mensuales',
      'Balance de situaciÃ³n trimestral',
      'Acceso a Holded con datos actualizados'
    ],
    faqs: [
      { q: 'Â¿Necesito Holded para contratar este servicio?', a: 'No es obligatorio, pero trabajamos preferentemente con Holded. Si no lo tienes, podemos ayudarte a migrarlo.' },
      { q: 'Â¿Puedo cancelar en cualquier momento?', a: 'SÃ­, con un preaviso de 30 dÃ­as.' }
    ]
  },
  {
    slug: 'impuestos-trimestrales',
    categoria: 'empresas-autonomos',
    name: 'Impuestos Trimestrales',
    shortDescription: 'PresentaciÃ³n trimestral de IVA, IRPF y otros modelos recurrentes.',
    description:
      'Gestionamos la presentaciÃ³n trimestral de tus impuestos: IVA (Modelo 303), retenciones a trabajadores (Modelo 111), retenciones de alquileres (Modelo 115) y pagos fraccionados del IRPF (Modelo 130/131). Todo en plazo y con revisiÃ³n previa.',
    price: 'Desde 120 â‚¬ / trimestre',
    duration: 'Servicio recurrente trimestral',
    includes: [
      'RevisiÃ³n de datos contables del trimestre',
      'Modelos 303, 111, 115 y 130/131 segÃºn aplique',
      'PresentaciÃ³n telemÃ¡tica en plazo',
      'Informe de liquidaciÃ³n'
    ],
    faqs: [
      { q: 'Â¿QuÃ© pasa si no presento los impuestos a tiempo?', a: 'Hacienda aplica recargos e intereses de demora. Con nuestro servicio recibes aviso previo para evitarlo.' }
    ]
  },
  {
    slug: 'baja-cese-actividad',
    categoria: 'empresas-autonomos',
    name: 'Baja y Cese de Actividad',
    shortDescription: 'TramitaciÃ³n de la baja de autÃ³nomo o disoluciÃ³n de sociedad.',
    description:
      'Gestionamos la baja fiscal y en la Seguridad Social del autÃ³nomo, o el proceso completo de disoluciÃ³n y liquidaciÃ³n de una sociedad: acuerdos de socios, escritura, liquidaciÃ³n de impuestos pendientes e inscripciÃ³n registral del cierre.',
    price: 'Consultar',
    duration: 'Variable',
    includes: [
      'Baja en Hacienda (Modelo 036/037)',
      'Baja en el RETA',
      'LiquidaciÃ³n de impuestos pendientes',
      'Para sociedades: acta de disoluciÃ³n, escritura e inscripciÃ³n registral'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ndo conviene darse de baja como autÃ³nomo?', a: 'Cuando cesan de forma definitiva los ingresos de la actividad. La baja en el RETA se puede hacer hasta el Ãºltimo dÃ­a del mes para no pagar ese mes.' }
    ]
  },

  // â”€â”€ TrÃ¡fico y CapitanÃ­a MarÃ­tima â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'transferencia-vehiculo',
    categoria: 'trafico-capitania-maritima',
    name: 'Transferencia de VehÃ­culo',
    shortDescription: 'GestiÃ³n del cambio de titular en la DGT para compraventas de vehÃ­culos.',
    description:
      'Tramitamos la transferencia de titularidad de vehÃ­culos de segunda mano ante la DGT: verificamos documentaciÃ³n, liquidamos el impuesto de transmisiones (ITP), presentamos la solicitud y obtenemos el nuevo permiso de circulaciÃ³n a nombre del comprador.',
    price: 'Desde 80 â‚¬',
    duration: '3â€“7 dÃ­as hÃ¡biles',
    includes: [
      'VerificaciÃ³n del contrato de compraventa',
      'LiquidaciÃ³n del ITP (Impuesto de Transmisiones)',
      'PresentaciÃ³n de la transferencia en DGT',
      'ObtenciÃ³n del permiso de circulaciÃ³n'
    ],
    faqs: [
      { q: 'Â¿QuÃ© documentos necesito para la transferencia?', a: 'Contrato de compraventa firmado, ficha tÃ©cnica del vehÃ­culo, permisos de circulaciÃ³n, DNI/NIE de ambas partes.' },
      { q: 'Â¿Tengo que pagar impuestos al comprar un coche de segunda mano?', a: 'SÃ­, el Impuesto de Transmisiones Patrimoniales (ITP), cuyo porcentaje varÃ­a segÃºn la comunidad autÃ³noma.' }
    ]
  },
  {
    slug: 'matriculacion',
    categoria: 'trafico-capitania-maritima',
    name: 'MatriculaciÃ³n de VehÃ­culos',
    shortDescription: 'Primera matriculaciÃ³n de vehÃ­culos nuevos e importados.',
    description:
      'Gestionamos la primera matriculaciÃ³n de vehÃ­culos nuevos o importados: liquidaciÃ³n del IEDMT (impuesto de matriculaciÃ³n), presentaciÃ³n de documentaciÃ³n ante la DGT, obtenciÃ³n de placas y entrega del permiso de circulaciÃ³n definitivo.',
    price: 'Consultar',
    duration: '5â€“10 dÃ­as hÃ¡biles',
    includes: [
      'VerificaciÃ³n de documentaciÃ³n tÃ©cnica',
      'LiquidaciÃ³n del IEDMT',
      'TramitaciÃ³n de matrÃ­cula ante la DGT',
      'ObtenciÃ³n de placas y permiso de circulaciÃ³n'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ndo debo pagar el impuesto de matriculaciÃ³n?', a: 'En la primera matriculaciÃ³n en EspaÃ±a o cuando el vehÃ­culo supera ciertos lÃ­mites de emisiones de COâ‚‚.' }
    ]
  },
  {
    slug: 'duplicado-permiso',
    categoria: 'trafico-capitania-maritima',
    name: 'Duplicado de Documentos de TrÃ¡fico',
    shortDescription: 'ObtenciÃ³n de duplicados del permiso de conducir, de circulaciÃ³n o ficha tÃ©cnica.',
    description:
      'Tramitamos duplicados de permiso de conducir, permiso de circulaciÃ³n o ficha tÃ©cnica del vehÃ­culo por pÃ©rdida, robo o deterioro ante la DGT o la prefectura correspondiente.',
    price: 'Desde 50 â‚¬',
    duration: '2â€“5 dÃ­as hÃ¡biles',
    includes: [
      'GestiÃ³n de la solicitud ante la DGT',
      'ObtenciÃ³n del duplicado correspondiente'
    ],
    faqs: [
      { q: 'Â¿Puedo conducir mientras espero el duplicado del carnet?', a: 'No, necesitas tener el permiso fÃ­sico o el resguardo provisional en vigor para circular legalmente.' }
    ]
  },
  {
    slug: 'tramites-embarcaciones',
    categoria: 'trafico-capitania-maritima',
    name: 'TrÃ¡mites de Embarcaciones',
    shortDescription: 'MatriculaciÃ³n, transferencias y gestiones ante CapitanÃ­a MarÃ­tima.',
    description:
      'Gestionamos los trÃ¡mites de embarcaciones de recreo ante CapitanÃ­a MarÃ­tima: matriculaciÃ³n, cambio de titularidad, despachos, abanderamiento y documentaciÃ³n para titulaciones nÃ¡uticas. TambiÃ©n tramitamos bajas y transferencias de motos de agua.',
    price: 'Consultar',
    duration: '5â€“15 dÃ­as hÃ¡biles',
    includes: [
      'MatriculaciÃ³n de embarcaciones',
      'Transferencia de titularidad',
      'Abanderamiento y despachos',
      'TramitaciÃ³n de bajas'
    ],
    faqs: [
      { q: 'Â¿DÃ³nde se tramitan los permisos de embarcaciones en EspaÃ±a?', a: 'Ante la CapitanÃ­a MarÃ­tima de la provincia correspondiente, dependiente de la DirecciÃ³n General de la Marina Mercante.' }
    ]
  },

  // â”€â”€ NotarÃ­a y Propiedades â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'compraventa-inmueble',
    categoria: 'notaria-propiedades',
    name: 'Compraventa de Inmueble',
    shortDescription: 'Soporte fiscal y documental en la compraventa de viviendas y locales.',
    description:
      'Ofrecemos acompaÃ±amiento fiscal y documental en operaciones de compraventa inmobiliaria: revisiÃ³n del contrato de arras, cÃ¡lculo de impuestos (ITP o IVA+AJD), representaciÃ³n ante notarÃ­a y liquidaciÃ³n de impuestos ante la Hacienda autonÃ³mica.',
    price: 'Consultar',
    duration: 'Variable segÃºn operaciÃ³n',
    includes: [
      'RevisiÃ³n del contrato de arras o promesa de compraventa',
      'CÃ¡lculo de ITP o IVA+AJD segÃºn tipologÃ­a',
      'Soporte en firma ante notarÃ­a',
      'LiquidaciÃ³n de impuestos ante la Hacienda autonÃ³mica',
      'InscripciÃ³n en el Registro de la Propiedad'
    ],
    faqs: [
      { q: 'Â¿QuÃ© impuestos paga el comprador de un piso de segunda mano?', a: 'El Impuesto de Transmisiones Patrimoniales (ITP), cuyo tipo varÃ­a segÃºn la comunidad autÃ³noma (entre el 6% y el 10% del precio).' },
      { q: 'Â¿Y si compro una vivienda nueva?', a: 'En vivienda nueva pagas IVA (10%) mÃ¡s Actos JurÃ­dicos Documentados (AJD, entre el 0,5% y el 1,5% segÃºn CCAA).' }
    ]
  },
  {
    slug: 'herencia',
    categoria: 'notaria-propiedades',
    name: 'Herencia y SucesiÃ³n',
    shortDescription: 'TramitaciÃ³n de herencias: declaraciÃ³n, liquidaciÃ³n y adjudicaciÃ³n.',
    description:
      'AcompaÃ±amos el proceso de aceptaciÃ³n y adjudicaciÃ³n de herencias: obtenciÃ³n del certificado de defunciÃ³n y Ãºltimas voluntades, liquidaciÃ³n del Impuesto de Sucesiones y Donaciones, adjudicaciÃ³n notarial de bienes e inscripciÃ³n registral.',
    price: 'Consultar',
    duration: '1â€“6 meses',
    includes: [
      'Certificado de Ãºltimas voluntades y seguro de vida',
      'Inventario del caudal hereditario',
      'LiquidaciÃ³n del Impuesto de Sucesiones y Donaciones',
      'Escritura de adjudicaciÃ³n de herencia',
      'InscripciÃ³n en Registro de la Propiedad y otras gestiones'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡nto tiempo tengo para aceptar la herencia?', a: 'No hay plazo para aceptar, pero el Impuesto de Sucesiones debe liquidarse en 6 meses (prorrogable otros 6).' },
      { q: 'Â¿Puedo renunciar a la herencia?', a: 'SÃ­, la renuncia es pura y simple, y puede hacerse ante notario.' }
    ]
  },
  {
    slug: 'donacion',
    categoria: 'notaria-propiedades',
    name: 'DonaciÃ³n de Bienes',
    shortDescription: 'TramitaciÃ³n fiscal y documental de donaciones de inmuebles, dinero o bienes.',
    description:
      'Gestionamos la fiscalidad de las donaciones: cÃ¡lculo del Impuesto sobre Sucesiones y Donaciones (a cargo del donatario), escritura pÃºblica de donaciÃ³n y liquidaciÃ³n ante la Hacienda autonÃ³mica. Asesoramos sobre optimizaciÃ³n fiscal segÃºn el grado de parentesco.',
    price: 'Consultar',
    duration: '2â€“4 semanas',
    includes: [
      'CÃ¡lculo del Impuesto de Donaciones',
      'Escritura pÃºblica de donaciÃ³n',
      'LiquidaciÃ³n ante Hacienda',
      'InscripciÃ³n registral si hay inmuebles'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡nto se paga por una donaciÃ³n entre padres e hijos?', a: 'Depende de la comunidad autÃ³noma. Algunas tienen reducciones muy significativas (hasta el 99% en Madrid o AndalucÃ­a para ciertas donaciones).' }
    ]
  },
  {
    slug: 'hipoteca-cancelacion',
    categoria: 'notaria-propiedades',
    name: 'CancelaciÃ³n de Hipoteca',
    shortDescription: 'CancelaciÃ³n registral de la hipoteca una vez pagado el prÃ©stamo.',
    description:
      'Cuando terminas de pagar la hipoteca, el banco no cancela automÃ¡ticamente la carga en el Registro de la Propiedad. Gestionamos la obtenciÃ³n del certificado de deuda cero, la firma notarial de la escritura de cancelaciÃ³n y la inscripciÃ³n registral.',
    price: 'Desde 150 â‚¬',
    duration: '2â€“4 semanas',
    includes: [
      'ObtenciÃ³n del certificado de saldo cero del banco',
      'Escritura notarial de cancelaciÃ³n',
      'PresentaciÃ³n en el Registro de la Propiedad',
      'Nota simple registral actualizada'
    ],
    faqs: [
      { q: 'Â¿Por quÃ© el banco no cancela la hipoteca por su cuenta?', a: 'El banco solo emite el certificado de deuda cero. La cancelaciÃ³n registral debe tramitarla el titular del prÃ©stamo.' }
    ]
  },

  // â”€â”€ Gestiones Especializadas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'certificado-digital',
    categoria: 'gestiones-especializadas',
    name: 'Certificado Digital â€” Camerfirma',
    shortDescription: 'ObtenciÃ³n y renovaciÃ³n de certificados digitales reconocidos para empresas y personas.',
    description:
      'Como punto de registro autorizado de Camerfirma, tramitamos la obtenciÃ³n y renovaciÃ³n de certificados digitales cualificados para personas fÃ­sicas, representantes de personas jurÃ­dicas y sellos de empresa. Imprescindibles para relacionarse con la AEAT, Seguridad Social y otros organismos.',
    price: 'Consultar',
    duration: 'Inmediato (presencialmente)',
    includes: [
      'VerificaciÃ³n de identidad presencial o videoconferencia',
      'EmisiÃ³n del certificado en formato software o tarjeta',
      'InstalaciÃ³n y guÃ­a de uso',
      'Soporte ante incidencias de uso'
    ],
    faqs: [
      { q: 'Â¿QuÃ© diferencia hay entre el certificado de persona fÃ­sica y el de representante?', a: 'El de persona fÃ­sica identifica al individuo. El de representante de persona jurÃ­dica permite actuar en nombre de la empresa.' },
      { q: 'Â¿CuÃ¡nto dura un certificado Camerfirma?', a: 'Generalmente 2 o 3 aÃ±os, segÃºn el tipo de certificado.' }
    ]
  },
  {
    slug: 'migracion-holded',
    categoria: 'gestiones-especializadas',
    name: 'MigraciÃ³n a Holded',
    shortDescription: 'MigraciÃ³n contable y configuraciÃ³n de Holded para tu empresa.',
    description:
      'Como Holded Solution Partner, realizamos la migraciÃ³n de tu contabilidad y facturaciÃ³n a Holded: importaciÃ³n de datos histÃ³ricos, configuraciÃ³n de plan de cuentas, integraciÃ³n bancaria, personalizaciÃ³n de facturas y formaciÃ³n inicial para tu equipo.',
    price: 'Desde 490 â‚¬',
    duration: '1â€“3 semanas',
    includes: [
      'AnÃ¡lisis del sistema actual',
      'ImportaciÃ³n de clientes, proveedores y productos',
      'ConfiguraciÃ³n del plan de cuentas',
      'IntegraciÃ³n de cuentas bancarias',
      'PersonalizaciÃ³n de plantillas de factura',
      'FormaciÃ³n inicial (2 horas incluidas)'
    ],
    faqs: [
      { q: 'Â¿Pierdo datos al migrar a Holded?', a: 'No. Hacemos una migraciÃ³n ordenada por fases para que tengas continuidad total de datos histÃ³ricos.' },
      { q: 'Â¿QuÃ© pasa si ya uso otro software de contabilidad?', a: 'Migramos desde ContaPlus, Sage, Excel u otros. Analizamos el caso antes de empezar.' }
    ]
  },
  {
    slug: 'representacion-fiscal',
    categoria: 'gestiones-especializadas',
    name: 'RepresentaciÃ³n Fiscal',
    shortDescription: 'Representante fiscal en EspaÃ±a para no residentes con obligaciones tributarias.',
    description:
      'Los no residentes con bienes o intereses econÃ³micos en EspaÃ±a pueden estar obligados a designar un representante fiscal. Actuamos como representante fiscal ante la AEAT, gestionando notificaciones, obligaciones declarativas y comunicaciones oficiales.',
    price: 'Desde 120 â‚¬ / aÃ±o',
    duration: 'Servicio anual recurrente',
    includes: [
      'DesignaciÃ³n como representante fiscal ante la AEAT',
      'RecepciÃ³n de notificaciones de Hacienda',
      'GestiÃ³n de comunicaciones y requerimientos',
      'Informe periÃ³dico al cliente no residente'
    ],
    faqs: [
      { q: 'Â¿CuÃ¡ndo es obligatorio el representante fiscal?', a: 'Para no residentes fuera de la UE/EEE con propiedades o rentas en EspaÃ±a, y en algunos casos para no residentes de la UE.' }
    ]
  },
  {
    slug: 'apostilla-legalizacion',
    categoria: 'gestiones-especializadas',
    name: 'Apostilla y LegalizaciÃ³n',
    shortDescription: 'Apostilla de documentos espaÃ±oles y legalizaciÃ³n de documentos extranjeros.',
    description:
      'Tramitamos la apostilla de la Haya para documentos espaÃ±oles destinados al extranjero, y la legalizaciÃ³n de documentos extranjeros para su uso en EspaÃ±a. TambiÃ©n gestionamos traducciones juradas cuando son necesarias.',
    price: 'Desde 60 â‚¬',
    duration: '3â€“10 dÃ­as hÃ¡biles',
    includes: [
      'VerificaciÃ³n del tipo de documento y paÃ­s de destino/origen',
      'TramitaciÃ³n de la apostilla ante el organismo competente',
      'Coordinar traducciÃ³n jurada si es necesaria',
      'Entrega del documento completo'
    ],
    faqs: [
      { q: 'Â¿QuÃ© es la apostilla?', a: 'Es una certificaciÃ³n que autentica la firma de un funcionario pÃºblico en un documento para que tenga validez en otro paÃ­s firmante del Convenio de La Haya.' },
      { q: 'Â¿Todos los paÃ­ses aceptan la apostilla?', a: 'Solo los paÃ­ses que han firmado el Convenio de La Haya (actualmente mÃ¡s de 120 paÃ­ses). Para el resto, es necesaria la legalizaciÃ³n diplomÃ¡tica.' }
    ]
  },

  // â”€â”€ FormaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'formacion-fiscal-contable',
    categoria: 'formacion',
    name: 'FormaciÃ³n Fiscal y Contable',
    shortDescription: 'Sesiones prÃ¡cticas sobre fiscalidad, contabilidad y obligaciones tributarias.',
    description:
      'Impartimos formaciÃ³n prÃ¡ctica en materia fiscal y contable para autÃ³nomos, pymes y equipos de administraciÃ³n: IRPF, IVA, cierre contable, modelos tributarios, declaraciones y planificaciÃ³n fiscal. Bloques de 2 horas desde 180 â‚¬.',
    price: 'Desde 180 â‚¬ / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'SesiÃ³n online o presencial (segÃºn disponibilidad)',
      'Material didÃ¡ctico y resumen escrito',
      'Ejercicios prÃ¡cticos sobre casos reales',
      'ResoluciÃ³n de dudas en directo',
      'GrabaciÃ³n de la sesiÃ³n (si es online)'
    ],
    faqs: [
      { q: 'Â¿Puedo solicitar un tema especÃ­fico?', a: 'SÃ­. La formaciÃ³n se adapta a tus necesidades concretas: cierre fiscal, IVA de importaciones, IRPF de expatriados, etc.' },
      { q: 'Â¿Es posible hacer la formaciÃ³n para un equipo?', a: 'SÃ­, podemos adaptar el contenido y el formato para equipos de hasta 10 personas.' }
    ]
  },
  {
    slug: 'formacion-laboral-rrhh',
    categoria: 'formacion',
    name: 'FormaciÃ³n Laboral y RRHH',
    shortDescription: 'FormaciÃ³n sobre contratos, nÃ³minas, gestiÃ³n laboral y recursos humanos.',
    description:
      'FormaciÃ³n prÃ¡ctica para responsables de administraciÃ³n, gerentes y equipos de RRHH: tipos de contratos, nÃ³minas, altas y bajas en Seguridad Social, gestiÃ³n de ausencias, despidos y documentaciÃ³n laboral. Bloques de 2 horas desde 180 â‚¬.',
    price: 'Desde 180 â‚¬ / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'SesiÃ³n online o presencial',
      'Material didÃ¡ctico adaptado',
      'Casos prÃ¡cticos de gestiÃ³n laboral',
      'ResoluciÃ³n de dudas',
      'Acceso a plantillas y modelos'
    ],
    faqs: [
      { q: 'Â¿Es apta para personas sin formaciÃ³n previa en RRHH?', a: 'SÃ­, adaptamos el nivel al perfil del participante.' }
    ]
  },
  {
    slug: 'formacion-holded',
    categoria: 'formacion',
    name: 'FormaciÃ³n en Holded',
    shortDescription: 'Aprende a gestionar tu contabilidad, facturaciÃ³n y CRM en Holded.',
    description:
      'Como Holded Solution Partner, impartimos formaciÃ³n especÃ­fica en el uso de Holded: mÃ³dulos de facturaciÃ³n, contabilidad, inventario, proyectos y CRM. Sesiones de 2 horas adaptadas a tu nivel y caso de uso real. Precio: 180 â‚¬ por bloque.',
    price: '180 â‚¬ / bloque de 2 h',
    duration: '2 horas por bloque',
    includes: [
      'SesiÃ³n prÃ¡ctica sobre tu propio entorno Holded',
      'Recorrido por los mÃ³dulos que uses',
      'ConfiguraciÃ³n de automatizaciones bÃ¡sicas',
      'GuÃ­a personalizada de uso',
      'Soporte post-sesiÃ³n por email (7 dÃ­as)'
    ],
    faqs: [
      { q: 'Â¿Necesito tener Holded contratado para hacer la formaciÃ³n?', a: 'SÃ­, trabajamos directamente sobre tu cuenta. Si aÃºn no tienes Holded, podemos ayudarte a configurarlo antes.' },
      { q: 'Â¿CuÃ¡ntos bloques de formaciÃ³n necesito?', a: 'Depende del mÃ³dulo. Para facturaciÃ³n bÃ¡sica suele ser suficiente con 1â€“2 bloques. Para contabilidad completa, 3â€“4 bloques.' }
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
