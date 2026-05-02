import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  ArrowRight,
  Briefcase,
  Calculator,
  Check,
  ChevronRight,
  FileCheck,
  FileText,
  Globe2,
  Home,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Upload
} from 'lucide-react';
import { Hero } from '@/components/site/Hero';

type IconItem = {
  Icon: LucideIcon;
};

const serviceCategories: Array<
  IconItem & {
    title: string;
    href: string;
    items: string[];
    tone: 'navy' | 'gold';
  }
> = [
  {
    title: 'Declaraciones e Impuestos',
    href: '/servicios/declaraciones-impuestos',
    items: ['IRPF', 'Modelo 151', 'No residentes'],
    tone: 'navy',
    Icon: FileText
  },
  {
    title: 'Extranjería y Nacionalidad',
    href: '/servicios/extranjeria-nacionalidad',
    items: ['Nacionalidad', 'Residencias', 'Renovaciones'],
    tone: 'gold',
    Icon: Globe2
  },
  {
    title: 'Empresas y Autónomos',
    href: '/servicios/empresas-autonomos',
    items: ['Alta de autónomos', 'Constitución de empresas', 'Contabilidad e impuestos'],
    tone: 'navy',
    Icon: Briefcase
  },
  {
    title: 'Tráfico y Capitanía Marítima',
    href: '/servicios/trafico-capitania-maritima',
    items: ['Transferencias', 'Matriculaciones', 'Gestiones náuticas'],
    tone: 'gold',
    Icon: Anchor
  },
  {
    title: 'Notaría y Propiedades',
    href: '/servicios/notaria-propiedades',
    items: ['Compraventas', 'Escrituras', 'Gestión documental'],
    tone: 'navy',
    Icon: Home
  },
  {
    title: 'Gestiones Especializadas',
    href: '/servicios/gestiones-especializadas',
    items: ['Camerfirma', 'Migraciones a Holded', 'Automatizaciones'],
    tone: 'gold',
    Icon: Settings
  }
];

const featuredServices: Array<IconItem & { title: string; text: string; href: string; tone: 'navy' | 'gold' | 'red' }> = [
  {
    title: 'Declaración de la Renta',
    text: 'Preparamos y presentamos tu IRPF de forma rápida y segura.',
    href: '/servicios/declaraciones-impuestos',
    tone: 'navy',
    Icon: Calculator
  },
  {
    title: 'Modelo 151',
    text: 'Para trabajadores, profesionales e inversores desplazados.',
    href: '/servicios/declaraciones-impuestos',
    tone: 'gold',
    Icon: FileCheck
  },
  {
    title: 'Nacionalidad española',
    text: 'Te acompañamos en todo el proceso hasta conseguir tu nacionalidad.',
    href: '/servicios/extranjeria-nacionalidad',
    tone: 'red',
    Icon: ShieldCheck
  }
];

const processSteps: Array<IconItem & { title: string; text: string }> = [
  {
    title: 'Contratas el servicio online',
    text: 'Elige tu servicio y contrátalo completamente por internet.',
    Icon: Settings
  },
  {
    title: 'Subes la documentación requerida',
    text: 'Envía tus archivos desde la plataforma o por email de forma segura.',
    Icon: Upload
  },
  {
    title: 'Gestionamos el trámite',
    text: 'Nos encargamos de todo el proceso con seguimiento y control continuo.',
    Icon: Search
  },
  {
    title: 'Recibes el resultado y justificantes',
    text: 'Te entregamos la documentación final y los justificantes listos para usar.',
    Icon: Check
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
    text: 'Muy atenta y resolutiva. Me ayudó con la nacionalidad española y todo fue más fácil de lo que esperaba.',
    name: 'Markus B.',
    country: 'Alemania',
    badge: 'DE'
  }
];


export default function HomePage() {
  return (
    <main className="bg-[#f8f4eb] text-[#07111d]">
      <Hero />
      <Services />
      <Certifications />
      <HowItWorks />
      <ClientPortal />
      <SubscriptionPlans />
      <TrainingMentoring />
      <Reviews />
      <FinalCta />
    </main>
  );
}

