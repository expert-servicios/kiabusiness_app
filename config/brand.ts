import type { LucideIcon } from 'lucide-react';
import { Award, Briefcase, CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react';

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
  title: 'Asesoría fiscal y legal en España, sin complicaciones',
  subtitle:
    'Contrata online, sube tu documentación y recibe tu trámite resuelto. Para particulares, autónomos y empresas.',
  description:
    'Trámites fiscales, legales y administrativos con gestión integral, atención cercana y entrega rápida de resultado.',
  primaryAction: { label: 'Soy empresa', href: '/servicios/empresas-autonomos' },
  secondaryAction: { label: 'Soy particular', href: '/servicios/declaraciones-impuestos' },
  highlights: ['+20 años de experiencia', 'Colaboradora social AEAT', 'Holded Solution Partner']
} as const;

export const trustItems: Array<{ label: string; Icon: LucideIcon }> = [
  { label: '+20 años de experiencia', Icon: Award },
  { label: 'Colaboradora social AEAT', Icon: ShieldCheck },
  { label: 'Camerfirma', Icon: CheckCircle2 },
  { label: 'Holded Solution Partner', Icon: Briefcase }
];

export const serviceCategories = [
  {
    title: 'Fiscalidad',
    description: 'IRPF, Modelo 151, no residentes, patrimonio y rentas internacionales.',
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
    description: 'Altas, sociedades, gestión mensual con Holded y trámites mercantiles.',
    href: '/servicios',
    icon: Briefcase
  },
  {
    title: 'Holded',
    description: 'Implantación, migración y formación práctica en Holded.',
    href: '/holded',
    icon: Briefcase
  },
  {
    title: 'Certificado digital',
    description: 'Certificados digitales para personas físicas, entidades mercantiles y entidades sin ánimo de lucro.',
    href: '/servicios/certificado-digital',
    icon: Award
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
    { label: 'Fiscalidad', href: '/servicios/declaraciones-impuestos' },
    { label: 'Extranjería y Nacionalidad', href: '/servicios/extranjeria-nacionalidad' },
    { label: 'Empresas y Autónomos', href: '/servicios/empresas-autonomos' },
    { label: 'Holded', href: '/holded' },
    { label: 'Certificado digital', href: '/servicios/certificado-digital' },
    { label: 'Tráfico y Capitanía Marítima', href: '/servicios/trafico-capitania-maritima' },
    { label: 'Notaría y Propiedades', href: '/servicios/notaria-propiedades' }
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
    { label: 'Email', href: 'mailto:info@expertconsulting.es' }
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
