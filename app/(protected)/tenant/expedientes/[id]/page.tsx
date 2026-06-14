import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Package, Upload } from 'lucide-react';
import { TenantDeliverableUpload } from '@/components/tenant/TenantDeliverableUpload';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  nuevo:                { label: 'Nuevo',               cls: 'bg-slate-100 text-slate-600' },
  pendiente_cliente:    { label: 'Pendiente docs',      cls: 'bg-amber-100 text-amber-700' },
  en_revision:          { label: 'En revisión',         cls: 'bg-blue-100 text-blue-700' },
  listo_para_presentar: { label: 'Listo para presentar',cls: 'bg-indigo-100 text-indigo-700' },
  presentado:           { label: 'Presentado',          cls: 'bg-purple-100 text-purple-700' },
  finalizado:           { label: 'Finalizado',          cls: 'bg-green-100 text-green-700' },
  bloqueado:            { label: 'Bloqueado',           cls: 'bg-red-100 text-red-700' },
};

async function getCaseDetail(userId: string, caseId: string) {
  const admin = getSupabaseAdmin();

  // Verify tenant_admin belongs to the client's tenant
  const { data: adminProfile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  if (!adminProfile?.tenant_id) return null;

  const { data: caseData } = await admin
    .from('cases')
    .select('id, service, category, status, opened_at, closed_at, client_id, admin_note')
    .eq('id', caseId)
    .single();

  if (!caseData) return null;

  // Verify the case client belongs to this tenant
  const { data: clientProfile } = await admin
    .from('profiles')
    .select('full_name, tenant_id')
    .eq('id', caseData.client_id)
    .single();

  if (clientProfile?.tenant_id !== adminProfile.tenant_id) return null;

  // Get documents with signed URLs
  const { data: docs } = await admin
    .from('documents')
    .select('id, original_name, uploaded_by_role, created_at, file_path, state')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  const enrichedDocs = await Promise.all(
    (docs ?? []).map(async (doc) => {
      const { data: urlData } = await admin.storage
        .from('client-documents')
        .createSignedUrl(doc.file_path, 3600);
      return { ...doc, downloadUrl: urlData?.signedUrl ?? null };
    })
  );

  const clientDocs = enrichedDocs.filter((d) => d.uploaded_by_role !== 'admin');
  const deliverables = enrichedDocs.filter((d) => d.uploaded_by_role === 'admin');

  // Get client email
  const { data: authUser } = await admin.auth.admin.getUserById(caseData.client_id);

  return {
    case: caseData,
    clientName: clientProfile?.full_name ?? authUser?.user?.email ?? '—',
    clientEmail: authUser?.user?.email ?? null,
    clientDocs,
    deliverables,
  };
}

export default async function TenantCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const detail = await getCaseDetail(user.id, caseId);
  if (!detail) notFound();

  const { case: c, clientName, clientDocs, deliverables } = detail;
  const badge = STATUS_BADGE[c.status] ?? { label: c.status, cls: 'bg-gray-100 text-gray-600' };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/tenant/expedientes" className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e8d5]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-[#07111d]">{c.service ?? c.category ?? '—'}</h1>
          <p className="text-sm text-[#29384a]">{clientName}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#d8cbb5] bg-white px-5 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
        <span className="text-xs text-[#29384a]">
          Abierto {new Date(c.opened_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        {c.closed_at && (
          <span className="text-xs text-[#29384a]">
            · Cerrado {new Date(c.closed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
        {c.admin_note && (
          <p className="w-full rounded-xl bg-[#f8f4eb] px-4 py-2.5 text-sm italic text-[#29384a]">
            {c.admin_note}
          </p>
        )}
      </div>

      {/* Deliverables — with upload */}
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#07111d]">
          <Package className="h-4 w-4 text-[#d7a33a]" /> Entregables ({deliverables.length})
        </h2>
        {deliverables.length > 0 && (
          <ul className="mb-4 space-y-2">
            {deliverables.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
        <div className="border-t border-[#f0e8d5] pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#29384a]">
            <Upload className="h-3.5 w-3.5" /> Subir entregable
          </p>
          <TenantDeliverableUpload caseId={c.id} />
        </div>
      </section>

      {/* Client documents */}
      {clientDocs.length > 0 && (
        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#07111d]">
            <FileText className="h-4 w-4 text-[#29384a]" /> Documentos del cliente ({clientDocs.length})
          </h2>
          <ul className="space-y-2">
            {clientDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DocRow({
  doc,
}: {
  doc: { id: string; original_name: string; created_at: string; downloadUrl: string | null };
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3">
      <FileText className="h-4 w-4 shrink-0 text-[#d7a33a]" />
      <span className="flex-1 truncate text-sm text-[#07111d]">{doc.original_name}</span>
      <span className="shrink-0 text-xs text-[#29384a]/50">
        {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
      </span>
      {doc.downloadUrl && (
        <a
          href={doc.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg p-1.5 text-[#29384a]/50 transition hover:bg-white hover:text-[#d7a33a]"
          title="Descargar"
        >
          <Download className="h-4 w-4" />
        </a>
      )}
    </li>
  );
}
