import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
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
  MonitorCheck,
  Search,
  ShieldCheck,
  Star,
  Upload,
} from 'lucide-react';
import { Hero } from '@/components/site/Hero';
import { ReviewsPreview } from '@/components/site/reviews-preview';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { HoldedDemoForm } from '@/components/site/HoldedDemoForm';
import { articles } from '@/lib/utils/blog';

export const metadata: Metadata = {
  title: 'EXPERT | Plataforma para asesorías y gestión fiscal en España',
  description:
    'Plataforma operativa para asesorías, gestorías y despachos: clientes, expedientes, documentos, pagos y Holded integrado. También asesoría fiscal, legal y administrativa para empresas y autónomos.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es',
    title: 'EXPERT | Plataforma para asesorías y gestión fiscal en España',
    description:
      'Plataforma operativa para asesorías, gestorías y despachos: clientes, expedientes, documentos, pagos y Holded integrado.',
    siteName: 'EXPERT — Plataforma para Asesorías',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'EXPERT — Asesoría Fiscal y Legal' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXPERT | Plataforma para asesorías y gestión fiscal en España',
    description: 'Plataforma para asesorías, gestorías y despachos. También asesoría fiscal y legal para empresas y autónomos.',
    images: ['/branding/expert%20servicios.png']
  },
  alternates: { canonical: 'https://expertconsulting.es' }
};

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
    title: 'Fiscalidad',
    text: 'Declaraciones fiscales para residentes, no residentes y contribuyentes con patrimonio o rentas internacionales.',
    href: '/servicios/declaraciones-impuestos',
    items: ['IRPF', 'Modelo 151', 'Modelo 720'],
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
    text: 'Alta de actividad, constitución de sociedades, gestión mensual con Holded y trámites mercantiles.',
    href: '/servicios/empresas-autonomos',
    items: ['Alta autónomos', 'Sociedades', 'Planes mensuales'],
    Icon: Briefcase
  },
  {
    title: 'Holded',
    text: 'Implantación, migración y formación práctica para trabajar con datos ordenados y procesos claros.',
    href: '/holded',
    items: ['Pack Starter', 'Migración', 'Formación Holded'],
    Icon: MonitorCheck
  },
  {
    title: 'Certificado digital',
    text: 'Certificados digitales para personas físicas, entidades mercantiles y entidades sin ánimo de lucro.',
    href: '/servicios/certificado-digital',
    items: ['Persona física', 'Entidad mercantil', 'Sin ánimo de lucro'],
    Icon: FileCheck
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
    title: 'Control documental',
    text: 'Organización de expedientes, plazos y documentos para trabajar con menos fricción operativa.',
    Icon: FileCheck
  },
  {
    title: 'Dirección profesional',
    text: 'Criterio fiscal, administrativo y legal para tomar decisiones con una visión más completa.',
    Icon: Star
  }
];

const holdedBenefits = [
  'Revisión de tu contabilidad actual',
  'Plan de migración a Holded por fases',
  'Configuración de facturación, bancos y reporting',
  'Acompañamiento inicial para tu equipo'
] as const;

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams;
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=/dashboard`);
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'EXPERT — Asesoría Fiscal y Legal',
    url: 'https://expertconsulting.es',
    logo: 'https://expertconsulting.es/branding/expert-app.png',
    image: 'https://expertconsulting.es/branding/expert%20servicios.png',
    description: 'Asesoría fiscal, legal y administrativa en España para empresas, autónomos y particulares. Impuestos, extranjería, trámites y gestión.',
    telephone: '+34696550480',
    address: { '@type': 'PostalAddress', addressCountry: 'ES' },
    areaServed: 'ES',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de asesoría',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Declaración de la Renta (IRPF)' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Asesoría de extranjería' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Constitución de sociedades' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Contabilidad para autónomos' } }
      ]
    },
    sameAs: ['https://expertconsulting.es']
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-[#F8F6F1] text-[#0D1B2A]">
        <Hero />
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
      <AdvisorSaasTeaser />
      <Services />
      <FeaturedServices />
      <HowItWorks />
      <ClientPortal />
      <HoldedMigration />
      <Operations />
      <BlogPreview />
      <ReviewsPreview />
      <FinalCta />
    </main>
    </>
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
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
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

        <div className="brand-blue-bg border border-[#D4A017]/25 p-6 text-[#F8F6F1] shadow-[0_22px_60px_rgba(13,27,42,0.22)]">
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

function HoldedMigration() {
  return (
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <SectionTitle
            dark
            eyebrow="Holded Solution Partner"
            title="Migración de contabilidad a Holded con criterio profesional."
            text="Preparamos el paso desde hojas de cálculo, programas antiguos o procesos dispersos hacia un entorno contable más claro, conectado y mantenible."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {holdedBenefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 border border-[#D4A017]/25 bg-[#23364D]/35 p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                <p className="text-sm leading-6 text-[#F8F6F1]/86">{benefit}</p>
              </div>
            ))}
          </div>

          <Link
            href="/holded"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver página Holded
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <HoldedDemoForm />
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

const categoryColors: Record<string, string> = {
  Fiscalidad: 'text-[#D4A017] border-[#D4A017]/40 bg-[#D4A017]/10',
  Extranjería: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  Empresas: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
  Holded: 'text-rose-400 border-rose-400/40 bg-rose-400/10',
  Trámites: 'text-purple-400 border-purple-400/40 bg-purple-400/10'
};

function BlogPreview() {
  const preview = articles.slice(0, 3);

  return (
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            dark
            eyebrow="Blog"
            title="Guías y artículos fiscales"
            text="Contenido práctico sobre impuestos, extranjería y gestión de empresas. Sin jerga."
          />
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver todos los artículos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {preview.map((article) => {
            const colorClass = categoryColors[article.category] ?? 'text-[#D4A017] border-[#D4A017]/40';
            return (
              <article
                key={article.slug}
                className="flex flex-col border border-[#D4A017]/20 bg-[#23364D]/35 p-6 transition hover:-translate-y-0.5 hover:border-[#D4A017]/60"
              >
                <span className={`inline-block self-start border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
                  {article.category}
                </span>
                <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-[#F8F6F1]">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#9CA3AF]">{article.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
                <Link
                  href={`/blog/${article.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                >
                  Leer artículo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            );
          })}
        </div>

        {/* Newsletter strip */}
        <div className="mt-12 border border-[#D4A017]/25 bg-[#23364D]/35 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">
                Alertas fiscales
              </p>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#F8F6F1] md:text-2xl">
                Recibe los próximos artículos en tu email
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#9CA3AF]">
                Novedades fiscales, cambios en extranjería y guías prácticas. Sin spam. Cancela cuando quieras.
              </p>
            </div>
            <div className="md:min-w-[400px]">
              <NewsletterForm source="home" variant="dark" layout="horizontal" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdvisorSaasTeaser() {
  return (
    <section className="border-b border-[#D8CBB5] bg-[#0D1B2A] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Para asesorías y gestorías</p>
          <h2 className="mt-2 font-serif text-xl font-semibold leading-snug text-[#F8F6F1] md:text-2xl">
            Plataforma operativa para asesorías — clientes, expedientes, documentos y Holded integrado.
          </h2>
        </div>
        <Link
          href="/para-asesorias"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
        >
          Ver la plataforma
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="brand-blue-bg px-6 py-16 text-center text-[#F8F6F1] md:py-20">
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
