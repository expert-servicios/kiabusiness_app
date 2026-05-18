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
  cardBody: string;     // body shown in WhatsApp cards mode
  imageUrl?: string;    // section-level image for WhatsApp cards
  services: CatalogService[];
}

// IDs match categoria slugs from lib/utils/catalog.ts
export const SERVICES_CATALOG: CatalogSection[] = [
  {
    id: 'declaraciones-impuestos',
    title: 'Declaraciones e Impues.',
    emoji: '🧾',
    cardBody: '📋 Gestionamos tu fiscalidad personal: Renta, Modelo 151, No Residentes y más. ¿Qué necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/fiscal.png',
    services: [
      { id: 'irpf',                 title: 'Declaración Renta',     description: 'IRPF anual · revisión y presentación online',         imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/irpf.png' },
      { id: 'modelo-151',           title: 'Modelo 151 / Beckham',  description: 'Expatriados desplazados a España · tipo fijo 24%',    imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/modelo151.png' },
      { id: 'no-residentes',        title: 'No Residentes',         description: 'IRNR · bienes y rentas en España · mod. 210/213',     imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/no-residentes.png' },
      { id: 'regularizacion',       title: 'Regularización Fiscal', description: 'Requerimientos · revisión y respuesta a Hacienda',    imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/regularizacion.png' },
      { id: 'iva-trimestral',       title: 'IVA Trimestral',        description: 'Mod. 303/390 · autónomos y empresas' },
      { id: 'impuesto-sociedades',  title: 'Impuesto Sociedades',   description: 'Mod. 200 · cierre contable del ejercicio' },
      { id: 'modelos-informativos', title: 'Modelos Informativos',  description: '347, 349, 180, 190 · presentación anual' },
      { id: 'modelo-720',           title: 'Modelo 720',            description: 'Bienes en el extranjero · residentes en España' },
    ],
  },
  {
    id: 'extranjeria-nacionalidad',
    title: 'Extranjería',
    emoji: '🌍',
    cardBody: '🌍 Tramitamos tu situación en España: residencia, nacionalidad, arraigo y más. ¿Cuál necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/extranjeria.png',
    services: [
      { id: 'permiso-residencia-inicial',             title: 'Permiso Inicial',        description: 'Primer permiso de residencia · 490 € + IVA' },
      { id: 'renovacion-residencia',                  title: 'Renovación Residencia',  description: 'Temporal y larga duración · sin irregularidad',    imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/residencia.png' },
      { id: 'arraigo-social',                         title: 'Arraigo Social',         description: 'Residencia · 3 años en España · oferta empleo' },
      { id: 'arraigo-familiar',                       title: 'Arraigo Familiar',       description: 'Residencia · vínculos familiares con españoles' },
      { id: 'nacionalidad-espanola',                  title: 'Nacionalidad Española',  description: 'Por residencia · expediente completo',               imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/nacionalidad-espanola.png' },
      { id: 'nacionalidad-espanola-menor',            title: 'Nacionalidad Menores',   description: 'Nacidos en España · 1 año residencia · 302,50 €',   imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/nacionalidad-menores.png' },
      { id: 'reagrupacion-familiar',                  title: 'Reagrupación Familiar',  description: 'Cónyuge e hijos · residentes legales en España' },
      { id: 'nie-pasaporte',                          title: 'NIE / TIE',              description: 'Obtención y renovación · con cita previa' },
    ],
  },
  {
    id: 'empresas-autonomos',
    title: 'Empresas y Autónomos',
    emoji: '💼',
    cardBody: '💼 Te ayudamos a crear o gestionar tu empresa o actividad. ¿Qué buscas?',
    imageUrl: 'https://expertconsulting.es/catalog/empresa.png',
    services: [
      { id: 'alta-autonomo',          title: 'Alta de Autónomo',      description: 'RETA · Hacienda · inicio de actividad',          imageUrl: 'https://expertconsulting.es/catalog/servicios/empresas/autonomo.png' },
      { id: 'constitucion-sl',        title: 'Constitución SL',       description: 'Sociedad · estatutos · registro mercantil',      imageUrl: 'https://expertconsulting.es/catalog/servicios/empresas/sl.png' },
      { id: 'contabilidad-mensual',   title: 'Contabilidad Mensual',  description: 'Facturas · conciliación · informes mensuales',   imageUrl: 'https://expertconsulting.es/catalog/servicios/empresas/contabilidad.png' },
      { id: 'impuestos-trimestrales', title: 'Impuestos Trimest.',    description: 'IVA · IRPF · mod. 303/111/115/130',              imageUrl: 'https://expertconsulting.es/catalog/servicios/empresas/gestion-fiscal.png' },
      { id: 'baja-cese-actividad',    title: 'Baja de Actividad',     description: 'Autónomo o disolución de sociedad' },
    ],
  },
  {
    id: 'trafico-capitania-maritima',
    title: 'Tráfico y Capitanía',
    emoji: '🚗',
    cardBody: '🚗 Transferencias, matrículas, duplicados y embarcaciones. ¿Qué trámite necesitas?',
    services: [
      { id: 'transferencia-vehiculo',  title: 'Transferencia Vehículo', description: 'Cambio de titular · DGT · ITP incluido' },
      { id: 'matriculacion',           title: 'Matriculación',          description: 'Primera matrícula · vehículo nuevo o importado' },
      { id: 'duplicado-permiso',       title: 'Duplicados Tráfico',     description: 'Carnet · circulación · ficha técnica' },
      { id: 'tramites-embarcaciones',  title: 'Embarcaciones',          description: 'Matrícula · transferencia · Capitanía Marítima' },
    ],
  },
  {
    id: 'notaria-propiedades',
    title: 'Notaría y Propiedades',
    emoji: '🏠',
    cardBody: '🏠 Compraventas, herencias, donaciones e hipotecas. ¿En qué podemos ayudarte?',
    services: [
      { id: 'compraventa-inmueble', title: 'Compraventa Inmueble', description: 'Fiscal y documental · ITP o IVA+AJD' },
      { id: 'herencia',             title: 'Herencia y Sucesión',  description: 'Declaración · liquidación · adjudicación' },
      { id: 'donacion',             title: 'Donación de Bienes',   description: 'Inmuebles · dinero · fiscalidad optimizada' },
      { id: 'hipoteca-cancelacion', title: 'Cancelación Hipoteca', description: 'Cancelación registral · deuda cero · desde 150 €' },
    ],
  },
  {
    id: 'gestiones-especializadas',
    title: 'Certif. Digital',
    emoji: '🔐',
    cardBody: '🔐 Somos Punto de Registro Autorizado Camerfirma. ¿Para persona física o entidad?',
    imageUrl: 'https://expertconsulting.es/catalog/certificados.png',
    services: [
      { id: 'certificado-digital-persona-fisica', title: 'Certif. Persona Física', description: '90 € · inmediato · presencial o videoconferencia' },
      { id: 'certificado-digital-entidad',        title: 'Certif. de Entidad',     description: '150 € · empresa o asociación · 24–48 h' },
    ],
  },
  {
    id: 'formacion',
    title: 'Formación',
    emoji: '🎓',
    cardBody: '🎓 Formación práctica: fiscal, laboral, RRHH y Holded. Desde 180 €/bloque de 2 h. ¿Qué área te interesa?',
    services: [
      { id: 'formacion-fiscal-contable', title: 'Formación Fiscal',  description: 'IRPF · IVA · contabilidad · desde 180 €/2 h' },
      { id: 'formacion-laboral-rrhh',    title: 'Formación Laboral', description: 'RRHH · contratos · nóminas · desde 180 €/2 h' },
      { id: 'formacion-holded',          title: 'Formación Holded',  description: 'ERP · facturación · flujos · desde 180 €/2 h',  imageUrl: 'https://expertconsulting.es/catalog/servicios/digital/formacion.png' },
    ],
  },
];

export const CATALOG_BODY_DEFAULT =
  'Hola 👋 Aquí tienes nuestros servicios. Pulsa el botón para explorarlos y cuéntanos cuál te interesa.';

export const CATALOG_FOOTER = 'Reserva cita gratuita en expertconsulting.es/cita';
