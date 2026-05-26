import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Prueba Holded 14 días | EXPERT',
  description:
    'Solicita acceso a la prueba gratuita de Holded durante 14 días. La prueba es acceso al software; la configuración y formación se contratan aparte.',
  alternates: { canonical: 'https://expertconsulting.es/planes/gratuito' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/gratuito',
    title: 'Prueba Holded 14 días | EXPERT',
    description: 'Solicita acceso a la prueba gratuita de Holded durante 14 días. Configuración y formación se contratan aparte.',
    images: [{ url: 'https://expertconsulting.es/catalog/holded.png', width: 1200, height: 630, alt: 'Prueba Holded 14 días — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/holded.png'] }
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
