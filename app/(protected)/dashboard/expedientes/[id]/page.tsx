import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, FolderOpen, Info } from 'lucide-react';
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
  pendiente_documentacion: 'bg-amber-100 text-amber-800',
  en_revision: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-purple-100 text-purple-800',
  presentado: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-600'
};

interface StateGuide {
  icon: 'alert' | 'clock' | 'check' | 'info';
  title: string;
  desc: string;
  borderColor: string;
  bgColor: string;
  iconColor: string;
}

const STATE_GUIDE: Record<string, StateGuide> = {
  pendiente_documentacion: {
    icon: 'alert',
    title: 'Necesitamos tu documentación para continuar',
    desc: 'Para poder gestionar tu expediente, sube los documentos que te hemos indicado. Si tienes dudas sobre qué necesitas, pregúntanos en el hilo de mensajes.',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500'
  },
  en_revision: {
    icon: 'clock',
    title: 'Estamos revisando tu documentación',
    desc: 'Hemos recibido tus documentos y los estamos analizando. Te avisaremos si necesitamos algo adicional. No necesitas hacer nada más por ahora.',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500'
  },
  en_proceso: {
    icon: 'info',
    title: 'Tu trámite está en curso',
    desc: 'Hemos iniciado la gestión de tu expediente ante el organismo correspondiente. Te informaremos de cada avance relevante.',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500'
  },
  presentado: {
    icon: 'info',
    title: 'Trámite presentado',
    desc: 'Tu expediente ha sido presentado ante el organismo competente. Estamos monitorizando la resolución y te avisaremos en cuanto tengamos novedades.',
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500'
  },
  finalizado: {
    icon: 'check',
    title: 'Expediente completado',
    desc: 'Tu trámite ha finalizado con éxito. Puedes encontrar todos los documentos finales en la sección de abajo. Si necesitas algo más, contacta con nosotros.',
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-50',
    iconColor: 'text-gray-500'
  }
};

const STEPS = [
  'pendiente_documentacion',
  'en_revision',
  'en_proceso',
  'presentado',
  'finalizado'
] as const;

const STEP_LABELS: Record<string, string> = {
  pendiente_documentacion: 'Docs.',
  en_revision: 'Revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado',
  finalizado: 'Finalizado'
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

  const guide = STATE_GUIDE[caseItem.state] ?? STATE_GUIDE.en_proceso;
  const currentStepIndex = STEPS.indexOf(caseItem.state as typeof STEPS[number]);

  const uploadedCount = documents.length;
  const reviewedCount = documents.filter((d) => d.state === 'revisado').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl px-6">

        {/* Back */}
        <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard/expedientes" className="underline underline-offset-4">Mis expedientes</Link>
        </div>

        {/* Case header */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#c88b25]/10 p-3 text-[#c88b25]">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#c88b25]">{caseItem.category}</p>
                <h1 className="mt-1 font-serif text-xl font-bold text-[#07111d]">{caseItem.service}</h1>
                <p className="mt-1 text-xs text-[#29384a]">
                  Abierto el {new Date(caseItem.opened_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <span className={`self-start rounded-full px-3 py-1.5 text-xs font-semibold ${STATE_COLORS[caseItem.state] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATE_LABELS[caseItem.state] ?? caseItem.state}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => {
                const done = currentStepIndex > i;
                const active = currentStepIndex === i;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        done ? 'bg-[#d7a33a] text-[#061321]' :
                        active ? 'bg-[#d7a33a] text-[#061321] ring-2 ring-[#d7a33a]/30' :
                        'bg-[#e8dfc9] text-[#29384a]'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <p className={`mt-1 hidden text-[10px] font-semibold sm:block ${active ? 'text-[#07111d]' : 'text-[#29384a]'}`}>
                        {STEP_LABELS[step]}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 ${done ? 'bg-[#d7a33a]' : 'bg-[#e8dfc9]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* State guidance */}
        <div className={`mt-4 rounded-2xl border p-5 ${guide.bgColor} ${guide.borderColor}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 ${guide.iconColor}`}>
              {guide.icon === 'alert' && <AlertCircle className="h-5 w-5" />}
              {guide.icon === 'clock' && <Clock className="h-5 w-5" />}
              {guide.icon === 'check' && <CheckCircle2 className="h-5 w-5" />}
              {guide.icon === 'info' && <Info className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#07111d]">{guide.title}</p>
              <p className="mt-1 text-sm text-[#29384a]">{guide.desc}</p>
              {uploadedCount > 0 && caseItem.state !== 'finalizado' && (
                <p className="mt-2 text-xs text-[#29384a]">
                  {uploadedCount} documento{uploadedCount !== 1 ? 's' : ''} subido{uploadedCount !== 1 ? 's' : ''}
                  {reviewedCount > 0 && ` · ${reviewedCount} revisado${reviewedCount !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <DocumentUpload caseId={id} initialDocuments={documents} />
          </div>
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <CaseMessageThread caseId={id} initialMessages={messages} currentRole="client" />
          </div>
        </div>

      </div>
    </main>
  );
}
