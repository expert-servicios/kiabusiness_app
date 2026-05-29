import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, FileBarChart, Plus } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface ReportRow {
  id          : string;
  report_type : string;
  period      : string | null;
  title       : string;
  generated_by: string;
  viewed_at   : string | null;
  created_at  : string;
}

async function fetchReports(): Promise<ReportRow[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/reports'), {
      headers: { cookie: cookieHeader },
      cache  : 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reports ?? [];
  } catch {
    return [];
  }
}

export default async function InformesPage() {
  const reports = await fetchReports();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#7a6e5f] hover:text-[#3d3528]"
      >
        <ArrowLeft size={14} />
        Volver al panel
      </Link>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c88b25]/10">
            <FileBarChart size={18} className="text-[#c88b25]" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#07111d]">Mis informes</h1>
            <p className="text-sm text-[#7a6e5f]">Informes de estado de empresa generados por Kia</p>
          </div>
        </div>
        <Link
          href="/dashboard/informes/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#c88b25] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b07820]"
        >
          <Plus size={15} />
          Nuevo informe
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-[#e8dfc8] bg-white p-10 text-center shadow-sm">
          <FileBarChart className="mx-auto mb-3 h-10 w-10 text-[#c8b89a]" />
          <p className="font-semibold text-[#3d3528]">Aún no tienes informes generados</p>
          <p className="mt-1 text-sm text-[#7a6e5f]">
            Genera tu primer informe de estado de empresa para ver KPIs, IVA estimado, saldos y alertas.
          </p>
          <Link
            href="/dashboard/informes/nuevo"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#c88b25] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b07820]"
          >
            <Plus size={14} />
            Generar primer informe
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e8dfc8] bg-white shadow-sm">
          <ul className="divide-y divide-[#f0e8d8]">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/informes/${r.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#faf7f0]"
                >
                  <div className="flex items-start gap-3">
                    <FileBarChart className="mt-0.5 h-5 w-5 shrink-0 text-[#c88b25]" />
                    <div>
                      <p className="font-semibold text-[#07111d]">{r.title}</p>
                      <p className="text-xs text-[#7a6e5f]">
                        {r.period && `${r.period} · `}
                        {new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {!r.viewed_at && (
                          <span className="ml-2 rounded-full bg-[#c88b25] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            NUEVO
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#c88b25]">Ver →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
