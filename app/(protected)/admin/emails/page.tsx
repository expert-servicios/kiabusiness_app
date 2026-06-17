import Link from 'next/link';
import { cookies } from 'next/headers';
import { Mail, CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface EmailEvent {
  id: number;
  event_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  created_at: string;
}

interface EmailsResponse {
  events: EmailEvent[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sent: { label: 'Enviado', icon: <Clock className="h-3 w-3" />, color: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Entregado', icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-green-50 text-green-700' },
  bounced: { label: 'Rebotado', icon: <AlertCircle className="h-3 w-3" />, color: 'bg-yellow-50 text-yellow-700' },
  failed: { label: 'Fallido', icon: <AlertCircle className="h-3 w-3" />, color: 'bg-red-50 text-red-700' }
};

const EVENT_LABELS: Record<string, string> = {
  'quote.received': 'Presupuesto recibido',
  'quote.received.admin': 'Presupuesto recibido (admin)',
  'quote.responded': 'Presupuesto respondido',
  'quote.accepted.admin': 'Presupuesto aceptado (admin)',
  'payment.confirmed': 'Pago confirmado',
  'case.status.updated': 'Estado actualizado',
  'service.completed': 'Servicio completado',
  'review.request': 'Solicitud de reseña',
  'subscription.created': 'Suscripción creada',
  'subscription.payment_failed': 'Pago suscripción fallido'
};

async function getEmailEvents(page: number): Promise<EmailsResponse> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const response = await fetch(absoluteAppUrl(`/api/admin/emails?page=${page}`), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!response.ok) return { events: [], total: 0, page: 1, pageSize: 50 };
    return await response.json() as EmailsResponse;
  } catch {
    return { events: [], total: 0, page: 1, pageSize: 50 };
  }
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const { events, total, pageSize } = await getEmailEvents(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <Mail className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Volver al panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Comunicaciones</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Registro de emails</h1>
            </div>
            <p className="text-sm text-[#29384a]">{total} envíos registrados</p>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              No hay emails registrados todavía.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d8cbb5] text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#29384a]">
                      <th className="pb-3 pr-4">Fecha</th>
                      <th className="pb-3 pr-4">Evento</th>
                      <th className="pb-3 pr-4">Destinatario</th>
                      <th className="pb-3 pr-4">Asunto</th>
                      <th className="pb-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => {
                      const cfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.sent;
                      return (
                        <tr key={ev.id} className="border-b border-[#f8f4eb] hover:bg-[#f8f4eb]/60">
                          <td className="py-3 pr-4 text-xs text-[#29384a]">
                            {new Date(ev.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#07111d]">
                            {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#29384a]">{ev.recipient_email}</td>
                          <td className="py-3 pr-4 max-w-xs truncate text-xs text-[#07111d]">{ev.subject}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-[#29384a]">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 ? (
                      <Link
                        href={`/admin/emails?page=${page - 1}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] hover:bg-[#f8f4eb] transition-colors"
                      >
                        <ChevronLeft className="h-3 w-3" /> Anterior
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-300 cursor-not-allowed">
                        <ChevronLeft className="h-3 w-3" /> Anterior
                      </span>
                    )}
                    {page < totalPages ? (
                      <Link
                        href={`/admin/emails?page=${page + 1}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] hover:bg-[#f8f4eb] transition-colors"
                      >
                        Siguiente <ChevronRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-300 cursor-not-allowed">
                        Siguiente <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
