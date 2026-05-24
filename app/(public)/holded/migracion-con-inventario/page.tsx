import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Calendar, Phone, BookOpen, FileText, ChevronDown } from 'lucide-react';
import { HoldedCalendlyButton } from '@/components/holded/HoldedCalendlyButton';
import { FaqSection } from '@/components/site/FaqSection';
import { articles } from '@/lib/utils/blog';

export const metadata: Metadata = {
  title: 'Migración a Holded con Inventario: catálogo, variantes y stock | EXPERT',
  description:
    'Importamos el catálogo completo de productos, variantes, stock inicial y almacenes a Holded, más el historial de facturas si lo necesitas. Holded Solution Partner certificados. 1.199 € + IVA.',
  alternates: { canonical: 'https://expertconsulting.es/holded/migracion-con-inventario' },
  openGraph: {
    type       : 'website',
    url        : 'https://expertconsulting.es/holded/migracion-con-inventario',
    title      : 'Migración a Holded con Inventario | EXPERT',
    description: 'Migra el catálogo de productos, variantes, stock y almacenes a Holded desde cualquier sistema. Partner Oficial Holded.',
    siteName   : 'EXPERT — Asesoría Fiscal y Legal',
    locale     : 'es_ES',
    images     : [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Migración a Holded con Inventario — EXPERT' }],
  },
};

const INCLUDES = [
  'Análisis del sistema origen y los datos disponibles',
  'Importación del maestro de productos y referencias',
  'Importación de variantes (talla, color, modelo) si aplica',
  'Importación de stock inicial por referencia y almacén',
  'Configuración de almacenes si hay más de uno',
  'Importación de facturas emitidas y recibidas si se incluye historial',
  'Importación del maestro de clientes y proveedores',
  'Validación de los datos importados en Holded',
  'Configuración básica de empresa en Holded si no está hecha',
  'Informe de incidencias detectadas durante la importación',
  'Soporte por email durante 30 días',
];

const NOT_INCLUDES = [
  { item: 'Integración en tiempo real con tienda online', alt: 'Requiere módulo de integración específico' },
  { item: 'Automatización de pedidos ni sincronización continua', alt: null },
  { item: 'Desarrollo de integraciones API personalizadas', alt: null },
  { item: 'Gestión mensual recurrente', alt: 'Ver planes mensuales EXPERT' },
  { item: 'Presentación de impuestos', alt: 'Ver nuestros planes' },
  { item: 'Formación en el módulo de inventario de Holded', alt: 'Ver Formación Holded' },
];

const FOR_WHOM = [
  'Pymes con catálogo de productos y gestión de stock.',
  'Empresas con tienda online que quieren centralizar en Holded.',
  'Distribuidores o almacenistas con referencias y variantes.',
  'Empresas que cambian de ERP y necesitan migrar inventario y facturación.',
  'Negocios con múltiples almacenes que quieren unificar la gestión.',
];

const HOW_WE_WORK = [
  {
    step : '01',
    title: 'Análisis del catálogo',
    text : 'Revisamos el sistema origen: número de referencias, variantes, almacenes y formato de exportación. Confirmamos el alcance antes de empezar.',
  },
  {
    step : '02',
    title: 'Preparación y mapeo',
    text : 'Transformamos los datos al formato que acepta Holded: referencias, variantes, stock por almacén y precios.',
  },
  {
    step : '03',
    title: 'Importación y validación',
    text : 'Importamos el catálogo y el stock en Holded y validamos que las referencias, variantes y cantidades son correctas.',
  },
  {
    step : '04',
    title: 'Entrega y soporte',
    text : 'Te entregamos un informe con lo importado y cualquier incidencia detectada. 30 días de soporte por email incluidos.',
  },
];

const MIN_DATA = [
  'Nombre y apellidos o razón social',
  'NIF / NIE / CIF',
  'Email de acceso al portal EXPERT',
  'Teléfono / WhatsApp',
  'Tipo de cliente: autónomo, SL u otra entidad',
  'Si ya tienes cuenta activa en Holded',
  'Sistema de origen (ContaPlus, A3, Sage, Excel, otro ERP)',
  'Número aproximado de referencias / SKUs de producto',
  'Si los productos tienen variantes y cuántas por referencia',
  'Si tienes múltiples almacenes',
  'Si el inventario está exportable en Excel/CSV',
  'Si quieres también importar historial de facturas',
];

const REQUIRED_DOCS = [
  'Exportación CSV/Excel del maestro de productos con stock actual',
  'Exportación CSV/Excel de variantes si aplica',
  'Exportación de ubicaciones de almacén si aplica',
  'Exportación de facturas emitidas/recibidas si se migra historial',
  'Exportación del maestro de clientes y proveedores',
  'Modelo 036/037 o alta fiscal para datos de empresa',
];

const FAQ = [
  {
    q: '¿Necesito tener Holded antes de contratar?',
    a: 'Sí. La migración importa datos en una cuenta de Holded activa. Si no tienes cuenta, te ayudamos con la prueba gratuita de 14 días y la configuración básica primero.',
  },
  {
    q: '¿Qué diferencia hay con Migración sin inventario?',
    a: 'Migración sin inventario solo mueve facturas, clientes y proveedores. Migración con inventario incluye además el catálogo completo: referencias, variantes, stock inicial y almacenes.',
  },
  {
    q: '¿Cuántas referencias se pueden migrar?',
    a: 'El precio base es adecuado para catálogos hasta 2.000 referencias. Si tienes más referencias, variantes complejas o múltiples almacenes, consultamos el alcance en una llamada antes de confirmar.',
  },
  {
    q: '¿Se puede sincronizar con la tienda online después?',
    a: 'La migración deja el inventario en Holded. La sincronización continua con tienda online (WooCommerce, Shopify, etc.) requiere un módulo adicional de integración.',
  },
  {
    q: '¿Incluye también las facturas históricas?',
    a: 'Sí, opcionalmente. Si necesitas importar también el historial de facturas, clientes y proveedores, se incluye en el mismo servicio.',
  },
  {
    q: '¿Tengo que dar mi API key de Holded?',
    a: 'No por WhatsApp ni por email. Cualquier acceso técnico se gestiona desde el portal seguro o mediante instrucciones de acceso directas.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Entre 3 y 6 semanas desde que recibimos los datos completos, según el volumen y complejidad del catálogo.',
  },
  {
    q: '¿Incluye formación en el módulo de inventario?',
    a: 'No directamente. Si necesitas formación para usar el módulo de inventario de Holded, existe el servicio de Formación Holded por separado.',
  },
];

const migracionConArticles = articles.filter((a) =>
  ['holded-inventario-guia-completa', 'migrar-inventario-a-holded', 'pack-starter-holded-vs-migracion'].includes(a.slug)
);

export default function MigracionConInventarioPage() {
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
              Migración a Holded · Con Inventario
            </p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-5xl">
              Tu catálogo completo en Holded — referencias, variantes y stock
            </h1>
            <p className="mt-6 text-base leading-8 text-[#9CA3AF] md:text-lg">
              Importamos el maestro de productos, variantes, stock inicial y almacenes
              desde cualquier sistema — limpio, validado y listo para operar. Con el
              historial de facturas incluido si lo necesitas.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/holded#precios"
                className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <ArrowRight className="h-4 w-4" />
                Preparar contratación — 1.199 € + IVA
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
              Primero confirmamos los datos básicos del catálogo. Solo pedimos los archivos
              cuando el alcance está confirmado.
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
                Si el catálogo supera 2.000 referencias, tiene variantes complejas o
                múltiples almacenes, recomendamos una llamada previa para valorar el
                alcance exacto.
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
            El catálogo completo de productos, variantes y stock importado en Holded,
            con los almacenes configurados y el historial de facturas si lo incluiste.
            Todo validado, sin duplicados y listo para operar.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/holded#precios"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <ArrowRight className="h-4 w-4" />
              Preparar contratación — 1.199 € + IVA
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
      {migracionConArticles.length > 0 && (
        <section className="bg-[#F8F6F1] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Blog</p>
              <h2 className="mt-4 font-serif text-3xl font-bold text-[#0D1B2A] md:text-4xl">
                Artículos relacionados
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {migracionConArticles.map((article) => (
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
            Tu inventario en Holded. Validado. Listo para operar.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#9CA3AF]">
            Pago único de 1.199 € + IVA. Sin suscripción. Sin compromisos adicionales.
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
            ¿Solo necesitas migrar facturas sin inventario?{' '}
            <Link href="/holded/migracion-sin-inventario" className="text-[#D4A017] underline underline-offset-2 hover:text-[#F2C14E]">
              Ver Migración sin inventario
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
