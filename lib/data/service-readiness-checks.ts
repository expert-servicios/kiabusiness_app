// Readiness checks for services that don't need juridical/fiscal viability checks
// but do need to verify the client is technically prepared before checkout.
// Used by: Holded services, monthly plans.

export type ReadinessQuestionType = 'single' | 'multi' | 'boolean';

export type ReadinessNextAction =
  | 'continue_checkout'
  | 'holded_trial'
  | 'recommend_plan_avanzado'
  | 'api_tutorial'
  | 'upload_excel'
  | 'book_call'
  | 'request_quote'
  | 'manual_review';

export interface ReadinessOption {
  id         : string;
  label      : string;
  description?: string;
  nextAction : ReadinessNextAction;
  /** If true, this answer alone blocks checkout regardless of other answers */
  blocking   ?: boolean;
}

export interface ReadinessQuestion {
  id         : string;
  text       : string;
  hint      ?: string;
  type       : ReadinessQuestionType;
  options    : ReadinessOption[];
}

export interface ReadinessCheck {
  slug        : string;
  title       : string;
  description : string;
  /** CTA label shown on the trigger button */
  ctaLabel    : string;
  questions   : ReadinessQuestion[];
}

export interface ReadinessAnswers {
  [questionId: string]: string | string[];
}

export interface ReadinessResult {
  nextAction   : ReadinessNextAction;
  /** Human-readable outcome title shown at end of wizard */
  title        : string;
  /** Short explanation shown at end of wizard */
  message      : string;
  /** Whether the user may proceed to checkout */
  canCheckout  : boolean;
}

// ── Priority order for resolving nextAction from multiple answers ──────────
const ACTION_PRIORITY: ReadinessNextAction[] = [
  'manual_review',
  'request_quote',
  'book_call',
  'holded_trial',
  'recommend_plan_avanzado',
  'api_tutorial',
  'upload_excel',
  'continue_checkout',
];

function highestPriority(actions: ReadinessNextAction[]): ReadinessNextAction {
  for (const action of ACTION_PRIORITY) {
    if (actions.includes(action)) return action;
  }
  return 'continue_checkout';
}

// ── Result copy per nextAction ─────────────────────────────────────────────
const RESULT_COPY: Record<ReadinessNextAction, Omit<ReadinessResult, 'nextAction'>> = {
  continue_checkout: {
    title      : '¡Estás listo para contratar!',
    message    : 'Tu entorno está preparado. Puedes continuar con el proceso de pago.',
    canCheckout: true,
  },
  holded_trial: {
    title      : 'Prueba Holded primero',
    message    : 'Te recomendamos activar la prueba gratuita de 14 días de Holded antes de contratar. Así podrás explorar la herramienta sin compromiso.',
    canCheckout: false,
  },
  recommend_plan_avanzado: {
    title      : 'Te encaja mejor el Plan Avanzado',
    message    : 'El Plan Supervisión no incluye preparación ni presentación de impuestos. Para eso conviene configurar el Plan Avanzado o revisar el alcance contigo.',
    canCheckout: false,
  },
  api_tutorial: {
    title      : 'Revisa la documentación de la API',
    message    : 'Antes de contratar la integración necesitas acceso a la API de Holded. Te enviamos la guía para activarla.',
    canCheckout: false,
  },
  upload_excel: {
    title      : 'Prepara tu fichero de datos',
    message    : 'Para la migración necesitas exportar tus datos actuales en Excel. Te enviamos la plantilla para que lo prepares.',
    canCheckout: false,
  },
  book_call: {
    title      : 'Reserva una llamada con nosotros',
    message    : 'Basándonos en tus respuestas, lo mejor es hablar 15 minutos con un asesor antes de empezar. Así te aseguramos el plan adecuado.',
    canCheckout: false,
  },
  request_quote: {
    title      : 'Solicita un presupuesto personalizado',
    message    : 'Tu caso tiene características especiales. Prepararemos un presupuesto a medida sin coste.',
    canCheckout: false,
  },
  manual_review: {
    title      : 'Revisión por el equipo',
    message    : 'Nuestro equipo revisará tu caso y te contactará en menos de 24 horas para orientarte.',
    canCheckout: false,
  },
};

// ── Checks ─────────────────────────────────────────────────────────────────

