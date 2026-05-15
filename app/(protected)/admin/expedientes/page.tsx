import Link from 'next/link';
import { cookies } from 'next/headers';
import { FolderOpen } from 'lucide-react';
import { CaseListWithFilters } from '@/components/admin/CaseListWithFilters';

interface CaseWithClient {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
  client: { full_name: string | null; email: string };
}

async function getAdminCases(): Promise<CaseWithClient[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/cases`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.cases as CaseWithClient[];
}

export default async function AdminCasesPage() {
  const cases = await getAdminCases();
  const total = cases.length;
  const active = cases.filter((c) => c.state !== 'finalizado').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <FolderOpen className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">
            Volver al panel de administración
          </Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Expedientes</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Gestión de expedientes</h1>
            </div>
            <div className="flex gap-4 text-sm text-[#29384a]">
              <span><strong className="text-[#07111d]">{active}</strong> activos</span>
              <span><strong className="text-[#07111d]">{total - active}</strong> finalizados</span>
            </div>
          </div>

          <CaseListWithFilters cases={cases} />
        </div>
      </div>
    </main>
  );
}
