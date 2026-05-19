import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Plan Gratuito — Demo Holded | EXPERT',
  description:
    'Activa tu demo gratuita de Holded con EXPERT. 14 días de prueba, configuración incluida y soporte de un Holded Solution Partner certificado.',
  alternates: { canonical: 'https://expertconsulting.es/planes/gratuito' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/gratuito',
    title: 'Plan Gratuito — Demo Holded | EXPERT',
    description: 'Activa tu demo gratuita de Holded con EXPERT. 14 días de prueba, configuración incluida.',
    images: [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Plan Gratuito Holded — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/holded.png'] }
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