const HOLDED_PACK_STARTER: ReadinessCheck = {
  slug       : 'holded-pack-starter',
  title      : 'Preparar contratación Pack Starter Holded',
  description: 'Dos minutos para confirmar que el Pack Starter encaja con lo que necesitas — y asegurarnos de que empiezas bien desde el primer día.',
  ctaLabel   : 'Preparar contratación',
  questions  : [
    {
      id   : 'holded_account_status',
      text : '¿Ya tienes cuenta activa de Holded?',
      hint : 'Si no tienes cuenta, gestionamos la prueba gratuita de 14 días como parte del servicio.',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí, ya tengo cuenta',                                        nextAction: 'continue_checkout' },
        { id: 'en_prueba', label: 'Estoy en periodo de prueba',                                nextAction: 'continue_checkout' },
        { id: 'no',       label: 'No tengo cuenta — me podéis ayudar a empezar',               nextAction: 'continue_checkout',
          description: 'Activamos la prueba gratuita de 14 días por ti antes de configurar' },
        { id: 'no_lo_se', label: 'No lo sé',                                                   nextAction: 'book_call' },
      ],
    },
    {
      id   : 'setup_goal',
      text : '¿Qué necesitas hacer principalmente?',
      type : 'single',
      options: [
        { id: 'crear_cero',       label: 'Crear y configurar desde cero',              nextAction: 'continue_checkout' },
        { id: 'configurar',       label: 'Configurar una cuenta existente',             nextAction: 'continue_checkout' },
        { id: 'preparar_gestion', label: 'Prepararme para gestión mensual con EXPERT', nextAction: 'continue_checkout' },
        { id: 'otro',             label: 'Otro — necesito orientación',                 nextAction: 'book_call' },
      ],
    },
    {
      id   : 'client_type',
      text : '¿Eres autónomo o sociedad?',
      type : 'single',
      options: [
        { id: 'autonomo', label: 'Autónomo / Freelance',  nextAction: 'continue_checkout' },
        { id: 'sl',       label: 'SL / empresa',          nextAction: 'continue_checkout' },
        { id: 'otra',     label: 'Otra entidad',           nextAction: 'continue_checkout' },
      ],
    },
    {
      id   : 'scope_check',
      text : '¿Necesitas migrar historial completo de facturas, productos con stock o integraciones API externas?',
      hint : 'Pack Starter es configuración inicial. Para migración completa o inventario tenemos servicios específicos.',
      type : 'single',
      options: [
        { id: 'no',        label: 'No, solo quiero configurar la cuenta',          nextAction: 'continue_checkout' },
        { id: 'historial', label: 'Sí, tengo facturas históricas que migrar',      nextAction: 'request_quote', blocking: true,
          description: 'Te recomendamos Migración Holded, específica para este caso' },
        { id: 'inventario', label: 'Sí, tengo inventario / almacenes / stock',     nextAction: 'request_quote', blocking: true,
          description: 'Te recomendamos Migración con Inventario, específica para este caso' },
        { id: 'no_lo_se',  label: 'No lo sé todavía',                              nextAction: 'book_call' },
      ],
    },
    {
      id   : 'fiscal_data_ready',
      text : '¿Tienes tus datos fiscales básicos preparados?',
      hint : 'Nombre / razón social, NIF/CIF, dirección fiscal y actividad económica.',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí, los tengo',            nextAction: 'continue_checkout' },
        { id: 'parcial',  label: 'Tengo algunos',             nextAction: 'continue_checkout' },
        { id: 'no_aun',   label: 'No los tengo todavía',      nextAction: 'continue_checkout' },
      ],
    },
    {
      id   : 'bank_connection',
      text : '¿Quieres conectar tu banco en Holded?',
      type : 'single',
      options: [
        { id: 'si',            label: 'Sí',                          nextAction: 'continue_checkout' },
        { id: 'mas_adelante',  label: 'Más adelante',                 nextAction: 'continue_checkout' },
        { id: 'necesito_ayuda', label: 'Necesito ayuda para decidir', nextAction: 'book_call' },
      ],
    },
  ],
};

