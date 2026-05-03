import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  ArrowRight,
  Briefcase,
  Calculator,
  Check,
  FileCheck,
  FileText,
  Globe2,
  Home,
  LockKeyhole,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Upload
} from 'lucide-react';
import { Hero } from '@/components/site/Hero';

type IconItem = {
  Icon: LucideIcon;
};

const serviceAreas: Array<
  IconItem & {
    title: string;
    text: string;
    href: string;
    items: string[];
  }
> = [
  {
    title: 'Fiscalidad e impuestos',
    text: 'Declaraciones, regularizaciones, tributación de residentes y no residentes.',
    href: '/servicios/declaraciones-impuestos',
    items: ['IRPF', 'Modelo 151', 'No residentes'],
    Icon: FileText
  },
  {
    title: 'Extranjería y nacionalidad',
    text: 'Acompañamiento documental y fiscal para residir o establecerse en España.',
    href: '/servicios/extranjeria-nacionalidad',
    items: ['Nacionalidad', 'Residencias', 'Renovaciones'],
    Icon: Globe2
  },
  {
    title: 'Empresas y autónomos',
    text: 'Altas, constitución, contabilidad, impuestos y gestión recurrente.',
    href: '/servicios/empresas-autonomos',
    items: ['Alta autónomos', 'Sociedades', 'Contabilidad'],
    Icon: Briefcase
  },
  {
    title: 'Tráfico y marítima',
    text: 'Gestiones administrativas de vehículos, embarcaciones y documentación.',
    href: '/servicios/trafico-capitania-maritima',
    items: ['Transferencias', 'Matriculaciones', 'Náutica'],
    Icon: Anchor
  },
  {
    title: 'Notaría y propiedades',
    text: 'Soporte documental en compraventas, escrituras y operaciones patrimoniales.',
    href: '/servicios/notaria-propiedades',
    items: ['Compraventas', 'Escrituras', 'Propiedades'],
    Icon: Home
  },
  {
    title: 'Gestiones especializadas',
    text: 'Certificados digitales, migraciones a Holded y trámites de mayor complejidad.',
    href: '/servicios/gestiones-especializadas',
    items: ['Camerfirma', 'Holded', 'Automatización'],
    Icon: Settings
  }
];

const featuredServices: Array<IconItem & { title: string; text: string; href: string }> = [
  {
    title: 'Declaración de la Renta',
    text: 'Revisión fiscal, preparación documental y presentación del IRPF con criterio profesional.',
    href: '/servicios/declaraciones-impuestos',
    Icon: Calculator
  },
  {
    title: 'Modelo 151',
    text: 'Tributación para profesionales, trabajadores e inversores desplazados a España.',
    href: '/servicios/declaraciones-impuestos',
    Icon: FileCheck
  },
  {
    title: 'Nacionalidad española',
    text: 'Preparación y seguimiento del expediente con control de requisitos y documentación.',
    href: '/servicios/extranjeria-nacionalidad',
    Icon: ShieldCheck
  }
];

const processSteps: Array<IconItem & { title: string; text: string }> = [
  {
    title: 'Contratas online',
    text: 'Elige el servicio o solicita presupuesto según tu caso.',
    Icon: Check
  },
  {
    title: 'Subes documentos',
    text: 'Envías la documentación necesaria desde un canal seguro.',
    Icon: Upload
  },
  {
    title: 'Revisamos tu caso',
    text: 'Analizamos la información y gestionamos el trámite completo.',
    Icon: Search
  },
  {
    title: 'Recibes resultado',
    text: 'Te entregamos justificantes, resolución o documentación final.',
    Icon: FileCheck
  }
];

const operations: Array<IconItem & { title: string; text: string }> = [
  {
    title: 'Gestión mensual',
    text: 'Planes recurrentes para autónomos, pymes y empresas que necesitan continuidad fiscal.',
    Icon: Briefcase
  },
  {
    title: 'Migración a Holded',
    text: 'Configuración, migración y formación para trabajar con procesos contables más ordenados.',
    Icon: Settings
  },
  {
    title: 'Mentoring operativo',
    text: 'Sesiones para tomar mejores decisiones fiscales, administrativas y de gestión interna.',
    Icon: Star
  }
];

const reviews = [
  {
    text: 'Ksenia hizo que todo el proceso fuera muy sencillo. Profesional, rápida y siempre dispuesta a ayudar.',
    name: 'James L.',
    country: 'Reino Unido',
    badge: 'UK'
  },
  {
    text: 'Excelente servicio para la gestión de mi Modelo 151 y la apertura de mi empresa. 100% recomendable.',
    name: 'Sophie M.',
    country: 'Francia',
    badge: 'FR'
  },
  {
    text: 'Muy atenta y resolutiva. Me ayudó con la nacionalidad española y todo fue más fácil de lo esperado.',
    name: 'Markus B.',
    country: 'Alemania',
    badge: 'DE'
  }
];

export default function HomePage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <Hero />
      <Services />
      <FeaturedServices />
      <HowItWorks />
      <ClientPortal />
      <Operations />
      <Reviews />
      <FinalCta />
    </main>
  );
}

