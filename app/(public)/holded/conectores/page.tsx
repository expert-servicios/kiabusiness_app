import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSearch,
  Layers,
  Package,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Conectores e IA para Holded — Claude y ChatGPT | EXPERT',
  description:
    'Conecta Holded con Claude y ChatGPT. Consulta facturas, clientes y contabilidad en lenguaje claro. Modo solo lectura, borradores con confirmación y automatizaciones por API. EXPERT — Holded Solution Partner.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/holded/conectores',
    title: 'Conectores e IA para Holded — Claude y ChatGPT | EXPERT',
    description:
      'Conecta Holded con IA: consulta en lenguaje claro, borradores con confirmación, automatizaciones por API. EXPERT — Holded Solution Partner.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Conectores e IA para Holded — EXPERT' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conectores e IA para Holded — Claude y ChatGPT | EXPERT',
    description: 'Conecta Holded con Claude y ChatGPT. Solo lectura, borradores y automatizaciones. EXPERT Holded Solution Partner.',
    images: ['https://expertconsulting.es/catalog/holded.png'],
  },
};

const levels = [
  {
    Icon: Eye,
    level: 'Nivel 1 — Cero riesgo',
    title: 'Modo solo lectura',
    desc: 'Pregunta por facturas, cobros, clientes, contabilidad, proyectos y vencimientos sin exportar hojas de cálculo. La IA consulta tus datos y te responde en lenguaje claro.',
    badge: 'No modifica tu cuenta',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    Icon: ClipboardCheck,
    level: 'Nivel 2',
    title: 'Borradores con confirmación',
    desc: 'Genera propuestas y borradores revisables: facturas, presupuestos, asientos contables. Nada se publica ni se envía sin tu confirmación explícita.',
    badge: 'Revisión obligatoria antes de ejecutar',
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    Icon: Layers,
    level: 'Nivel 3',
    title: 'Automatizaciones e integraciones',
    desc: 'Flujos por API, conectores con herramientas externas (CRM, ERP, email, WhatsApp), reporting automatizado y procesos a medida sobre tus datos reales.',
    badge: 'Implementación a medida',
    badgeColor: 'text-[#D4A017] bg-[#D4A017]/10 border-[#D4A017]/30',
  },
] as const;

const useCases = [
  {
    Icon: BarChart3,
    area: 'Finanzas',
    cases: [
      'Vencimientos y cobros pendientes en tiempo real',
      'Márgenes por cliente o producto',
      'Conciliación bancaria asistida',
      'Previsión de tesorería semanal',
    ],
  },
  {
    Icon: FileSearch,
    area: 'Contabilidad',
    cases: [
      'Consulta el diario o balance en lenguaje claro',
      'Resumen del plan de cuentas sin exportar',
      'Revisión de asientos antes de cerrar el período',
      'Control de cuentas por cobrar y pagar',
    ],
  },
  {
    Icon: Package,
    area: 'Operaciones',
    cases: [
      'Estado de stock y alertas de inventario',
      'Avance de proyectos y horas imputadas',
      'Pipeline CRM y estado de presupuestos',
      'Documentos pendientes de firma o aprobación',
    ],
  },
  {
    Icon: Zap,
    area: 'Fiscal y control',
    cases: [
      'Revisión de calidad de datos antes de cierres',
      'Preparación de información para declaraciones',
      'Control de IVA repercutido vs soportado',
      'Alertas de plazos y obligaciones recurrentes',
    ],
  },
] as const;

const connectors = [
  {
    name: 'Conector para Claude',
    status: 'En producción',
    statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    desc: 'Integración con Claude (Anthropic) para consultar y operar sobre Holded en lenguaje claro. Disponible ahora.',
    primaryLabel: 'Ver Conector Claude',
    primaryHref: 'https://holded.verifactu.business/conectores/claude',
    secondaryLabel: 'Documentación',
    secondaryHref: 'https://holded.verifactu.business/conectores/docs',
  },
  {
    name: 'Conector para ChatGPT',
    status: 'En lanzamiento',
    statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
    desc: 'Integración con ChatGPT (OpenAI) para las mismas capacidades de consulta y operación sobre Holded.',
    primaryLabel: 'Ver Conector ChatGPT',
    primaryHref: 'https://holded.verifactu.business/conectores/chatgpt',
    secondaryLabel: 'Documentación',
    secondaryHref: 'https://holded.verifactu.business/conectores/docs',
  },
] as const;

const securityPoints = [
  { Icon: Eye, text: 'Solo lectura por defecto. La IA consulta, no actúa.' },
  { Icon: ClipboardCheck, text: 'Borradores solo con confirmación. Nada se ejecuta sin tu aprobación.' },
  { Icon: ShieldCheck, text: 'No mueve dinero, no envía correos automáticamente, no cierra contabilidad de forma autónoma.' },
  { Icon: CheckCircle2, text: 'Integración independiente sobre la API oficial de Holded. No somos Holded.' },
] as const;

