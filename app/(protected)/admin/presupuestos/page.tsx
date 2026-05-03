import Link from 'next/link';
import { cookies } from 'next/headers';
import { FileText, Users, CircleDot } from 'lucide-react';

interface Quote {
  id: string;
  title: string;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  client_id: string | null;
}

async function getAdminQuotes() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes`, {
    headers: { cookie: cookieHeader ?? '' },
    cache: 'no-store'
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.quotes as Quote[];
}

export default async function AdminQuotesPage() {
  const quotes = await getAdminQuotes();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <FileText className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Volver al panel de administración</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Presupuestos</p>
              <h1 className="mt-3 text-3xl font-serif font-bold text-[#07111d]">Gestión de presupuestos</h1>
            </div>
            <p className="text-sm text-[#29384a]">Lista de solicitudes, estado de pago y cliente asignado.</p>
          </div>

          {quotes.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              No hay presupuestos registrados. Las solicitudes aparecerán aquí cuando lleguen a la plataforma.
            </div>
          ) : (
            <div className="space-y-6">
              {quotes.map((quote) => (
                <div key={quote.id} className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#07111d]">{quote.title}</p>
                      <p className="mt-2 text-sm text-[#29384a]">Creado el {new Date(quote.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
                        <CircleDot className="h-4 w-4" />
                        {quote.status}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#d7a33a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#061321]">
                        <Users className="h-4 w-4" />
                        {quote.client_id ? 'Cliente registrado' : 'Lead anónimo'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 text-sm text-[#29384a]">
                      <p>
                        <span className="font-semibold">Importe:</span> €{quote.amount_eur.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-semibold">Vence:</span>{' '}
                        {quote.expires_at ? new Date(quote.expires_at).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 text-sm text-[#29384a]">
                      <p className="font-semibold text-[#07111d]">ID del presupuesto</p>
                      <p className="mt-2 break-all text-xs leading-5">{quote.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
