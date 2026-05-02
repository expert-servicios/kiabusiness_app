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
    title: 'Nos envías tu documentación',
    text: 'Por email o plataforma segura. Nos adaptamos a ti.',
    Icon: Upload
  },
  {
    title: 'Revisamos tu caso',
    text: 'Analizamos tu situación y te proponemos la mejor opción.',
    Icon: Search
  },
  {
    title: 'Presentamos o gestionamos el trámite',
    text: 'Nos encargamos de todo el proceso para que no te preocupes de nada.',
    Icon: Send
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

const accreditations: Array<
  | { type: 'text'; label: string }
  | { type: 'image'; label: string; src: string; width: number; height: number; className?: string }
> = [
  { type: 'text', label: 'Agencia Tributaria' },
  {
    type: 'image',
    label: 'Red PAE',
    src: '/logo-RedPAE/Logo_RedPAE_Logotipo_Color.png',
    width: 220,
    height: 72,
    className: 'max-h-12'
  },
  { type: 'text', label: 'Generalitat Valenciana' },
  { type: 'text', label: 'holded' },
  {
    type: 'image',
    label: 'Camerfirma',
    src: '/LogoCamerfirmaSimple.webp',
    width: 220,
    height: 72,
    className: 'max-h-10'
  }
];

export default function HomePage() {
  return (
    <main className="bg-[#f8f4eb] text-[#07111d]">
      <Hero />
      <Services />
      <PartnerStrip />
      <HowItWorks />
      <Reviews />
      <FinalCta />
      <Accreditations />
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

function PartnerStrip() {
  return (
    <section className="bg-[#061321] px-6 py-8 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:items-center">
        <div className="rounded-[1.75rem] border border-[#d7a33a]/20 bg-white/5 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[#f7e6bc]">Tecnología certificada</p>
          <p className="mt-3 text-xl font-bold">Holded Solution Partner</p>
          <p className="mt-2 text-sm leading-6 text-white/70">Contabilidad y fiscalidad con soporte digital seguro.</p>
        </div>
        <PartnerItem title="Partner certificado" text="Holded para gestión contable y fiscal." />
        <PartnerItem title="Colaboradora social de la AEAT" text="N.º 00000" />
        <PartnerItem title="Entidad colaboradora" text="Camerfirma para trámites digitales." />
      </div>
    </section>
  );
}

function PartnerItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l border-[#d7a33a]/45 pl-5">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/72">{text}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="bg-[#fbf8f0] px-6 py-9 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Así de fácil" compact />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {processSteps.map(({ Icon, title, text }, index) => (
            <article key={title} className="relative text-center">
              {index < processSteps.length - 1 && (
                <ChevronRight className="absolute right-[-34px] top-12 hidden h-7 w-7 text-[#c88b25] md:block" />
              )}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#d8cbb5] bg-white text-[#061321] shadow-sm">
                <Icon className="h-10 w-10" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold">
                {index + 1}. {title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#29384a]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
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
    <section className="relative overflow-hidden bg-[#061321] px-6 py-8 text-white">
      <div className="pointer-events-none absolute -left-24 bottom-0 h-32 w-80 rounded-tr-full border-t-[13px] border-[#d7a33a]/80" />
      <div className="pointer-events-none absolute -right-24 top-0 h-32 w-80 rounded-bl-full border-b-[13px] border-[#d7a33a]/80" />
      <div className="relative mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold uppercase leading-tight md:text-4xl">
            Nos ocupamos de todo.
            <span className="block text-[#d7a33a]">Tú solo envías los datos.</span>
          </h2>
          <p className="mt-3 text-base text-white/76">Solicita tu presupuesto hoy y recibe una propuesta personalizada en 24 horas.</p>
        </div>
        <div className="text-center">
          <Link
            href="/solicitar-presupuesto"
            className="inline-flex min-h-14 min-w-[310px] items-center justify-center gap-3 rounded-md bg-[#c88b25] px-8 py-4 text-xl font-bold text-[#061321] shadow-xl shadow-[#0D1B2A]/25 transition hover:bg-[#b57a1e]"
          >
            <Calculator className="h-7 w-7" />
            Solicitar presupuesto
          </Link>
          <p className="mt-2 text-sm text-white/70">Sin compromiso. Presupuesto personalizado.</p>
        </div>
      </div>
    </section>
  );
}

function Accreditations() {
  return (
    <section className="bg-[#fbf8f0] px-6 py-8 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <SectionTitle title="Colaboraciones y acreditaciones oficiales" compact />
        <div className="mt-7 grid grid-cols-2 items-center gap-6 border-t border-[#d8cbb5] pt-6 text-center text-lg font-semibold text-[#07111d]/46 md:grid-cols-5">
          {accreditations.map((item) => (
            <div key={item.label} className="flex min-h-14 items-center justify-center">
              {item.type === 'image' ? (
                <Image
                  src={item.src}
                  alt={item.label}
                  width={item.width}
                  height={item.height}
                  className={`h-auto w-auto object-contain grayscale opacity-70 transition hover:grayscale-0 hover:opacity-100 ${item.className ?? ''}`}
                />
              ) : (
                <span>{item.label}</span>
              )}
            </div>
          ))}
        </div>
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
