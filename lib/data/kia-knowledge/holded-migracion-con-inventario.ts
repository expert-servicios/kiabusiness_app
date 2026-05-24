// Kia knowledge base: Migración a Holded con Inventario
// Used by Kia to answer questions, set expectations and route correctly.

export const holdedMigracionConInventarioKnowledge = {
  slug       : 'holded-migracion-con-inventario',
  serviceName: 'Migración a Holded con Inventario',
  category   : 'holded',
  flowType   : 'readiness' as const,

  priceId : 'price_holded_migracion_con_inventario',
  price   : '1.199 € + IVA',

  publicPath : '/holded/migracion-con-inventario',
  landingUrl : 'https://expertconsulting.es/holded/migracion-con-inventario',

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
    'Importación completa del inventario (productos, variantes, stock, almacenes) más historial de facturas, clientes y proveedores a Holded. Pago único.',

  longDescription:
    'Migración con inventario es el servicio completo para empresas con catálogo de productos: importamos el maestro de referencias, variantes (talla, color, modelo), stock inicial, almacenes y, opcionalmente, el historial de facturas, clientes y proveedores. Ideal para empresas que operan con tienda online, distribución o gestión de almacén y quieren centralizar todo en Holded.',

  // ── For whom ────────────────────────────────────────────────────────────
  forWhom: [
    'Pymes con catálogo de productos y gestión de stock.',
    'Empresas con tienda online (WooCommerce, Shopify, PrestaShop) que quieren centralizar en Holded.',
    'Distribuidores o almacenistas con referencias y variantes.',
    'Empresas que cambian de ERP (ContaPlus, A3, Sage, otro) y necesitan migrar inventario y facturación.',
    'Negocios con múltiples almacenes que quieren unificar la gestión.',
  ],

  // ── Includes ────────────────────────────────────────────────────────────
  includes: [
    'Análisis del sistema origen y los datos disponibles.',
    'Importación del maestro de productos y referencias.',
    'Importación de variantes (talla, color, modelo) si aplica.',
    'Importación de stock inicial por referencia y almacén.',
    'Configuración de almacenes si hay más de uno.',
    'Importación de facturas emitidas y recibidas si se incluye historial.',
    'Importación del maestro de clientes y proveedores.',
    'Validación de los datos importados en Holded.',
    'Configuración básica de la empresa en Holded si no está hecha.',
    'Soporte por email durante 30 días.',
  ],

  // ── Does NOT include ────────────────────────────────────────────────────
  notIncludes: [
    'Integración en tiempo real con tienda online (requiere módulo específico).',
    'Automatización de pedidos ni sincronización continua.',
    'Desarrollo de integraciones API personalizadas.',
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
    'Sistema de origen (ContaPlus, A3, Sage, Excel, otro ERP)',
    'Número aproximado de referencias / SKUs de producto',
    'Si los productos tienen variantes (talla, color, etc.) y cuántas por referencia',
    'Si tiene múltiples almacenes',
    'Si el inventario está actualizado y exportable en Excel/CSV',
    'Si necesita también importar historial de facturas',
  ],

  requiredDocs: [
    'Exportación CSV/Excel del maestro de productos con stock actual',
    'Exportación CSV/Excel de variantes si aplica',
    'Exportación de ubicaciones de almacén si aplica',
    'Exportación de facturas emitidas/recibidas si se migra historial',
    'Exportación de maestro de clientes y proveedores',
    'Modelo 036/037 o alta fiscal para datos de empresa',
  ],

  // ── FAQ for Kia ─────────────────────────────────────────────────────────
  faq: [
    {
      q: '¿Qué es la Migración con inventario?',
      a: 'Es el servicio completo que importa el catálogo de productos, variantes, stock y almacenes a Holded, además del historial de facturas, clientes y proveedores si se necesita.',
    },
    {
      q: '¿Necesito tener Holded ya?',
      a: 'Sí. La migración necesita una cuenta de Holded activa. Si no tienes, te ayudamos con la prueba gratuita de 14 días y la configuración inicial primero.',
    },
    {
      q: '¿Qué diferencia hay con Migración sin inventario?',
      a: 'Migración sin inventario solo mueve facturas, clientes y proveedores. Migración con inventario incluye además el catálogo completo: referencias, variantes, stock inicial y almacenes.',
    },
    {
      q: '¿Cuántas referencias se pueden migrar?',
      a: 'El precio base es adecuado para catálogos hasta 2.000 referencias. Si tienes más referencias, variantes complejas o múltiples almacenes, consultamos el alcance en una llamada antes de confirmar.',
    },
    {
      q: '¿Se puede sincronizar con la tienda online después?',
      a: 'La migración deja el inventario en Holded. La sincronización continua con tienda online (WooCommerce, Shopify, etc.) requiere un módulo adicional de integración.',
    },
    {
      q: '¿Cuánto tarda?',
      a: 'Entre 3 y 6 semanas desde que recibimos los datos completos, según el volumen y complejidad del catálogo.',
    },
    {
      q: '¿Tengo que dar la API key de Holded?',
      a: 'No por WhatsApp. Cualquier acceso técnico se gestiona desde el portal seguro. Nunca te pediremos la API key por mensajería.',
    },
    {
      q: '¿Incluye formación en Holded?',
      a: 'No directamente. Si necesitas formación para usar el módulo de inventario de Holded, existe el servicio de Formación Holded por separado.',
    },
  ],

  // ── Kia routing rules ────────────────────────────────────────────────────
  kiaRules: [
    'Usar siempre readiness, nunca viabilidad.',
    'Si el cliente no tiene Holded, no bloquear pero indicar que la migración requiere cuenta activa — ofrecer prueba 14 días.',
    'Si el cliente no tiene inventario (solo facturas), derivar a Migración sin inventario.',
    'Si el cliente solo quiere configuración inicial sin historial, derivar a Pack Starter.',
    'No pedir API key por WhatsApp ni ningún canal de mensajería.',
    'Si el catálogo supera 2.000 referencias, tiene variantes complejas o múltiples almacenes, recomendar llamada antes de confirmar precio.',
    'Si la tienda online necesita sincronización continua, aclarar que eso requiere módulo de integración adicional.',
    'Si hay dudas de alcance, ofrecer llamada de 15 min.',
    'No pedir documentos pesados al inicio — primero confirmar número de referencias y exportabilidad.',
  ],

  // ── Related service slugs ────────────────────────────────────────────────
  relatedServices: [
    'holded-pack-starter',
    'holded-migracion-sin-inventario',
    'holded-modulo-formacion',
    'plan-avanzado',
  ],

  // ── Blog articles ────────────────────────────────────────────────────────
  relatedArticleSlugs: [
    'holded-inventario-guia-completa',
    'migrar-inventario-a-holded',
    'pack-starter-holded-vs-migracion',
  ],

  // ── Official sources (for Kia, not for display in landing) ──────────────
  officialSources: [
    { label: 'Holded Academy (ayuda oficial)',       url: 'https://help.holded.com/es/' },
    { label: 'Módulo de inventario en Holded',       url: 'https://help.holded.com/es/articles/3244155' },
    { label: 'Prueba gratuita Holded 14 días',       url: 'https://www.holded.com/es/precios' },
    { label: 'EXPERT — Holded Solution Partner',     url: 'https://expertconsulting.es/holded' },
  ],
} as const;

export type HoldedMigracionConInventarioKnowledge = typeof holdedMigracionConInventarioKnowledge;
