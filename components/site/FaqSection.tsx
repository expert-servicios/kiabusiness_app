'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection({
  items,
  title = 'Preguntas frecuentes',
  dark = false
}: {
  items: FaqItem[];
  title?: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className={`px-6 py-16 md:py-20 ${dark ? 'brand-blue-bg' : 'bg-white'}`}>
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">FAQ</p>
          <h2 className={`mt-4 font-serif text-3xl font-bold leading-tight ${dark ? 'text-[#F8F6F1]' : 'text-[#0D1B2A]'}`}>
            {title}
          </h2>
        </div>

        <div className={`mt-10 divide-y ${dark ? 'divide-white/10' : 'divide-[#D4A017]/20'}`}>
          {items.map((item, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-start justify-between gap-4 py-5 text-left"
              >
                <span className={`font-serif text-lg font-semibold leading-snug ${dark ? 'text-[#F8F6F1]' : 'text-[#0D1B2A]'}`}>
                  {item.q}
                </span>
                <ChevronDown
                  className={`mt-1 h-5 w-5 shrink-0 text-[#D4A017] transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="pb-5">
                  <p className={`text-sm leading-7 ${dark ? 'text-[#9CA3AF]' : 'text-[#23364D]'}`}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
