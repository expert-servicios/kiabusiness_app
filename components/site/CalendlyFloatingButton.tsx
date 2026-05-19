'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { CalendlyModal } from './CalendlyModal';

interface Props {
  url: string;
}

export function CalendlyFloatingButton({ url }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reservar llamada gratuita 15 min"
        title="Llamada gratuita 15 min"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A017] text-[#0D1B2A] shadow-[0_16px_35px_rgba(0,0,0,0.25)] transition hover:scale-105 hover:bg-[#F2C14E] focus:outline-none focus:ring-4 focus:ring-[#D4A017]/30"
      >
        <CalendarClock className="h-6 w-6" aria-hidden="true" />
      </button>
      <CalendlyModal
        url={url}
        title="Reunión informativa gratuita"
        subtitle="15 minutos · Sin compromiso"
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
