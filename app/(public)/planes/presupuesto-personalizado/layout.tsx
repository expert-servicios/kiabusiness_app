import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Presupuesto Personalizado | EXPERT',
  description:
    'Solicita un presupuesto a medida para tu empresa o necesidades concretas. Gestión laboral, nóminas, extranjería y más. Sin permanencia.',
  alternates: { canonical: 'https://expertconsulting.es/planes/presupuesto-personalizado' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/presupuesto-personalizado',
    title: 'Presupuesto Personalizado | EXPERT',
    description: 'Solicita un presupuesto a medida para tu empresa. Gestión laboral, nóminas, extranjería y más.',
    images: [{ url: 'https://expertconsulting.es/catalog/consultoria.png', width: 1200, height: 630, alt: 'Presupuesto Personalizado — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/consultoria.png'] }
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
