// Kia knowledge base: Migración a Holded sin Inventario
// Used by Kia to answer questions, set expectations and route correctly.

export const holdedMigracionSinInventarioKnowledge = {
  slug       : 'holded-migracion-sin-inventario',
  serviceName: 'Migración a Holded sin Inventario',
  category   : 'holded',
  flowType   : 'readiness' as const,

  priceId : 'price_holded_migracion_sin_inventario',
  price   : '899 € + IVA',

  publicPath : '/holded/migracion-sin-inventario',
  landingUrl : 'https://expertconsulting.es/holded/migracion-sin-inventario',

  // ── Checkout requirements ────────────────────────────────────────────────
  requiresProfileCompleted              : true,
  requiresBillingReady                  : true,
  requiresHoldedConnectionBeforeCheckout: false,
  allowsCheckoutWithoutHoldedAccount    : false,

  // ── CTAs ────────────────────────────────────────────────────────────────
  ctaPrimary  : 'Preparar contratación',
  ctaSecondary: 'Solicitar prueba Holded 14 días',
  ctaDoubt    : 'Llamada 15 min',

  // ── What it is ──────────────────────────────────────────────────────────
  shortDescription:
    'Importación completa del historial de facturas, clientes y proveedores a Holded. Sin inventario. Pago único.',

  longDescription:
    'Migración sin inventario mueve el historial completo de tu contabilidad y facturación a Holded: facturas emitidas, facturas recibidas, maestro de clientes y proveedores, períodos históricos. Ideal para quienes venían usando ContaPlus, A3, Sage, Excel u otro sistema y quieren dejar todo registrado en Holded sin perder datos históricos. No incluye stock, productos ni almacenes.',

  // ── For whom ────────────────────────────────────────────────────────────
  forWhom: [
    'Autónomos y pymes con historial en ContaPlus, A3, Sage, Factura Directa, Excel u otro.',
    'Empresas que quieren llevar toda la contabilidad histórica a Holded.',
    'Clientes que quieren cerrar un sistema antiguo y centralizar en Holded.',
    'Usuarios que necesitan mantener la trazabilidad de facturas pasadas.',
    'Empresas sin inventario que simplemente quieren importar documentos y maestros.',
  ],

  // ── Includes ────────────────────────────────────────────────────────────
  includes: [
    'Análisis del sistema origen y los datos disponibles.',
    'Importación de facturas emitidas (1 a 3 años según contrato).',
    'Importación de facturas recibidas si están disponibles en CSV/Excel.',
    'Importación del maestro de clientes.',
    'Importación del maestro de proveedores.',
    'Validación de los datos importados en Holded.',
    'Configuración básica de la empresa en Holded si no está hecha.',
    'Soporte por email durante 30 días.',
  ],

  // ── Does NOT include ────────────────────────────────────────────────────
  notIncludes: [
    'Inventario, almacenes, referencias de producto ni stock → ver Migración con inventario.',
    'Configuración inicial de Holded desde cero → ver Pack Starter (si la cuenta no está configurada).',
    'Contabilidad analítica avanzada.',
    'Integración con ERPs externos ni APIs.',
    'Gestión mensual recurrente → ver Planes mensuales EXPERT.',
    'Presentación de impuestos ni modelos fiscales.',
    'Formación en Holded → ver Formación Holded.',
  ],

  // ── Minimum data needed ─────────────────────────────────────────────────
  requiredData: [
    'Nombre y apellidos o razón social',
    'NIF / NIE / CIF',
    'Email de acceso al portal EXPERT',
    'Teléfono / WhatsApp',
    'Tipo de cliente: autónomo, SL u otra entidad',
    'Si ya tiene cuenta activa en Holded',
    'Sistema de origen (ContaPlus, A3, Sage, Excel, otro)',
    'Años de historial a migrar',
    'Volumen estimado de registros (facturas emitidas + recibidas)',
    'Si los datos están exportables en CSV/Excel',
    'Si tiene proveedores a importar además de clientes',
    'Si tiene algún tipo de inventario o stock',
  ],

  requiredDocs: [
    'Exportación CSV/Excel de facturas emitidas por período',
    'Exportación CSV/Excel de facturas recibidas (opcional, si disponible)',
    'Exportación de maestro de clientes y proveedores',
    'Modelo 036/037 o alta fiscal (para datos de la empresa)',
  ],

  // ── FAQ for Kia ─────────────────────────────────────────────────────────
  faq: [
    {
      q: '¿Qué es la Migración sin inventario?',
      a: 'Es el servicio que importa tu historial completo de facturas, clientes y proveedores a Holded. No incluye inventario ni stock.',
    },
    {
      q: '¿Necesito tener Holded ya?',
      a: 'Sí. La migración necesita una cuenta de Holded activa. Si no tienes, te ayudamos primero con la prueba gratuita de 14 días y la configuración básica (Pack Starter puede ser el primer paso).',
    },
    {
      q: '¿Qué pasa si tengo inventario?',
      a: 'Si tienes productos, referencias o stock, el servicio correcto es Migración con inventario (1.199 € + IVA).',
    },
    {
      q: '¿Cuántos años de historial se pueden migrar?',
      a: 'El precio base cubre hasta 3 años. Si tienes más de 3 años o más de 10.000 registros, consultamos el alcance en una llamada antes de confirmar.',
    },
    {
      q: '¿Desde qué sistemas se puede migrar?',
      a: 'Desde cualquier sistema que permita exportar datos en CSV o Excel: ContaPlus, A3, Sage, Factura Directa, Excel propio, etc. Si tu sistema no exporta, valoramos la alternativa.',
    },
    {
      q: '¿Incluye la configuración de Holded?',
      a: 'Incluye la configuración básica necesaria para que la importación sea correcta. Si la cuenta ya está bien configurada, se omite. Si necesitas una configuración completa desde cero, el punto de partida puede ser Pack Starter.',
    },
    {
      q: '¿Cuánto tarda?',
      a: 'Entre 2 y 4 semanas desde que recibimos los datos completos, según el volumen.',
    },
    {
      q: '¿Tengo que dar la API key de Holded?',
      a: 'No por WhatsApp. Cualquier acceso técnico se gestiona desde el portal seguro. Nunca te pediremos la API key por mensajería.',
    },
  ],

  // ── Kia routing rules ────────────────────────────────────────────────────
  kiaRules: [
    'Usar siempre readiness, nunca viabilidad.',
    'Si el cliente no tiene Holded, no bloquear pero indicar que la migración requiere cuenta activa — ofrecer prueba 14 días.',
    'Si el cliente tiene inventario, stock o almacenes, derivar a Migración con inventario.',
    'Si el cliente solo quiere configuración inicial sin historial, derivar a Pack Starter.',
    'No pedir API key por WhatsApp ni ningún canal de mensajería.',
    'Si el volumen supera 10.000 registros o más de 3 años, recomendar llamada antes de confirmar precio.',
    'Si el sistema origen no exporta datos, informar que se valora la alternativa en llamada.',
    'Si el cliente quiere plan mensual, explicar que primero hay que tener Holded configurado y con datos correctos.',
    'Si hay dudas de alcance, ofrecer llamada de 15 min.',
    'No pedir documentos pesados al inicio — primero confirmar datos básicos y exportabilidad.',
  ],

  // ── Related service slugs ────────────────────────────────────────────────
  relatedServices: [
    'holded-pack-starter',
    'holded-migracion-con-inventario',
    'holded-modulo-formacion',
    'plan-avanzado',
  ],

  // ── Blog articles ────────────────────────────────────────────────────────
  relatedArticleSlugs: [
    'migrar-contaplus-a-holded',
    'holded-migracion-sin-inventario-guia',
    'pack-starter-holded-vs-migracion',
  ],

  // ── Official sources (for Kia, not for display in landing) ──────────────
  officialSources: [
    { label: 'Holded Academy (ayuda oficial)',   url: 'https://help.holded.com/es/' },
    { label: 'Importar datos en Holded',         url: 'https://help.holded.com/es/articles/3244155' },
    { label: 'Prueba gratuita Holded 14 días',   url: 'https://www.holded.com/es/precios' },
    { label: 'EXPERT — Holded Solution Partner', url: 'https://expertconsulting.es/holded' },
  ],
} as const;

export type HoldedMigracionSinInventarioKnowledge = typeof holdedMigracionSinInventarioKnowledge;
