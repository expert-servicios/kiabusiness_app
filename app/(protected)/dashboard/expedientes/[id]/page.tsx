import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { DocumentUpload } from '@/components/cases/DocumentUpload';
import { CaseMessageThread } from '@/components/cases/CaseMessageThread';

interface CaseDetail {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
}

interface Document {
  id: string;
  original_name: string;
  state: string;
  created_at: string;
}

interface Message {
  id: string;
  body: string;
  sender_role: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

const STATE_LABELS: Record<string, string> = {
  pendiente_documentacion: 'Pendiente de documentación',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado',
  finalizado: 'Finalizado'
};

const STATE_COLORS: Record<string, string> = {
  pendiente_documentacion: 'bg-yellow-100 text-yellow-800',
  en_revision: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-purple-100 text-purple-800',
  presentado: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-600'
};

async function fetchWithCookies(path: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return null;
  return response.json();
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [casesData, docsData, messagesData] = await Promise.all([
    fetchWithCookies('/api/cases'),
    fetchWithCookies(`/api/cases/${id}/documents`),
    fetchWithCookies(`/api/cases/${id}/messages`)
  ]);

  const caseItem = (casesData?.cases as CaseDetail[] | undefined)?.find((c) => c.id === id);
  if (!caseItem) notFound();

  const documents: Document[] = docsData?.documents ?? [];
  const messages: Message[] = messagesData?.messages ?? [];

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard/expedientes" className="underline underline-offset-4">Mis expedientes</Link>
        </div>

        {/* Case header */}
        <div className="mb-6 rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[#c88b25]/10 p-4 text-[#c88b25]">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#c88b25]">{caseItem.category}</p>
                <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{caseItem.service}</h1>
                <p className="mt-1 text-sm text-[#29384a]">
                  Abierto el {new Date(caseItem.opened_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center self-start rounded-full px-4 py-2 text-xs font-semibold ${STATE_COLORS[caseItem.state] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATE_LABELS[caseItem.state] ?? caseItem.state}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Documents */}
          <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <DocumentUpload caseId={id} initialDocuments={documents} />
          </div>

          {/* Messages */}
          <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <CaseMessageThread caseId={id} initialMessages={messages} currentRole="client" />
          </div>
        </div>
      </div>
    </main>
  );
}
