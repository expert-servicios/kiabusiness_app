import Link from 'next/link';
import { cookies } from 'next/headers';
import { FileText } from 'lucide-react';
import { AdminQuoteCard } from '@/components/quotes/AdminQuoteCard';
import { absoluteAppUrl } from '@/lib/utils/app-url';

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
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
    const response = await fetch(absoluteAppUrl('/api/quotes'), {
      headers: { cookie: cookieHeader ?? '' },
      cache: 'no-store'
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.quotes as Quote[];
  } catch {
    return [];
  }
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
                <AdminQuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