const HOLDED_MIGRACION_SIN_INVENTARIO: ReadinessCheck = {
  slug       : 'holded-migracion-sin-inventario',
  title      : 'Preparar migración a Holded — Sin inventario',
  description: 'Unos minutos para confirmar que tienes los datos listos y que este servicio encaja con tu caso.',
  ctaLabel   : 'Preparar migración',
  questions  : [
    {
      id   : 'tiene_holded',
      text : '¿Tienes ya una cuenta activa de Holded?',
      hint : 'La migración requiere una cuenta Holded activa donde cargar los datos.',
      type : 'single',
      options: [
        { id: 'si',     label: 'Sí, ya tengo cuenta',         nextAction: 'continue_checkout' },
        { id: 'prueba', label: 'Estoy en periodo de prueba',   nextAction: 'continue_checkout' },
        { id: 'no',     label: 'No tengo cuenta todavía',      nextAction: 'holded_trial',
          description: 'Activa la prueba gratuita de 14 días antes de migrar' },
      ],
    },
    {
      id   : 'sistema_origen',
      text : '¿Desde qué sistema o formato migras?',
      type : 'single',
      options: [
        { id: 'excel',      label: 'Excel / Google Sheets',              nextAction: 'continue_checkout' },
        { id: 'contaplus',  label: 'ContaPlus / A3 / Sage',             nextAction: 'book_call',
          description: 'Requiere extracción y adaptación previa — te orientamos en la llamada' },
        { id: 'otro_erp',   label: 'Otro ERP o sistema propietario',    nextAction: 'book_call' },
        { id: 'ninguno',    label: 'No vengo de ningún sistema',         nextAction: 'continue_checkout' },
      ],
    },
    {
      id   : 'datos_exportados',
      text : '¿Tienes exportados clientes, proveedores y facturas del sistema anterior?',
      type : 'single',
      options: [
        { id: 'si',      label: 'Sí, tengo el Excel / CSV listo',      nextAction: 'continue_checkout' },
        { id: 'parcial', label: 'Tengo parte de los datos',             nextAction: 'upload_excel' },
        { id: 'no',      label: 'No sé cómo exportarlos todavía',       nextAction: 'upload_excel' },
      ],
    },
    {
      id   : 'volumen_registros',
      text : '¿Cuántos registros aproximados tienes entre clientes, proveedores y facturas?',
      type : 'single',
      options: [
        { id: 'menos_1000',  label: 'Menos de 1.000',                   nextAction: 'continue_checkout' },
        { id: '1000_10000',  label: 'Entre 1.000 y 10.000',             nextAction: 'continue_checkout' },
        { id: 'mas_10000',   label: 'Más de 10.000',                    nextAction: 'book_call',
          description: 'Volumen alto — revisamos el alcance en una llamada' },
      ],
    },
    {
      id   : 'anos_historial',
      text : '¿Cuántos años de historial quieres migrar?',
      type : 'single',
      options: [
        { id: 'este_anio',    label: 'Solo el ejercicio actual',         nextAction: 'continue_checkout' },
        { id: 'hasta_3',      label: 'Hasta 3 años atrás',               nextAction: 'continue_checkout' },
        { id: 'mas_3',        label: 'Más de 3 años',                    nextAction: 'book_call' },
      ],
    },
    {
      id   : 'tiene_inventario',
      text : '¿Tienes catálogo de productos con referencias y stock?',
      hint : 'Si tienes inventario, el servicio adecuado es Migración con inventario.',
      type : 'single',
      options: [
        { id: 'no',       label: 'No, no tengo inventario',             nextAction: 'continue_checkout' },
        { id: 'si',       label: 'Sí, tengo productos y stock',         nextAction: 'request_quote', blocking: true,
          description: 'Para inventario el servicio correcto es Migración con inventario' },
        { id: 'no_lo_se', label: 'No lo sé',                            nextAction: 'book_call' },
      ],
    },
  ],
};

