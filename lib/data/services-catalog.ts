export interface CatalogService {
  id: string;
  title: string;        // max 24 chars (WhatsApp list row limit)
  description: string;  // max 72 chars
}

export interface CatalogSection {
  id: string;
  title: string;        // max 24 chars
  services: CatalogService[];
}

export const SERVICES_CATALOG: CatalogSection[] = [
  {
    id: 'fiscal',
    title: 'Asesoría fiscal',
    services: [
      { id: 'irpf',       title: 'Declaración IRPF',    description: 'Renta anual · personas físicas residentes' },
      { id: 'iva',        title: 'IVA trimestral',       description: 'Mod. 303/390 · autónomos y empresas' },
      { id: 'sociedades', title: 'Impuesto Sociedades',  description: 'Mod. 200 · cuentas anuales incluidas' },
    ],
  },
  {
    id: 'extranjeria',
    title: 'Extranjería',
    services: [
      { id: 'nie',        title: 'NIE / TIE',            description: 'Solicitud y renovación · con cita previa' },
      { id: 'residencia', title: 'Permiso residencia',   description: 'Inicial, renovación y modificación' },
      { id: 'arraigo',    title: 'Arraigo social/lab.',  description: 'Regularización · preparamos la documentación' },
    ],
  },
  {
    id: 'empresa',
    title: 'Empresa y Laboral',
    services: [
      { id: 'sl',         title: 'Constitución SL',      description: 'Alta sociedad limitada, notaría y registro' },
      { id: 'autonomo',   title: 'Alta autónomo',        description: 'RETA, IAE e inicio de actividad' },
      { id: 'nominas',    title: 'Nóminas y contratos',  description: 'Gestión mensual · altas/bajas Seg. Social' },
    ],
  },
  {
    id: 'holded',
    title: 'Holded ERP',
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
