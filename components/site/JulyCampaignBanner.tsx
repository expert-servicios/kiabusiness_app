import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { julySiteCampaignLinks } from '@/lib/marketing/july-2026';

type JulyCampaignBannerProps = {
  focus?: 'holded' | 'planes' | 'certificado';
};

const copy = {
  holded: {
    eyebrow: 'Julio fiscal',
    text: 'Ordena Holded y tu gestion mensual antes del siguiente cierre.',
    primaryLabel: 'Diagnostico Holded',
    primaryHref: julySiteCampaignLinks.holded,
    secondaryLabel: 'Comparar planes',
    secondaryHref: julySiteCampaignLinks.planes,
  },
  planes: {
    eyebrow: 'Planes mensuales',
    text: 'Despues de migrar a Holded, evita volver al cierre de ultima hora.',
    primaryLabel: 'Comparar planes',
    primaryHref: julySiteCampaignLinks.planes,
    secondaryLabel: 'Migracion Holded',
    secondaryHref: julySiteCampaignLinks.holded,
  },
  certificado: {
    eyebrow: 'Tramites online',
    text: 'Certificado digital sin desplazamiento cuando el tramite admite verificacion remota.',
    primaryLabel: 'Persona fisica',
    primaryHref: julySiteCampaignLinks.certificadoPersonaFisica,
    secondaryLabel: 'Entidad',
    secondaryHref: julySiteCampaignLinks.certificadoEntidad,
  },
} as const;

export function JulyCampaignBanner({ focus = 'holded' }: JulyCampaignBannerProps) {
  const item = copy[focus];

  return (
    <section className="border-b border-[#D4A017]/30 bg-[#0D1B2A] px-4 py-3 text-[#F8F6F1]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#D4A017]/15 text-[#D4A017]">
            <CalendarClock className="h-4 w-4" />
          </span>
          <p className="text-sm leading-6">
            <span className="font-bold uppercase tracking-[0.16em] text-[#D4A017]">{item.eyebrow}</span>
            <span className="mx-2 text-[#D4A017]/60">/</span>
            <span className="text-[#F8F6F1]/90">{item.text}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={item.primaryHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4A017] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            {item.primaryLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={item.secondaryHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#D4A017]/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10"
          >
            {item.secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