export default function HoldedConectoresPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Holded × IA</p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl">
              Conectores, automatizaciones e IA para Holded
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#9CA3AF] md:text-lg">
              Consulta datos en lenguaje claro, reduce tareas manuales y mejora el control. Implementación por fases, con seguridad y trazabilidad desde el primer día.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://holded.verifactu.business/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <Bot className="h-4 w-4" />
                Solicitar demo
              </a>
              <a
                href="https://holded.verifactu.business/conectores"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
              >
                Ver hub de conectores <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Security strip */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {securityPoints.map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-3 border border-[#D4A017]/20 bg-[#0D1B2A]/40 px-4 py-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                <p className="text-xs leading-5 text-[#9CA3AF]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 Levels ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Implementación por fases</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Empezamos donde tiene sentido para ti.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              No es todo o nada. Cada nivel añade capacidad y control sin exigir que saltes al siguiente.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {levels.map(({ Icon, level, title, desc, badge, badgeColor }) => (
              <article key={title} className="flex flex-col border border-[#D4A017]/25 bg-white p-7">
                <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10">
                  <Icon className="h-6 w-6 text-[#D4A017]" />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">{level}</p>
                <h3 className="mt-1 font-serif text-xl font-bold text-[#0D1B2A]">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#23364D]">{desc}</p>
                <span className={`mt-5 inline-block self-start border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
                  {badge}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Connectors comparison ──────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Conectores disponibles</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Claude y ChatGPT conectados a tu Holded.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Usa la IA con la que ya trabajas. Ambos conectores ofrecen las mismas capacidades sobre tu cuenta.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {connectors.map((c) => (
              <div key={c.name} className="flex flex-col border border-[#D4A017]/25 bg-[#F8F6F1] p-8">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-2xl font-bold text-[#0D1B2A]">{c.name}</h3>
                  <span className={`shrink-0 border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${c.statusColor}`}>
                    {c.status}
                  </span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#23364D]">{c.desc}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={c.primaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                  >
                    {c.primaryLabel} <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href={c.secondaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-[#D4A017]/50 px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:border-[#D4A017]"
                  >
                    {c.secondaryLabel}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Casos de uso</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Lo que puedes consultar desde el primer día.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Sin exportar. Sin cambiar de herramienta. Pregunta en lenguaje claro y obtén respuestas sobre tus datos reales.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map(({ Icon, area, cases }) => (
              <article key={area} className="border border-[#D4A017]/25 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center bg-[#D4A017]/10">
                  <Icon className="h-5 w-5 text-[#D4A017]" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-[#0D1B2A]">{area}</h3>
                <ul className="mt-4 space-y-2.5">
                  {cases.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-[#23364D]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security block ────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-14 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="border border-[#D4A017]/30 bg-[#F8F6F1] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
              <div>
                <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10">
                  <ShieldCheck className="h-6 w-6 text-[#D4A017]" />
                </div>
                <h2 className="mt-5 font-serif text-2xl font-bold text-[#0D1B2A] md:text-3xl">
                  Seguridad y límites claros
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  Entendemos que conectar IA a tus datos de negocio requiere confianza. Por eso empezamos siempre en modo solo lectura y establecemos límites claros antes de activar cualquier acción.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Solo lectura por defecto', desc: 'La IA consulta tu cuenta sin modificar nada. Este es el punto de partida siempre.' },
                  { label: 'Borradores con confirmación', desc: 'Cuando aplican acciones, se trabaja con borradores que revisas y confirmas tú.' },
                  { label: 'Sin acciones autónomas', desc: 'No mueve dinero, no envía correos automáticamente, no cierra contabilidad sin supervisión.' },
                  { label: 'Integración sobre API oficial', desc: 'Operamos sobre la API oficial de Holded. No somos Holded ni actuamos en su nombre.' },
                ].map(({ label, desc }) => (
                  <div key={label} className="border border-[#D4A017]/20 bg-white p-4">
                    <p className="text-sm font-bold text-[#0D1B2A]">{label}</p>
                    <p className="mt-1.5 text-xs leading-5 text-[#23364D]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-16 text-center text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Siguiente paso</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Solicitar demo con datos reales
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Te preparamos una sesión útil, no una demo genérica. Conectamos el conector a una cuenta real y te mostramos lo que puede consultar sobre tus propios datos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://holded.verifactu.business/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <Bot className="h-4 w-4" />
              Solicitar demo
            </a>
            <Link
              href="/holded"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
            >
              Ver implantación Holded
            </Link>
          </div>
          <p className="mt-8 text-xs text-[#6b7a8d]">
            Integración independiente sobre la API oficial de Holded. No somos Holded S.L. ni actuamos en su nombre.
          </p>
        </div>
      </section>

    </main>
  );
}
