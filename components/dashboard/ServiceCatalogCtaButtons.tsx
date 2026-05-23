'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getReadinessCheck } from '@/lib/data/service-readiness-checks';
import { getViabilityCheck } from '@/lib/data/viability-checks';
import { ReadinessButton } from '@/components/services/ReadinessButton';
import { ViabilityButton } from '@/components/services/ViabilityButton';
import type { ServiceFlowType } from '@/lib/services/service-registry';

interface Props {
  flowType  : ServiceFlowType;
  slug      : string;
  categoria : string;
}

const SERVICE_PAGE_CLS =
  'inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-3.5 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]';
const QUOTE_CLS =
  'inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-3.5 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]';
const SECONDARY_CLS =
  'inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3.5 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d]';
const READINESS_CLS =
  'inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-3.5 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]';
const VIABILITY_CLS =
  'inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-3.5 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]';

export function ServiceCatalogCtaButtons({ flowType, slug, categoria }: Props) {
  const servicePath = `/servicios/${categoria}/${slug}`;

  if (flowType === 'readiness') {
    const check = getReadinessCheck(slug);
    if (check) {
      return (
        <>
          <ReadinessButton
            check={check}
            serviceSlug={slug}
            onApproved={() => { window.location.href = servicePath; }}
            className={READINESS_CLS}
          />
          <Link href={servicePath} className={SECONDARY_CLS} target="_blank" rel="noopener noreferrer">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </Link>
        </>
      );
    }
  }

  if (flowType === 'viability') {
    const check = getViabilityCheck(slug);
    if (check) {
      return (
        <>
          <ViabilityButton check={check} serviceSlug={slug} className={VIABILITY_CLS} />
          <Link href={servicePath} className={SECONDARY_CLS} target="_blank" rel="noopener noreferrer">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </Link>
        </>
      );
    }
  }

  if (flowType === 'quote') {
    return (
      <Link
        href={`/solicitar-presupuesto?servicio=${slug}`}
        className={QUOTE_CLS}
      >
        Solicitar presupuesto <ArrowRight className="h-3 w-3" />
      </Link>
    );
  }

  // direct_checkout or fallback
  return (
    <>
      <Link href={servicePath} className={SERVICE_PAGE_CLS}>
        Contratar <ArrowRight className="h-3 w-3" />
      </Link>
      <Link href={servicePath} className={SECONDARY_CLS} target="_blank" rel="noopener noreferrer">
        Ver detalle <ArrowRight className="h-3 w-3" />
      </Link>
    </>
  );
}
