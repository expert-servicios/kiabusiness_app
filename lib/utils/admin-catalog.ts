export interface CatalogItem {
  id: string;
  label: string;
  category: 'servicio' | 'plan' | 'formacion';
  subcategory?: string;
  description: string;
  suggestedPrice: number;
  mode: 'payment' | 'subscription';
  stripePriceEnvKey?: string;
}

export const ADMIN_CATALOG: CatalogItem[] = [
  // ── Plans (subscription) ────────────────────────────────────────────────────
  {
    id: 'plan-avanzado',
    label: 'Plan Avanzado',
    category: 'plan',
    description: 'Gestión fiscal y contable mensual básica para autónomos y pymes',
    suggestedPrice: 99,
    mode: 'subscription',
    stripePriceEnvKey: 'STRIPE_PLAN_MONTHLY_99'
  },
  {
    id: 'plan-colaborativo',
    label: 'Plan Colaborativo',
    category: 'plan',
    description: 'Gestión completa para pymes con contabilidad, IVA y asesoría continua',
    suggestedPrice: 199,
    mode: 'subscription',
    stripePriceEnvKey: 'STRIPE_PLAN_MONTHLY_199'
  },
  {
    id: 'plan-delegado',
    label: 'Plan Delegado',
    category: 'plan',
    description: 'Delegación total de la gestión fiscal, contable y administrativa',
    suggestedPrice: 349,
    mode: 'subscription',
    stripePriceEnvKey: 'STRIPE_PLAN_MONTHLY_349'
  },

  // ── Formaciones ──────────────────────────────────────────────────────────────
  {
    id: 'formacion-holded-2h',
    label: 'Formación Holded (2 horas)',
    category: 'formacion',
    description: 'Sesión práctica de 2 horas para aprender a usar Holded con autonomía',
    suggestedPrice: 180,
    mode: 'payment'
  },
  {
    id: 'formacion-holded-4h',
    label: 'Formación Holded (4 horas)',
    category: 'formacion',
    description: 'Formación intensiva de 4 horas en Holded con ejercicios prácticos',
    suggestedPrice: 320,
    mode: 'payment'
  },
  {
    id: 'formacion-fiscal',
    label: 'Formación Fiscal y Contable',
    category: 'formacion',
    description: 'Bloque de formación en fiscalidad, IVA, IRPF y contabilidad básica',
    suggestedPrice: 180,
    mode: 'payment'
  },
  {
    id: 'formacion-laboral',
    label: 'Formación Laboral y RRHH',
    category: 'formacion',
    description: 'Nóminas, contratos, Seguridad Social y gestión de personal',
    suggestedPrice: 180,
    mode: 'payment'
  },

  // ── Declaraciones e Impuestos ────────────────────────────────────────────────
  {
    id: 'irpf',
    label: 'Declaración de la Renta (IRPF)',
    category: 'servicio',
    subcategory: 'Declaraciones e Impuestos',
    description: 'Preparación y presentación del IRPF con revisión fiscal completa',
    suggestedPrice: 90,
    mode: 'payment'
  },
  {
    id: 'modelo-303',
    label: 'IVA trimestral (Modelo 303)',
    category: 'servicio',
    subcategory: 'Declaraciones e Impuestos',
    description: 'Liquidación y presentación del IVA trimestral ante la AEAT',
    suggestedPrice: 60,
    mode: 'payment'
  },
  {
    id: 'impuesto-sociedades',
    label: 'Impuesto sobre Sociedades (Mod. 200)',
    category: 'servicio',
    subcategory: 'Declaraciones e Impuestos',
    description: 'Preparación y presentación del Impuesto sobre Sociedades',
    suggestedPrice: 250,
    mode: 'payment'
  },
  {
    id: 'modelo-151',
    label: 'Ley Beckham (Modelo 151)',
    category: 'servicio',
    subcategory: 'Declaraciones e Impuestos',
    description: 'Declaración anual bajo el Régimen de Impatriados (Ley Beckham)',
    suggestedPrice: 180,
    mode: 'payment'
  },

  // ── Extranjería y Nacionalidad ───────────────────────────────────────────────
  {
    id: 'arraigo-social',
    label: 'Arraigo Social',
    category: 'servicio',
    subcategory: 'Extranjería y Nacionalidad',
    description: 'Solicitud de autorización de residencia por arraigo social (3 años)',
    suggestedPrice: 350,
    mode: 'payment'
  },
  {
    id: 'renovacion-residencia',
    label: 'Renovación de Residencia',
    category: 'servicio',
    subcategory: 'Extranjería y Nacionalidad',
    description: 'Renovación de autorización de residencia y/o trabajo',
    suggestedPrice: 280,
    mode: 'payment'
  },
  {
    id: 'reagrupacion-familiar',
    label: 'Reagrupación Familiar',
    category: 'servicio',
    subcategory: 'Extranjería y Nacionalidad',
    description: 'Expediente de reagrupación familiar completo',
    suggestedPrice: 400,
    mode: 'payment'
  },
  {
    id: 'nie-certificado',
    label: 'NIE / Certificado de Registro',
    category: 'servicio',
    subcategory: 'Extranjería y Nacionalidad',
    description: 'Obtención de NIE o certificado de registro comunitario',
    suggestedPrice: 120,
    mode: 'payment'
  },
  {
    id: 'nacionalidad-espanola',
    label: 'Nacionalidad Española',
    category: 'servicio',
    subcategory: 'Extranjería y Nacionalidad',
    description: 'Solicitud de nacionalidad española por residencia o descendencia',
    suggestedPrice: 500,
    mode: 'payment'
  },
  {
    id: 'nacionalidad-menor-nacido-espana',
    label: 'Nacionalidad menor nacido en España',
    category: 'servicio',
    subcategory: 'Extranjería y Nacionalidad',
    description: 'Solicitud de nacionalidad por residencia para menor nacido en España',
    suggestedPrice: 302.5,
    mode: 'payment'
  },

  // ── Empresas y Autónomos ─────────────────────────────────────────────────────
  {
    id: 'alta-autonomo',
    label: 'Alta de Autónomo',
    category: 'servicio',
    subcategory: 'Empresas y Autónomos',
    description: 'Tramitación del alta en RETA y registro de actividad en Hacienda',
    suggestedPrice: 150,
    mode: 'payment'
  },
  {
    id: 'constitucion-sl',
    label: 'Constitución de SL',
    category: 'servicio',
    subcategory: 'Empresas y Autónomos',
    description: 'Constitución de Sociedad Limitada (escritura + Registro Mercantil)',
    suggestedPrice: 800,
    mode: 'payment'
  },
  {
    id: 'migracion-holded',
    label: 'Migración a Holded',
    category: 'servicio',
    subcategory: 'Empresas y Autónomos',
    description: 'Migración completa de contabilidad y gestión a Holded',
    suggestedPrice: 490,
    mode: 'payment'
  },

  // ── Notaría y Propiedades ────────────────────────────────────────────────────
  {
    id: 'compraventa-inmueble',
    label: 'Compraventa de Inmueble',
    category: 'servicio',
    subcategory: 'Notaría y Propiedades',
    description: 'Gestión fiscal y notarial de compraventa de inmueble',
    suggestedPrice: 600,
    mode: 'payment'
  },
  {
    id: 'herencia',
    label: 'Herencia y Sucesiones',
    category: 'servicio',
    subcategory: 'Notaría y Propiedades',
    description: 'Tramitación completa de herencia: impuesto, escritura y registro',
    suggestedPrice: 700,
    mode: 'payment'
  },

  // ── Tráfico y Capitanía ──────────────────────────────────────────────────────
  {
    id: 'matriculacion-vehiculo',
    label: 'Matriculación de Vehículo',
    category: 'servicio',
    subcategory: 'Tráfico y Capitanía Marítima',
    description: 'Tramitación de matrícula de vehículo nuevo o de importación',
    suggestedPrice: 150,
    mode: 'payment'
  },
  {
    id: 'transferencia-vehiculo',
    label: 'Transferencia de Vehículo',
    category: 'servicio',
    subcategory: 'Tráfico y Capitanía Marítima',
    description: 'Cambio de titularidad de vehículo + liquidación del ITP',
    suggestedPrice: 120,
    mode: 'payment'
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return ADMIN_CATALOG.find((item) => item.id === id);
}

export const CATALOG_CATEGORIES = ['servicio', 'plan', 'formacion'] as const;
