'use client';

import { useState } from 'react';
import { Mail, Megaphone, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { CampanasDashboard } from './CampanasDashboard';

interface EmailEvent {
  id: number;
  event_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sent:      { label: 'Enviado',   icon: <Clock className="h-3 w-3"/>,        color: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Entregado', icon: <CheckCircle2 className="h-3 w-3"/>, color: 'bg-green-50 text-green-700' },
  bounced:   { label: 'Rebotado',  icon: <AlertCircle className="h-3 w-3"/>,  color: 'bg-yellow-50 text-yellow-700' },
  failed:    { label: 'Fallido',   icon: <AlertCircle className="h-3 w-3"/>,  color: 'bg-red-50 text-red-700' },
};

const EVENT_LABELS: Record<string, string> = {
  'quote.received': 'Presupuesto recibido',
  'quote.received.admin': 'Presupuesto (admin)',
  'quote.responded': 'Presupuesto respondido',
  'quote.accepted.admin': 'Presupuesto aceptado',
  'payment.confirmed': 'Pago confirmado',
  'case.status.updated': 'Estado expediente',
  'service.completed': 'Servicio completado',
  'review.request': 'Solicitud reseña',
  'subscription.created': 'Suscripción creada',
  'subscription.payment_failed': 'Pago suscripción fallido',
  'cita.confirmed': 'Cita confirmada',
  'campaign': 'Campaña',
};

export function EmailsPageClient({ initialEvents }: { initialEvents: EmailEvent[] }) {
  const [tab, setTab] = useState<'historial' | 'campanas'>('historial');

  const tabs = [
    { id: 'historial' as const, label: 'Historial', icon: Mail },
    { id: 'campanas' as const, label: 'Campañas', icon: Megaphone },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-white border border-[#d8cbb5] p-1 w-fit shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === id
                ? 'bg-[#07111d] text-white shadow-sm'
                : 'text-[#29384a] hover:bg-[#f0e9d8]'
            }`}
          >
            <Icon className="h-3.5 w-3.5"/>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'historial' && (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
          <div className="border-b border-[#d8cbb5] px-6 py-4">
            <p className="text-sm font-semibold text-[#07111d]">Registro transaccional</p>
            <p className="text-xs text-[#29384a]">{initialEvents.length} envíos registrados</p>
          </div>

          {initialEvents.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#29384a]">No hay emails registrados todavía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#29384a]">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Evento</th>
                    <th className="px-4 py-3">Destinatario</th>
                    <th className="px-4 py-3">Asunto</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {initialEvents.map((ev) => {
                    const cfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.sent;
                    return (
                      <tr key={ev.id} className="border-b border-[#f8f4eb] hover:bg-[#faf7f0]">
                        <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">
                          {new Date(ev.created_at).toLocaleString('es-ES', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#07111d]">
                          {EVENT_LABELS[ev.event_type] ?? ev.event_type.replace(/\./g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#29384a]">{ev.recipient_email}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[#07111d]">{ev.subject}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'campanas' && <CampanasDashboard />}
    </div>
  );
}