const HOLDED_MIGRACION_CON_INVENTARIO: ReadinessCheck = {
  slug       : 'holded-migracion-con-inventario',
  title      : 'Preparar migración a Holded — Con inventario',
  description: 'La migración con inventario requiere preparación adicional. Verificamos que tienes los datos listos.',
  ctaLabel   : 'Preparar migración',
  questions  : [
    {
      id   : 'tiene_holded',
      text : '¿Tienes ya una cuenta activa de Holded?',
      hint : 'La migración requiere una cuenta Holded activa donde cargar los datos.',
      type : 'single',
      options: [
        { id: 'si',     label: 'Sí, ya tengo cuenta',         nextAction: 'continue_checkout' },
        { id: 'prueba', label: 'Estoy en periodo de prueba',   nextAction: 'continue_checkout' },
        { id: 'no',     label: 'No tengo cuenta todavía',      nextAction: 'holded_trial',
          description: 'Activa la prueba gratuita de 14 días antes de migrar' },
      ],
    },
    {
      id   : 'referencias_productos',
      text : '¿Cuántas referencias de producto tienes en tu catálogo?',
      type : 'single',
      options: [
        { id: 'menos_500', label: 'Menos de 500',               nextAction: 'continue_checkout' },
        { id: '500_2000',  label: 'Entre 500 y 2.000',           nextAction: 'continue_checkout' },
        { id: 'mas_2000',  label: 'Más de 2.000',                nextAction: 'book_call',
          description: 'Catálogo grande — revisamos el alcance en una llamada' },
      ],
    },
    {
      id   : 'datos_inventario',
      text : '¿Tienes el inventario exportado con stock, precio y referencia?',
      type : 'single',
      options: [
        { id: 'si',      label: 'Sí, tengo el fichero listo',      nextAction: 'continue_checkout' },
        { id: 'parcial', label: 'Tengo parte de los datos',         nextAction: 'upload_excel' },
        { id: 'no',      label: 'Necesito ayuda para exportarlo',   nextAction: 'upload_excel' },
      ],
    },
    {
      id   : 'variantes',
      text : '¿Tus productos tienen variantes (talla, color, modelo, etc.)?',
      type : 'single',
      options: [
        { id: 'no',     label: 'No, son productos simples',        nextAction: 'continue_checkout' },
        { id: 'pocas',  label: 'Sí, pocas variantes',              nextAction: 'continue_checkout' },
        { id: 'muchas', label: 'Sí, muchas variantes complejas',   nextAction: 'book_call' },
      ],
    },
    {
      id   : 'sistema_origen',
      text : '¿Desde qué sistema o formato migras el inventario?',
      type : 'single',
      options: [
        { id: 'excel',     label: 'Excel / Google Sheets',         nextAction: 'continue_checkout' },
        { id: 'contaplus', label: 'ContaPlus / A3 / Sage / ERP',  nextAction: 'book_call',
          description: 'Requiere extracción y adaptación — te orientamos en la llamada' },
        { id: 'otro',      label: 'Otro sistema propietario',      nextAction: 'book_call' },
        { id: 'manual',    label: 'Lo tengo en papel o sin sistema', nextAction: 'continue_checkout' },
      ],
    },
    {
      id   : 'almacenes',
      text : '¿Tienes más de un almacén o ubicación de stock?',
      type : 'single',
      options: [
        { id: 'un_almacen',     label: 'No, un solo almacén',          nextAction: 'continue_checkout' },
        { id: 'varios_simples', label: 'Sí, varios almacenes simples',  nextAction: 'continue_checkout' },
        { id: 'complejo',       label: 'Sí, estructura compleja de almacenes', nextAction: 'book_call' },
      ],
    },
  ],
};

const HOLDED_MODULO_FORMACION: ReadinessCheck = {
  slug       : 'holded-modulo-formacion',
  title      : 'Formación Holded con EXPERT',
  description: 'Para sacarle el máximo partido a la formación, verificamos tu nivel actual con Holded.',
  ctaLabel   : 'Comprobar preparación',
  questions  : [
    {
      id   : 'tiene_holded',
      text : '¿Tienes ya una cuenta activa de Holded?',
      type : 'single',
      options: [
        { id: 'si',      label: 'Sí, ya tengo cuenta',            nextAction: 'continue_checkout' },
        { id: 'prueba',  label: 'Estoy en periodo de prueba',      nextAction: 'continue_checkout' },
        { id: 'no',      label: 'No tengo cuenta todavía',         nextAction: 'holded_trial' },
      ],
    },
    {
      id   : 'nivel_holded',
      text : '¿Cuál es tu nivel actual con Holded?',
      type : 'single',
      options: [
        { id: 'principiante', label: 'Principiante — nunca lo he usado',       nextAction: 'continue_checkout' },
        { id: 'basico',       label: 'Básico — facturas y poco más',           nextAction: 'continue_checkout' },
        { id: 'intermedio',   label: 'Intermedio — uso varios módulos',        nextAction: 'continue_checkout' },
        { id: 'avanzado',     label: 'Avanzado — necesito temas específicos',  nextAction: 'book_call' },
      ],
    },
    {
      id   : 'objetivo_formacion',
      text : '¿Qué quieres conseguir con la formación?',
      type : 'single',
      options: [
        { id: 'primeros_pasos', label: 'Poner en marcha Holded desde cero',       nextAction: 'continue_checkout' },
        { id: 'facturacion',    label: 'Dominar facturación y cobros',            nextAction: 'continue_checkout' },
        { id: 'inventario',     label: 'Gestionar inventario y almacén',          nextAction: 'continue_checkout' },
        { id: 'personalizado',  label: 'Formación personalizada a mi empresa',    nextAction: 'book_call' },
      ],
    },
  ],
};

