import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { PlanCtaButton } from '@/components/planes/PlanCtaButton';

export const metadata: Metadata = {
  title: 'Plan Supervisión — 49 €/mes + IVA | EXPERT',
  description:
    'Plan Supervisión para autónomos y pequeñas empresas que llevan Holded y quieren revisión mensual, alertas Kia y soporte básico. No incluye presentación de impuestos.',
  alternates: { canonical: 'https://expertconsulting.es/planes/supervision' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/supervision',
    title: 'Plan Supervisión — 49 €/mes + IVA | EXPERT',
    description: 'Revisión mensual básica de Holded, alertas Kia y soporte básico sin delegar la gestión completa.',
    images: [{ url: 'https://expertconsulting.es/catalog/consultoria.png', width: 1200, height: 630, alt: 'Plan Supervisión — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/consultoria.png'] }
};

const includes = [
  'Revisión mensual básica de Holded',
  'Alertas de errores y anomalías',
  'Revisión de facturas y categorías principales',
  'Revisión básica de bancos/conciliación',
  'Resumen mensual generado por Kia',
  'Estado de empresa básico',
  'Soporte por email/WhatsApp',
  'Portal Cliente EXPERT',
  'Licencia Holded obligatoria no incluida',
];

const notIncludes = [
  'Presentación de impuestos',
  'Contabilidad delegada',
  'Subida de facturas por EXPERT',
  'Migración de datos',
  'Nóminas/laboral',
  'Reuniones periódicas',
  'Revisión fiscal avanzada',
];

export default function PlanSupervisionPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="mx-auto max-w-4xl px-6 pt-5 pb-2">
        <Breadcrumb items={[{ label: 'Planes', href: '/planes' }, { label: 'Plan Supervisión' }]} />
      </div>

      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción</p>
          <ShieldCheck className="mx-auto mt-5 h-10 w-10 text-[#D4A017]" />
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Plan Supervisión</h1>
          <div className="mt-5 flex items-end justify-center gap-1">
            <span className="font-serif text-5xl font-bold text-[#D4A017]">49</span>
            <span className="mb-2 text-lg text-[#9CA3AF]">€/mes + IVA</span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Tú llevas Holded. Kia y EXPERT supervisan lo esencial, detectan alertas y te ayudan a no perder el control mensual.
          </p>
          <div className="mx-auto mt-8 max-w-sm">
            <PlanCtaButton planSlug="supervision" ctaLabel="Configurar plan — 49 €/mes" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-bold">Qué incluye</h2>
            <ul className="mt-5 space-y-3">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                  <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">Qué no incluye</h2>
            <ul className="mt-5 space-y-3">
              {notIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#9CA3AF]" />
                  <span className="text-sm leading-6 text-[#6B7280]">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-[#23364D]">
              Si necesitas impuestos trimestrales, revisa el{' '}
              <Link href="/planes/avanzado" className="font-semibold text-[#D4A017] hover:underline">
                Plan Avanzado
              </Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
