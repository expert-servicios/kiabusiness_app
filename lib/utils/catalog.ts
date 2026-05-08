export const categories = [
  {
    slug: 'declaraciones-impuestos',
    name: 'Declaraciones e Impuestos',
    description: 'Renta, IVA, Sociedades y planificación fiscal anual para personas físicas y empresas.'
  },
  {
    slug: 'extranjeria-nacionalidad',
    name: 'Extranjería y Nacionalidad',
    description: 'Arraigo, permisos, renovaciones y expedientes de nacionalidad española.'
  },
  {
    slug: 'empresas-autonomos',
    name: 'Empresas y Autónomos',
    description: 'Alta de actividad, asesoría contable y obligaciones recurrentes de negocio.'
  },
  {
    slug: 'trafico-capitania-maritima',
    name: 'Tráfico y Capitanía Marítima',
    description: 'Gestiones de tráfico, matriculaciones y trámites de embarcaciones.'
  },
  {
    slug: 'notaria-propiedades',
    name: 'Notaría y Propiedades',
    description: 'Compraventas, escrituras, herencias y fiscalidad inmobiliaria.'
  },
  {
    slug: 'gestiones-especializadas',
    name: 'Gestiones Especializadas',
    description: 'Trámites estratégicos con enfoque legal-administrativo de alta complejidad.'
  },
  {
    slug: 'formacion',
    name: 'Formación',
    description:
      'Formación fiscal, contable, legal, mercantil, laboral, RRHH y uso de Holded. Bloques de 2 horas desde 180 euros.'
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
  // ── Declaraciones e Impuestos ─────────────────────────────────────────────
  {
    slug: 'irpf',
    categoria: 'declaraciones-impuestos',
    name: 'Declaración de la Renta (IRPF)',
    shortDescription: 'Preparación y presentación del IRPF con revisión fiscal completa.',
    description:
      'Gestionamos tu declaración de la renta de principio a fin: revisamos tu situación fiscal, identificamos deducciones aplicables, preparamos el borrador, lo validamos contigo y lo presentamos ante la AEAT. Servicio para residentes, trabajadores por cuenta ajena, autónomos y propietarios de inmuebles.',
    price: 'Desde 90 €',
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

  // ── Extranjería y Nacionalidad ─────────────────────────────────────────────
  {
    slug: 'arraigo-social',
    categoria: 'extranjeria-nacionalidad',
    name: 'Arraigo Social',
    shortDescription: 'Autorización de residencia por arraigo social en España.',
    description:
      'El arraigo social permite obtener un permiso de residencia temporal para personas que llevan al menos 3 años empadronadas en España, tienen vínculos familiares con residentes legales o disponen de una oferta de empleo. Preparamos toda la documentación y gestionamos el expediente.',
    price: 'Consultar',
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
    price: 'Consultar',
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

  // ── Empresas y Autónomos ───────────────────────────────────────────────────
  {
    slug: 'alta-autonomo',
    categoria: 'empresas-autonomos',
    name: 'Alta de Autónomo',
    shortDescription: 'Tramitación del alta en el RETA y gestión de la actividad económica.',
    description:
      'Gestionamos tu alta como autónomo en la Agencia Tributaria (Modelo 036/037) y en la Seguridad Social (RETA), con asesoramiento sobre el epígrafe de actividad más adecuado, cuota de autónomos, tarifa plana y obligaciones fiscales desde el inicio.',
    price: 'Desde 120 €',
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
    price: 'Desde 490 €',
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
    slug: 'certificado-digital',
    categoria: 'gestiones-especializadas',
    name: 'Certificado Digital — Camerfirma',
    shortDescription: 'Obtención y renovación de certificados digitales reconocidos para empresas y personas.',
    description:
      'Como punto de registro autorizado de Camerfirma, tramitamos la obtención y renovación de certificados digitales cualificados para personas físicas, representantes de personas jurídicas y sellos de empresa. Imprescindibles para relacionarse con la AEAT, Seguridad Social y otros organismos.',
    price: 'Consultar',
    duration: 'Inmediato (presencialmente)',
    includes: [
      'Verificación de identidad presencial o videoconferencia',
      'Emisión del certificado en formato software o tarjeta',
      'Instalación y guía de uso',
      'Soporte ante incidencias de uso'
    ],
    faqs: [
      { q: '¿Qué diferencia hay entre el certificado de persona física y el de representante?', a: 'El de persona física identifica al individuo. El de representante de persona jurídica permite actuar en nombre de la empresa.' },
      { q: '¿Cuánto dura un certificado Camerfirma?', a: 'Generalmente 2 o 3 años, según el tipo de certificado.' }
    ]
  },
  {
    slug: 'migracion-holded',
    categoria: 'gestiones-especializadas',
    name: 'Migración a Holded',
    shortDescription: 'Migración contable y configuración de Holded para tu empresa.',
    description:
      'Como Holded Solution Partner, realizamos la migración de tu contabilidad y facturación a Holded: importación de datos históricos, configuración de plan de cuentas, integración bancaria, personalización de facturas y formación inicial para tu equipo.',
    price: 'Desde 490 €',
    duration: '1–3 semanas',
    includes: [
      'Análisis del sistema actual',
      'Importación de clientes, proveedores y productos',
      'Configuración del plan de cuentas',
      'Integración de cuentas bancarias',
      'Personalización de plantillas de factura',
      'Formación inicial (2 horas incluidas)'
    ],
    faqs: [
      { q: '¿Pierdo datos al migrar a Holded?', a: 'No. Hacemos una migración ordenada por fases para que tengas continuidad total de datos históricos.' },
      { q: '¿Qué pasa si ya uso otro software de contabilidad?', a: 'Migramos desde ContaPlus, Sage, Excel u otros. Analizamos el caso antes de empezar.' }
    ]
  },
  {
    slug: 'representacion-fiscal',
    categoria: 'gestiones-especializadas',
    name: 'Representación Fiscal',
    shortDescription: 'Representante fiscal en España para no residentes con obligaciones tributarias.',
    description:
      'Los no residentes con bienes o intereses económicos en España pueden estar obligados a designar un representante fiscal. Actuamos como representante fiscal ante la AEAT, gestionando notificaciones, obligaciones declarativas y comunicaciones oficiales.',
    price: 'Desde 120 € / año',
    duration: 'Servicio anual recurrente',
    includes: [
      'Designación como representante fiscal ante la AEAT',
      'Recepción de notificaciones de Hacienda',
      'Gestión de comunicaciones y requerimientos',
      'Informe periódico al cliente no residente'
    ],
    faqs: [
      { q: '¿Cuándo es obligatorio el representante fiscal?', a: 'Para no residentes fuera de la UE/EEE con propiedades o rentas en España, y en algunos casos para no residentes de la UE.' }
    ]
  },
  {
    slug: 'apostilla-legalizacion',
    categoria: 'gestiones-especializadas',
    name: 'Apostilla y Legalización',
    shortDescription: 'Apostilla de documentos españoles y legalización de documentos extranjeros.',
    description:
      'Tramitamos la apostilla de la Haya para documentos españoles destinados al extranjero, y la legalización de documentos extranjeros para su uso en España. También gestionamos traducciones juradas cuando son necesarias.',
    price: 'Desde 60 €',
    duration: '3–10 días hábiles',
    includes: [
      'Verificación del tipo de documento y país de destino/origen',
      'Tramitación de la apostilla ante el organismo competente',
      'Coordinar traducción jurada si es necesaria',
      'Entrega del documento completo'
    ],
    faqs: [
      { q: '¿Qué es la apostilla?', a: 'Es una certificación que autentica la firma de un funcionario público en un documento para que tenga validez en otro país firmante del Convenio de La Haya.' },
      { q: '¿Todos los países aceptan la apostilla?', a: 'Solo los países que han firmado el Convenio de La Haya (actualmente más de 120 países). Para el resto, es necesaria la legalización diplomática.' }
    ]
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
