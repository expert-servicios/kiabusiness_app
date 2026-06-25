import type { Metadata } from 'next';
import { SolicitudPresupuestoForm } from '@/components/site/SolicitudPresupuestoForm';

export const metadata: Metadata = {
  title: 'Solicitar presupuesto gratuito | EXPERT',
  description:
    'Solicita un presupuesto personalizado sin compromiso. Te respondemos en menos de 24 horas hábiles. Fiscalidad, extranjería, empresas y más.',
  alternates: { canonical: 'https://expertconsulting.es/solicitar-presupuesto' },
  openGraph: {
    title: 'Solicitar presupuesto gratuito | EXPERT',
    description: 'Solicita un presupuesto personalizado sin compromiso. Fiscalidad, extranjería, empresas y más.',
    url: 'https://expertconsulting.es/solicitar-presupuesto',
    type: 'website',
  },
};

export default function SolicitarPresupuestoPage() {
  return <SolicitudPresupuestoForm />;
}
