import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Calendar, Phone, BookOpen, FileText, ChevronDown } from 'lucide-react';
import { HoldedCalendlyButton } from '@/components/holded/HoldedCalendlyButton';
import { FaqSection } from '@/components/site/FaqSection';
import { articles } from '@/lib/utils/blog';

export const metadata: Metadata = {
  title: 'Migración a Holded sin Inventario: importar facturas y datos históricos | EXPERT',
  description:
    'Importamos tu historial completo de facturas, clientes y proveedores a Holded desde ContaPlus, A3, Sage, Excel u otro sistema. Holded Solution Partner certificados. 899 € + IVA.',
  alternates: { canonical: 'https://expertconsulting.es/holded/migracion-sin-inventario' },
  openGraph: {
    type       : 'website',
    url        : 'https://expertconsulting.es/holded/migracion-sin-inventario',
    title      : 'Migración a Holded sin Inventario | EXPERT',
    description: 'Migra el historial de facturas, clientes y proveedores a Holded desde cualquier sistema. Sin perder datos. Partner Oficial Holded.',
    siteName   : 'EXPERT — Asesoría Fiscal y Legal',
    locale     : 'es_ES',
    images     : [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Migración a Holded sin Inventario — EXPERT' }],
  },
};

const INCLUDES = [
  'Análisis del sistema origen y los datos disponibles',
  'Importación de facturas emitidas (hasta 3 años según contrato)',
  'Importación de facturas recibidas si están disponibles en CSV/Excel',
  'Importación del maestro de clientes',
  'Importación del maestro de proveedores',
  'Validación de los datos importados en Holded',
  'Configuración básica de empresa en Holded si no está hecha',
  'Informe de incidencias detectadas durante la importación',
  'Soporte por email durante 30 días',
];

const NOT_INCLUDES = [
  { item: 'Inventario, almacenes, referencias de producto ni stock', alt: 'Ver Migración con inventario' },
  { item: 'Configuración completa de Holded desde cero', alt: 'Ver Pack Starter (paso previo recomendado)' },
  { item: 'Contabilidad analítica avanzada', alt: null },
  { item: 'Integración con ERPs externos ni APIs', alt: null },
  { item: 'Gestión mensual recurrente', alt: 'Ver planes mensuales EXPERT' },
  { item: 'Presentación de impuestos', alt: 'Ver nuestros planes' },
  { item: 'Formación en Holded', alt: 'Ver Formación Holded' },
];

const FOR_WHOM = [
  'Autónomos y pymes con historial en ContaPlus, A3, Sage o Excel.',
  'Empresas que quieren dejar todo el historial registrado en Holded.',
  'Clientes que quieren cerrar un sistema antiguo y centralizar en Holded.',
  'Usuarios que necesitan mantener la trazabilidad de facturas pasadas.',
  'Empresas de servicios sin inventario que quieren importar documentos y maestros.',
];

const HOW_WE_WORK = [
  {
    step : '01',
    title: 'Análisis de los datos',
    text : 'Revisamos el sistema origen, qué datos hay disponibles y en qué formato. Confirmamos el alcance y el volumen antes de empezar.',
  },
  {
    step : '02',
    title: 'Preparación y mapeo',
    text : 'Transformamos los datos del sistema origen al formato que acepta Holded. Limpiamos duplicados, errores de NIF y campos vacíos.',
  },
  {
    step : '03',
    title: 'Importación y validación',
    text : 'Importamos los datos a Holded y validamos que los totales cuadran, los NIFs son correctos y no hay duplicados.',
  },
  {
    step : '04',
    title: 'Entrega y soporte',
    text : 'Te entregamos un informe con lo importado y cualquier incidencia. 30 días de soporte por email incluidos.',
  },
];

const MIN_DATA = [
  'Nombre y apellidos o razón social',
  'NIF / NIE / CIF',
  'Email de acceso al portal EXPERT',
  'Teléfono / WhatsApp',
  'Tipo de cliente: autónomo, SL u otra entidad',
  'Si ya tienes cuenta activa en Holded',
  'Sistema de origen (ContaPlus, A3, Sage, Excel, otro)',
  'Años de historial a migrar',
  'Volumen estimado de registros (facturas emitidas + recibidas)',
  'Si los datos están exportables en CSV/Excel',
  'Si tienes inventario, stock o referencias de producto',
];

const REQUIRED_DOCS = [
  'Exportación CSV/Excel de facturas emitidas por período',
  'Exportación CSV/Excel de facturas recibidas (si disponible)',
  'Exportación del maestro de clientes y proveedores',
  'Modelo 036/037 o alta fiscal (datos de empresa)',
];

const FAQ = [
  {
    q: '¿Necesito tener Holded antes de contratar?',
    a: 'Sí. La migración importa datos en una cuenta de Holded activa. Si no tienes cuenta, te ayudamos con la prueba gratuita de 14 días y la configuración básica primero (Pack Starter puede ser el paso previo).',
  },
  {
    q: '¿Qué sistemas de origen son compatibles?',
    a: 'Cualquier sistema que permita exportar datos en CSV o Excel: ContaPlus, A3, Sage, Factura Directa, Excel propio, etc. Si tu sistema no exporta directamente, lo valoramos en una llamada.',
  },
  {
    q: '¿Cuántos años de historial se pueden migrar?',
    a: 'El precio base cubre hasta 3 años. Si tienes más de 3 años o más de 10.000 registros, consultamos el alcance antes de confirmar.',
  },
  {
    q: '¿Incluye inventario o stock?',
    a: 'No. Si tienes productos, referencias o almacenes, el servicio correcto es Migración con inventario (1.199 € + IVA).',
  },
  {
    q: '¿Incluye la configuración de Holded?',
    a: 'Incluye la configuración básica necesaria para que la importación sea correcta. Si necesitas una configuración completa desde cero, el punto de partida puede ser Pack Starter.',
  },
  {
    q: '¿Tengo que dar mi API key de Holded?',
    a: 'No por WhatsApp ni por email. Cualquier acceso técnico se gestiona desde el portal seguro o mediante instrucciones de acceso directas.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Entre 2 y 4 semanas desde que recibimos los datos completos y en formato exportable. Si los datos necesitan mucha limpieza previa, el plazo puede alargarse.',
  },
  {
    q: '¿Puedo contratar gestión mensual después?',
    a: 'Sí. Una vez migrado el historial, la cuenta queda preparada para la gestión mensual. Para los planes mensuales sí se requiere Holded conectado.',
  },
];

const migracionSinArticles = articles.filter((a) =>
  ['migrar-contaplus-a-holded', 'holded-migracion-sin-inventario-guia', 'pack-starter-holded-vs-migracion'].includes(a.slug)
);

export default function MigracionSinInventarioPage() {
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
              Migración a Holded · Sin Inventario
            </p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-5xl">
              Tu historial de facturas en Holded, sin perder ningún dato
            </h1>
            <p className="mt-6 text-base leading-8 text-[#9CA3AF] md:text-lg">
              Importamos el historial completo de facturas, clientes y proveedores desde
              ContaPlus, A3, Sage, Excel u otro sistema — limpio, validado y listo para
              trabajar desde el primer día.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/holded#precios"
                className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <ArrowRight className="h-4 w-4" />
                Preparar contratación — 899 € + IVA
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
              Pago único · Requiere cuenta Holded activa · Partner Oficial Holded
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
              Primero confirmamos los datos básicos y el sistema de origen. Solo pedimos
              los archivos cuando el alcance está confirmado.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#D4A017]" />
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D1B2A]">Datos de contexto</p>
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
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#23364D]">Archivos de datos (cuando se confirme el alcance)</p>
              </div>
              <div className="space-y-2">
                {REQUIRED_DOCS.map((item) => (
                  <div key={item} className="flex gap-3 border border-[#D4A017]/10 bg-white p-3.5">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A017]/40" />
                    <p className="text-sm leading-5 text-[#23364D]/75">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded border border-[#D4A017]/25 bg-[#D4A017]/5 p-4 text-sm leading-6 text-[#23364D]">
                Si el volumen supera 10.000 registros o más de 3 años de historial,
                recomendamos una llamada previa para valorar el alcance exacto.
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
            Todo el historial de facturas, clientes y proveedores importado en Holded,
            validado y accesible. Sin duplicados, sin errores de NIF y con los totales
            cuadrados. Listo para operar y para la gestión mensual si lo necesitas.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/holded#precios"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <ArrowRight className="h-4 w-4" />
              Preparar contratación — 899 € + IVA
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
      {migracionSinArticles.length > 0 && (
        <section className="bg-[#F8F6F1] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Blog</p>
              <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
                Artículos relacionados
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {migracionSinArticles.map((article) => (
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
            Cierra el sistema antiguo. Empieza con Holded.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#9CA3AF]">
            Pago único de 899 € + IVA. Sin suscripción. Sin compromisos adicionales.
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
            ¿Necesitas migrar también inventario?{' '}
            <Link href="/holded/migracion-con-inventario" className="text-[#D4A017] underline underline-offset-2 hover:text-[#F2C14E]">
              Ver Migración con inventario
            </Link>
            {' · '}
            <Link href="/holded" className="text-[#D4A017] underline underline-offset-2 hover:text-[#F2C14E]">
              Ver todos los servicios Holded
            </Link>
          </p>
        </div>
      </section>

    </main>
  );
}
