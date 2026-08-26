'use client';

import { useState } from 'react';
import { Award, CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react';
import { getAcademyProgram } from '@/lib/data/academy-catalog';

export interface ClientEnrollmentRow {
  id: string;
  program_slug: string;
  program_name: string;
  amount_eur: number;
  status: 'active' | 'cancelled' | 'completed';
  certification_requested: boolean;
  certification_status: 'none' | 'requested' | 'under_review' | 'approved' | 'rejected' | 'paid';
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtEur(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function CertificationSection({ enrollment, onUpdated }: { enrollment: ClientEnrollmentRow; onUpdated: () => void }) {
  const program = getAcademyProgram(enrollment.program_slug);
  const certification = program?.officialCertification;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!certification) return null;

  const handleRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/academy/certification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Error al solicitar la certificación');
        return;
      }
      onUpdated();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/academy/certification/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al iniciar el pago');
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[#f0e8d8] pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">
        Certificación oficial {certification.code}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#29384a]">{certification.requirementsNote}</p>

      <div className="mt-3">
        {enrollment.certification_status === 'none' && (
          <button
            type="button"
            onClick={handleRequest}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#c88b25] px-4 py-2 text-xs font-bold text-[#c88b25] transition hover:bg-[#c88b25]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Award className="h-4 w-4" />
            {loading ? 'Enviando...' : `Solicitar certificación (${certification.price})`}
          </button>
        )}
        {enrollment.certification_status === 'requested' && (
          <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            <Clock className="h-4 w-4" />
            Solicitud recibida — revisando tu elegibilidad.
          </p>
        )}
        {enrollment.certification_status === 'under_review' && (
          <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            <Clock className="h-4 w-4" />
            En revisión por nuestro equipo.
          </p>
        )}
        {enrollment.certification_status === 'rejected' && (
          <p className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            <XCircle className="h-4 w-4" />
            No cumples los requisitos de acceso en este momento — contacta con nosotros para más detalles.
          </p>
        )}
        {enrollment.certification_status === 'approved' && (
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#d7a33a] px-4 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            {loading ? 'Procesando...' : `Pagar certificación oficial (${certification.price})`}
          </button>
        )}
        {enrollment.certification_status === 'paid' && (
          <p className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Certificación oficial pagada — nuestro equipo te contactará para formalizar la incorporación.
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function AcademyEnrollmentsPanel({ initialEnrollments }: { initialEnrollments: ClientEnrollmentRow[] }) {
  const [enrollments, setEnrollments] = useState(initialEnrollments);

  const refresh = async () => {
    const res = await fetch('/api/academy/enrollments');
    if (!res.ok) return;
    const data = await res.json();
    setEnrollments(data.enrollments ?? []);
  };

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment) => (
        <div key={enrollment.id} className="rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-serif text-lg font-bold text-[#07111d]">{enrollment.program_name}</p>
              <p className="text-xs text-[#8899aa]">
                {fmtEur(enrollment.amount_eur)} · Matriculado el {fmtDate(enrollment.created_at)}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#07111d]">
              {STATUS_LABEL[enrollment.status]}
            </span>
          </div>

          <CertificationSection enrollment={enrollment} onUpdated={refresh} />
        </div>
      ))}
    </div>
  );
}