function Services() {
  return (
    <section className="bg-[#f8f4eb] px-6 py-8 text-[#07111d] md:py-10">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Soluciones legales, fiscales y administrativas" eyebrow="Áreas de especialización" />

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviceCategories.map(({ Icon, title, href, items, tone }) => (
            <Link
              href={href}
              key={title}
              className="group rounded-lg border border-[#d8cbb5] bg-white/88 p-5 shadow-[0_8px_22px_rgba(7,17,29,0.08)] transition hover:-translate-y-0.5 hover:border-[#d7a33a] hover:shadow-[0_14px_30px_rgba(7,17,29,0.12)]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                    tone === 'gold' ? 'bg-[#c88b25] text-white' : 'bg-[#061321] text-white'
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold leading-tight">{title}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-[#29384a]">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c88b25]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#b57a1e]">
                    Ver servicios
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7">
          <SectionTitle title="Servicios destacados" compact />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {featuredServices.map(({ Icon, title, text, href, tone }) => {
              const iconClass =
                tone === 'red'
                  ? 'bg-[#9d1f2f] text-white'
                  : tone === 'gold'
                    ? 'bg-[#c88b25] text-white'
                    : 'bg-[#061321] text-white';

              return (
                <Link
                  href={href}
                  key={title}
                  className="group rounded-lg border border-[#d8cbb5] bg-white/88 p-5 shadow-[0_8px_22px_rgba(7,17,29,0.08)] transition hover:border-[#d7a33a]"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold leading-tight">{title}</h3>
                      <p className="mt-2 text-sm leading-5 text-[#29384a]">{text}</p>
                      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#b57a1e]">
                        Más información
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Certifications() {
  const certifications = [
    {
      label: 'Holded Solution Partner',
      src: '/Holded-Logotype-Red_Light.svg',
      width: 220,
      height: 64
    },
    {
      label: 'Agencia Tributaria',
      src: '/Agencia_Tributaria.svg.png',
      width: 180,
      height: 64
    },
    {
      label: 'Red PAE',
      src: '/logo-RedPAE/Logo_RedPAE_Logotipo_Color.png',
      width: 220,
      height: 64
    },
    {
      label: 'Camerfirma',
      src: '/LogoCamerfirmaSimple.webp',
      width: 200,
      height: 64
    }
  ];

  return (
    <section className="bg-[#f8f4eb] px-6 py-14 text-[#07111d]">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="font-serif text-2xl font-bold uppercase tracking-wide">Certificado por</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#29384a]">
          Trabajamos con entidades oficiales y socios tecnológicos para garantizar un servicio seguro y fiable.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {certifications.map((item) => (
            <div key={item.label} className="flex items-center justify-center rounded-3xl border border-[#d8cbb5] bg-white p-6 shadow-[0_12px_30px_rgba(7,17,29,0.08)]">
              <Image src={item.src} alt={item.label} width={item.width} height={item.height} className="max-h-16 object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-[#fbf8f0] px-6 py-12 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Cómo funciona" compact />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-10">
          {processSteps.map(({ Icon, title, text }, index) => (
            <article key={title} className="relative rounded-[2rem] border border-[#d8cbb5] bg-white p-8 text-center shadow-[0_18px_45px_rgba(7,17,29,0.08)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c88b25]/40 bg-[#fdf6eb] text-[#c88b25] shadow-sm">
                <Icon className="h-10 w-10" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold">{title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#29384a]">{text}</p>
              {index < processSteps.length - 1 && (
                <span className="absolute right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-[#c88b25] text-white md:flex items-center justify-center">→</span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientPortal() {
  return (
    <section className="bg-white px-6 py-12 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Portal de clientes" compact />
        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="max-w-xl text-sm leading-7 text-[#29384a]">
              Accede a tu área privada para subir documentos, consultar el estado de tu caso, descargar los documentos finales y gestionar tus facturas desde un solo lugar.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-[#07111d]">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#c88b25]" />
                Subida segura de documentación y archivos.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#c88b25]" />
                Seguimiento del estado del expediente en tiempo real.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#c88b25]" />
                Descarga de justificantes y documentación final.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#c88b25]" />
                Gestión de facturas y comunicaciones con tu asesor.
              </li>
            </ul>
          </div>
          <div className="rounded-[2rem] border border-[#d8cbb5] bg-[#f8f4eb] p-8 shadow-[0_18px_45px_rgba(7,17,29,0.08)]">
            <h3 className="font-serif text-xl font-bold">Tus gestiones digitales</h3>
            <p className="mt-4 text-sm leading-7 text-[#29384a]">
              Un espacio diseñado para que puedas colaborar con EXPERT de forma ordenada y segura, desde cualquier dispositivo.
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold">Documentos</p>
                <p className="mt-2 text-sm text-[#4c5b6d]">Carga tus archivos y comparte enlaces seguros.</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold">Estado del caso</p>
                <p className="mt-2 text-sm text-[#4c5b6d]">Consulta pasos completados y próximos plazos.</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold">Descargas</p>
                <p className="mt-2 text-sm text-[#4c5b6d]">Descarga tu documentación final y justificantes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubscriptionPlans() {
  return (
    <section className="bg-[#f8f4eb] px-6 py-12 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Planes de gestión mensual" compact />
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#29384a]">
          Suscripción mensual para autónomos, pymes y empresas que necesitan mantenimiento fiscal continuo y atención personalizada.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PlanCard title="Autónomos" description="Gestión fiscal mensual, declaraciones y soporte prioritario." />
          <PlanCard title="Pymes" description="Contabilidad, impuestos y seguimiento administrativo continuo." />
          <PlanCard title="Empresas" description="Asesoría legal y fiscal completa con reportes periódicos." />
        </div>
      </div>
    </section>
  );
}

function PlanCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-[#d8cbb5] bg-white p-8 shadow-[0_18px_45px_rgba(7,17,29,0.08)]">
      <h3 className="font-serif text-xl font-bold">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-[#29384a]">{description}</p>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#c88b25]">Gestión continua</p>
    </div>
  );
}

function TrainingMentoring() {
  return (
    <section className="bg-white px-6 py-12 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Formación y mentoring" compact />
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#29384a]">
          Apoyo experto en migración a Holded, formación para tu equipo y mentoring continuo para tu negocio.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card title="Migración a Holded" text="Te acompañamos en la migración de datos y configuración de tu cuenta Holded." />
          <Card title="Formación Holded" text="Capacitación práctica para que uses Holded con confianza y velocidad." />
          <Card title="Mentoring" text="Sesiones periódicas para mejorar procesos y optimizar tu gestión empresarial." />
        </div>
      </div>
    </section>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-[#d8cbb5] bg-[#f8f4eb] p-8 shadow-[0_18px_45px_rgba(7,17,29,0.08)]">
      <h3 className="font-serif text-xl font-bold">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-[#29384a]">{text}</p>
    </div>
  );
}

function Reviews() {
  return (
    <section className="bg-[#061321] px-6 py-9 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Lo que dicen nuestros clientes" dark compact />
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.name} className="rounded-lg border border-[#c88b25]/70 bg-[#0a1b2d] p-5 shadow-xl shadow-black/15">
              <p className="font-serif text-5xl leading-none text-[#d7a33a]">“</p>
              <p className="-mt-4 text-sm leading-6 text-white/82">{review.text}</p>
              <div className="mt-3 flex gap-1 text-[#d7a33a]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#061321]">
                  {review.badge}
                </span>
                <div>
                  <p className="font-bold text-white">{review.name}</p>
                  <p className="text-sm text-white/65">{review.country}</p>
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
    <section className="relative overflow-hidden bg-[#061321] px-6 py-12 text-white">
      <div className="pointer-events-none absolute -left-24 bottom-0 h-32 w-80 rounded-tr-full border-t-[13px] border-[#d7a33a]/80" />
      <div className="pointer-events-none absolute -right-24 top-0 h-32 w-80 rounded-bl-full border-b-[13px] border-[#d7a33a]/80" />
      <div className="relative mx-auto max-w-6xl text-center">
        <h2 className="font-serif text-3xl font-bold uppercase leading-tight md:text-4xl">
          ¿No tienes claro qué servicio necesitas?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/75">
          Te ayudamos a escoger la solución fiscal o legal que mejor encaja con tu situación.
        </p>
        <Link
          href="/solicitar-presupuesto"
          className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-[#c88b25] px-8 py-4 text-lg font-bold uppercase tracking-[0.16em] text-[#061321] shadow-[0_18px_45px_rgba(13,27,42,0.28)] transition hover:bg-[#b57a1e]"
        >
          Solicitar presupuesto
        </Link>
      </div>
    </section>
  );
}


function SectionTitle({
  title,
  eyebrow,
  compact = false,
  dark = false
}: {
  title: string;
  eyebrow?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={`text-center ${compact ? '' : 'mb-1'}`}>
      <h2
        className={`font-serif font-bold uppercase tracking-wide ${
          compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
        } ${dark ? 'text-white' : 'text-[#07111d]'}`}
      >
        {title}
      </h2>
      {eyebrow && (
        <p className={`mt-2 text-xs font-bold uppercase tracking-[0.22em] ${dark ? 'text-white/64' : 'text-[#29384a]/74'}`}>
          {eyebrow}
        </p>
      )}
      <div className="mx-auto mt-3 h-px w-20 bg-[#d7a33a]" />
    </div>
  );
}
