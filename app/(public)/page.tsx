import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Calculator,
  Check,
  Clock,
  FileCheck,
  FileText,
  BookOpen,
  Gift,
  Globe2,
  GraduationCap,
  Home,
  LockKeyhole,
  MonitorCheck,
  Search,
  ShieldCheck,
  Star,
  Upload,
  Zap,
} from 'lucide-react';
import { Hero } from '@/components/site/Hero';
import { ReviewsPreview } from '@/components/site/reviews-preview';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { JulyCampaignBanner } from '@/components/site/JulyCampaignBanner';
import { CalendlyButton } from '@/components/site/CalendlyButton';
import { getPublishedBlogArticles } from '@/lib/utils/blog';
import { academyPrograms } from '@/lib/data/academy-catalog';
import { getCalAcademyUrl } from '@/lib/utils/cal';

export const metadata: Metadata = {
  title: 'Asesoría fiscal y legal inteligente para empresas responsables | EXPERT Consulting',
  description:
    'Gestión fiscal, legal y contable con IA (Kia) y equipo experto. Cuanto más te impliques en la gestión de tu empresa, menos pagas. Planes desde 49€/mes.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es',
    title: 'Asesoría fiscal y legal inteligente para empresas responsables | EXPERT Consulting',
    description:
      'Gestión fiscal, legal y contable con IA (Kia) y equipo experto. Cuanto más te impliques en la gestión de tu empresa, menos pagas. Planes desde 49€/mes.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'EXPERT — Asesoría Fiscal y Legal' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asesoría fiscal y legal inteligente para empresas responsables | EXPERT Consulting',
    description: 'Gestión fiscal, legal y contable con IA (Kia) y equipo experto. Planes desde 49€/mes.',
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

const holdedCards = [
  {
    Icon: Gift,
    title: 'Prueba gratis 14 días',
    text: 'Sin tarjeta de crédito. Lo activamos con nuestra cuenta de partner y hacemos el onboarding contigo.',
    href: '/planes/gratuito',
    cta: 'Solicitar prueba gratuita',
  },
  {
    Icon: Upload,
    title: 'Migración e implantación',
    text: 'Desde 499 € + IVA. Auditoría, limpieza y estructura lista para operar, con datos bien vinculados.',
    href: '/holded',
    cta: 'Ver packs de migración',
  },
  {
    Icon: Zap,
    title: 'Licencia con asistencia',
    text: 'Contrata Holded a través de nosotros: configuración, soporte y formación, mismas condiciones que Holded.',
    href: '/contacto?asunto=Licencia%20Holded%20con%20asistencia',
    cta: 'Solicitar información',
  },
] as const;

const modeloSteps: Array<IconItem & { title: string; text: string }> = [
  {
    title: 'Tú gestionas en Holded',
    text: 'Subes facturas, organizas cobros y pagos, mantienes tu empresa al día.',
    Icon: Upload
  },
  {
    title: 'Kia vigila y avisa',
    text: 'Nuestra IA detecta alertas fiscales, plazos y desviaciones antes de que se conviertan en un problema.',
    Icon: Bell
  },
  {
    title: 'Nosotros validamos y presentamos',
    text: 'Revisamos, corregimos si hace falta y presentamos lo que corresponda según tu plan.',
    Icon: FileCheck
  }
];

const authorityItems: Array<IconItem & { title: string; text: string }> = [
  {
    title: '+20 años',
    text: 'de experiencia fiscal y legal',
    Icon: Star
  },
  {
    title: 'Colaboradora social AEAT',
    text: 'Colaboramos directamente con la Agencia Tributaria',
    Icon: ShieldCheck
  },
  {
    title: 'Red PAE',
    text: 'Punto de Atención al Emprendedor reconocido',
    Icon: Briefcase
  },
  {
    title: 'Holded Solution Partner',
    text: 'Implantación y soporte certificado',
    Icon: MonitorCheck
  }
];

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
    telephone: '+34669045528',
    email: 'info@expertconsulting.es',
    address: { '@type': 'PostalAddress', addressCountry: 'ES' },
    areaServed: 'ES',
    priceRange: '€€',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+34669045528',
      contactType: 'customer service',
      areaServed: 'ES',
      availableLanguage: ['Spanish', 'Russian', 'English']
    },
    founder: { '@type': 'Person', name: 'Ksenia Ilicheva', url: 'https://expertconsulting.es/sobre-mi' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de asesoría',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Declaración de la Renta (IRPF)' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Asesoría de extranjería' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Constitución de sociedades' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Contabilidad para autónomos' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Migración e implantación de Holded' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Certificado digital sin desplazamiento' } }
      ]
    },
    sameAs: [
      'https://www.linkedin.com/in/ksenia-ilicheva/',
      'https://www.instagram.com/expert_servicios/',
      'https://www.facebook.com/expertapp'
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-[#F8F6F1] text-[#0D1B2A]">
        {/* Campaña temporal julio 2026, retirar tras el 31/07 */}
        <JulyCampaignBanner focus="holded" />
        <Hero />
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
      <ModeloResponsable />
      <AdvisorSaasTeaser />
      <Services />
      <Authority />
      <FeaturedServices />
      <HowItWorks />
      <ClientPortal />
      <HoldedMigration />
      <Formacion />
      <Operations />
      <BlogPreview />
      <DocsPreview />
      <ReviewsPreview />
      <FinalCta />
    </main>
    </>
  );
}

