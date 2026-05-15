import { cookies } from 'next/headers';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { AdminFiscalCalendar } from '@/components/admin/AdminFiscalCalendar';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

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
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

const currentYear = new Date().getFullYear();

export default async function AdminFiscalCalendarPage() {
  const [usersData, obligationsData] = await Promise.all([
    fetchWithCookies('/api/admin/users'),
    fetchWithCookies(`/api/admin/fiscal-calendar?year=${currentYear}`),
  ]);

  const users: Profile[] = (usersData?.users ?? []).filter((u: Profile) => u.role === 'client');
  const obligations: FiscalObligation[] = obligationsData?.obligations ?? [];

  const pending = obligations.filter((o) => o.status === 'pending').length;
  const submitted = obligations.filter((o) => o.status === 'submitted').length;
  const overdue = obligations.filter(
    (o) => o.status === 'pending' && new Date(o.deadline) < new Date()
  ).length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Gestión fiscal</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <Calendar className="h-6 w-6 text-[#d7a33a]" /> Calendario Fiscal
            </h1>
          </div>
          <div className="flex items-center gap-5 text-sm text-[#29384a]">
            <span><strong className="font-serif text-xl font-bold text-[#07111d]">{pending}</strong> pendientes</span>
            <span><strong className="font-serif text-xl font-bold text-[#1fae4b]">{submitted}</strong> presentadas</span>
            {overdue > 0 && (
              <span><strong className="font-serif text-xl font-bold text-red-600">{overdue}</strong> vencidas</span>
            )}
          </div>
        </div>

        {/* Quick nav to users */}
        <div className="mb-6 flex items-center gap-2 text-sm text-[#29384a]">
          <Link href="/admin/usuarios" className="flex items-center gap-1 text-[#c88b25] hover:underline">
            Usuarios <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <span>Generar obligaciones desde perfil de usuario</span>
        </div>

        <AdminFiscalCalendar
          obligations={obligations}
          users={users}
          year={currentYear}
        />
      </div>
    </main>
  );
}