const PLAN_SUPERVISION: ReadinessCheck = {
  slug       : 'plan-supervision',
  title      : 'Plan Supervisión — Verifica que encaja contigo',
  description: 'El Plan Supervisión es para quienes llevan Holded por su cuenta y quieren revisión mensual profesional, alertas y soporte básico.',
  ctaLabel   : 'Configurar plan',
  questions  : [
    {
      id   : 'holded_account_status',
      text : '¿Ya tienes cuenta Holded activa?',
      hint : 'Todos los planes mensuales requieren Holded. La licencia no está incluida.',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí',       nextAction: 'continue_checkout' },
        { id: 'no',       label: 'No',       nextAction: 'holded_trial', blocking: true,
          description: 'Empieza con la prueba Holded 14 días o Pack Starter antes del plan mensual' },
        { id: 'no_lo_se', label: 'No lo sé', nextAction: 'holded_trial', blocking: true },
        { id: 'otro',     label: 'Otro',     nextAction: 'book_call' },
      ],
    },
    {
      id   : 'self_accounting',
      text : '¿Llevas tú la contabilidad en Holded?',
      type : 'single',
      options: [
        { id: 'si',              label: 'Sí',              nextAction: 'continue_checkout' },
        { id: 'empezando',       label: 'Estoy empezando', nextAction: 'continue_checkout' },
        { id: 'necesito_ayuda',  label: 'Necesito ayuda',  nextAction: 'book_call' },
        { id: 'otro',            label: 'Otro',            nextAction: 'book_call' },
      ],
    },
    {
      id   : 'api_connection',
      text : '¿Puedes conectar tu API key de Holded desde el Panel Cliente?',
      hint : 'Nunca envíes la API key por WhatsApp o email. Se conecta desde el portal seguro.',
      type : 'single',
      options: [
        { id: 'si',              label: 'Sí',              nextAction: 'continue_checkout' },
        { id: 'no_se_como',      label: 'No sé cómo',      nextAction: 'api_tutorial', blocking: true },
        { id: 'necesito_tutorial', label: 'Necesito tutorial', nextAction: 'api_tutorial', blocking: true },
        { id: 'otro',            label: 'Otro',            nextAction: 'book_call' },
      ],
    },
    {
      id   : 'tax_scope',
      text : '¿Quieres solo revisión o también presentación de impuestos?',
      type : 'single',
      options: [
        { id: 'solo_revision',     label: 'Solo revisión',       nextAction: 'continue_checkout' },
        { id: 'tambien_impuestos', label: 'También impuestos',   nextAction: 'recommend_plan_avanzado', blocking: true },
        { id: 'no_lo_se',          label: 'No lo sé',            nextAction: 'book_call' },
        { id: 'otro',              label: 'Otro',                nextAction: 'book_call' },
      ],
    },
    {
      id   : 'plataforma_expert',
      text : '¿Aceptas trabajar desde Plataforma EXPERT para centralizar documentos, avisos, comunicación y conexión Holded?',
      hint : 'Plataforma EXPERT es el área privada donde conectas Holded, subes documentos, ves alertas y tienes el seguimiento de Kia. Es obligatoria para todos los planes mensuales.',
      type : 'single',
      options: [
        { id: 'si',                   label: 'Sí, acepto',           nextAction: 'continue_checkout' },
        { id: 'necesito_explicacion',  label: 'Necesito explicación', nextAction: 'book_call', blocking: true,
          description: 'Plataforma EXPERT es el área privada donde se centraliza la gestión mensual. Sin ella no podemos ofrecer el servicio. Un asesor te explica cómo funciona en 10 minutos.' },
        { id: 'otro',                  label: 'Otro',                 nextAction: 'book_call' },
      ],
    },
  ],
};

