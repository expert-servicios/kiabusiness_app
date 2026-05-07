import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Solicitar presupuesto | EXPERT — Asesoría Fiscal y Legal',
  description:
    'Solicita un presupuesto personalizado para servicios de asesoría fiscal, extranjería, empresas y autónomos. Respuesta en menos de 24 horas hábiles.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/solicitar-presupuesto',
    title: 'Solicitar presupuesto | EXPERT',
    description:
      'Solicita un presupuesto personalizado para servicios de asesoría fiscal, extranjería, empresas y autónomos. Respuesta en menos de 24 horas hábiles.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
