'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Link2, Plus, AlertTriangle } from 'lucide-react';
import { academyPrograms } from '@/lib/data/academy-catalog';

export interface AcademyEnrollmentRow {
  id: string;
  client_id: string;
  program_slug: string;
  program_name: string;
  amount_eur: number;
  stripe_payment_id: string;
  status: 'active' | 'cancelled' | 'completed';
  certification_requested: boolean;
  certification_status: 'none' | 'requested' | 'under_review' | 'approved' | 'rejected' | 'paid';
  admin_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
}

export interface UnlinkedOrderRow {
  id: string;
  amount_eur: number;
  currency: string;
  stripe_payment_id: string;
  service_slugs: string | null;
  metadata: { checkout_session?: { customer_email?: string | null } } | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const CERT_LABEL: Record<string, string> = {
  none: 'Sin solicitar',
  requested: 'Solicitada',
  under_review: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  paid: 'Pagada',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtEur(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function LinkOrderRow({ order, onLinked }: { order: UnlinkedOrderRow; onLinked: () => void }) {
  const [email, setEmail] = useState(order.metadata?.checkout_session?.customer_email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLink = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/academy/enrollments/link-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Error al vincular');
        return;
      }
      onLinked();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-amber-900">{order.service_slugs ?? 'Programa desconocido'}</p>
          <p className="text-xs text-amber-700">
            {fmtEur(order.amount_eur)} · {fmtDate(order.created_at)} · pago {order.stripe_payment_id.slice(0, 20)}...
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@del-comprador.com"
          className="min-w-[220px] flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-[#07111d]"
        />
        <button
          type="button"
          onClick={handleLink}
          disabled={loading || !email}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Link2 className="h-3.5 w-3.5" />
          {loading ? 'Vinculando...' : 'Vincular matrícula'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function NewEnrollmentForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [programSlug, setProgramSlug] = useState(academyPrograms[0]?.slug ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!email || !programSlug || !amount) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/academy/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, program_slug: programSlug, amount_eur: Number(amount), admin_note: note || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Error al crear la matrícula');
        return;
      }
      setOpen(false);
      setEmail('');
      setAmount('');
      setNote('');
      onCreated();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#07111d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a2942]"
      >
        <Plus className="h-3.5 w-3.5" />
        Nueva matrícula manual
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#d8cbb5] bg-white p-4">
      <p className="text-sm font-bold text-[#07111d]">Crear matrícula manual</p>
      <p className="mt-1 text-xs text-[#29384a]">
        Requiere que ya exista una cuenta EXPERT con ese email. Úsalo para altas comprobadas fuera de Stripe (transferencia, cortesía, etc.).
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@cuenta-existente.com"
          className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm"
        />
        <select
          value={programSlug}
          onChange={(e) => setProgramSlug(e.target.value)}
          className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm"
        >
          {academyPrograms.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Importe €"
          className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota interna (opcional)"
          className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !email || !amount}
          className="rounded-lg bg-[#d7a33a] px-4 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear matrícula'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a]">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function EnrollmentCard({ enrollment, onUpdated }: { enrollment: AcademyEnrollmentRow; onUpdated: () => void }) {
  const [status, setStatus] = useState(enrollment.status);
  const [certStatus, setCertStatus] = useState(enrollment.certification_status);
  const [saving, setSaving] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/academy/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base font-bold text-[#07111d]">
            {enrollment.profiles?.full_name ?? enrollment.profiles?.email ?? 'Cuenta desconocida'}
          </p>
          <p className="text-xs text-[#29384a]">{enrollment.profiles?.email}</p>
          <p className="mt-1 text-sm text-[#29384a]">{enrollment.program_name}</p>
          <p className="text-xs text-[#8899aa]">{fmtEur(enrollment.amount_eur)} · {fmtDate(enrollment.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <select
            value={status}
            onChange={(e) => {
              const v = e.target.value as AcademyEnrollmentRow['status'];
              setStatus(v);
              patch({ status: v });
            }}
            disabled={saving}
            className="rounded-full border border-[#d8cbb5] bg-white px-2.5 py-1 text-xs font-semibold text-[#07111d]"
          >
            {Object.entries(STATUS_LABEL).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {enrollment.program_slug === 'direccion-administracion-gestion-empresarial' && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#f0e8d8] pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Certificación oficial ADGD0210</p>
          <select
            value={certStatus}
            onChange={(e) => {
              const v = e.target.value as AcademyEnrollmentRow['certification_status'];
              setCertStatus(v);
              patch({ certification_status: v });
            }}
            disabled={saving}
            className="rounded-lg border border-[#d8cbb5] bg-white px-2.5 py-1 text-xs font-semibold text-[#07111d]"
          >
            {Object.entries(CERT_LABEL).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function AcademyEnrollmentsAdmin({
  initialEnrollments,
  initialUnlinkedOrders,
}: {
  initialEnrollments: AcademyEnrollmentRow[];
  initialUnlinkedOrders: UnlinkedOrderRow[];
}) {
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [unlinkedOrders, setUnlinkedOrders] = useState(initialUnlinkedOrders);

  const refresh = async () => {
    const res = await fetch('/api/admin/academy/enrollments');
    if (!res.ok) return;
    const data = await res.json();
    setEnrollments(data.enrollments ?? []);
    setUnlinkedOrders(data.unlinkedOrders ?? []);
  };

  const activeCount = enrollments.filter((e) => e.status === 'active').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-7">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Panel admin
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Matrículas — EXPERT Business Academy</h1>
              <p className="mt-1 text-sm text-[#29384a]">
                Vincula compras del Payment Link sin cuenta, gestiona el estado de las matrículas y la certificación oficial opcional.
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-center">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-green-800">{activeCount}</p>
                <p className="text-xs text-green-700">Activas</p>
              </div>
              {unlinkedOrders.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                  <p className="font-serif text-2xl font-bold text-amber-800">{unlinkedOrders.length}</p>
                  <p className="text-xs text-amber-700">Sin vincular</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {unlinkedOrders.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-[#07111d]">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Pendientes de vincular ({unlinkedOrders.length})
            </h2>
            <p className="mb-3 text-xs text-[#29384a]">
              Pagos recibidos por el Payment Link de un email sin cuenta EXPERT todavía. En cuanto la persona se registre con ese mismo email, vincula aquí para activar su acceso.
            </p>
            <div className="space-y-3">
              {unlinkedOrders.map((order) => (
                <LinkOrderRow key={order.id} order={order} onLinked={refresh} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Matrículas ({enrollments.length})</h2>
            <NewEnrollmentForm onCreated={refresh} />
          </div>

          {enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-12 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-[#d8cbb5]" />
              <h3 className="mt-4 font-serif text-lg font-bold text-[#07111d]">Sin matrículas todavía</h3>
              <p className="mt-2 text-sm text-[#29384a]">Aparecerán aquí en cuanto se registre la primera venta.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => (
                <EnrollmentCard key={e.id} enrollment={e} onUpdated={refresh} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
