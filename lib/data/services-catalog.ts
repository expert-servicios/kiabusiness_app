export interface CatalogService {
  id: string;
  title: string;        // max 24 chars (WhatsApp list row limit)
  description: string;  // max 72 chars
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
    cardBody: '📋 Gestionamos tu fiscalidad: IRPF, IVA, Sociedades y más. ¿Qué necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/fiscal.png',
    services: [
      { id: 'irpf',       title: 'Declaración IRPF',    description: 'Renta anual · personas físicas residentes' },
      { id: 'iva',        title: 'IVA trimestral',       description: 'Mod. 303/390 · autónomos y empresas' },
      { id: 'sociedades', title: 'Impuesto Sociedades',  description: 'Mod. 200 · cuentas anuales incluidas' },
    ],
  },
  {
    id: 'extranjeria',
    title: 'Extranjería',
    emoji: '🌍',
    cardBody: '🌍 Tramitamos tu situación en España: NIE, residencia, arraigo y más. ¿Cuál necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/extranjeria.png',
    services: [
      { id: 'nie',        title: 'NIE / TIE',            description: 'Solicitud y renovación · con cita previa' },
      { id: 'residencia', title: 'Permiso residencia',   description: 'Inicial, renovación y modificación' },
      { id: 'arraigo',    title: 'Arraigo social/lab.',  description: 'Regularización · preparamos la documentación' },
    ],
  },
  {
    id: 'empresa',
    title: 'Empresa y Laboral',
    emoji: '💼',
    cardBody: '💼 Te ayudamos a crear o gestionar tu empresa o actividad. ¿Qué buscas?',
    imageUrl: 'https://expertconsulting.es/catalog/empresa.png',
    services: [
      { id: 'sl',         title: 'Constitución SL',      description: 'Alta sociedad limitada, notaría y registro' },
      { id: 'autonomo',   title: 'Alta autónomo',        description: 'RETA, IAE e inicio de actividad' },
      { id: 'nominas',    title: 'Nóminas y contratos',  description: 'Gestión mensual · altas/bajas Seg. Social' },
    ],
  },
  {
    id: 'holded',
    title: 'Holded ERP',
    emoji: '🚀',
    cardBody: '🚀 Somos Partner Oficial Holded. Implantamos, formamos y damos soporte. ¿Por dónde empezamos?',
    imageUrl: 'https://expertconsulting.es/catalog/holded.png',
    services: [
      { id: 'holded-impl', title: 'Impl. Holded ERP',   description: 'Config. + integración · demo gratuita' },
      { id: 'holded-form', title: 'Formación Holded',   description: 'Sesiones personalizadas online u on-site' },
      { id: 'holded-sop',  title: 'Soporte Holded',     description: 'Asistencia continua y optimización' },
    ],
  },
];

export const CATALOG_BODY_DEFAULT =
  'Hola 👋 Aquí tienes un resumen de los servicios de EXPERT Asesoría. Pulsa el botón para explorarlos y cuéntanos cuál te interesa.';

export const CATALOG_FOOTER =
  'Reserva llamada gratuita en expertconsulting.es/cita';
