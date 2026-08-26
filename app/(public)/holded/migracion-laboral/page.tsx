import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  Calendar,
  Check,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { HoldedCalendlyButton } from '@/components/holded/HoldedCalendlyButton';
import { RequestProposalModal } from '@/components/holded/RequestProposalModal';
import { FaqSection } from '@/components/site/FaqSection';

const SERVICE_NAME = 'Migración laboral a Holded';
const UNIT_PRICE = 50;
const MIN_EMPLOYEES = 5;

export const metadata: Metadata = {
  title: 'Migración laboral a Holded desde 50 € por empleado | EXPERT',
  description:
    'Migramos y validamos los datos laborales de tu plantilla en Holded por 50 € + IVA por empleado. Incluye revisión documental, configuración y nómina de prueba.',
  alternates: { canonical: 'https://expertconsulting.es/holded/migracion-laboral' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/holded/migracion-laboral',
    title: 'Migración laboral a Holded | EXPERT',
    description: 'Perfiles laborales configurados y comprobados en Holded desde 50 € + IVA por empleado.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{
      url: 'https://expertconsulting.es/catalog/holded.png',
      width: 1200,
      height: 630,
      alt: 'Migración laboral a Holded — EXPERT',
    }],
  },
};

const INCLUDES = [
  'Revisión previa de la documentación laboral disponible',
  'Creación o validación del perfil de cada empleado en Holded',
  'Datos personales y laborales necesarios para nómina',
  'Vinculación con centro de trabajo, CCC y convenio configurados',
  'Contrato, categoría, grupo, jornada y fecha de antigüedad',
  'Estructura salarial, pagas extraordinarias e IRPF informado',
  'Comprobación del código de ocupación CNO cuando proceda',
  'Carga del contrato vigente y documentación acordada',
  'Nómina de prueba y control de coherencia por empleado',
  'Informe final de incidencias y checklist de entrega',
];

const NOT_INCLUDED = [
  'Cálculo o rectificación de nóminas históricas',
  'Atrasos, complementarias o liquidaciones L03/L90',
  'Altas, bajas o variaciones ante TGSS y comunicaciones al SEPE',
  'Envíos mensuales mediante SILTRA ni gestión laboral recurrente',
  'Reconstrucción de documentación inexistente o incompleta',
  'Asesoramiento jurídico sobre contratos o conflictos laborales',
  'Licencia o suscripción de Holded',
];

const PROCESS = [
  {
    step: '01',
    title: 'Revisión de 15 minutos',
    text: 'Confirmamos número de empleados, estado de Holded, documentación disponible y posibles incidencias antes de aceptar el encargo.',
    Icon: Calendar,
  },
  {
    step: '02',
    title: 'Recepción segura',
    text: 'Recibimos los expedientes por el portal seguro. No pedimos nóminas, NAF, CCC ni credenciales por WhatsApp o email.',
    Icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Migración y control',
    text: 'Configuramos cada perfil y contrastamos los datos con la documentación vigente antes de generar una nómina de prueba.',
    Icon: Users,
  },
  {
    step: '04',
    title: 'Entrega',
    text: 'Entregamos la cuenta preparada, el resultado de las comprobaciones y la relación de incidencias que requieran decisión del cliente.',
    Icon: FileCheck2,
  },
];

