'use client';

import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';

const CALENDLY_URL =
  (process.env.NEXT_PUBLIC_CALENDLY_REUNION_URL ?? '') +
  '?hide_event_type_details=1' +
  '&hide_gdpr_banner=1' +
  '&background_color=f8f6f1' +
  '&text_color=0d1b2a' +
  '&primary_color=f2c14e';

export function CalendlyBadge() {
  const pathname = usePathname();
  if (pathname === '/cita') return null;

  return (
    <button
      type="button"
      onClick={() => window.Calendly?.initPopupWidget({ url: CALENDLY_URL })}
      aria-label="Reservar cita gratuita"
      className="flex items-center gap-2 rounded-full bg-[#F2C14E] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-[0_4px_18px_rgba(242,193,78,0.45)] transition hover:bg-[#D4A017] hover:shadow-[0_4px_22px_rgba(212,160,23,0.5)] active:scale-95"
    >
      <Calendar className="h-4 w-4 shrink-0" />
      Reservar cita
    </button>
  );
}
