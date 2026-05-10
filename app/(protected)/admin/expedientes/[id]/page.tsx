import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, User, Download, FileText } from 'lucide-react';
import { AdminCaseCard } from '@/components/cases/AdminCaseCard';
import { DocStateSelect } from '@/components/admin/DocStateSelect';
import { CaseChecklistEditor } from '@/components/admin/CaseChecklistEditor';
import { HoldedSyncButton } from '@/components/admin/HoldedSyncButton';

interface Document {
  id: string;
  original_name: string;
  state: 'pendiente' | 'revisado' | 'rechazado';
  created_at: string;
  file_path: string;
  downloadUrl: string | null;
}

interface CaseDetail {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
  admin_note: string | null;
  docs_checklist: string[] | null;
  client: { email: string; full_name: string | null; phone: string | null };
}

async function getData(id: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/cases/${id}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ case: CaseDetail; documents: Document[] }>;
}

export default async function AdminCaseDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8f4eb] py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/admin/expedientes" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-4 w-4" /> Volver a expedientes
          </Link>
          <p className="mt-8 text-[#29384a]">Expediente no encontrado.</p>
        </div>
      </main>
    );
  }

  const { case: c, documents } = data;
  const pending = documents.filter((d) => d.state === 'pendiente').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl px-6">

        <Link href="/admin/expedientes" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
          <ArrowLeft className="h-4 w-4" /> Volver a expedientes
        </Link>

        {/* Case state card */}
        <div className="mt-6">
          <AdminCaseCard caseItem={c} />
        </div>

        {/* Client info */}
        <div className="mt-4 rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Cliente</p>
          </div>
          <div className="grid gap-1 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#29384a]">Nombre</p>
              <p className="font-semibold text-[#07111d]">{c.client.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#29384a]">Email</p>
              <a href={`mailto:${c.client.email}`} className="font-semibold text-[#c88b25] hover:underline">{c.client.email}</a>
            </div>
            <div>
              <p className="text-xs text-[#29384a]">Teléfono</p>
              <p className="font-semibold text-[#07111d]">{c.client.phone ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <CaseChecklistEditor caseId={id} initialItems={Array.isArray(c.docs_checklist) ? c.docs_checklist : []} />
        </div>

        <div className="mt-4 rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Holded Projects</p>
              <p className="mt-1 text-sm text-[#29384a]">
                Crear o enlazar este expediente como proyecto operativo en Holded.
              </p>
            </div>
            <HoldedSyncButton
              endpoint="/api/admin/integrations/holded/sync-project"
              payload={{ caseId: id }}
              label="Sync proyecto"
            />
          </div>
        </div>

        {/* Documents */}
        <div className="mt-4 rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#c88b25]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Documentación</p>
            </div>
            <div className="flex gap-3 text-xs text-[#29384a]">
              <span><strong className="text-[#07111d]">{documents.length}</strong> archivos</span>
              {pending > 0 && (
                <span className="font-semibold text-[#c88b25]">{pending} pendiente{pending > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-8 text-center text-sm text-[#29384a]">
              El cliente aún no ha subido documentos para este expediente.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#c88b25]" />
                    <div>
                      <p className="text-sm font-semibold text-[#07111d]">{doc.original_name}</p>
                      <p className="text-xs text-[#29384a]">
                        Subido el {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DocStateSelect docId={doc.id} currentState={doc.state} />
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d]"
                      >
                        <Download className="h-3 w-3" />
                        Descargar
                      </a>
                    )}
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
