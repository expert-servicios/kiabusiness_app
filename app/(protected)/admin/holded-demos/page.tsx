import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, Building2, Mail, Phone, Monitor, Users } from 'lucide-react';
import { HoldedDemoStatusSelect } from '@/components/admin/HoldedDemoStatusSelect';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface HoldedDemo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string;
  company_type: string | null;
  employees_count: string | null;
  current_software: string | null;
  needs: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending:        'Pendiente de activar',
  demo_active:    'Demo activa',
  onboarding_done:'Onboarding hecho',
  training_done:  'Formación hecha',
  converted:      'Cliente convertido',
  closed:         'Cerrado'
};

async function getDemos(): Promise<HoldedDemo[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/holded-demos'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.demos ?? [];
  } catch {
    return [];
  }
}

export default async function AdminHoldedDemosPage() {
  const demos = await getDemos();

  const pendingCount = demos.filter((d) => d.status === 'pending').length;
  const activeCount = demos.filter((d) => d.status === 'demo_active').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-7">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Panel admin
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Prueba Holded 14 días</h1>
              <p className="mt-1 text-sm text-[#29384a]">
                Solicitudes de demo gratuita de 14 días — onboarding y formación incluidos
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-center">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-amber-800">{pendingCount}</p>
                <p className="text-xs text-amber-700">Por activar</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-blue-800">{activeCount}</p>
                <p className="text-xs text-blue-700">Demo activa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {demos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-12 text-center">
            <Monitor className="mx-auto h-10 w-10 text-[#d8cbb5]" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">Sin solicitudes todavía</h2>
            <p className="mt-2 text-sm text-[#29384a]">
              Cuando alguien solicite la prueba Holded desde{' '}
              <Link href="/planes/gratuito" className="text-[#c88b25] underline underline-offset-4">
                /planes/gratuito
              </Link>
              , aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demos.map((demo) => {
              const date = new Date(demo.created_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric'
              });
              const statusLabel = STATUS_LABELS[demo.status] ?? demo.status;

              return (
                <div key={demo.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10 text-[#c88b25]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-serif text-base font-bold text-[#07111d]">{demo.company_name}</p>
                        <p className="mt-0.5 text-sm text-[#29384a]">{demo.name}</p>
                        <p className="text-xs text-[#29384a]">{date}</p>
                      </div>
                    </div>
                    <span className="self-start rounded-full border border-[#d8cbb5] bg-[#f8f4eb] px-3 py-1 text-xs font-semibold text-[#29384a]">
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#29384a]">
                    <a href={`mailto:${demo.email}`} className="inline-flex items-center gap-1.5 font-semibold text-[#c88b25] hover:underline">
                      <Mail className="h-3.5 w-3.5" />
                      {demo.email}
                    </a>
                    {demo.phone && (
                      <a href={`tel:${demo.phone}`} className="inline-flex items-center gap-1.5 hover:text-[#07111d]">
                        <Phone className="h-3.5 w-3.5" />
                        {demo.phone}
                      </a>
                    )}
                    {demo.employees_count && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {demo.employees_count}
                      </span>
                    )}
                  </div>

                  {(demo.company_type || demo.current_software) && (
                    <div className="mt-4 grid gap-4 border-t border-[#f0e8d8] pt-4 text-sm sm:grid-cols-2">
                      {demo.company_type && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Tipo de empresa</p>
                          <p className="mt-1 text-[#29384a]">{demo.company_type}</p>
                        </div>
                      )}
                      {demo.current_software && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Software actual</p>
                          <p className="mt-1 text-[#29384a]">{demo.current_software}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {demo.needs && (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Qué quiere conseguir</p>
                      <p className="mt-1 text-sm leading-6 text-[#29384a]">{demo.needs}</p>
                    </div>
                  )}

                  {demo.notes && (
                    <div className="mt-3 rounded-lg bg-[#f8f4eb] p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Notas internas</p>
                      <p className="mt-1 text-xs text-[#29384a]">{demo.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#f0e8d8] pt-4">
                    <HoldedDemoStatusSelect demoId={demo.id} initialStatus={demo.status} />
                    <a
                      href={`mailto:${demo.email}?subject=Tu prueba Holded 14 días — EXPERT`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-4 py-1.5 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Enviar email
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
