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
    title: 'Fiscalidad',
    emoji: '📊',
    cardBody: 'Fiscalidad: Renta, Modelo 151, IRNR, Modelo 720 y patrimonio. ¿Qué necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/waba/fiscalidad.png',
    services: [
      { id: 'irpf', title: 'Renta IRPF', description: 'Declaración anual de renta personal', imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/irpf.png' },
      { id: 'modelo-151', title: 'Modelo 151 / Beckham', description: 'Régimen para desplazados a España', imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/modelo151.png' },
      { id: 'no-residentes', title: 'IRNR no residentes', description: 'Bienes y rentas en España', imageUrl: 'https://expertconsulting.es/catalog/servicios/fiscal/no-residentes.png' },
      { id: 'modelo-720', title: 'Modelo 720', description: 'Bienes en el extranjero' },
      { id: 'impuesto-patrimonio', title: 'Patrimonio', description: 'Revisión y declaración patrimonial' },
    ],
  },
  {
    id: 'extranjeria-nacionalidad',
    title: 'Extranjería y Nac.',
    emoji: '🌍',
    cardBody: 'Residencia, arraigo, reagrupación y nacionalidad española. ¿Cuál necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/waba/extranjeria-nacionalidad.png',
    services: [
      { id: 'arraigo-social', title: 'Arraigo Social', description: 'Residencia por arraigo social' },
      { id: 'arraigo-familiar', title: 'Arraigo Familiar', description: 'Residencia por vínculo familiar' },
      { id: 'renovacion-residencia', title: 'Renovación Resid.', description: 'Renovación de residencia', imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/residencia.png' },
      { id: 'nacionalidad-espanola', title: 'Nacionalidad Esp.', description: 'Expediente de nacionalidad', imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/nacionalidad-espanola.png' },
      { id: 'nacionalidad-espanola-menor-nacido-en-espana', title: 'Nacionalidad Menor', description: 'Menor nacido en España', imageUrl: 'https://expertconsulting.es/catalog/servicios/extranjeria/nacionalidad-menores.png' },
      { id: 'reagrupacion-familiar', title: 'Reagrupación', description: 'Reagrupación familiar' },
      { id: 'permiso-residencia-inicial', title: 'Permiso Inicial', description: 'Primer permiso de residencia' },
    ],
  },
  {
    id: 'empresas-autonomos',
    title: 'Empresas y Autón.',
    emoji: '🏢',
    cardBody: 'Altas, sociedades, planes mensuales con Holded y trámites mercantiles.',
    imageUrl: 'https://expertconsulting.es/catalog/waba/empresas-autonomos.png',
    services: [
      { id: 'alta-autonomo', title: 'Alta autónomo', description: 'Inicio de actividad' },
      { id: 'constitucion-sl', title: 'Constitución SL', description: 'Creación de sociedad limitada' },
      { id: 'plan-avanzado', title: 'Plan Avanzado', description: 'Gestión mensual con Holded' },
      { id: 'plan-colaborativo', title: 'Plan Colaborativo', description: 'Gestión mensual colaborativa' },
      { id: 'plan-personalizado', title: 'Plan Personalizado', description: 'Cobertura mensual a medida' },
      { id: 'configurar-holded', title: 'Configurar Holded', description: 'Onboarding antes de empezar' },
      { id: 'cuentas-anuales', title: 'Cuentas Anuales', description: 'Depósito mercantil anual' },
      { id: 'apoderamientos-mercantiles', title: 'Apoderamientos', description: 'Poderes y cambios societarios' },
    ],
  },
  {
    id: 'holded',
    title: 'Holded',
    emoji: '📈',
    cardBody: 'Implantación, migración y formación práctica en Holded.',
    imageUrl: 'https://expertconsulting.es/catalog/waba/holded.png',
    services: [
      { id: 'holded-starter', title: 'Pack Starter', description: 'Onboarding a Holded', imageUrl: 'https://expertconsulting.es/catalog/waba/holded-starter-onboarding.png' },
      { id: 'holded-migracion-sin-inventario', title: 'Migración sin inv.', description: 'Migración completa sin inventario', imageUrl: 'https://expertconsulting.es/catalog/waba/holded-migracion-sin-inventario.png' },
      { id: 'holded-migracion-con-inventario', title: 'Migración con inv.', description: 'Migración completa con inventario', imageUrl: 'https://expertconsulting.es/catalog/waba/holded-migracion-con-inventario.png' },
      { id: 'formacion-holded', title: 'Formación Holded', description: 'Formación en Holded por horas', imageUrl: 'https://expertconsulting.es/catalog/waba/holded-formacion-por-horas.png' },
    ],
  },
  {
    id: 'certificado-digital',
    title: 'Certif. Digital',
    emoji: '🔐',
    cardBody: 'Certificados digitales para persona física, entidad mercantil o entidad sin ánimo de lucro.',
    imageUrl: 'https://expertconsulting.es/catalog/waba/certificado-digital.png',
    services: [
      { id: 'certificado-digital-persona-fisica', title: 'Persona física', description: 'Certificado digital para particulares' },
      { id: 'certificado-digital-entidad', title: 'Entidad mercantil', description: 'Certificado digital de empresa' },
      { id: 'certificado-digital-sin-animo-lucro', title: 'Sin ánimo lucro', description: 'Asociaciones y fundaciones' },
    ],
  },
  {
    id: 'trafico-capitania-maritima',
    title: 'Tráfico y Capitanía',
    emoji: '🚗',
    cardBody: '🚗 Transferencias, matrículas, duplicados y embarcaciones. ¿Qué trámite necesitas?',
    imageUrl: 'https://expertconsulting.es/catalog/waba/trafico-capitania-maritima.png',
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
    imageUrl: 'https://expertconsulting.es/catalog/waba/notaria-propiedades.png',
    services: [
      { id: 'compraventa-inmueble', title: 'Compraventa Inmueble', description: 'Fiscal y documental · ITP o IVA+AJD' },
      { id: 'herencia',             title: 'Herencia y Sucesión',  description: 'Declaración · liquidación · adjudicación' },
      { id: 'donacion',             title: 'Donación de Bienes',   description: 'Inmuebles · dinero · fiscalidad optimizada' },
      { id: 'hipoteca-cancelacion', title: 'Cancelación Hipoteca', description: 'Cancelación registral · deuda cero · desde 150 €' },
    ],
  },
];

export const CATALOG_BODY_DEFAULT =
  'Hola 👋 Aquí tienes nuestros servicios. Pulsa el botón para explorarlos y cuéntanos cuál te interesa.';

export const CATALOG_FOOTER = 'Reserva cita gratuita en expertconsulting.es/cita';
