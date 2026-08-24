import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { AcademyEnrollmentsPanel, type ClientEnrollmentRow } from '@/components/dashboard/AcademyEnrollmentsPanel';

async function getEnrollments(): Promise<ClientEnrollmentRow[]> {
  const data = await fetchWithCookies<{ enrollments: ClientEnrollmentRow[] }>('/api/academy/enrollments');
  return data?.enrollments ?? [];
}

export default async function DashboardAcademyPage() {
  const enrollments = await getEnrollments();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">EXPERT Business Academy</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Mis matrículas</h1>

          {enrollments.length === 0 ? (
            <p className="mt-6 text-sm text-[#29384a]">
              Todavía no tienes ninguna matrícula activa.{' '}
              <Link href="/academy" className="text-[#c88b25] underline underline-offset-4">Ver programas disponibles</Link>.
            </p>
          ) : (
            <div className="mt-8">
              <AcademyEnrollmentsPanel initialEnrollments={enrollments} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
