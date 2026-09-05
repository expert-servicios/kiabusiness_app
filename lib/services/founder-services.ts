export const FOUNDER_SERVICE_SLUGS = [
  'constitucion-sl-circe',
  'nif-socio-extranjero',
] as const;

export type FounderServiceSlug = (typeof FOUNDER_SERVICE_SLUGS)[number];

export type FounderServiceProduct = {
  slug: FounderServiceSlug;
  category: 'empresas-autonomos';
  name: string;
  shortName: string;
  description: string;
  unitAmount: number;
  displayPrice: string;
  stripeLookupKey: string;
  allowQuantity: boolean;
};

export const FOUNDER_SERVICE_PRODUCTS: Record<FounderServiceSlug, FounderServiceProduct> = {
  'constitucion-sl-circe': {
    slug: 'constitucion-sl-circe',
    category: 'empresas-autonomos',
    name: 'Formación guiada para constituir una SL vía CIRCE',
    shortName: 'Constitución SL vía CIRCE',
    description: 'Sesión práctica de 2 horas para preparar y tramitar la constitución de una Sociedad Limitada mediante PAE Virtual / CIRCE.',
    unitAmount: 18000,
    displayPrice: '180 € + IVA',
    stripeLookupKey: 'expert_constitucion_sl_circe_180',
    allowQuantity: false,
  },
  'nif-socio-extranjero': {
    slug: 'nif-socio-extranjero',
    category: 'empresas-autonomos',
    name: 'Obtención de NIF para socio extranjero sin DNI/NIE',
    shortName: 'NIF socio extranjero',
    description: 'Revisión documental y tramitación ante la AEAT de la solicitud de NIF fiscal para una persona física extranjera sin DNI/NIE, cuando proceda.',
    unitAmount: 6000,
    displayPrice: '60 € + IVA / persona',
    stripeLookupKey: 'expert_nif_socio_extranjero_60',
    allowQuantity: true,
  },
};

export function getFounderServiceProduct(slug: string): FounderServiceProduct | null {
  return FOUNDER_SERVICE_SLUGS.includes(slug as FounderServiceSlug)
    ? FOUNDER_SERVICE_PRODUCTS[slug as FounderServiceSlug]
    : null;
}
