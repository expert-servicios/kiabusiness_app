import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Solicitar presupuesto | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Solicita un presupuesto personalizado para servicios de asesoría fiscal, extranjería, empresas y autónomos. Respuesta en menos de 24 horas hábiles.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/solicitar-presupuesto',
    title: 'Solicitar presupuesto | EXPERT',
    description:
      'Solicita un presupuesto personalizado para servicios de asesoría fiscal, extranjería, empresas y autónomos. Respuesta en menos de 24 horas hábiles.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'EXPERT Asesoría' }]
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/branding/expert%20servicios.png']
  },
  alternates: { canonical: 'https://expertconsulting.es/solicitar-presupuesto' }
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
