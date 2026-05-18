export interface CatalogService {
  id: string;
  title: string;        // max 24 chars (WhatsApp list row limit)
  description: string;  // max 72 chars
  imageUrl?: string;    // public HTTPS URL for web + future WhatsApp per-service cards
}

export interface CatalogSection {
  id: string;
  title: string;        // max 24 chars
  emoji: string;
  cardBody: string;     // description shown in card-mode button message
  imageUrl?: string;    // public HTTPS URL — set once images are uploaded to /public/catalog/
  services: CatalogService[];
}

export const SERVICES_CATALOG: CatalogSection[] = [
  {
    id: 'fiscal',
    title: 'Asesoría fiscal',
    emoji: '🧾',
    cardBody: '📋 Gestionamos tu fiscalidad personal: Renta, Modelo 151, No Residentes y más. ¿Qué necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/fiscal.png',
    services: [
      { id: 'irpf',           title: 'Declaración Renta',    description: 'IRPF anual · revisión y presentación online',         imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/irpf.png' },
      { id: 'modelo151',      title: 'Modelo 151',           description: 'Desplazados · Ley Beckham · fiscalidad internacional', imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/modelo151.png' },
      { id: 'no-residentes',  title: 'No Residentes',        description: 'IRNR · impuestos y rentas para no residentes',         imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/no-residentes.png' },
      { id: 'regularizacion', title: 'Regularización Fiscal',description: 'Requerimientos · revisión y respuesta a Hacienda',     imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/regularizacion.png' },
    ],
  },
  {
    id: 'extranjeria',
    title: 'Extranjería',
    emoji: '🌍',
    cardBody: '🌍 Tramitamos tu situación en España: NIE, residencia, arraigo y más. ¿Cuál necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/extranjeria.png',
    services: [
      { id: 'residencia',            title: 'Residencia y Renovación',  description: 'Permisos de residencia · renovación y seguimiento',      imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/residencia.png' },
      { id: 'nacionalidad',          title: 'Nacionalidad Española',    description: 'Expediente completo · revisión y seguimiento profesional', imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/nacionalidad-espanola.png' },
      { id: 'nacionalidad-menores',  title: 'Nacionalidad Menores',     description: 'Menores nacidos en España · gestión documental',          imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/nacionalidad-menores.png' },
      { id: 'nie',                   title: 'NIE / TIE',                description: 'Solicitud y renovación · con cita previa' },
      { id: 'arraigo',               title: 'Arraigo social/lab.',      description: 'Regularización · preparamos la documentación' },
    ],
  },
  {
    id: 'empresa',
    title: 'Empresa y Laboral',
    emoji: '💼',
    cardBody: '💼 Te ayudamos a crear o gestionar tu empresa o actividad. ¿Qué buscas?',
    imageUrl: 'https://expertconsulting.es/catalog/empresa.png',
    services: [
      { id: 'autonomo', title: 'Alta de Autónomo',  description: 'Hacienda · Seguridad Social · inicio de actividad', imageUrl: 'https://expertconsulting.es/catalog/servicios/empresas/autonomo.png' },
      { id: 'sl',       title: 'Constitución SL',   description: 'Sociedad · estatutos · puesta en marcha online',   imageUrl: 'https://expertconsulting.es/catalog/servicios/empresas/sl.png' },
      { id: 'nominas',  title: 'Nóminas y contratos',description: 'Gestión mensual · altas/bajas Seg. Social' },
    ],
  },
  {
    id: 'holded',
    title: 'Holded ERP',
    emoji: '🚀',
    cardBody: '🚀 Somos Partner Oficial Holded. Implantamos, formamos y damos soporte. ¿Por dónde empezamos?',
    imageUrl: 'https://expertconsulting.es/catalog/holded.png',
    services: [
      { id: 'holded-migracion', title: 'Migración a Holded',    description: 'Datos · configuración · traspaso profesional guiado', imageUrl: 'https://expertconsulting.es/catalog/servicios/digital/migracion.png' },
      { id: 'holded-config',    title: 'Configuración Holded',  description: 'Cuenta · facturación · ajustes y parametrización',    imageUrl: 'https://expertconsulting.es/catalog/servicios/digital/configuracion.png' },
      { id: 'holded-form',      title: 'Formación Holded',      description: 'Sesiones guiadas · procesos · control y soporte',     imageUrl: 'https://expertconsulting.es/catalog/servicios/digital/formacion.png' },
      { id: 'holded-digital',   title: 'Digitalización',        description: 'Automatización · procesos online · escalabilidad',    imageUrl: 'https://expertconsulting.es/catalog/servicios/digital/digitalizacion.png' },
      { id: 'holded-sop',       title: 'Soporte Holded',        description: 'Asistencia continua y optimización' },
    ],
  },
];

export const CATALOG_BODY_DEFAULT =
  'Hola 👋 Aquí tienes un resumen de los servicios de EXPERT Asesoría. Pulsa el botón para explorarlos y cuéntanos cuál te interesa.';

export const CATALOG_FOOTER =
  'Reserva llamada gratuita en expertconsulting.es/cita';
