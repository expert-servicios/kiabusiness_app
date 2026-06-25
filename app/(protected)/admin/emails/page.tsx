'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp, Loader2, RotateCcw } from 'lucide-react';

interface EmailEvent {
  id: number;
  event_type: string;
  recipient_email: string;
  subject: string;
  resend_id: string | null;
  status: string;
  last_error: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sent:    { label: 'Enviado',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  delivered:{ label: 'Entregado',color: 'bg-green-50 text-green-700 border-green-200' },
  bounced: { label: 'Rebotado', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  failed:  { label: 'Fallido',  color: 'bg-red-50 text-red-700 border-red-200' },
  retried: { label: 'Reenviado',color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const EVENT_LABELS: Record<string, string> = {
  'quote.received':           'Presupuesto recibido',
  'quote.received.admin':     'Presupuesto recibido (admin)',
  'quote.responded':          'Presupuesto respondido',
  'quote.accepted.admin':     'Presupuesto aceptado (admin)',
  'payment.confirmed':        'Pago confirmado',
  'case.status.updated':      'Estado actualizado',
  'service.completed':        'Servicio completado',
  'review.request':           'Solicitud reseña',
  'subscription.created':     'Suscripción creada',
  'subscription.payment_failed': 'Pago suscripción fallido',
  'client_invite_wa':         'Invitación cliente (WABA)',
  'new_client_admin_alert':   'Nuevo cliente (admin)',
  'user.welcome':             'Bienvenida usuario',
};

export default function AdminEmailsPage() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      setEvents(data.events ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === events.length ? new Set() : new Set(events.map((e) => e.id))
    );
  };

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`¿Borrar ${ids.length} registro${ids.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvents((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelected(new Set());
      showToast(`${data.deleted} registro${data.deleted > 1 ? 's' : ''} eliminado${data.deleted > 1 ? 's' : ''}`);
    } catch (err) {
      showToast((err as Error).message ?? 'Error al borrar', 'err');
    } finally {
      setDeleting(false);
    }
  };

  const handleResend = async (id: number) => {
    setResending(id);
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message ?? 'Añadido a la cola');
      await load();
    } catch (err) {
      showToast((err as Error).message ?? 'No se puede reenviar automáticamente', 'err');
    } finally {
      setResending(null);
    }
  };

  const failedCount = events.filter((e) => e.status === 'failed').length;
  const allSelected = events.length > 0 && selected.size === events.length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#061321]">
          <Mail className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Panel</Link>
          <span className="text-[#9ca3af]">/</span>
          <span>Historial de envíos</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Comunicaciones</p>
            <h1 className="mt-2 font-serif text-2xl font-bold text-[#07111d] lg:text-3xl">Historial de envíos</h1>
            <p className="mt-1 text-sm text-[#7a6e5f]">
              {events.length} registros
              {failedCount > 0 && <span className="ml-2 font-semibold text-red-600">· {failedCount} fallidos</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => handleDelete([...selected])}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Borrar {selected.size}
              </button>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm font-semibold text-[#29384a] transition hover:bg-[#f0e9d8] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
            toast.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {toast.msg}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#7a6e5f]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#7a6e5f]">No hay registros de email.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0e9d8] bg-[#faf7f2]">
                    <th className="w-10 py-3 pl-4" aria-label="Seleccionar todos">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-[#d8cbb5] accent-[#c88b25]"
                      />
                    </th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6e5f]">Fecha</th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6e5f]">Tipo</th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6e5f]">Destinatario</th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6e5f] hidden lg:table-cell">Asunto</th>
                    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6e5f]">Estado</th>
                    <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6e5f]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => {
                    const cfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.sent;
                    const isExpanded = expanded === ev.id;
                    return (
                      <>
                        <tr
                          key={ev.id}
                          className={`border-b border-[#f8f4eb] transition-colors ${selected.has(ev.id) ? 'bg-amber-50/60' : 'hover:bg-[#faf7f2]'}`}
                        >
                          <td className="py-3 pl-4">
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar ${ev.recipient_email}`}
                              checked={selected.has(ev.id)}
                              onChange={() => toggleSelect(ev.id)}
                              className="rounded border-[#d8cbb5] accent-[#c88b25]"
                            />
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#7a6e5f] whitespace-nowrap">
                            {new Date(ev.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#07111d]">
                            {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#29384a]">{ev.recipient_email}</td>
                          <td className="py-3 pr-4 max-w-[220px] truncate text-xs text-[#07111d] hidden lg:table-cell">{ev.subject}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
                              {ev.status === 'failed' ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center justify-end gap-1">
                              {(ev.last_error || ev.status === 'failed') && (
                                <button
                                  type="button"
                                  onClick={() => setExpanded(isExpanded ? null : ev.id)}
                                  className="rounded-lg p-1.5 text-[#9ca3af] transition hover:bg-[#f0e9d8] hover:text-[#07111d]"
                                  title={isExpanded ? 'Ocultar error' : 'Ver error'}
                                  aria-label={isExpanded ? 'Ocultar error' : 'Ver error'}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              {ev.status === 'failed' && (
                                <button
                                  type="button"
                                  onClick={() => handleResend(ev.id)}
                                  disabled={resending === ev.id}
                                  className="rounded-lg p-1.5 text-[#9ca3af] transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                                  title="Reintentar envío"
                                  aria-label="Reintentar envío"
                                >
                                  {resending === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete([ev.id])}
                                disabled={deleting}
                                className="rounded-lg p-1.5 text-[#9ca3af] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Borrar registro"
                                aria-label="Borrar registro"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && ev.last_error && (
                          <tr key={`${ev.id}-err`} className="border-b border-[#f8f4eb] bg-red-50/40">
                            <td colSpan={7} className="px-4 py-3">
                              <p className="text-xs font-semibold text-red-700 mb-1">Error de Resend:</p>
                              <code className="text-xs text-red-600 break-all">{ev.last_error}</code>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
