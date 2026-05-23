// Readiness checks for services that don't need juridical/fiscal viability checks
// but do need to verify the client is technically prepared before checkout.
// Used by: Holded services, monthly plans.

export type ReadinessQuestionType = 'single' | 'multi' | 'boolean';

export type ReadinessNextAction =
  | 'continue_checkout'
  | 'holded_trial'
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
  title      : 'Prepara tu cuenta Holded',
  description: 'Unas preguntas rápidas para asegurarnos de que el pack encaja con tu situación actual.',
  ctaLabel   : 'Comprobar preparación',
  questions  : [
    {
      id   : 'tiene_holded',
      text : '¿Tienes ya una cuenta activa de Holded?',
      type : 'single',
      options: [
        { id: 'si',         label: 'Sí, ya tengo cuenta',            nextAction: 'continue_checkout' },
        { id: 'prueba',     label: 'Estoy en periodo de prueba',      nextAction: 'continue_checkout' },
        { id: 'no',         label: 'No, todavía no tengo cuenta',     nextAction: 'holded_trial' },
      ],
    },
    {
      id   : 'volumen_facturas',
      text : '¿Cuántas facturas emites aproximadamente al mes?',
      type : 'single',
      options: [
        { id: 'menos_20',   label: 'Menos de 20',                    nextAction: 'continue_checkout' },
        { id: 'entre_20_100', label: 'Entre 20 y 100',              nextAction: 'continue_checkout' },
        { id: 'mas_100',    label: 'Más de 100',                     nextAction: 'book_call' },
      ],
    },
    {
      id   : 'software_actual',
      text : '¿Usas actualmente otro software de facturación o ERP?',
      type : 'single',
      options: [
        { id: 'no_uso',     label: 'No, llevo todo en papel/Excel',  nextAction: 'continue_checkout' },
        { id: 'otro_erp',   label: 'Sí, tengo datos que migrar',     nextAction: 'book_call' },
        { id: 'ya_holded',  label: 'Ya uso Holded',                  nextAction: 'continue_checkout' },
      ],
    },
  ],
};

const HOLDED_MIGRACION_SIN_INVENTARIO: ReadinessCheck = {
  slug       : 'holded-migracion-sin-inventario',
  title      : 'Migración a Holded — Sin inventario',
  description: 'Verificamos que tengas los datos listos para migrar sin inventario de productos.',
  ctaLabel   : 'Comprobar preparación',
  questions  : [
    {
      id   : 'tiene_holded',
      text : '¿Tienes ya una cuenta activa de Holded?',
      type : 'single',
      options: [
        { id: 'si',      label: 'Sí, ya tengo cuenta',           nextAction: 'continue_checkout' },
        { id: 'prueba',  label: 'Estoy en periodo de prueba',     nextAction: 'continue_checkout' },
        { id: 'no',      label: 'No tengo cuenta todavía',        nextAction: 'holded_trial' },
      ],
    },
    {
      id   : 'datos_exportados',
      text : '¿Tienes exportados tus clientes, proveedores y facturas del sistema anterior?',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí, tengo el Excel / CSV listo',  nextAction: 'continue_checkout' },
        { id: 'parcial',  label: 'Tengo parte de los datos',         nextAction: 'upload_excel' },
        { id: 'no',       label: 'No sé cómo exportarlos',           nextAction: 'upload_excel' },
      ],
    },
    {
      id   : 'sistema_origen',
      text : '¿Desde qué sistema migras?',
      type : 'single',
      options: [
        { id: 'excel',    label: 'Excel / Google Sheets',            nextAction: 'continue_checkout' },
        { id: 'contaplus', label: 'ContaPlus / A3 / Sage',          nextAction: 'book_call' },
        { id: 'otro',     label: 'Otro ERP / sistema propietario',   nextAction: 'book_call' },
        { id: 'ningun',   label: 'No vengo de ningún sistema',       nextAction: 'continue_checkout' },
      ],
    },
  ],
};

const HOLDED_MIGRACION_CON_INVENTARIO: ReadinessCheck = {
  slug       : 'holded-migracion-con-inventario',
  title      : 'Migración a Holded — Con inventario',
  description: 'La migración con inventario requiere preparación adicional. Verificamos que estés listo.',
  ctaLabel   : 'Comprobar preparación',
  questions  : [
    {
      id   : 'tiene_holded',
      text : '¿Tienes ya una cuenta activa de Holded?',
      type : 'single',
      options: [
        { id: 'si',      label: 'Sí, ya tengo cuenta',           nextAction: 'continue_checkout' },
        { id: 'prueba',  label: 'Estoy en periodo de prueba',     nextAction: 'continue_checkout' },
        { id: 'no',      label: 'No tengo cuenta todavía',        nextAction: 'holded_trial' },
      ],
    },
    {
      id   : 'referencias_productos',
      text : '¿Cuántas referencias de producto tienes en tu catálogo?',
      type : 'single',
      options: [
        { id: 'menos_500',  label: 'Menos de 500',                nextAction: 'continue_checkout' },
        { id: '500_2000',   label: 'Entre 500 y 2.000',           nextAction: 'continue_checkout' },
        { id: 'mas_2000',   label: 'Más de 2.000',                nextAction: 'book_call' },
      ],
    },
    {
      id   : 'datos_inventario',
      text : '¿Tienes el inventario exportado con stock, precio y referencia?',
      type : 'single',
      options: [
        { id: 'si',       label: 'Sí, tengo el fichero listo',    nextAction: 'continue_checkout' },
        { id: 'parcial',  label: 'Tengo parte de los datos',      nextAction: 'upload_excel' },
        { id: 'no',       label: 'Necesito ayuda para exportarlo', nextAction: 'upload_excel' },
      ],
    },
    {
      id   : 'variantes',
      text : '¿Tus productos tienen variantes (talla, color, etc.)?',
      type : 'single',
      options: [
        { id: 'no',       label: 'No, son productos simples',     nextAction: 'continue_checkout' },
        { id: 'pocas',    label: 'Sí, pocas variantes',           nextAction: 'continue_checkout' },
        { id: 'muchas',   label: 'Sí, muchas variantes complejas', nextAction: 'book_call' },
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

const PLAN_AVANZADO: ReadinessCheck = {
  slug       : 'plan-avanzado',
  title      : 'Plan Avanzado — Verifica que es tu plan',
  description: 'Unas preguntas para confirmar que el Plan Avanzado se adapta a tus necesidades.',
  ctaLabel   : 'Configurar mi plan',
  questions  : [
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
        { id: 'fiscal',        label: 'Gestión fiscal y declaraciones',          nextAction: 'continue_checkout' },
        { id: 'laboral',       label: 'Nóminas y gestión laboral',               nextAction: 'continue_checkout' },
        { id: 'contabilidad',  label: 'Contabilidad y cuentas anuales',          nextAction: 'continue_checkout' },
        { id: 'todo',          label: 'Todo lo anterior más asesoría estratégica', nextAction: 'book_call' },
      ],
    },
  ],
};

const PLAN_COLABORATIVO: ReadinessCheck = {
  slug       : 'plan-colaborativo',
  title      : 'Plan Colaborativo — Verifica que es tu plan',
  description: 'El Plan Colaborativo está pensado para equipos y empresas en crecimiento. Veamos si encaja.',
  ctaLabel   : 'Configurar mi plan',
  questions  : [
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
        { id: 'si_nuevo',   label: 'Queremos empezar con Holded',   nextAction: 'continue_checkout' },
        { id: 'no',         label: 'No, usamos otro sistema',        nextAction: 'continue_checkout' },
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
