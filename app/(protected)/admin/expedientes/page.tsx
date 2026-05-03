import Link from 'next/link';
import { cookies } from 'next/headers';
import { FolderOpen } from 'lucide-react';
import { AdminCaseCard } from '@/components/cases/AdminCaseCard';

interface Case {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
}

async function getAdminCases(): Promise<Case[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cases`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.cases as Case[];
}

export default async function AdminCasesPage() {
  const cases = await getAdminCases();

  const open = cases.filter((c) => c.state !== 'finalizado');
  const closed = cases.filter((c) => c.state === 'finalizado');

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
              <span>
                <strong className="text-[#07111d]">{open.length}</strong> activos
              </span>
              <span>
                <strong className="text-[#07111d]">{closed.length}</strong> finalizados
              </span>
            </div>
          </div>

          {cases.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              No hay expedientes registrados. Se crean automáticamente tras un pago confirmado.
            </div>
          ) : (
            <div className="space-y-8">
              {open.length > 0 ? (
                <section>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#c88b25]">
                    Activos ({open.length})
                  </h2>
                  <div className="space-y-4">
                    {open.map((c) => (
                      <AdminCaseCard key={c.id} caseItem={c} />
                    ))}
                  </div>
                </section>
              ) : null}

              {closed.length > 0 ? (
                <section>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#29384a]">
                    Finalizados ({closed.length})
                  </h2>
                  <div className="space-y-4 opacity-60">
                    {closed.map((c) => (
                      <AdminCaseCard key={c.id} caseItem={c} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