function Services() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div>
          <SectionTitle
            eyebrow="Servicios"
            title="Una asesoría para resolver, no para complicar."
            text="Fiscalidad, legal, extranjería y gestión administrativa en una experiencia digital, ordenada y cercana."
          />
          <Link
            href="/servicios"
            className="mt-7 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver todos los servicios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {serviceAreas.map(({ Icon, title, text, href, items }) => (
            <Link
              href={href}
              key={title}
              className="group border border-[#D4A017]/25 bg-[#F8F6F1] p-6 shadow-[0_10px_28px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.11)]"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D4A017]/25 bg-[#0D1B2A] text-[#D4A017]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold leading-tight text-[#0D1B2A]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {items.map((item) => (
                  <span key={item} className="border border-[#D4A017]/25 px-2.5 py-1 text-xs font-semibold text-[#23364D]">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
                Consultar área
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedServices() {
  return (
    <section className="bg-[#0D1B2A] px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          dark
          eyebrow="Servicios destacados"
          title="Los trámites más solicitados, listos para empezar online."
          text="Cada servicio se orienta a un resultado concreto: documentación revisada, trámite presentado y seguimiento claro."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredServices.map(({ Icon, title, text, href }) => (
            <Link
              href={href}
              key={title}
              className="group border border-[#D4A017]/25 bg-[#23364D]/35 p-7 shadow-[0_20px_45px_rgba(13,27,42,0.32)] transition hover:-translate-y-0.5 hover:border-[#D4A017]"
            >
              <Icon className="h-9 w-9 stroke-[#D4A017]" strokeWidth={1.7} />
              <h3 className="mt-6 font-serif text-2xl font-bold text-[#F8F6F1]">{title}</h3>
              <p className="mt-4 min-h-24 text-sm leading-7 text-[#9CA3AF]">{text}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#D4A017]">
                Empezar
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Proceso"
          title="Un flujo pensado para clientes que no quieren perder tiempo."
          text="La parte compleja ocurre detrás: tú ves el estado, entregas documentos y recibes el resultado."
          centered
        />

        <div className="mt-11 grid gap-4 md:grid-cols-4">
          {processSteps.map(({ Icon, title, text }, index) => (
            <article key={title} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6 shadow-[0_10px_28px_rgba(13,27,42,0.07)]">
              <div className="flex items-center justify-between">
                <span className="font-serif text-4xl font-bold text-[#D4A017]">{String(index + 1).padStart(2, '0')}</span>
                <Icon className="h-8 w-8 stroke-[#0D1B2A]" strokeWidth={1.7} />
              </div>
              <h3 className="mt-7 font-serif text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#23364D]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientPortal() {
  const rows = [
    ['Documentación', 'Subida segura y control de pendientes'],
    ['Expedientes', 'Estado claro de cada trámite'],
    ['Pagos', 'Stripe, facturas y suscripciones'],
    ['Acceso', 'Google OAuth y enlace mágico']
  ];

  return (
    <section className="bg-[#F8F6F1] px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <SectionTitle
            eyebrow="Panel de cliente"
            title="Tu documentación y tus trámites en un solo sitio."
            text="El portal privado está preparado para centralizar documentos, pagos, estados y comunicaciones sin depender de hilos de email dispersos."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#0D1B2A] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#23364D]"
            >
              <LockKeyhole className="h-4 w-4" />
              Acceder al panel
            </Link>
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Solicitar presupuesto
            </Link>
          </div>
        </div>

        <div className="border border-[#D4A017]/25 bg-[#0D1B2A] p-6 text-[#F8F6F1] shadow-[0_22px_60px_rgba(13,27,42,0.22)]">
          <div className="flex items-center justify-between border-b border-[#D4A017]/20 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">EXPERT Portal</p>
              <h3 className="mt-2 font-serif text-2xl font-bold">Vista de cliente</h3>
            </div>
            <span className="border border-[#D4A017]/35 px-3 py-1 text-xs font-bold text-[#D4A017]">Seguro</span>
          </div>

          <div className="mt-6 divide-y divide-[#F8F6F1]/10">
            {rows.map(([label, text]) => (
              <div key={label} className="grid gap-2 py-4 sm:grid-cols-[150px_1fr]">
                <p className="text-sm font-bold text-[#F8F6F1]">{label}</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Operations() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Continuidad"
          title="Para quien necesita algo más que un trámite puntual."
          text="EXPERT también cubre la gestión recurrente, la digitalización contable y el acompañamiento operativo."
          centered
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {operations.map(({ Icon, title, text }) => (
            <article key={title} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-7 shadow-[0_10px_28px_rgba(13,27,42,0.07)]">
              <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
              <h3 className="mt-6 font-serif text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#23364D]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="bg-[#0D1B2A] px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          dark
          centered
          eyebrow="Clientes"
          title="Atención cercana con exigencia profesional."
          text="La confianza se gana resolviendo, comunicando claro y cuidando cada expediente."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.name} className="border border-[#D4A017]/25 bg-[#23364D]/35 p-6">
              <div className="flex gap-1 text-[#D4A017]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-[#F8F6F1]/82">{review.text}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[#F8F6F1] text-xs font-bold text-[#0D1B2A]">
                  {review.badge}
                </span>
                <div>
                  <p className="font-bold">{review.name}</p>
                  <p className="text-sm text-[#9CA3AF]">{review.country}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#0D1B2A] px-6 py-16 text-center text-[#F8F6F1] md:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-[#D4A017]/40" />
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Siguiente paso</p>
        <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">Cuéntanos tu caso y te orientamos.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#9CA3AF]">
          Si no sabes qué servicio necesitas, empezamos por revisar tu situación y preparar una propuesta clara.
        </p>
        <Link
          href="/solicitar-presupuesto"
          className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
        >
          Solicitar presupuesto
        </Link>
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
  dark = false,
  centered = false
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">{eyebrow}</p>
      <h2 className={`mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl ${dark ? 'text-[#F8F6F1]' : 'text-[#0D1B2A]'}`}>
        {title}
      </h2>
      <p className={`mt-4 text-sm leading-7 md:text-base ${dark ? 'text-[#9CA3AF]' : 'text-[#23364D]'}`}>{text}</p>
    </div>
  );
}