const PLAN_AVANZADO: ReadinessCheck = {
  slug       : 'plan-avanzado',
  title      : 'Plan Avanzado — Verifica que es tu plan',
  description: 'Unas preguntas para confirmar que tienes Holded preparado y que el alcance fiscal básico encaja con el Plan Avanzado.',
  ctaLabel   : 'Configurar mi plan',
  questions  : [
    {
      id   : 'holded_account_status',
      text : '¿Ya tienes cuenta Holded activa?',
      hint : 'Holded es obligatorio y la licencia no está incluida.',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí, ya tengo cuenta',        nextAction: 'continue_checkout' },
        { id: 'no',       label: 'No tengo Holded',            nextAction: 'holded_trial', blocking: true },
        { id: 'no_lo_se', label: 'No lo sé',                   nextAction: 'holded_trial', blocking: true },
        { id: 'otro',     label: 'Otro',                       nextAction: 'book_call' },
      ],
    },
    {
      id   : 'holded_api_connection',
      text : '¿Puedes conectar Holded desde el Panel Cliente?',
      hint : 'El checkout mensual queda bloqueado hasta tener Holded conectado.',
      type : 'single',
      options: [
        { id: 'si',               label: 'Sí',              nextAction: 'continue_checkout' },
        { id: 'no_se_como',       label: 'No sé cómo',      nextAction: 'api_tutorial', blocking: true },
        { id: 'necesito_tutorial', label: 'Necesito tutorial', nextAction: 'api_tutorial', blocking: true },
        { id: 'otro',             label: 'Otro',            nextAction: 'book_call' },
      ],
    },
    {
      id   : 'forma_juridica',
      text : '¿Cuál es tu situación actual?',
      type : 'single',
      options: [
        { id: 'autonomo',  label: 'Autónomo / Freelance',            nextAction: 'continue_checkout' },
        { id: 'sl',        label: 'Sociedad Limitada (SL)',          nextAction: 'continue_checkout' },
        { id: 'sa',        label: 'Sociedad Anónima (SA)',           nextAction: 'request_quote' },
        { id: 'ninguna',   label: 'Todavía no estoy dado de alta',   nextAction: 'book_call' },
      ],
    },
    {
      id   : 'volumen_facturacion',
      text : '¿Cuál es tu facturación anual aproximada?',
      type : 'single',
      options: [
        { id: 'menos_30k',  label: 'Menos de 30.000 €',             nextAction: 'continue_checkout' },
        { id: '30_100k',    label: 'Entre 30.000 € y 100.000 €',    nextAction: 'continue_checkout' },
        { id: '100_300k',   label: 'Entre 100.000 € y 300.000 €',   nextAction: 'continue_checkout' },
        { id: 'mas_300k',   label: 'Más de 300.000 €',              nextAction: 'request_quote' },
      ],
    },
    {
      id   : 'necesidades',
      text : '¿Qué necesitas principalmente?',
      type : 'single',
      options: [
        { id: 'fiscal',        label: 'Impuestos básicos',                       nextAction: 'continue_checkout' },
        { id: 'laboral',       label: 'Nóminas y gestión laboral',               nextAction: 'request_quote', blocking: true },
        { id: 'contabilidad',  label: 'Revisión y cierre trimestral',            nextAction: 'continue_checkout' },
        { id: 'todo',          label: 'Todo lo anterior más asesoría estratégica', nextAction: 'book_call' },
      ],
    },
    {
      id   : 'plataforma_expert',
      text : '¿Aceptas trabajar desde Plataforma EXPERT para centralizar documentos, avisos, comunicación y conexión Holded?',
      hint : 'Plataforma EXPERT es el área privada donde conectas Holded, subes documentos, ves alertas y tienes el seguimiento de Kia. Es obligatoria para todos los planes mensuales.',
      type : 'single',
      options: [
        { id: 'si',                   label: 'Sí, acepto',           nextAction: 'continue_checkout' },
        { id: 'necesito_explicacion',  label: 'Necesito explicación', nextAction: 'book_call', blocking: true,
          description: 'Plataforma EXPERT es el área privada donde se centraliza la gestión mensual. Sin ella no podemos ofrecer el servicio. Un asesor te explica cómo funciona en 10 minutos.' },
        { id: 'otro',                  label: 'Otro',                 nextAction: 'book_call' },
      ],
    },
  ],
};

