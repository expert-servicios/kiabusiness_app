import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, ExternalLink,
  Video, XCircle, RefreshCw, AlertCircle
} from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface Appointment {
  id: string;
  service: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
  confirmed_date: string | null;
  confirmed_time: string | null;
  meeting_url: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeBg: string; badgeText: string; Icon: React.FC<{ className?: string }> }> = {
  pending:     { label: 'Pendiente de confirmar', badgeBg: 'bg-amber-100',  badgeText: 'text-amber-800',  Icon: Clock },
  confirmed:   { label: 'Confirmada',             badgeBg: 'bg-green-100',  badgeText: 'text-green-800',  Icon: CheckCircle2 },
  cancelled:   { label: 'Cancelada',              badgeBg: 'bg-red-100',    badgeText: 'text-red-700',    Icon: XCircle },
  rescheduled: { label: 'Reagendada',             badgeBg: 'bg-blue-100',   badgeText: 'text-blue-800',   Icon: RefreshCw },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

async function getAppointments(): Promise<Appointment[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(absoluteAppUrl('/api/dashboard/citas'), {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.appointments ?? []) as Appointment[];
}

export default async function DashboardCitasPage() {
  const appointments = await getAppointments();
  const upcoming = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const past = appointments.filter((a) => a.status === 'cancelled' || a.status === 'rescheduled');

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-3xl px-6">

        <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#c88b25]/10 p-2.5">
              <Calendar className="h-5 w-5 text-[#c88b25]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Citas</p>
              <h1 className="mt-0.5 font-serif text-2xl font-bold text-[#07111d]">Mis citas</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#29384a]">
            {appointments.length === 0
              ? 'Aquí aparecerán las citas que hayas solicitado con EXPERT.'
              : `${appointments.length} cita${appointments.length !== 1 ? 's' : ''} registrada${appointments.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-10 text-center">
            <Calendar className="mx-auto mb-4 h-10 w-10 text-[#d8cbb5]" />
            <p className="font-semibold text-[#29384a]">No tienes citas registradas</p>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Solicita una cita con nosotros desde la página de contacto.
            </p>
            <Link
              href="/cita"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-6 py-3 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
            >
              Solicitar cita
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Próximas</p>
                <div className="space-y-3">
                  {upcoming.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
                    const { Icon } = cfg;
                    return (
                      <div
                        key={appt.id}
                        className={`rounded-2xl border p-5 ${appt.status === 'confirmed' ? 'border-green-200 bg-green-50/40' : 'border-amber-200 bg-amber-50/40'}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#07111d]">{appt.service}</p>
                            {appt.confirmed_date ? (
                              <p className="mt-1 text-sm font-medium text-[#29384a]">
                                {fmtDate(appt.confirmed_date)}
                                {appt.confirmed_time && (
                                  <span className="ml-2 text-[#c88b25]">· {appt.confirmed_time}</span>
                                )}
                              </p>
                            ) : (
                              <p className="mt-1 text-sm text-[#9ca3af]">Pendiente de confirmar fecha</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>

                        {appt.meeting_url && (
                          <div className="mt-4 flex items-center gap-2">
                            <a
                              href={appt.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-4 py-2 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
                            >
                              <Video className="h-4 w-4" />
                              Unirse a la reunión
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}

                        {appt.status === 'pending' && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                            <p className="text-xs text-amber-800">
                              Tu cita está pendiente de confirmación. Te avisaremos por email en cuanto la hayamos revisado.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past / cancelled */}
            {past.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#29384a]/50">Anteriores</p>
                <div className="space-y-2">
                  {past.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.cancelled;
                    const { Icon } = cfg;
                    return (
                      <div key={appt.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#d8cbb5] bg-white px-5 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#29384a]">{appt.service}</p>
                          <p className="text-xs text-[#9ca3af]">
                            {appt.confirmed_date ? fmtDate(appt.confirmed_date) : new Date(appt.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
