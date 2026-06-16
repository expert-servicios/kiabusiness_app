'use client';

import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { getCalMeetingUrl } from '@/lib/utils/cal';

const CAL_URL = getCalMeetingUrl();

function toCalLink(url: string): string {
  try { return new URL(url).pathname.slice(1); } catch { return url; }
}

export function CalendlyBadge() {
  const pathname = usePathname();
  if (pathname === '/cita') return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (CAL_URL && window.Cal) {
          window.Cal('modal', { calLink: toCalLink(CAL_URL), config: { layout: 'month_view' } });
          return;
        }
        window.location.assign('/cita');
      }}
      aria-label="Reservar cita gratuita"
      className="flex items-center gap-2 rounded-full bg-[#F2C14E] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-[0_4px_18px_rgba(242,193,78,0.45)] transition hover:bg-[#D4A017] hover:shadow-[0_4px_22px_rgba(212,160,23,0.5)] active:scale-95"
    >
      <Calendar className="h-4 w-4 shrink-0" />
      Reservar cita
    </button>
  );
}
