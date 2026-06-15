import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GenerateReportPanel } from '@/components/dashboard/reports/GenerateReportPanel';

export const metadata = { title: 'Nuevo informe — EXPERT' };

export default function NuevoInformePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <Link
        href="/dashboard/informes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#7a6e5f] hover:text-[#3d3528]"
      >
        <ArrowLeft size={14} />
        Mis informes
      </Link>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Estado de empresa</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[#07111d]">Nuevo informe</h1>
        <p className="mt-2 text-sm text-[#7a6e5f]">
          Genera un informe actualizado a partir de la integración activa de Holded.
        </p>
      </div>

      <GenerateReportPanel />
    </main>
  );
}