const PLAN_COLABORATIVO: ReadinessCheck = {
  slug       : 'plan-colaborativo',
  title      : 'Plan Colaborativo — Verifica que es tu plan',
  description: 'El Plan Colaborativo está pensado para volumen estándar y operativa sencilla con Holded conectado. Revisamos si encaja o requiere presupuesto.',
  ctaLabel   : 'Configurar mi plan',
  questions  : [
    {
      id   : 'holded_account_status',
      text : '¿Ya tienes cuenta Holded activa?',
      hint : 'Holded es obligatorio y la licencia no está incluida.',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí, ya tengo cuenta',        nextAction: 'continue_checkout' },
        { id: 'no',       label: 'No tengo Holded',            nextAction: 'holded_trial', blocking: true },
        { id: 'otro',     label: 'Otro',                       nextAction: 'book_call' },
      ],
    },
    {
      id   : 'holded_api_connection',
      text : '¿Puedes conectar Holded desde el Panel Cliente?',
      type : 'single',
      options: [
        { id: 'si',               label: 'Sí',              nextAction: 'continue_checkout' },
        { id: 'no_se_como',       label: 'No sé cómo',      nextAction: 'api_tutorial', blocking: true },
        { id: 'necesito_tutorial', label: 'Necesito tutorial', nextAction: 'api_tutorial', blocking: true },
        { id: 'otro',             label: 'Otro',            nextAction: 'book_call' },
      ],
    },
    {
      id   : 'forma_juridica',
      text : '¿Cuál es tu situación actual?',
      type : 'single',
      options: [
        { id: 'autonomo',  label: 'Autónomo / Freelance',            nextAction: 'continue_checkout' },
        { id: 'sl',        label: 'Sociedad Limitada (SL)',          nextAction: 'continue_checkout' },
        { id: 'sa',        label: 'Sociedad Anónima (SA)',           nextAction: 'request_quote' },
        { id: 'ninguna',   label: 'Todavía no estoy dado de alta',   nextAction: 'book_call' },
      ],
    },
    {
      id   : 'num_empleados',
      text : '¿Cuántos empleados tiene tu empresa?',
      type : 'single',
      options: [
        { id: 'solo',      label: 'Solo yo (sin empleados)',         nextAction: 'book_call' },
        { id: '1_5',       label: '1 a 5 empleados',                nextAction: 'continue_checkout' },
        { id: '6_20',      label: '6 a 20 empleados',               nextAction: 'continue_checkout' },
        { id: 'mas_20',    label: 'Más de 20 empleados',            nextAction: 'request_quote' },
      ],
    },
    {
      id   : 'volumen_facturacion',
      text : '¿Cuál es tu facturación anual aproximada?',
      type : 'single',
      options: [
        { id: 'menos_100k', label: 'Menos de 100.000 €',            nextAction: 'continue_checkout' },
        { id: '100_500k',   label: 'Entre 100.000 € y 500.000 €',  nextAction: 'continue_checkout' },
        { id: 'mas_500k',   label: 'Más de 500.000 €',             nextAction: 'request_quote' },
      ],
    },
    {
      id   : 'necesita_holded',
      text : '¿Tu empresa usa o quiere usar Holded?',
      type : 'single',
      options: [
        { id: 'si_activo',  label: 'Sí, ya usamos Holded',          nextAction: 'continue_checkout' },
        { id: 'si_nuevo',   label: 'Queremos empezar con Holded',   nextAction: 'holded_trial', blocking: true },
        { id: 'no',         label: 'No, usamos otro sistema',        nextAction: 'holded_trial', blocking: true },
      ],
    },
    {
      id   : 'plataforma_expert',
      text : '¿Aceptas trabajar desde Plataforma EXPERT para centralizar documentos, avisos, comunicación y conexión Holded?',
      hint : 'Plataforma EXPERT es el área privada donde conectas Holded, subes documentos, ves alertas y tienes el seguimiento de Kia. Es obligatoria para todos los planes mensuales.',
      type : 'single',
      options: [
        { id: 'si',                   label: 'Sí, acepto',           nextAction: 'continue_checkout' },
        { id: 'necesito_explicacion',  label: 'Necesito explicación', nextAction: 'book_call', blocking: true,
          description: 'Plataforma EXPERT es el área privada donde se centraliza la gestión mensual. Sin ella no podemos ofrecer el servicio. Un asesor te explica cómo funciona en 10 minutos.' },
        { id: 'otro',                  label: 'Otro',                 nextAction: 'book_call' },
      ],
    },
  ],
};

