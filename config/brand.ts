import type { LucideIcon } from 'lucide-react';
import { Award, Briefcase, CheckCircle2, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';

export const siteName = 'EXPERT';

export const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Sobre mí', href: '/sobre-mi' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' }
] as const;

export const heroCopy = {
  eyebrow: 'EXPERT · Asesoría fiscal, legal y administrativa',
  title: 'Asesoría fiscal en España',
  subtitle: 'Para empresas y personas físicas',
  description: 'Presentamos tus impuestos, optimizamos tu fiscalidad y evitamos errores con Hacienda.',
  primaryAction: { label: 'Hablar por WhatsApp', href: '/contacto' },
  secondaryAction: { label: 'Ver servicios', href: '/servicios' },
  highlights: [
    '+20 años de experiencia',
    'Colaboradora social AEAT',
    'Holded Solution Partner'
  ]
} as const;

export const trustItems: Array<{ label: string; Icon: LucideIcon }> = [
  { label: '+20 años de experiencia', Icon: Award },
  { label: 'Colaboradora social AEAT', Icon: ShieldCheck },
  { label: 'Camerfirma', Icon: CheckCircle2 },
  { label: 'Holded Solution Partner', Icon: Briefcase }
];

export const serviceCategories = [
  {
    title: 'Declaraciones e Impuestos',
    description: 'IRPF, Modelo 151, IVA, Sociedades, no residentes y regularizaciones fiscales.',
    href: '/servicios',
    icon: Sparkles
  },
  {
    title: 'Extranjería y Nacionalidad',
    description: 'Nacionalidad española, residencias, renovaciones y revisión documental.',
    href: '/servicios',
    icon: Users
  },
  {
    title: 'Empresas y Autónomos',
    description: 'Altas, sociedades, contabilidad, impuestos y gestión fiscal recurrente.',
    href: '/servicios',
    icon: Briefcase
  },
  {
    title: 'Tráfico y Capitanía Marítima',
    description: 'Vehículos, embarcaciones, matriculaciones y gestiones administrativas.',
    href: '/servicios',
    icon: ShieldCheck
  },
  {
    title: 'Notaría y Propiedades',
    description: 'Compraventas, escrituras, herencias, poderes y gestión patrimonial.',
    href: '/servicios',
    icon: CheckCircle2
  },
  {
    title: 'Gestiones Especializadas',
    description: 'Certificados Camerfirma, Holded, automatizaciones y trámites especiales.',
    href: '/servicios',
    icon: Award
  }
] as const;

export const featuredServices = [
  {
    title: 'Declaración de la Renta',
    description: 'Preparación y presentación del IRPF con revisión documental y criterio fiscal.',
    cta: 'Solicitar información',
    href: '/servicios'
  },
  {
    title: 'Modelo 151',
    description: 'Declaración para trabajadores desplazados acogidos al régimen especial.',
    cta: 'Consultar servicio',
    href: '/servicios'
  },
  {
    title: 'Nacionalidad española',
    description: 'Preparación, revisión y acompañamiento documental para el expediente.',
    cta: 'Ver requisitos',
    href: '/servicios'
  }
] as const;

export const workSteps = [
  'Envías la documentación',
  'Revisamos tu caso',
  'Gestionamos el trámite',
  'Te informamos del resultado'
] as const;

export const reviewCards = [
  {
    label: 'Reseña verificada',
    badge: 'Servicio finalizado'
  },
  {
    label: 'Reseña verificada',
    badge: 'Servicio finalizado'
  },
  {
    label: 'Reseña verificada',
    badge: 'Servicio finalizado'
  }
] as const;

export const accreditationItems = [
  { label: 'Agencia Tributaria' },
  { label: 'Holded' },
  { label: 'Camerfirma' },
  { label: 'Punto PAE' },
  { label: 'Generalitat Valenciana' }
] as const;

export const footerLinks = {
  services: [
    { label: 'Declaraciones e Impuestos', href: '/servicios' },
    { label: 'Extranjería y Nacionalidad', href: '/servicios' },
    { label: 'Empresas y Autónomos', href: '/servicios' },
    { label: 'Gestiones Especializadas', href: '/servicios' }
  ],
  company: [
    { label: 'Sobre mí', href: '/sobre-mi' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contacto', href: '/contacto' }
  ],
  legal: [
    { label: 'Aviso legal', href: '/aviso-legal' },
    { label: 'Privacidad', href: '/privacidad' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Condiciones de contratación', href: '/condiciones' }
  ],
  contact: [
    { label: 'WhatsApp', href: '/contacto' },
    { label: 'Email', href: 'mailto:contacto@expert.example' }
  ]
} as const;

export const footerCopy = 'Asesoría fiscal, legal y administrativa en España para empresas, autónomos y personas físicas.';

export const privateAreaCopy = {
  title: 'Tu área privada de gestión fiscal',
  description:
    'Sube documentación, consulta el estado de tus trámites, accede a tus facturas y comunícate de forma segura desde un único panel.',
  primaryAction: { label: 'Acceder', href: '/login' },
  secondaryAction: { label: 'Crear cuenta', href: '/registro' }
};