const FAQ = [
  {
    q: '¿Cómo se calcula el precio?',
    a: `El precio es de ${UNIT_PRICE} € + IVA por cada empleado que deba crearse o revisarse. El pedido mínimo es de ${MIN_EMPLOYEES} empleados (${UNIT_PRICE * MIN_EMPLOYEES} € + IVA). Confirmamos la plantilla facturable en la revisión previa.`,
  },
  {
    q: '¿Qué ocurre si tengo 11 empleados?',
    a: 'El importe sería 550 € + 115,50 € de IVA, total 665,50 €, siempre que los expedientes estén completos y no requieran regularizaciones históricas.',
  },
  {
    q: '¿Incluye la gestión mensual de nóminas?',
    a: 'No. Es un servicio puntual de implantación y migración. El cálculo mensual, SILTRA, afiliación y comunicaciones oficiales se contratan por separado.',
  },
  {
    q: '¿Incluye formación para gestionar las nóminas después?',
    a: 'No incluye el programa formativo completo. Si quieres aprender a ejecutar el ciclo laboral de forma autónoma, consulta el Programa de Gestión Laboral Integral de EXPERT.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Para plantillas de hasta 15 empleados, el plazo orientativo es de 3 a 5 días hábiles desde la recepción completa y validación de la documentación.',
  },
  {
    q: '¿Puedo pagar directamente en la web?',
    a: 'Primero confirmamos el número de empleados y que la documentación permite la migración. Tras la revisión recibirás el enlace de pago con la cantidad correcta.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: SERVICE_NAME,
  description: 'Migración y validación de datos laborales en Holded por empleado.',
  provider: { '@type': 'Organization', name: 'EXPERT' },
  areaServed: { '@type': 'Country', name: 'España' },
  url: 'https://expertconsulting.es/holded/migracion-laboral',
  offers: {
    '@type': 'Offer',
    price: UNIT_PRICE,
    priceCurrency: 'EUR',
    description: `Precio unitario por empleado. Pedido mínimo de ${MIN_EMPLOYEES} empleados. IVA no incluido.`,
  },
};

export default function MigracionLaboralPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <Image
              src="/Holded-Logotype-Red_Light.svg"
              alt="Holded"
              width={110}
              height={33}
              className="mb-6 h-8 w-auto"
            />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">
              Implantación del área laboral
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-6xl">
              Migramos tu plantilla laboral a Holded
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D5DB] md:text-lg">
              Configuramos y validamos cada expediente laboral para que puedas empezar a trabajar con nóminas desde una base ordenada y comprobada.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HoldedCalendlyButton className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]">
                <Calendar className="h-4 w-4" />
                Pedir revisión previa — 15 min
              </HoldedCalendlyButton>
              <Link
                href="/solicitar-presupuesto?servicio=holded-migracion-laboral"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/60 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#D4A017]/10"
              >
                Solicitar propuesta <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-[#9CA3AF]">
              Pago único · IVA no incluido · Documentación mediante portal seguro
            </p>
          </div>

          <div className="border border-[#D4A017]/35 bg-[#0D1B2A]/50 p-7 shadow-2xl md:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Precio unitario</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-serif text-6xl font-bold text-white">50 €</span>
                  <span className="pb-2 text-sm text-[#D1D5DB]">+ IVA</span>
                </div>
                <p className="mt-2 text-sm text-[#D1D5DB]">por empleado migrado y validado</p>
              </div>
              <Calculator className="h-9 w-9 text-[#D4A017]" />
            </div>
            <div className="mt-7 border-t border-white/15 pt-6">
              <p className="text-sm font-bold text-white">Ejemplo: plantilla de 11 empleados</p>
              <dl className="mt-4 space-y-2 text-sm text-[#D1D5DB]">
                <div className="flex justify-between gap-4"><dt>Base imponible</dt><dd>550,00 €</dd></div>
                <div className="flex justify-between gap-4"><dt>IVA 21 %</dt><dd>115,50 €</dd></div>
                <div className="flex justify-between gap-4 border-t border-white/15 pt-3 font-bold text-white"><dt>Total</dt><dd>665,50 €</dd></div>
              </dl>
            </div>
            <p className="mt-5 text-xs leading-5 text-[#9CA3AF]">
              Pedido mínimo: {MIN_EMPLOYEES} empleados. El presupuesto definitivo se confirma tras revisar el estado de los expedientes.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Alcance cerrado</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Qué incluye el precio por empleado</h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
              Trabajamos sobre la situación vigente. Si encontramos datos contradictorios, paramos ese expediente y lo reflejamos en el informe de incidencias.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {INCLUDES.map((item) => (
              <div key={item} className="flex gap-3 border border-[#D4A017]/25 bg-[#F8F6F1] p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                <p className="text-sm leading-6 text-[#23364D]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Límites del servicio</p>
              <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Lo que requiere otro presupuesto</h2>
              <p className="mt-4 text-sm leading-7 text-[#23364D]">
                El precio unitario funciona cuando la documentación está completa y la relación laboral vigente no necesita reconstrucción o regularización.
              </p>
              <div className="mt-7">
                <RequestProposalModal
                  serviceName={SERVICE_NAME}
                  className="inline-flex min-h-12 items-center gap-2 bg-[#0D1B2A] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#23364D]"
                />
              </div>
            </div>
            <div className="space-y-3">
              {NOT_INCLUDED.map((item) => (
                <div key={item} className="flex gap-3 border border-[#0D1B2A]/10 bg-white p-4">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#9CA3AF]" />
                  <p className="text-sm leading-6 text-[#23364D]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Metodología</p>
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Cuatro pasos con trazabilidad</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {PROCESS.map(({ step, title, text, Icon }) => (
              <article key={step} className="border border-white/15 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.2em] text-[#D4A017]">{step}</span>
                  <Icon className="h-6 w-6 text-[#D4A017]" />
                </div>
                <h3 className="mt-6 font-serif text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#D1D5DB]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 border border-[#D4A017]/35 bg-[#F8F6F1] p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#D4A017]/12">
                <BriefcaseBusiness className="h-6 w-6 text-[#D4A017]" />
              </div>
              <div>
                <p className="font-serif text-2xl font-bold">¿Quieres aprender a gestionarlo tú?</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#23364D]">
                  El Programa de Gestión Laboral Integral incluye 20 horas de formación y 5 horas de tutoría para dominar Holded, Creative Quality y SILTRA.
                </p>
              </div>
            </div>
            <Link
              href="/academy/gestion-laboral-integral"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#D4A017]"
            >
              Comparar con formación <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <FaqSection items={FAQ} />

      <section className="bg-[#0D1B2A] px-6 py-16 text-center text-white">
        <ClipboardCheck className="mx-auto h-9 w-9 text-[#D4A017]" />
        <h2 className="mt-5 font-serif text-3xl font-bold">Confirma el alcance antes de migrar</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#D1D5DB]">
          En 15 minutos revisamos la plantilla, los documentos disponibles y si el precio unitario se puede aplicar sin trabajos adicionales.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <HoldedCalendlyButton className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]">
            <Calendar className="h-4 w-4" />
            Reservar revisión previa
          </HoldedCalendlyButton>
          <Link
            href="/contacto?asunto=Migracion%20laboral%20a%20Holded"
            className="inline-flex min-h-12 items-center justify-center border border-white/25 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-[#D4A017]"
          >
            Resolver una duda
          </Link>
        </div>
      </section>
    </main>
  );
}
