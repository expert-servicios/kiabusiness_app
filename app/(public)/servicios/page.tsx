import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Anchor,
  ArrowRight,
  Briefcase,
  Calculator,
  Check,
  FileCheck,
  Globe2,
  HelpCircle,
  Home,
  MonitorCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Servicios profesionales | EXPERT',
  description:
    'Servicios profesionales de fiscalidad, extranjería, empresa, Holded, certificado digital, tráfico, embarcaciones, notaría y propiedades.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/servicios',
    title: 'Servicios profesionales | EXPERT',
    description:
      'Fiscalidad, extranjería, empresa, trámites mercantiles, certificado digital, Holded, tráfico, embarcaciones, notaría y propiedades.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'EXPERT — Servicios profesionales' }]
  },
  twitter: { card: 'summary_large_image', images: ['/branding/expert%20servicios.png'] },
  alternates: { canonical: 'https://expertconsulting.es/servicios' }
};

type ServiceGroup = {
  title: string;
  items: string[];
};

type ServiceArea = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  secondaryCta?: { label: string; href: string };
  Icon: LucideIcon;
  services?: string[];
  groups?: ServiceGroup[];
  auxiliaryActions?: { label: string; href: string }[];
};

const serviceAreas: ServiceArea[] = [
  {
    title: 'Fiscalidad',
    description:
      'Declaraciones fiscales para personas físicas, residentes, no residentes y contribuyentes con patrimonio o rentas internacionales.',
    href: '/servicios/declaraciones-impuestos',
    ctaLabel: 'Ver servicios fiscales',
    Icon: Calculator,
    services: [
      'Renta IRPF',
      'Modelo 151 / Ley Beckham',
      'IRNR no residentes',
      'Modelo 720',
      'Impuesto sobre el Patrimonio'
    ]
  },
  {
    title: 'Extranjería y Nacionalidad',
    description:
      'Tramitación y revisión de expedientes de residencia, arraigo, reagrupación familiar y nacionalidad española.',
    href: '/servicios/extranjeria-nacionalidad',
    ctaLabel: 'Ver servicios de extranjería',
    Icon: Globe2,
    services: [
      'Arraigo social',
      'Arraigo familiar',
      'Renovación de residencia',
      'Nacionalidad española',
      'Nacionalidad menor nacido en España',
      'Reagrupación familiar',
      'Permiso inicial de residencia'
    ]
  },
  {
    title: 'Empresas y Autónomos',
    description:
      'Alta de actividad, constitución de sociedades, gestión mensual con Holded y trámites mercantiles para mantener tu empresa al día.',
    href: '/servicios/empresas-autonomos',
    ctaLabel: 'Ver servicios para empresas',
    Icon: Briefcase,
    groups: [
      {
        title: 'Inicio de actividad',
        items: ['Alta de autónomo', 'Constitución de SL']
      },
      {
        title: 'Gestión mensual de empresas',
        items: ['Plan Avanzado', 'Plan Colaborativo', 'Plan Personalizado', 'Necesito configurar Holded primero']
      },
      {
        title: 'Trámites mercantiles',
        items: [
          'Cuentas anuales',
          'Apoderamientos mercantiles',
          'Cambio de administrador',
          'Modificación de estatutos',
          'Compraventa de empresas'
        ]
      }
    ]
  },
  {
    title: 'Holded',
    description:
      'Implantación, migración y formación práctica en Holded para autónomos, pymes y empresas que quieren trabajar con datos ordenados, procesos claros y una configuración preparada para facturación, contabilidad, bancos e impuestos.',
    href: '/holded',
    ctaLabel: 'Ver servicios Holded',
    secondaryCta: { label: 'Reservar demo gratuita', href: '/holded#demo' },
    Icon: MonitorCheck,
    services: [
      'Pack Starter / Onboarding a Holded',
      'Migración completa sin inventario',
      'Migración completa con inventario',
      'Formación en Holded por horas'
    ],
    auxiliaryActions: [
      { label: 'Solicitar prueba gratuita 14 días', href: '/planes/gratuito' },
      { label: 'Solicitar información sobre licencia Holded', href: '/contacto?asunto=Licencia%20Holded' },
      { label: 'Ver conectores e IA para Holded', href: '/holded/conectores' }
    ]
  },
  {
    title: 'Certificado digital',
    description:
      'Certificados digitales para personas físicas, entidades mercantiles y entidades sin ánimo de lucro, con acompañamiento para activar y utilizar el certificado correctamente.',
    href: '/servicios/certificado-digital',
    ctaLabel: 'Ver certificados digitales',
    Icon: FileCheck,
    services: ['Persona física', 'Entidad mercantil', 'Entidad sin ánimo de lucro']
  },
  {
    title: 'Tráfico y Capitanía Marítima',
    description:
      'Gestiones administrativas para vehículos y embarcaciones, incluyendo transferencias, matriculaciones, duplicados y trámites marítimos.',
    href: '/servicios/trafico-capitania-maritima',
    ctaLabel: 'Ver trámites de tráfico y embarcaciones',
    Icon: Anchor,
    services: ['Transferencia de vehículo', 'Matriculación', 'Duplicado de documentos', 'Trámites de embarcaciones']
  },
  {
    title: 'Notaría y Propiedades',
    description:
      'Acompañamiento en operaciones inmobiliarias, herencias, donaciones y cancelaciones hipotecarias, con revisión documental y fiscal del trámite.',
    href: '/servicios/notaria-propiedades',
    ctaLabel: 'Ver servicios de notaría y propiedades',
    Icon: Home,
    services: ['Compraventa de inmueble', 'Herencia / sucesión', 'Donación de bienes', 'Cancelación de hipoteca']
  }
];

