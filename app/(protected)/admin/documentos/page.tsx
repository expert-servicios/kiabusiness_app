import { cookies } from 'next/headers';
import Link from 'next/link';
import { FileSearch } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { DocumentClassificationList, type DocClassification } from '@/components/admin/DocumentClassificationList';

async function fetchAllDocuments(): Promise<DocClassification[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/documents?page=0'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json() as { documents: DocClassification[] };
    return data.documents;
  } catch {
    return [];
  }
}

export default async function AdminDocumentosPage() {
  const documents = await fetchAllDocuments();
  const pending = documents.filter((d) => d.status === 'needs_review').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <FileSearch className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">
            Volver al panel
          </Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Clasificación documental</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Documentos recibidos</h1>
              <p className="mt-2 text-sm text-[#29384a]">
                Documentos clasificados automáticamente por Kia. Revisa y corrige los marcados como pendientes.
              </p>
            </div>
            {pending > 0 && (
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-amber-100 text-center">
                <span className="text-xl font-bold text-amber-800">{pending}</span>
                <span className="text-[10px] font-semibold uppercase text-amber-700">pendientes</span>
              </div>
            )}
          </div>

          <DocumentClassificationList initialDocuments={documents} />
        </div>
      </div>
    </main>
  );
}
