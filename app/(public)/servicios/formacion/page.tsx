import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Monitor, ShieldCheck, ExternalLink, ChevronDown } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { FormacionBuyButton } from './FormacionBuyButton';
import { FormacionFaqs } from './FormacionFaqs';

export const metadata: Metadata = {
  title: 'Formación práctica con tus datos reales | EXPERT',
  description:
    'Formación personalizada 1:1 sobre tu PC, con tu certificado digital y tu acceso real a la AEAT, Seguridad Social, Holded y otras administraciones. 180 € + IVA por sesión de 2 horas.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/servicios/formacion',
    title: 'Formación práctica con tus datos reales | EXPERT',
    description:
      'Sesiones 1:1 sobre tu propio PC: AEAT, Seguridad Social, Holded, alta de autónomo, constitución de empresa y más. 180 € + IVA / 2 h.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

const CALENDLY_URL = 'https://calendly.com/soy-kseniailicheva/reunion-informativa';

const areas = [
  {
    id: 'aeat',
    title: 'Sede Electrónica de la AEAT',
    description:
      'Accedemos juntos a la Sede de la Agencia Tributaria con tu certificado digital. Aprendes a consultar tus datos fiscales, descargar declaraciones, atender notificaciones y requerimientos, presentar escritos y realizar cualquier gestión tributaria sin depender de nadie.',
    topics: [
      'Consultar y descargar tus declaraciones',
      'Atender notificaciones y requerimientos',
      'Presentar escritos y recursos',
      'Liquidar y presentar modelos (IVA, IRPF, Sociedades)'
    ]
  },
  {
    id: 'seguridad-social',
    title: 'Seguridad Social — Sede Electrónica',
    description:
      'Trabajamos sobre tu acceso real a la Sede Electrónica de la Seguridad Social. Aprenderás a consultar tu vida laboral, gestionar cotizaciones, realizar altas y bajas de trabajadores y obtener certificados de estar al corriente de pago.',
    topics: [
      'Consultar vida laboral y cotizaciones',
      'Alta y baja de trabajadores (Sistema RED)',
      'Certificados de estar al corriente',
      'Gestión de bases de cotización'
    ]
  },
  {
    id: 'holded',
    title: 'Holded — Contabilidad y facturación',
    description:
      'Sesión práctica directamente en tu cuenta de Holded. Aprendes a registrar facturas y gastos, conciliar el banco, revisar el cierre mensual y obtener informes de resultados — sin errores y con criterio contable real.',
    topics: [
      'Facturas emitidas y registro de gastos',
      'Conciliación bancaria paso a paso',
      'Cierre mensual y asientos contables',
      'Informes de resultados y balance'
    ]
  },
  {
    id: 'alta-empresa',
    title: 'Alta de autónomo y constitución de sociedad',
    description:
      'Aprende a darte de alta como autónomo o a constituir una Sociedad Limitada tú mismo, online y paso a paso, usando el PAE electrónico (CIRCE) y la Sede Electrónica de la AEAT. Con tu certificado digital, sin necesidad de gestores para los trámites básicos.',
    topics: [
      'Modelo 036/037 — alta en Hacienda',
      'Alta en el RETA (Seguridad Social)',
      'CIRCE — constitución de SL online',
      'Sede Electrónica del Registro Mercantil'
    ]
  },
  {
    id: 'otras-administraciones',
    title: 'Otras administraciones y trámites online',
    description:
      'Tu certificado digital abre las puertas de cualquier administración pública española. Aprendes a operar en portales de ayuntamientos, ministerios, Registro de la Propiedad, organismos autónomos y a solicitar certificados, licencias y trámites municipales.',
    topics: [
      'Registro de la Propiedad online',
      'Trámites municipales y licencias',
      'Ministerios y organismos autónomos',
      'Certificados electrónicos oficiales'
    ]
  },
  {
    id: 'planificacion-fiscal',
    title: 'Revisión y planificación fiscal real',
    description:
      'Analizamos tu situación fiscal real sobre tus propios datos: borrador del IRPF, declaraciones anteriores, cuentas anuales, deducciones aplicables a tu actividad y estrategias de optimización dentro de la legalidad. Sin teoría genérica.',
    topics: [
      'Consultar y modificar borrador IRPF',
      'Revisar declaraciones de años anteriores',
      'Deducciones y gastos deducibles reales',
      'Optimización fiscal para autónomos y SL'
    ]
  }
];

const relatedArticles = [
  {
    slug: 'certificado-digital-empresas',
    category: 'Trámites',
    title: 'Certificado digital para empresas: tipos, usos y cómo obtenerlo',
    excerpt: 'El certificado digital es imprescindible para relacionarse con la AEAT, la Seguridad Social y otros organismos. Explicamos los tipos disponibles y cómo tramitarlo.',
    readTime: '4 min'
  },
  {
    slug: 'alta-autonomo-espana',
    category: 'Empresas',
    title: 'Alta de autónomo en España: todo lo que debes saber antes de empezar',
    excerpt: 'Pasos para darte de alta como autónomo, cuota a pagar en 2025, tarifa plana, modelos trimestrales y las obligaciones que te esperan el primer año.',
    readTime: '7 min'
  },
  {
    slug: 'holded-contabilidad-pymes',
    category: 'Holded',
    title: 'Por qué Holded es el mejor ERP para pymes y autónomos en España',
    excerpt: 'Analizamos los módulos clave de Holded (facturación, contabilidad, proyectos, CRM) y explicamos cuándo merece la pena migrar desde hojas de cálculo o programas clásicos.',
    readTime: '5 min'
  }
];

const categoryColor: Record<string, string> = {
  Trámites: 'text-purple-600 border-purple-300 bg-purple-50',
  Empresas: 'text-emerald-700 border-emerald-300 bg-emerald-50',
  Holded: 'text-rose-600 border-rose-300 bg-rose-50'
};

export default function FormacionPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="mx-auto max-w-5xl px-6 pt-5 pb-2">
        <Breadcrumb items={[{ label: 'Servicios', href: '/servicios' }, { label: 'Formación' }]} />
      </div>

      {/* Hero */}
      <section className="brand-blue-bg px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Formación 1:1 personalizada</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
            Aprendes con tus datos reales,<br className="hidden md:block" /> en tu propio ordenador
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            Sin teoría genérica. Cada sesión de 2 horas se hace directamente sobre tu PC, con tu certificado digital,
            tu acceso a Holded y tus documentos reales. Al terminar sabes hacerlo tú solo.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Consulta gratuita 15 min
            </a>
          </div>
        </div>
      </section>

      {/* Format strip */}
      <div className="border-b border-[#D4A017]/20 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#D4A017]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Duración</p>
              <p className="text-sm font-semibold text-[#0D1B2A]">2 horas por sesión</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-[#D4A017]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Formato</p>
              <p className="text-sm font-semibold text-[#0D1B2A]">Videollamada · pantalla compartida · PC</p>
            </div>
          </div>
          <div className="ml-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Precio por sesión</p>
            <p className="font-serif text-2xl font-bold text-[#D4A017]">
              180 € <span className="text-sm font-normal text-[#9CA3AF]">+ IVA</span>
            </p>
          </div>
        </div>
      </div>

      {/* Requirements block */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="border border-[#D4A017]/40 bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#D4A017]" />
            <div>
              <p className="font-serif text-lg font-bold text-[#0D1B2A]">Requisitos para la sesión</p>
              <p className="mt-1 text-sm text-[#23364D]">
                La formación se hace en tu entorno real. Necesitas tener disponible antes de empezar:
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                req: 'Ordenador de sobremesa o portátil',
                note: 'No tablets ni móvil — imprescindible para operar en sedes electrónicas y compartir pantalla'
              },
              {
                req: 'Certificado digital instalado en el navegador',
                note: 'De empresa (representante) o de persona física. Si no tienes, podemos gestionarlo'
              },
              {
                req: 'Acceso a Holded',
                note: 'Para sesiones de contabilidad o facturación. Si aún no tienes cuenta, podemos orientarte'
              },
              {
                req: 'Tus documentos y credenciales de acceso',
                note: 'Datos fiscales, contratos, facturas o cualquier información sobre la que quieras trabajar'
              }
            ].map(({ req, note }) => (
              <div key={req} className="flex items-start gap-3 border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4A017]" />
                <div>
                  <p className="text-sm font-semibold text-[#0D1B2A]">{req}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#9CA3AF]">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 15-min CTA banner */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border border-[#D4A017] bg-[#D4A017]/5 px-6 py-5 sm:flex-row">
          <div>
            <p className="font-semibold text-[#0D1B2A]">¿Tienes dudas antes de reservar?</p>
            <p className="mt-0.5 text-sm text-[#23364D]">
              Reserva una llamada gratuita de 15 minutos y te orientamos sin compromiso.
            </p>
          </div>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 border border-[#D4A017] bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
          >
            Llamada gratuita 15 min →
          </a>
        </div>
      </section>

      {/* Training cards */}
      <section className="mx-auto max-w-5xl px-6 pb-6">
        <h2 className="font-serif text-2xl font-bold">Áreas de formación</h2>
        <p className="mt-2 text-sm text-[#23364D]">
          Cada sesión se adapta a tu caso. Puedes combinar áreas o profundizar en una sola.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <div
              key={area.id}
              className="flex flex-col border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_20px_rgba(13,27,42,0.05)]"
            >
              <h3 className="font-serif text-lg font-bold text-[#0D1B2A]">{area.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#23364D]">{area.description}</p>
              <ul className="mt-4 space-y-1.5">
                {area.topics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-[#D4A017]" />
                    {topic}
                  </li>
                ))}
              </ul>
              <FormacionBuyButton area={area.title} />
            </div>
          ))}
        </div>
      </section>

      {/* CIRCE highlight block */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="border-l-4 border-[#D4A017] bg-[#0D1B2A] p-8 text-[#F8F6F1]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">¿Quieres hacerlo tú mismo?</p>
          <h2 className="mt-3 font-serif text-xl font-bold md:text-2xl">
            Date de alta como autónomo o constituye tu sociedad tú mismo — paso a paso
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            A través del <strong className="text-[#F8F6F1]">PAE electrónico (CIRCE)</strong>, la plataforma oficial del
            Ministerio de Industria, puedes crear una empresa o darte de alta como autónomo online en minutos.
            En la sesión abrimos la web juntos, completamos los formularios con tus datos reales y lo tramitamos en directo.
            Sin papeles, sin desplazamientos, sin intermediarios innecesarios.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#D4A017]/60 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Ver PAE electrónico (CIRCE)
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#D4A017] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Reservar sesión — 180 €
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold">Cómo funciona la sesión</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Reserva y cuéntanos el objetivo',
                text: 'Reserva tu plaza y dinos qué quieres aprender: qué gestión, en qué plataforma y qué nivel de partida tienes. Ajustamos el temario antes de empezar.'
              },
              {
                step: '02',
                title: 'Preparas tu equipo',
                text: 'El día de la sesión tienes tu PC listo con el certificado digital instalado, acceso a Holded si es necesario y los documentos o datos sobre los que quieres trabajar.'
              },
              {
                step: '03',
                title: 'Sesión en directo — pantalla compartida',
                text: 'Nos conectamos por videollamada, compartes pantalla y trabajamos en tu entorno real. Al finalizar te entregamos un resumen escrito de lo que hemos visto.'
              }
            ].map(({ step, title, text }) => (
              <div key={step} className="border border-[#D4A017]/25 p-6">
                <span className="font-serif text-3xl font-bold text-[#D4A017]/30">{step}</span>
                <h3 className="mt-2 font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="font-serif text-2xl font-bold">Preguntas frecuentes</h2>
        <p className="mt-2 text-sm text-[#23364D]">Todo lo que necesitas saber antes de reservar tu sesión.</p>
        <div className="mt-8">
          <FormacionFaqs />
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border border-[#D4A017]/30 bg-white px-6 py-5 sm:flex-row">
          <p className="text-sm text-[#23364D]">
            ¿No encuentras respuesta a tu pregunta?{' '}
            <span className="font-semibold text-[#0D1B2A]">Llámanos 15 minutos, es gratis.</span>
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 bg-[#D4A017] px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Reservar llamada gratuita →
          </a>
        </div>
      </section>

      {/* Holded promotion block */}
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <img
                src="/Holded-Logotype-Red_Light.svg"
                alt="Holded"
                className="mb-5 h-8 w-auto opacity-90"
              />
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">
                EXPERT · Holded Solution Partner
              </p>
              <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">
                Holded: el ERP que transforma tu gestión
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#9CA3AF]">
                Facturación, contabilidad, CRM, proyectos e inventario en una sola plataforma cloud.
                Diseñado para autónomos y pymes españolas. Conforme con la Ley Antifraude y VeriFactu.
                Como Holded Solution Partner certificados, te acompañamos desde el primer día.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  'Facturación y contabilidad automática',
                  'Conciliación bancaria en tiempo real',
                  'Generación de modelos tributarios (303, 130, 111…)',
                  'Acceso compartido con tu asesoría',
                  'Conforme con VeriFactu y Ley Antifraude'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A017]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <div className="border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Prueba gratis</p>
                <p className="mt-2 font-serif text-xl font-bold">14 días sin coste</p>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                  Accede a todas las funcionalidades de Holded durante 14 días. Sin tarjeta de crédito.
                </p>
                <Link
                  href="/planes/gratuito"
                  className="mt-4 inline-flex w-full items-center justify-center bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                >
                  Empezar prueba gratuita
                </Link>
              </div>
              <div className="border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Demo personalizada</p>
                <p className="mt-2 font-serif text-xl font-bold">Te lo mostramos en vivo</p>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                  Reserva una demo con nosotros y te enseñamos Holded aplicado a tu tipo de negocio.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center border border-[#D4A017] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
                  >
                    Solicitar demo gratuita
                  </a>
                  <Link
                    href="/holded"
                    className="text-center text-xs font-semibold text-[#9CA3AF] transition hover:text-[#D4A017]"
                  >
                    Ver todo sobre Holded →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related articles */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="font-serif text-2xl font-bold">Artículos relacionados</h2>
        <p className="mt-2 text-sm text-[#23364D]">Guías prácticas para complementar tu formación.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {relatedArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="flex flex-col border border-[#D4A017]/20 bg-white p-5 shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017]/50"
            >
              <span className={`inline-block self-start border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${categoryColor[article.category] ?? ''}`}>
                {article.category}
              </span>
              <h3 className="mt-3 font-serif text-base font-bold leading-snug text-[#0D1B2A]">
                {article.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#23364D]">{article.excerpt}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.readTime}
                </span>
                <span className="font-bold text-[#D4A017]">Leer →</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
          >
            Ver todos los artículos del blog →
          </Link>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="brand-blue-bg px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">¿No sabes por dónde empezar?</p>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">
            Cuéntanos qué necesitas aprender
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            Llámanos 15 minutos sin coste. Te decimos qué sesión necesitas y cómo preparar tu equipo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Llamada gratuita 15 min
            </a>
            <Link
              href="/contacto"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Escribir por formulario
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