function ModeloResponsable() {
  return (
    <section className="bg-[#0D1B2A] px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          dark
          centered
          eyebrow="El modelo EXPERT"
          title="Un modelo de precios que no habías visto antes"
          text="La mayoría de asesorías cobran más cuanto más delegas. Nosotros hacemos lo contrario: cuanto más organizada esté tu empresa y más te impliques en su día a día, menos pagas cada mes. Tú decides el nivel de compromiso; Kia y nuestro equipo se adaptan a él."
        />

        <div className="mt-11 grid gap-5 md:grid-cols-3">
          {modeloSteps.map(({ Icon, title, text }, index) => (
            <article key={title} className="border border-[#D4A017]/25 bg-[#23364D]/35 p-7 shadow-[0_20px_45px_rgba(13,27,42,0.32)]">
              <div className="flex items-center justify-between">
                <span className="font-serif text-4xl font-bold text-[#D4A017]">{String(index + 1).padStart(2, '0')}</span>
                <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
              </div>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#F8F6F1]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/planes"
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Descubre cuánto puedes ahorrar implicándote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
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

          <Link
            href="/servicios"
            className="group flex flex-col justify-center border border-[#D4A017]/40 bg-[#07111d] p-6 text-[#F8F6F1] transition hover:-translate-y-0.5 hover:border-[#D4A017]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#D4A017]/40 bg-[#D4A017]/10 text-[#D4A017]">
              <ArrowRight className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-serif text-xl font-bold leading-tight">Ver todos los servicios</h3>
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">Explora el catálogo completo, organizado por categoría.</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
              Explorar
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Authority() {
  return (
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          dark
          centered
          eyebrow="Confianza"
          title="Expertos de verdad, no un chatbot con traje"
          text="Casi 20 años de trayectoria fiscal y legal, con las acreditaciones que dan respaldo real a cada trámite."
        />

        <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {authorityItems.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="border border-[#D4A017]/25 bg-[#23364D]/35 p-6 text-center shadow-[0_20px_45px_rgba(13,27,42,0.32)]"
            >
              <Icon className="mx-auto h-9 w-9 stroke-[#D4A017]" strokeWidth={1.6} />
              <p className="mt-4 font-serif text-lg font-bold text-[#F8F6F1]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedServices() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Servicios destacados"
          title="Los trámites más solicitados, listos para empezar online."
          text="Cada servicio se orienta a un resultado concreto: documentación revisada, trámite presentado y seguimiento claro."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredServices.map(({ Icon, title, text, href }) => (
            <Link
              href={href}
              key={title}
              className="group border border-[#D4A017]/25 bg-[#F8F6F1] p-7 shadow-[0_10px_28px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.11)]"
            >
              <Icon className="h-9 w-9 stroke-[#D4A017]" strokeWidth={1.7} />
              <h3 className="mt-6 font-serif text-2xl font-bold text-[#0D1B2A]">{title}</h3>
              <p className="mt-4 min-h-24 text-sm leading-7 text-[#23364D]">{text}</p>
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
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          dark
          eyebrow="Proceso"
          title="Un flujo pensado para clientes que no quieren perder tiempo."
          text="La parte compleja ocurre detrás: tú ves el estado, entregas documentos y recibes el resultado."
          centered
        />

        <div className="mt-11 grid gap-4 md:grid-cols-4">
          {processSteps.map(({ Icon, title, text }, index) => (
            <article key={title} className="border border-[#D4A017]/25 bg-[#23364D]/35 p-6 shadow-[0_20px_45px_rgba(13,27,42,0.32)]">
              <div className="flex items-center justify-between">
                <span className="font-serif text-4xl font-bold text-[#D4A017]">{String(index + 1).padStart(2, '0')}</span>
                <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
              </div>
              <h3 className="mt-7 font-serif text-xl font-bold text-[#F8F6F1]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">{text}</p>
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
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            dark
            eyebrow="Holded Solution Partner certificado"
            title="La única asesoría que te vende Holded, te migra y te enseña a llevarlo."
            text="Como Solution Partner certificados gestionamos tu acceso a Holded con las mismas condiciones que tendrías directamente con ellos — más el acompañamiento que Holded no te da."
          />
          <Link
            href="/holded"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver todo lo que hacemos con Holded
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {holdedCards.map(({ Icon, title, text, href, cta }) => (
            <Link
              href={href}
              key={title}
              className="group flex flex-col border border-[#D4A017]/25 bg-[#23364D]/35 p-7 shadow-[0_20px_45px_rgba(13,27,42,0.32)] transition hover:-translate-y-0.5 hover:border-[#D4A017]"
            >
              <span className="flex h-11 w-11 items-center justify-center bg-[#D4A017]/15 text-[#D4A017]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-6 font-serif text-xl font-bold text-[#F8F6F1]">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[#9CA3AF]">{text}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#D4A017]">
                {cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Formacion() {
  const calAcademyUrl = getCalAcademyUrl();

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow="Formación"
            title="Que tu equipo entienda los números, no solo los introduzca."
            text="Programas prácticos de EXPERT Business Academy para trabajar la gestión empresarial y laboral con criterio, no a ciegas."
          />
          <Link
            href="/academy"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver todos los programas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {academyPrograms.map((program) => (
            <Link
              href={program.slug === academyPrograms[0].slug ? '/academy' : `/academy/${program.slug}`}
              key={program.slug}
              className="group border border-[#D4A017]/25 bg-[#F8F6F1] p-7 shadow-[0_10px_28px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.11)]"
            >
              <span className="flex h-11 w-11 items-center justify-center border border-[#D4A017]/25 bg-[#0D1B2A] text-[#D4A017]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-serif text-xl font-bold leading-tight text-[#0D1B2A]">{program.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#23364D]">{program.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 border border-[#D4A017]/25 px-2.5 py-1 text-xs font-semibold text-[#23364D]">
                  <Clock className="h-3.5 w-3.5 text-[#D4A017]" />
                  {program.hoursTraining}h + {program.hoursInternship || program.hoursTutoring || 0}h {program.hoursInternship ? 'prácticas' : 'tutoría'}
                </span>
                <span className="inline-flex items-center gap-1.5 border border-[#D4A017]/25 px-2.5 py-1 text-xs font-semibold text-[#23364D]">
                  <Award className="h-3.5 w-3.5 text-[#D4A017]" />
                  {program.price}
                </span>
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
                Ver programa
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <CalendlyButton
            url={calAcademyUrl}
            fallbackHref="/cita"
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#D4A017]/10"
          >
            Reservar entrevista de admisión
          </CalendlyButton>
        </div>
      </div>
    </section>
  );
}

function Operations() {
  return (
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          dark
          eyebrow="Continuidad"
          title="Para quien necesita algo más que un trámite puntual."
          text="EXPERT también cubre la gestión recurrente, la digitalización contable y el acompañamiento operativo."
          centered
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {operations.map(({ Icon, title, text }) => (
            <article key={title} className="border border-[#D4A017]/25 bg-[#23364D]/35 p-7 shadow-[0_20px_45px_rgba(13,27,42,0.32)]">
              <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
              <h3 className="mt-6 font-serif text-xl font-bold text-[#F8F6F1]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">{text}</p>
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
  const preview = getPublishedBlogArticles().slice(0, 3);

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            eyebrow="Blog"
            title="Últimos artículos"
            text="Guías prácticas sobre fiscalidad, extranjería y gestión, escritas sin tecnicismos."
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
                className="flex flex-col border border-[#D4A017]/20 bg-white p-6 shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017]/60"
              >
                <span className={`inline-block self-start border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
                  {article.category}
                </span>
                <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-[#0D1B2A]">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#23364D]">{article.excerpt}</p>
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
        <div className="mt-12 border border-[#D4A017]/25 bg-white p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">
                Alertas fiscales
              </p>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#0D1B2A] md:text-2xl">
                Recibe los próximos artículos en tu email
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#23364D]">
                Novedades fiscales, cambios en extranjería y guías prácticas. Sin spam. Cancela cuando quieras.
              </p>
            </div>
            <div className="md:min-w-[400px]">
              <NewsletterForm source="home" variant="light" layout="horizontal" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DocsPreview() {
  return (
    <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <SectionTitle
            dark
            eyebrow="Base de conocimientos"
            title="¿Prefieres resolverlo tú mismo antes de escribirnos?"
            text="Nuestra base de conocimientos reúne guías paso a paso sobre nacionalidad, fiscalidad y trámites habituales — para que encuentres la respuesta en dos minutos."
          />
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/docs"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <BookOpen className="h-4 w-4" />
              Explorar la base de conocimientos
            </Link>
            <Link
              href="/contacto"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10"
            >
              ¿No lo encuentras? Habla con nosotros
            </Link>
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
        <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
          ¿Empezamos a gestionar tu empresa de forma más inteligente?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#9CA3AF]">
          Cuenta con nosotros desde 49 €/mes. Cuanto más te impliques, menos pagas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/cita"
            className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Reservar cita gratuita
          </Link>
          <Link
            href="/planes"
            className="inline-flex min-h-12 items-center justify-center border border-[#D4A017]/60 px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10"
          >
            Ver planes y precios
          </Link>
        </div>
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
