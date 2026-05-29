import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { CompanyStatusReport } from '@/components/dashboard/reports/CompanyStatusReport';
import type { ReportData } from '@/lib/reports/report-generator';

interface ReportRow {
  id         : string;
  title      : string;
  period     : string | null;
  ai_summary : string | null;
  data       : ReportData;
  created_at : string;
}

async function fetchReport(id: string): Promise<ReportRow | null> {
  try {
    const cookieStore  = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl(`/api/reports/${id}`), {
      headers: { cookie: cookieHeader },
      cache  : 'no-store',
    });
    if (res.status === 401) redirect('/auth/login');
    if (!res.ok) return null;
    const json = await res.json();
    return json.report ?? null;
  } catch {
    return null;
  }
}

export default async function InformeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params;
  const report   = await fetchReport(id);
  if (!report) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <Link
        href="/dashboard/informes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#7a6e5f] hover:text-[#3d3528]"
      >
        <ArrowLeft size={14} />
        Mis informes
      </Link>

      <div className="rounded-2xl border border-[#e8dfc8] bg-white p-6 shadow-sm lg:p-8">
        <CompanyStatusReport reportId={id} data={report.data} />
      </div>
    </main>
  );
}
