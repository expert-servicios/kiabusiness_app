import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  ArrowRight,
  Award,
  Briefcase,
  Calculator,
  Check,
  ChevronRight,
  FileCheck,
  FileText,
  Globe2,
  Home,
  MessageCircle,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Upload
} from 'lucide-react';

type IconItem = {
  Icon: LucideIcon;
};

const trustItems: Array<IconItem & { title: string; subtitle: string }> = [
  { title: '+20 años', subtitle: 'de experiencia', Icon: Award },
  { title: 'Colaboradora', subtitle: 'social de la AEAT', Icon: ShieldCheck },
  { title: 'Especialistas', subtitle: 'expatriados', Icon: Globe2 },
  { title: 'Atención', subtitle: 'profesional y cercana', Icon: Check }
];

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
    text: 'Por WhatsApp, email o plataforma segura. Nos adaptamos a ti.',
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

const accreditations = ['Agencia Tributaria', 'Punto PAE', 'Generalitat Valenciana', 'holded', 'Camerfirma'];

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

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#061321] text-white">
      <Image
        src="/expert-app.png"
        alt="Fondo de marca EXPERT"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover opacity-30"
      />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(215,163,58,0.18),transparent_18%),linear-gradient(180deg,rgba(6,19,33,0.96),rgba(6,19,33,0.98))]" />
      <div className="pointer-events-none absolute -right-24 top-24 hidden h-72 w-72 rounded-full bg-[#d7a33a]/10 blur-3xl lg:block" />
      <div className="pointer-events-none absolute -left-24 bottom-0 hidden h-72 w-72 rounded-full bg-[#d7a33a]/10 blur-3xl lg:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#061321] to-transparent" />
      <Image
        src="/logos/expert-mark-light-clean.png"
        alt="Marca EXPERT"
        width={640}
        height={460}
        priority
        className="pointer-events-none absolute right-[4%] top-16 z-0 hidden w-[38rem] max-w-[48vw] opacity-20 lg:block"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-[#d7a33a]/40 bg-[#d7a33a]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#f7e6bc]">
              Asesoría premium
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold uppercase leading-[0.92] tracking-[0.12em] text-white sm:text-6xl lg:text-[5.25rem]">
              <span className="block">Asesoría fiscal</span>
              <span className="block text-[#d7a33a]">y legal en España</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">
              Profesionalismo, confidencialidad y soluciones reales para residentes, expatriados, autónomos y empresas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="https://wa.me/34669045528"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#1fae4b] px-6 py-3 text-base font-bold text-white shadow-xl shadow-black/25 transition hover:bg-[#178d3f]"
              >
                <MessageCircle className="h-5 w-5" />
                Hablar por WhatsApp
              </Link>
              <Link
                href="/servicios"
                className="inline-flex min-h-12 items-center justify-center gap-4 rounded-md border border-[#d7a33a] px-7 py-3 text-base font-bold text-[#d7a33a] transition hover:bg-[#d7a33a] hover:text-[#061321]"
              >
                Ver servicios
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 md:max-w-2xl">
              {trustItems.map(({ Icon, title, subtitle }) => (
                <div key={title} className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/15 text-[#d7a33a]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs text-white/70">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_90px_rgba(0,0,0,0.35)] lg:block">
            <div className="mb-6 flex items-center justify-between rounded-3xl bg-[#0b2238]/90 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#f7e6bc]">Confianza certificada</p>
                <p className="mt-2 text-lg font-semibold text-white">Partner Holded y AEAT</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d7a33a]/15 text-[#d7a33a]">
                <Star className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-4 text-sm leading-6 text-white/75">
              <p>Tramitación fiscal y administrativa con tecnología segura y soporte digital.</p>
              <p>Gestión integral de impuestos, extranjería y constitución de empresas.</p>
              <p>Atención rápida, personalizada y orientada a resultados.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
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
          <p className="mt-3 text-base text-white/76">Confía en una profesional y olvídate de preocupaciones.</p>
        </div>
        <div className="text-center">
          <Link
            href="https://wa.me/34669045528"
            className="inline-flex min-h-14 min-w-[310px] items-center justify-center gap-3 rounded-md bg-[#1fae4b] px-8 py-4 text-xl font-bold text-white shadow-xl shadow-black/25 transition hover:bg-[#178d3f]"
          >
            <MessageCircle className="h-7 w-7" />
            Hablar por WhatsApp
          </Link>
          <p className="mt-2 text-sm text-white/70">Respuesta rápida y personalizada</p>
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
        <div className="mt-7 grid grid-cols-2 items-center gap-6 border-t border-[#d8cbb5] pt-6 text-center text-xl font-semibold text-[#07111d]/38 md:grid-cols-5">
          {accreditations.map((item) => (
            <div key={item}>{item}</div>
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
