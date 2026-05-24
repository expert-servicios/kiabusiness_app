// Kia knowledge base: Pack Starter / Onboarding a Holded
// Used by Kia to answer questions, set expectations and route correctly.

export const holdedPackStarterKnowledge = {
  slug       : 'holded-pack-starter',
  serviceName: 'Pack Starter / Onboarding a Holded',
  category   : 'holded',
  flowType   : 'readiness' as const,

  priceId : 'price_1SxNObLeYwwgvux4fLN9k8YG',
  price   : '499 € + IVA',

  publicPath : '/holded/pack-starter',
  landingUrl : 'https://expertconsulting.es/holded/pack-starter',

  // ── Checkout requirements ────────────────────────────────────────────────
  requiresProfileCompleted             : true,
  requiresBillingReady                 : true,
  requiresHoldedConnectionBeforeCheckout: false,
  allowsCheckoutWithoutHoldedAccount   : true,

  // ── CTAs ────────────────────────────────────────────────────────────────
  ctaPrimary  : 'Preparar contratación',
  ctaSecondary: 'Solicitar prueba Holded 14 días',
  ctaDoubt    : 'Llamada 15 min',

  // ── What it is ──────────────────────────────────────────────────────────
  shortDescription:
    'Servicio de configuración inicial de Holded: empresa, datos fiscales, facturación, bancos y estructura básica. Pago único, sin gestión mensual.',

  longDescription:
    'Pack Starter deja la cuenta de Holded lista para operar desde el primer día. Configuramos los datos fiscales de la empresa o autónomo, la facturación, las series de facturación, los impuestos básicos, la orientación bancaria y los permisos de acceso. Ideal para quien empieza con Holded desde cero o tiene una cuenta existente pero mal configurada. Incluye soporte por email durante 30 días.',

  // ── For whom ────────────────────────────────────────────────────────────
  forWhom: [
    'Autónomos que empiezan con Holded por primera vez.',
    'Sociedades pequeñas que quieren configurar bien la cuenta.',
    'Usuarios con cuenta Holded creada pero sin configurar correctamente.',
    'Clientes que quieren preparar la cuenta antes de contratar gestión mensual.',
    'Empresas que quieren ordenar facturación, bancos y datos fiscales.',
  ],

  // ── Includes ────────────────────────────────────────────────────────────
  includes: [
    'Revisión inicial de la situación del cliente.',
    'Configuración de datos fiscales de la empresa / autónomo.',
    'Configuración básica de facturación.',
    'Series de facturación si procede.',
    'Revisión de impuestos básicos.',
    'Configuración inicial de clientes / proveedores si procede.',
    'Orientación sobre conexión bancaria.',
    'Revisión de permisos y accesos.',
    'Guía básica de uso inicial.',
    'Soporte por email durante 30 días.',
  ],

  // ── Does NOT include ────────────────────────────────────────────────────
  notIncludes: [
    'Migración completa de facturas históricas → ver Migración sin inventario.',
    'Migración masiva de clientes y proveedores → ver Migración sin inventario.',
    'Inventario, almacenes o productos con stock → ver Migración con inventario.',
    'Integraciones API externas → ver Módulo Integraciones.',
    'Contabilidad atrasada.',
    'Presentación de impuestos.',
    'Gestión mensual recurrente → ver Planes mensuales EXPERT.',
  ],

  // ── Minimum data needed (not heavy docs) ─────────────────────────────────
  requiredData: [
    'Nombre y apellidos o razón social',
    'NIF / NIE / CIF',
    'Email de acceso al portal EXPERT',
    'Teléfono / WhatsApp',
    'Tipo de cliente: autónomo, SL u otra entidad',
    'Dirección fiscal / facturación',
    'Actividad económica',
    'Si ya tiene cuenta Holded: sí / no / no lo sé',
    'Si quiere crear cuenta nueva o configurar existente',
    'Si quiere conectar banco: sí / más adelante / no lo sé',
    'Si emite facturas con IVA',
    'Fecha aproximada de inicio de uso',
  ],

  optionalDocs: [
    'Alta censal 036 / 037 si la tiene (opcional).',
    'Escritura de constitución si es sociedad y ya la tiene (opcional).',
    'Logo de empresa si quiere incluirlo en facturas (opcional).',
    'Ejemplo de factura anterior si ya facturaba (opcional).',
    'Listado simple de clientes / proveedores si quiere cargar algunos datos (opcional).',
  ],

  // ── FAQ for Kia ─────────────────────────────────────────────────────────
  faq: [
    {
      q: '¿Qué es Pack Starter?',
      a: 'Es un servicio de configuración inicial para dejar Holded preparado para empezar a trabajar: empresa, datos fiscales, facturación, bancos y estructura básica.',
    },
    {
      q: '¿Necesito tener Holded antes?',
      a: 'No necesariamente. Si no tienes cuenta, gestionamos la prueba gratuita de 14 días por ti y después configuramos todo. Puedes contratar Pack Starter aunque no tengas Holded todavía.',
    },
    {
      q: '¿Puedo contratarlo si ya tengo Holded?',
      a: 'Sí. En ese caso se revisa y ajusta la configuración existente.',
    },
    {
      q: '¿Incluye migración completa?',
      a: 'No. La migración completa de facturas históricas es otro servicio: Migración sin inventario o con inventario, según el caso.',
    },
    {
      q: '¿Incluye inventario?',
      a: 'No. Si tienes productos, stock o almacenes, el servicio adecuado es Migración con inventario o un presupuesto específico.',
    },
    {
      q: '¿Es un plan mensual?',
      a: 'No. Pack Starter es pago único. La gestión mensual recurrente va por los planes EXPERT.',
    },
    {
      q: '¿Tengo que dar la API key de Holded?',
      a: 'No por WhatsApp. Cualquier acceso técnico se gestiona desde el portal seguro o mediante instrucciones de acceso directas. Nunca te pediremos la API key por este canal.',
    },
    {
      q: '¿Puedo contratar gestión mensual después?',
      a: 'Sí. Pack Starter puede dejar la cuenta preparada antes de contratar gestión mensual. Para los planes mensuales sí será necesario tener Holded conectado.',
    },
    {
      q: '¿Cuánto tarda?',
      a: 'Entre 1 y 2 semanas desde que confirmamos los datos.',
    },
  ],

  // ── Kia routing rules ────────────────────────────────────────────────────
  kiaRules: [
    'Usar siempre readiness, nunca viabilidad.',
    'No bloquear checkout por falta de cuenta Holded — Pack Starter permite contratar sin ella.',
    'Si el cliente no tiene Holded, ofrecer CTA prueba gratuita 14 días Y permitir continuar Pack Starter.',
    'No pedir API key por WhatsApp ni ningún canal de mensajería.',
    'Si el cliente quiere migrar facturas históricas, derivar a Migración sin inventario.',
    'Si el cliente tiene inventario o almacenes, derivar a Migración con inventario.',
    'Si el cliente quiere plan mensual, explicar que plan mensual requiere Holded conectado (Pack Starter puede ser el paso previo).',
    'Si el cliente pide precio, enviar landing: expertconsulting.es/holded/pack-starter.',
    'Si hay dudas de alcance o el cliente no sabe lo que necesita, ofrecer llamada de 15 min.',
    'No pedir documentos pesados al inicio — primero confirmar datos básicos.',
  ],

  // ── Related service slugs ────────────────────────────────────────────────
  relatedServices: [
    'holded-migracion-sin-inventario',
    'holded-migracion-con-inventario',
    'holded-modulo-formacion',
    'plan-avanzado',
  ],

  // ── Blog articles ────────────────────────────────────────────────────────
  relatedArticleSlugs: [
    'como-empezar-con-holded',
    'holded-autonomos-pequenas-empresas',
    'pack-starter-holded-vs-migracion',
  ],

  // ── Official sources (for Kia, not for display in landing) ──────────────
  officialSources: [
    { label: 'Holded Academy (ayuda oficial)',       url: 'https://help.holded.com/es/' },
    { label: 'Holded para desarrolladores',          url: 'https://www.holded.com/es/desarrolladores' },
    { label: 'Autenticación API Holded',             url: 'https://www.holded.com/es/desarrolladores/autenticacion' },
    { label: 'Prueba gratuita Holded 14 días',       url: 'https://www.holded.com/es/precios' },
    { label: 'EXPERT — Holded Solution Partner',     url: 'https://expertconsulting.es/holded' },
  ],
} as const;

export type HoldedPackStarterKnowledge = typeof holdedPackStarterKnowledge;
