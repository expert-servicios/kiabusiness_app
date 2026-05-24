import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Calendar, Phone, BookOpen, FileText, ChevronDown } from 'lucide-react';
import { HoldedCalendlyButton } from '@/components/holded/HoldedCalendlyButton';
import { FaqSection } from '@/components/site/FaqSection';
import { articles } from '@/lib/utils/blog';

export const metadata: Metadata = {
  title: 'Pack Starter Holded: configuración inicial y onboarding | EXPERT',
  description:
    'Configuramos tu cuenta de Holded desde cero: datos fiscales, facturación, series, bancos y estructura inicial. Holded Solution Partner certificados. 499 € + IVA.',
  alternates: { canonical: 'https://expertconsulting.es/holded/pack-starter' },
  openGraph: {
    type       : 'website',
    url        : 'https://expertconsulting.es/holded/pack-starter',
    title      : 'Pack Starter Holded: configuración inicial y onboarding | EXPERT',
    description: 'Empieza con Holded bien configurado desde el primer día. Datos fiscales, facturación, bancos y estructura básica. Partner Oficial Holded.',
    siteName   : 'EXPERT — Asesoría Fiscal y Legal',
    locale     : 'es_ES',
    images     : [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Pack Starter Holded — EXPERT' }],
  },
};

const INCLUDES = [
  'Revisión inicial de la situación del cliente',
  'Configuración de datos fiscales (empresa / autónomo)',
  'Configuración básica de facturación',
  'Series de facturación si procede',
  'Revisión de impuestos básicos (IVA, retenciones)',
  'Configuración inicial de clientes y proveedores si procede',
  'Orientación sobre conexión bancaria (Open Banking)',
  'Revisión de permisos y accesos',
  'Guía básica de uso inicial de Holded',
  'Soporte por email durante 30 días',
];

const NOT_INCLUDES = [
  { item: 'Migración completa de facturas históricas', alt: 'Ver Migración sin inventario' },
  { item: 'Migración masiva de clientes y proveedores', alt: 'Ver Migración sin inventario' },
  { item: 'Inventario, almacenes o productos con stock', alt: 'Ver Migración con inventario' },
  { item: 'Integraciones API externas personalizadas', alt: 'Ver Módulo Integraciones' },
  { item: 'Contabilidad atrasada de ejercicios anteriores', alt: null },
  { item: 'Presentación de impuestos', alt: 'Ver nuestros planes' },
  { item: 'Gestión mensual recurrente', alt: 'Ver planes mensuales' },
];

const FOR_WHOM = [
  'Autónomos que empiezan con Holded desde cero.',
  'Sociedades pequeñas que quieren configurar bien la cuenta.',
  'Usuarios con cuenta Holded creada pero sin terminar de configurar.',
  'Clientes que quieren preparar la cuenta antes de contratar gestión mensual.',
  'Empresas que quieren ordenar facturación, bancos y datos fiscales.',
];

const HOW_WE_WORK = [
  {
    step : '01',
    title: 'Confirmación de datos',
    text : 'Recopilamos los datos básicos: razón social, NIF, dirección fiscal, actividad y situación de cuenta Holded.',
  },
  {
    step : '02',
    title: 'Revisión y diagnóstico',
    text : 'Revisamos el estado actual y definimos qué hay que configurar o ajustar antes de empezar.',
  },
  {
    step : '03',
    title: 'Configuración',
    text : 'Configuramos empresa, facturación, series, impuestos, accesos y orientación bancaria en tu cuenta.',
  },
  {
    step : '04',
    title: 'Entrega y soporte',
    text : 'Te entregamos la cuenta lista con una guía de primeros pasos. 30 días de soporte por email incluidos.',
  },
];

const MIN_DATA = [
  'Nombre y apellidos o razón social',
  'NIF / NIE / CIF',
  'Email de acceso al portal EXPERT',
  'Teléfono / WhatsApp',
  'Tipo de cliente: autónomo, SL u otra entidad',
  'Dirección fiscal / facturación',
  'Actividad económica',
  'Si ya tienes cuenta Holded: sí / no / no lo sé',
  'Si quieres conectar banco: sí / más adelante',
  'Si emites facturas con IVA',
];

const OPTIONAL_DOCS = [
  'Alta censal 036 / 037 (si la tienes)',
  'Escritura de constitución si es sociedad (si la tienes)',
  'Logo de empresa para facturas (opcional)',
  'Ejemplo de factura anterior (opcional)',
  'Listado simple de clientes si quieres cargar algunos (opcional)',
];

const FAQ = [
  {
    q: '¿Necesito tener Holded antes de contratar?',
    a: 'No. Si no tienes cuenta, gestionamos la prueba gratuita de 14 días por ti como parte del servicio. Puedes contratar Pack Starter sin tener Holded.',
  },
  {
    q: '¿Puedo contratarlo si ya tengo Holded?',
    a: 'Sí. En ese caso revisamos y ajustamos la configuración existente para que quede correctamente estructurada.',
  },
  {
    q: '¿Incluye migración completa de facturas históricas?',
    a: 'No. Pack Starter es configuración inicial. Si necesitas migrar historial de facturas, el servicio adecuado es Migración sin inventario o con inventario, según el caso.',
  },
  {
    q: '¿Incluye gestión de inventario o stock?',
    a: 'No. Si tienes productos, referencias o almacenes, necesitas Migración con inventario o un presupuesto específico.',
  },
  {
    q: '¿Es un plan mensual?',
    a: 'No. Pack Starter es un servicio de pago único (499 € + IVA). La gestión mensual recurrente va por los planes EXPERT.',
  },
  {
    q: '¿Tengo que dar mi API key de Holded?',
    a: 'No por WhatsApp ni por email. Cualquier acceso técnico se gestiona desde el portal seguro o mediante instrucciones de acceso directas.',
  },
  {
    q: '¿Puedo contratar gestión mensual después?',
    a: 'Sí. Pack Starter puede dejar la cuenta preparada como paso previo a la gestión mensual. Para los planes mensuales sí se requiere Holded conectado.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Entre 1 y 2 semanas desde que confirmamos los datos.',
  },
];

const packStarterArticles = articles.filter((a) =>
  ['como-empezar-con-holded', 'holded-autonomos-pequenas-empresas', 'pack-starter-holded-vs-migracion'].includes(a.slug)
);

export default function PackStarterPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Image
              src="/Holded-Logotype-Red_Light.svg"
              alt="Holded"
              width={100}
              height={30}
              className="mx-auto mb-6 h-8 w-auto"
            />
            <p className="text-xs font-bold uppercase tracking-[0.30em] text-[#D4A017]">
              Pack Starter · Onboarding a Holded
            </p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-5xl">
              Empieza con Holded bien configurado desde el primer día
            </h1>
            <p className="mt-6 text-base leading-8 text-[#9CA3AF] md:text-lg">
              Configuramos tu cuenta, datos fiscales, facturación, bancos y estructura inicial
              para que puedas trabajar con Holded de forma ordenada — sin perder horas
              tocando botones al azar.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/holded#precios"
                className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <ArrowRight className="h-4 w-4" />
                Preparar contratación — 499 € + IVA
              </Link>
              <a
                href="https://www.holded.com/es/precios"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017]/60 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
              >
                Solicitar prueba Holded 14 días
              </a>
              <HoldedCalendlyButton className="inline-flex min-h-12 items-center gap-2 border border-white/20 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#F8F6F1]/80 transition hover:bg-white/5">
                <Phone className="h-4 w-4" />
                Llamada 15 min
              </HoldedCalendlyButton>
            </div>

            <p className="mt-6 text-xs text-[#9CA3AF]">
              Pago único · No requiere Holded activo para contratar · Partner Oficial Holded
            </p>
          </div>
        </div>
      </section>

      {/* ── Para quién es ─────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Para quién es</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
              Esto es para ti si...
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOR_WHOM.map((item) => (
              <div key={item} className="flex gap-3 border border-[#D4A017]/25 bg-[#F8F6F1] p-5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                <p className="text-sm leading-6 text-[#23364D]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Qué incluye / no incluye ──────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Alcance</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">
              Qué incluye y qué no incluye
            </h2>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {/* Incluye */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Incluye</p>
              <div className="space-y-2">
                {INCLUDES.map((item) => (
                  <div key={item} className="flex gap-3 bg-[#23364D]/40 p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                    <p className="text-sm leading-6 text-[#F8F6F1]/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* No incluye */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">No incluye</p>
              <div className="space-y-2">
                {NOT_INCLUDES.map(({ item, alt }) => (
                  <div key={item} className="flex gap-3 bg-[#0D1B2A]/60 p-4">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    <div>
                      <p className="text-sm leading-6 text-[#F8F6F1]/75">{item}</p>
                      {alt && (
                        <p className="mt-0.5 text-xs text-[#D4A017]/80">{alt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo trabajamos ───────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Proceso</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
              Cómo trabajamos
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_WE_WORK.map(({ step, title, text }) => (
              <div key={step} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6">
                <p className="font-mono text-3xl font-bold text-[#D4A017]/40">{step}</p>
                <h3 className="mt-3 font-serif text-lg font-bold text-[#0D1B2A]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Datos que necesitaremos ───────────────────────────────────────── */}
      <section className="bg-[#F8F6F1] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Datos</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
              Qué necesitaremos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#23364D]">
              Para Pack Starter casi todo son datos, no documentos. Primero confirmamos
              lo básico y solo pedimos lo imprescindible.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#D4A017]" />
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D1B2A]">Datos obligatorios</p>
              </div>
              <div className="space-y-2">
                {MIN_DATA.map((item) => (
                  <div key={item} className="flex gap-3 border border-[#D4A017]/20 bg-white p-3.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                    <p className="text-sm leading-5 text-[#23364D]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#23364D]">Documentos opcionales</p>
              </div>
              <div className="space-y-2">
                {OPTIONAL_DOCS.map((item) => (
                  <div key={item} className="flex gap-3 border border-[#D4A017]/10 bg-white p-3.5">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A017]/40" />
                    <p className="text-sm leading-5 text-[#23364D]/75">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded border border-[#D4A017]/25 bg-[#D4A017]/5 p-4 text-sm leading-6 text-[#23364D]">
                Primero confirmamos datos básicos. Solo pediremos documentos si
                realmente hacen falta para tu caso concreto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Resultado esperado ────────────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Resultado</p>
          <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">
            Qué tienes al finalizar
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#9CA3AF]">
            Una cuenta de Holded preparada para empezar a emitir facturas, organizar
            datos básicos y avanzar hacia una gestión más ordenada — sin errores de
            configuración que corrijas meses después.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/holded#precios"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <ArrowRight className="h-4 w-4" />
              Preparar contratación — 499 € + IVA
            </Link>
            <HoldedCalendlyButton className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017]/50 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10">
              <Calendar className="h-4 w-4" />
              Llamada 15 min
            </HoldedCalendlyButton>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">FAQ</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
              Preguntas frecuentes
            </h2>
          </div>
          <FaqSection items={FAQ} />
        </div>
      </section>

      {/* ── Artículos relacionados ────────────────────────────────────────── */}
      {packStarterArticles.length > 0 && (
        <section className="bg-[#F8F6F1] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Blog</p>
              <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
                Artículos relacionados
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packStarterArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group flex flex-col border border-[#D4A017]/20 bg-white p-6 transition hover:border-[#D4A017]/50"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#D4A017]" />
                    <span className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">{article.readTime}</span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-[#0D1B2A] group-hover:text-[#23364D]">
                    {article.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#23364D]/75">{article.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#D4A017]">
                    Leer artículo <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Image
            src="/Holded-Logotype-Red_Light.svg"
            alt="Holded"
            width={80}
            height={24}
            className="mx-auto mb-6 h-6 w-auto opacity-70"
          />
          <h2 className="font-serif text-3xl font-bold md:text-4xl">
            Empieza con Holded de forma ordenada
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#9CA3AF]">
            Pago único de 499 € + IVA. Sin suscripción. Sin compromisos adicionales.
            Con 30 días de soporte incluidos.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/holded#precios"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-10 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <ArrowRight className="h-4 w-4" />
              Preparar contratación
            </Link>
            <HoldedCalendlyButton className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017]/50 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10">
              <Phone className="h-4 w-4" />
              Llamada 15 min sin coste
            </HoldedCalendlyButton>
          </div>
          <p className="mt-6 text-xs text-[#9CA3AF]">
            ¿Necesitas migrar historial o inventario?{' '}
            <Link href="/holded" className="text-[#D4A017] underline underline-offset-2 hover:text-[#F2C14E]">
              Ver todos los servicios Holded
            </Link>
          </p>
        </div>
      </section>

    </main>
  );
}