const PLAN_PRESUPUESTO_PERSONALIZADO: ReadinessCheck = {
  slug       : 'plan-presupuesto-personalizado',
  title      : 'Plan Personalizado — Cuéntanos tu caso',
  description: 'Algunas preguntas para preparar tu presupuesto personalizado sin coste.',
  ctaLabel   : 'Solicitar presupuesto',
  questions  : [
    {
      id   : 'forma_juridica',
      text : '¿Cuál es tu situación actual?',
      type : 'single',
      options: [
        { id: 'autonomo',  label: 'Autónomo / Freelance',            nextAction: 'request_quote' },
        { id: 'sl',        label: 'Sociedad Limitada (SL)',          nextAction: 'request_quote' },
        { id: 'sa',        label: 'Sociedad Anónima (SA)',           nextAction: 'request_quote' },
        { id: 'grupo',     label: 'Grupo de empresas',               nextAction: 'request_quote' },
        { id: 'ninguna',   label: 'Todavía no estoy dado de alta',   nextAction: 'book_call' },
      ],
    },
    {
      id   : 'servicios_necesarios',
      text : '¿Qué servicios necesitas principalmente? (selecciona todos los que apliquen)',
      type : 'single',
      options: [
        { id: 'fiscal',    label: 'Fiscal y contabilidad',           nextAction: 'request_quote' },
        { id: 'laboral',   label: 'Laboral y nóminas',               nextAction: 'request_quote' },
        { id: 'legal',     label: 'Legal y contratos',               nextAction: 'request_quote' },
        { id: 'holded',    label: 'Consultoría y formación Holded',   nextAction: 'request_quote' },
      ],
    },
  ],
};

// ── Registry ───────────────────────────────────────────────────────────────

const CHECKS: ReadinessCheck[] = [
  HOLDED_PACK_STARTER,
  HOLDED_MIGRACION_SIN_INVENTARIO,
  HOLDED_MIGRACION_CON_INVENTARIO,
  HOLDED_MODULO_FORMACION,
  PLAN_SUPERVISION,
  PLAN_AVANZADO,
  PLAN_COLABORATIVO,
  PLAN_PRESUPUESTO_PERSONALIZADO,
];

const CHECKS_BY_SLUG = new Map(CHECKS.map((c) => [c.slug, c]));

export function getReadinessCheck(serviceSlug: string): ReadinessCheck | undefined {
  return CHECKS_BY_SLUG.get(serviceSlug);
}

export function hasReadinessCheck(serviceSlug: string): boolean {
  return CHECKS_BY_SLUG.has(serviceSlug);
}

export function calculateReadinessResult(
  check  : ReadinessCheck,
  answers: ReadinessAnswers,
): ReadinessResult {
  const collectedActions: ReadinessNextAction[] = [];

  for (const question of check.questions) {
    const answer = answers[question.id];
    if (!answer) continue;

    const selectedIds = Array.isArray(answer) ? answer : [answer];
    for (const selectedId of selectedIds) {
      const option = question.options.find((o) => o.id === selectedId);
      if (option) {
        collectedActions.push(option.nextAction);
        if (option.blocking) {
          const copy = RESULT_COPY[option.nextAction];
          return { nextAction: option.nextAction, ...copy };
        }
      }
    }
  }

  const nextAction = highestPriority(
    collectedActions.length > 0 ? collectedActions : ['continue_checkout'],
  );
  const copy = RESULT_COPY[nextAction];
  return { nextAction, ...copy };
}
