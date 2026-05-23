import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronRight } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

interface Props {
  params: Promise<{ id: string }>;
}

type Viabilidad = 'alta' | 'media' | 'baja' | 'no_viable';

const VIABILIDAD_CONFIG: Record<Viabilidad, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  alta      : { label: 'Viabilidad alta',   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  media     : { label: 'Viabilidad media',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: AlertTriangle },
  baja      : { label: 'Viabilidad baja',   color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: XCircle      },
  no_viable : { label: 'No viable',         color: 'text-red-900',     bg: 'bg-red-100 border-red-300',        icon: XCircle      },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
}

export default async function InformePage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = getSupabaseAdmin();
  const { data: report } = await admin
    .from('kia_reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!report) notFound();

  // Ownership check — must be own phone / own client_id or admin
  const { data: profile } = await admin
    .from('profiles')
    .select('phone, role')
    .eq('id', user.id)
    .single();

  const isOwner = report.client_id === user.id || report.phone_number === profile?.phone;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff';
  if (!isOwner && !isAdmin) redirect('/dashboard');

  // Mark as viewed
  if (!report.viewed_at) {
    void admin.from('kia_reports').update({ viewed_at: new Date().toISOString() }).eq('id', id);
  }

  const viabilidad = (report.viabilidad ?? 'media') as Viabilidad;
  const cfg = VIABILIDAD_CONFIG[viabilidad] ?? VIABILIDAD_CONFIG.media;
  const Icon = cfg.icon;
  const documentos: string[] = Array.isArray(report.documentos) ? report.documentos : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#7a6e5f] hover:text-[#3d3528]"
      >
        <ArrowLeft size={14} />
        Volver al panel
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c88b25]">
          Informe de viabilidad
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#3d3528]">{report.service_label}</h1>
        <p className="mt-1 text-sm text-[#7a6e5f]">
          {report.service_area} · Generado el {formatDate(report.created_at)}
        </p>
      </div>

      {/* Viabilidad badge */}
      <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-5 ${cfg.bg}`}>
        <Icon size={24} className={`shrink-0 ${cfg.color}`} />
        <div>
          <p className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
          {report.riesgo && (
            <p className="mt-1 text-sm text-[#3d3528]">{report.riesgo}</p>
          )}
        </div>
      </div>

      {/* Documentos necesarios */}
      {documentos.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[#e8dfc8] bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6e5f]">
            Documentación necesaria
          </p>
          <ul className="space-y-2">
            {documentos.map((doc) => (
              <li key={doc} className="flex items-start gap-2 text-sm text-[#3d3528]">
                <FileText size={14} className="mt-0.5 shrink-0 text-[#c88b25]" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Siguientes pasos */}
      {report.siguientes_pasos && (
        <div className="mb-6 rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6e5f]">
            Siguientes pasos
          </p>
          <p className="text-sm text-[#3d3528] whitespace-pre-line">{report.siguientes_pasos}</p>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        {viabilidad !== 'no_viable' && (
          <Link
            href={`/contratar?from=cart`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c88b25] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b07820]"
          >
            Ver cesta
            <ChevronRight size={14} />
          </Link>
        )}
        <Link
          href="/auth/login?next=%2Fcita"
          className="inline-flex items-center gap-2 rounded-xl border border-[#e8dfc8] bg-white px-5 py-2.5 text-sm font-medium text-[#3d3528] hover:border-[#c88b25]"
        >
          Reservar llamada gratuita
        </Link>
      </div>

      <p className="mt-6 text-xs text-[#a89880]">
        Este informe fue generado automáticamente por Kia basándose en tus respuestas. No constituye asesoramiento jurídico definitivo.
        Consulta con el equipo de EXPERT para confirmación profesional.
      </p>
    </main>
  );
}