const monthlyPlans = [
  { name: 'Plan Avanzado', href: '/planes/avanzado', text: 'Para empresas y autónomos que quieren mantener el control con supervisión profesional.' },
  { name: 'Plan Colaborativo', href: '/planes/colaborativo', text: 'Para equipos que trabajan en Holded y necesitan revisión, impuestos y seguimiento mensual.' },
  { name: 'Plan Personalizado', href: '/planes/presupuesto-personalizado', text: 'Para empresas con mayor volumen, gestión laboral u operativa más específica.' }
];

const orientationOptions = [
  'Tengo una consulta fiscal',
  'Necesito hacer un trámite de extranjería',
  'Quiero abrir o gestionar una empresa',
  'Necesito ayuda con Holded',
  'He recibido un requerimiento',
  'No sé por dónde empezar'
] as const;

export default function ServiciosPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Servicios</p>
          <h1 className="mt-4 max-w-4xl font-serif text-3xl font-bold leading-tight md:text-5xl">
            Servicios profesionales para empresas, autónomos y particulares
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#C9D2DC] md:text-lg">
            Fiscalidad, extranjería, empresa, trámites mercantiles, certificado digital, Holded, tráfico,
            embarcaciones, notaría y propiedades. Todo organizado por áreas para que encuentres rápido el servicio
            que necesitas y puedas avanzar con criterio profesional.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Solicitar orientación
            </Link>
            <Link
              href="/planes"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Ver planes de gestión mensual
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Áreas de servicio</p>
            <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Elige el área que encaja con tu trámite</h2>
            <p className="mt-3 text-sm leading-7 text-[#23364D]">
              Cada bloque agrupa servicios relacionados para que puedas comparar opciones sin mezclar procedimientos,
              plazos ni documentación.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            {serviceAreas.map(({ Icon, title, description, services, groups, auxiliaryActions, href, ctaLabel, secondaryCta }) => (
              <article
                key={title}
                className="flex flex-col border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_24px_rgba(13,27,42,0.07)]"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D4A017]/25 bg-[#0D1B2A] text-[#D4A017]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{description}</p>
                  </div>
                </div>

                {services && (
                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {services.map((service) => (
                      <li key={service} className="flex items-start gap-2 text-sm leading-6 text-[#23364D]">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#D4A017]" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {groups && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {groups.map((group) => (
                      <div key={group.title}>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">{group.title}</p>
                        <ul className="mt-3 space-y-2">
                          {group.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm leading-5 text-[#23364D]">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {auxiliaryActions && (
                  <div className="mt-6 border-t border-[#D4A017]/20 pt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#23364D]">Acciones auxiliares Holded</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {auxiliaryActions.map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="inline-flex min-h-10 items-center justify-between gap-3 border border-[#D4A017]/25 px-3 py-2 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#D4A017]"
                        >
                          {action.label}
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 flex flex-wrap gap-4">
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                  >
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {secondaryCta && (
                    <Link
                      href={secondaryCta.href}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#23364D] transition hover:text-[#D4A017]"
                    >
                      {secondaryCta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-blue-bg px-6 py-14 text-[#F8F6F1] md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes</p>
              <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Gestión mensual de empresas con Holded</h2>
              <p className="mt-4 text-sm leading-7 text-[#C9D2DC] md:text-base">
                Si necesitas contabilidad, impuestos, seguimiento fiscal y soporte mensual, trabajamos con planes
                adaptados a tu nivel de implicación. Puedes llevar tú parte de la gestión, colaborar con nosotros o
                delegar una cobertura más completa según el volumen y necesidades reales de tu empresa.
              </p>
              <p className="mt-5 border-l-2 border-[#D4A017] pl-4 text-sm leading-6 text-[#F8F6F1]">
                Todos los planes funcionan con Holded. Si todavía no tienes cuenta, te ayudamos con la prueba gratuita,
                configuración inicial, onboarding o migración.
              </p>
              <Link
                href="/planes"
                className="mt-7 inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Ver planes mensuales
              </Link>
            </div>

            <div className="grid gap-4">
              {monthlyPlans.map((plan) => (
                <Link
                  key={plan.name}
                  href={plan.href}
                  className="group border border-[#D4A017]/25 bg-[#23364D]/35 p-5 transition hover:border-[#D4A017]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#F8F6F1]">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#C9D2DC]">{plan.text}</p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#D4A017] transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#D4A017]/25 bg-white text-[#D4A017]">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-serif text-2xl font-bold md:text-3xl">¿No sabes qué servicio elegir?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#23364D] md:text-base">
            No pasa nada. Muchos trámites se parecen desde fuera, pero no tienen el mismo procedimiento, plazo ni
            documentación. Cuéntanos tu caso y te orientamos hacia el servicio, plan o revisión profesional que
            realmente corresponde.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {orientationOptions.map((option) => (
              <span key={option} className="border border-[#D4A017]/25 bg-white px-3 py-2 text-sm font-semibold text-[#23364D]">
                {option}
              </span>
            ))}
          </div>
          <Link
            href="/solicitar-presupuesto"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#0D1B2A] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#23364D]"
          >
            Solicitar orientación
          </Link>
        </div>
      </section>
    </main>
  );
}
