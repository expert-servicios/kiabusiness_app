import { cookies } from 'next/headers';
import { Calendar } from 'lucide-react';
import { ClientFiscalCalendar } from '@/components/dashboard/ClientFiscalCalendar';

interface FiscalObligation {
  id: string;
  user_id: string;
  company_id: string | null;
  year: number;
  obligation_key: string;
  modelo: string;
  description: string;
  period_label: string | null;
  deadline: string;
  status: 'pending' | 'submitted' | 'exempt' | 'skipped';
  google_event_id: string | null;
  notes: string | null;
}

async function fetchWithCookies(path: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ClientFiscalCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const year = new Date().getFullYear();

  const [obligationsData, tokenData] = await Promise.all([
    fetchWithCookies(`/api/admin/fiscal-calendar?year=${year}`),
    fetchWithCookies('/api/auth/google-calendar/status'),
  ]);

  const obligations: FiscalObligation[] = obligationsData?.obligations ?? [];
  const googleConnected: boolean = tokenData?.connected ?? false;

  const pending = obligations.filter((o) => o.status === 'pending').length;
  const overdue = obligations.filter(
    (o) => o.status === 'pending' && new Date(o.deadline) < new Date()
  ).length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-5xl px-6">

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Mis obligaciones</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <Calendar className="h-6 w-6 text-[#d7a33a]" /> Calendario Fiscal {year}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#29384a]">
            {overdue > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                {overdue} vencida{overdue > 1 ? 's' : ''}
              </span>
            )}
            <span><strong className="font-semibold text-[#07111d]">{pending}</strong> pendientes</span>
          </div>
        </div>

        <ClientFiscalCalendar
          obligations={obligations}
          googleConnected={googleConnected}
          flashConnected={params.connected === '1'}
          flashError={params.error === 'oauth'}
        />
      </div>
    </main>
  );
}
