import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
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
  const json = await fetchWithCookies<{ report: ReportRow }>(`/api/reports/${id}`);
  return json?.report ?? null;
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
