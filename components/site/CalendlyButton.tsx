'use client';

import { useState, type ReactNode } from 'react';
import { CalendlyModal } from './CalendlyModal';

interface Props {
  url: string;
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export function CalendlyButton({ url, title, subtitle, className, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <CalendlyModal
        url={url}
        title={title}
        subtitle={subtitle}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
