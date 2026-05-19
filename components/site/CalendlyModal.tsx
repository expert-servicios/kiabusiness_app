'use client';

import { useEffect } from 'react';
import { X, CalendarClock } from 'lucide-react';

interface Props {
  url: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CalendlyModal({ url, title, subtitle, isOpen, onClose }: Props) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handle);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handle);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embedUrl = `${url}${url.includes('?') ? '&' : '?'}background_color=f8f6f1&text_color=061321&primary_color=d4a017`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#07111d]/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#07111d] px-6 py-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-[#D4A017]" />
            <div>
              <p className="font-serif text-base font-bold text-white">{title}</p>
              {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Calendly iframe */}
        <div className="bg-[#f8f6f1]">
          <iframe
            src={embedUrl}
            width="100%"
            height="660"
            frameBorder="0"
            title={title}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
