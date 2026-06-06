'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar, Check, ChevronDown, Link2, MessageSquare,
  Phone, Mail, RefreshCw, Trash2, X, FolderOpen, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
  confirmed_date: string | null;
  confirmed_time: string | null;
  meeting_url: string | null;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pendiente',    cls: 'bg-amber-100 text-amber-800' },
  confirmed:   { label: 'Confirmada',   cls: 'bg-green-100 text-green-800' },
  cancelled:   { label: 'Cancelada',    cls: 'bg-red-100 text-red-800' },
  rescheduled: { label: 'Reagendada',   cls: 'bg-blue-100 text-blue-800' }
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function AdminCitasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter persisted in URL: ?status=pending|confirmed|cancelled|all
  const filter = searchParams.get('status') ?? 'all';
  const setFilter = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete('status');
    else params.set('status', value);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : '?', { scroll: false });
  }, [router, searchParams]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [expedienteTarget, setExpedienteTarget] = useState<Appointment | null>(null);
  const [expedienteService, setExpedienteService] = useState('');
  const [expedienteCategory, setExpedienteCategory] = useState('inmigración');
  const [creatingCase, setCreatingCase] = useState(false);
  const [caseCreated, setCaseCreated] = useState<{ id: string } | null>(null);
  const [caseError, setCaseError] = useState<string | null>(null);

  const handleCrearExpediente = async () => {
    if (!expedienteTarget) return;
    setCreatingCase(true);
    setCaseError(null);
    try {
      // 1. Find client by email
      const searchRes = await fetch(`/api/admin/clients-quick?q=${encodeURIComponent(expedienteTarget.email)}`);
      const searchData = await searchRes.json();
      const client = (searchData.clients ?? []).find(
        (c: { email: string }) => c.email.toLowerCase() === expedienteTarget.email.toLowerCase()
      );
      if (!client) {
        setCaseError('No se encontró un cliente registrado con ese email. Asegúrate de que el cliente está creado en el panel.');
        return;
      }
      // 2. Create case
      const caseRes = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          service: expedienteService || expedienteTarget.service,
          category: expedienteCategory,
        }),
      });
      const caseData = await caseRes.json();
      if (!caseRes.ok) { setCaseError(caseData.error ?? 'Error al crear expediente.'); return; }
      setCaseCreated(caseData.case);
    } finally { setCreatingCase(false); }
  };

  const openCrearExpediente = (appt: Appointment) => {
    setExpedienteTarget(appt);
    setExpedienteService(appt.service);
    setExpedienteCategory('inmigración');
    setCaseCreated(null);
    setCaseError(null);
  };

  const [confirmForm, setConfirmForm] = useState({
    confirmed_date: '',
    confirmed_time: '',
    meeting_url: '',
    admin_notes: '',
    send_confirmation: true
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/citas?status=${filter}`);
    const data = await res.json();
    setAppointments(data.appointments ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const openConfirm = (appt: Appointment) => {
    setSelected(appt);
    setConfirmForm({
      confirmed_date: appt.confirmed_date ?? appt.preferred_date ?? '',
      confirmed_time: appt.confirmed_time ?? '',
      meeting_url: appt.meeting_url ?? '',
      admin_notes: appt.admin_notes ?? '',
      send_confirmation: true
    });
  };

  const handleSave = async (status: 'confirmed' | 'cancelled' | 'rescheduled') => {
    if (!selected) return;
    setSaving(true);
    const payload: Record<string, unknown> = { status };
    if (status === 'confirmed') {
      payload.confirmed_date  = confirmForm.confirmed_date || null;
      payload.confirmed_time  = confirmForm.confirmed_time || null;
      payload.meeting_url     = confirmForm.meeting_url || null;
      payload.send_confirmation = confirmForm.send_confirmation;
    }
    if (confirmForm.admin_notes) payload.admin_notes = confirmForm.admin_notes;

    const res = await fetch(`/api/admin/citas?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setSelected(null);
      await load();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/admin/citas?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    await load();
  };

  const counts = {
    all:         appointments.length,
    pending:     appointments.filter((a) => a.status === 'pending').length,
    confirmed:   appointments.filter((a) => a.status === 'confirmed').length,
    cancelled:   appointments.filter((a) => a.status === 'cancelled').length
  };

  const inputCls = 'w-full border border-[#d8cbb5] bg-white px-3 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25] rounded-lg';

  return (
    <div className="min-h-screen bg-[#f8f4eb]">
      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Citas y consultas</h1>
              <p className="mt-1 text-sm text-[#29384a]">
                {counts.pending > 0
                  ? `${counts.pending} cita${counts.pending !== 1 ? 's' : ''} pendiente${counts.pending !== 1 ? 's' : ''} de confirmar`
                  : 'Todas las citas al día'}
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] transition hover:border-[#c88b25]"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>

          {/* Filter tabs */}
          <div className="mt-4 flex gap-2">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => {
              const labels: Record<string, string> = { all: 'Todas', pending: 'Pendientes', confirmed: 'Confirmadas', cancelled: 'Canceladas' };
              const cnt = counts[f];
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f ? 'bg-[#07111d] text-[#d7a33a]' : 'border border-[#d8cbb5] bg-white text-[#29384a] hover:border-[#c88b25]'
                  }`}
                >
                  {labels[f]}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === f ? 'bg-[#d7a33a]/20 text-[#d7a33a]' : 'bg-[#f0e8d8] text-[#29384a]'}`}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#29384a]">Cargando…</div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-[#d8cbb5]" />
            <p className="mt-4 font-semibold text-[#07111d]">Sin citas {filter !== 'all' ? 'en este estado' : 'todavía'}</p>
            <p className="mt-2 text-sm text-[#29384a]">Las solicitudes aparecerán aquí cuando los clientes rellenen el formulario.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={appt.id}
                  className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#c88b25]/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#07111d]">{appt.name}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#c88b25]">{appt.service}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#29384a]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(appt.preferred_date)} · {appt.preferred_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {appt.email}
                        </span>
                        {appt.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {appt.phone}</span>
                        )}
                      </div>
                      {appt.notes && (
                        <p className="mt-2 flex items-start gap-1 text-xs text-[#29384a]">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                          {appt.notes}
                        </p>
                      )}
                      {appt.status === 'confirmed' && appt.confirmed_date && (
                        <p className="mt-2 text-xs font-semibold text-green-700">
                          ✓ Confirmada: {formatDate(appt.confirmed_date)} · {appt.confirmed_time}
                          {appt.meeting_url && <> · <a href={appt.meeting_url} target="_blank" rel="noopener noreferrer" className="underline">Enlace reunión</a></>}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {appt.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => openConfirm(appt)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#c88b25] px-3 py-1.5 text-xs font-semibold text-[#061321] transition hover:bg-[#d7a33a]"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirmar
                        </button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => openCrearExpediente(appt)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#D4A017] bg-[#D4A017]/8 px-3 py-1.5 text-xs font-semibold text-[#c88b25] transition hover:bg-[#D4A017]/15"
                          title="Crear expediente para este cliente"
                        >
                          <FolderOpen className="h-3.5 w-3.5" /> Crear expediente
                        </button>
                      )}
                      {appt.status !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => openConfirm(appt)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25]"
                        >
                          <ChevronDown className="h-3.5 w-3.5" /> Editar
                        </button>
                      )}
                      <button
                        type="button"
                        title="Eliminar cita"
                        onClick={() => handleDelete(appt.id)}
                        className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Crear expediente modal */}
      {expedienteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {caseCreated ? (
              <>
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-green-50 p-3">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-center font-semibold text-[#07111d]">¡Expediente creado!</p>
                <p className="mt-1 text-center text-sm text-[#29384a]">
                  Expediente para <strong>{expedienteTarget.name}</strong> creado correctamente.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpedienteTarget(null)}
                    className="flex-1 rounded-xl border border-[#d8cbb5] py-2 text-sm font-semibold text-[#29384a] hover:bg-[#f0e9d8]"
                  >
                    Cerrar
                  </button>
                  <Link
                    href={`/admin/expedientes/${caseCreated.id}`}
                    onClick={() => setExpedienteTarget(null)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#07111d] py-2 text-sm font-bold text-white hover:bg-[#1a2a3a]"
                  >
                    <FolderOpen className="h-4 w-4" /> Ver expediente
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg font-bold text-[#07111d]">Crear expediente</h2>
                  <button type="button" title="Cerrar" onClick={() => setExpedienteTarget(null)} className="rounded-lg p-1 hover:bg-[#f8f4eb]">
                    <X className="h-4 w-4 text-[#29384a]" />
                  </button>
                </div>

                <div className="rounded-xl bg-[#f8f4eb] px-4 py-3 mb-4 text-sm">
                  <p className="font-semibold text-[#07111d]">{expedienteTarget.name}</p>
                  <p className="text-xs text-[#29384a]">{expedienteTarget.email}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#07111d] mb-1">Servicio</label>
                    <input
                      type="text"
                      id="expediente-service"
                      placeholder="Nombre del servicio"
                      value={expedienteService}
                      onChange={(e) => setExpedienteService(e.target.value)}
                      className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#07111d] mb-1">Categoría</label>
                    <select
                      id="expediente-category"
                      aria-label="Categoría del expediente"
                      value={expedienteCategory}
                      onChange={(e) => setExpedienteCategory(e.target.value)}
                      className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                    >
                      {['inmigración', 'fiscal', 'laboral', 'contabilidad', 'otros'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {caseError && (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{caseError}</p>
                )}

                <button
                  type="button"
                  onClick={handleCrearExpediente}
                  disabled={creatingCase}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#07111d] py-2.5 text-sm font-bold text-white hover:bg-[#1a2a3a] disabled:opacity-50"
                >
                  {creatingCase ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                  {creatingCase ? 'Creando…' : 'Crear expediente'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm / Edit modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Gestionar cita</h2>
              <button type="button" title="Cerrar" onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-[#f8f4eb]">
                <X className="h-5 w-5 text-[#29384a]" />
              </button>
            </div>

            <div className="mt-2 rounded-xl bg-[#f8f4eb] px-4 py-3 text-sm">
              <p className="font-semibold text-[#07111d]">{selected.name}</p>
              <p className="text-xs text-[#29384a]">{selected.service} · {formatDate(selected.preferred_date)}</p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="confirm-date" className="block text-xs font-semibold text-[#07111d]">Fecha confirmada</label>
                <input
                  id="confirm-date"
                  type="date"
                  title="Fecha confirmada"
                  value={confirmForm.confirmed_date}
                  onChange={(e) => setConfirmForm((p) => ({ ...p, confirmed_date: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#07111d]">Hora confirmada</label>
                <input
                  type="text"
                  placeholder="ej. 10:00h"
                  value={confirmForm.confirmed_time}
                  onChange={(e) => setConfirmForm((p) => ({ ...p, confirmed_time: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#07111d]">
                  <Link2 className="inline h-3 w-3 mr-1" />Enlace de reunión (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={confirmForm.meeting_url}
                  onChange={(e) => setConfirmForm((p) => ({ ...p, meeting_url: e.target.value }))}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <label htmlFor="confirm-notes" className="block text-xs font-semibold text-[#07111d]">Notas internas</label>
                <textarea
                  id="confirm-notes"
                  rows={2}
                  placeholder="Notas internas sobre la cita…"
                  value={confirmForm.admin_notes}
                  onChange={(e) => setConfirmForm((p) => ({ ...p, admin_notes: e.target.value }))}
                  className={`mt-1 resize-none ${inputCls}`}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#29384a]">
                <input
                  type="checkbox"
                  checked={confirmForm.send_confirmation}
                  onChange={(e) => setConfirmForm((p) => ({ ...p, send_confirmation: e.target.checked }))}
                  className="h-4 w-4 accent-[#c88b25]"
                />
                Enviar email de confirmación al cliente
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSave('confirmed')}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#c88b25] px-4 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#d7a33a] disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> Confirmar cita
              </button>
              <button
                type="button"
                onClick={() => handleSave('cancelled')}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <X className="h-4 w-4" /> Cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';

export default function AdminCitasPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8f4eb] text-sm text-[#29384a]">Cargando…</div>}>
      <AdminCitasPageInner />
    </Suspense>
  );
}
