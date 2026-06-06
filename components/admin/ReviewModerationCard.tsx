'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, CheckCircle2, XCircle, Award, User } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  allow_publish: boolean;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  created_at: string;
  service_name: string | null;
  client_name: string | null;
  client_email: string | null;
}

export function ReviewModerationCard({ review }: { review: Review }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const patch = async (payload: Record<string, unknown>) => {
    const key = JSON.stringify(payload);
    setLoading(key);
    try {
      await fetch(`/api/admin/resenas/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const statusBadge = {
    pending:  'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }[review.status];

  const statusLabel = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[review.status];

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Stars */}
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= review.rating ? 'fill-[#d7a33a] stroke-[#d7a33a]' : 'fill-transparent stroke-[#d8cbb5]'}`}
                />
              ))}
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}>{statusLabel}</span>
            {review.featured && (
              <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                <Award className="h-3 w-3" /> Destacada
              </span>
            )}
            {review.allow_publish && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Autoriza publicación</span>
            )}
          </div>

          {review.service_name && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#c88b25]">{review.service_name}</p>
          )}

          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-[#07111d]">"{review.comment}"</p>
          ) : (
            <p className="mt-2 text-sm italic text-[#29384a]/60">Sin comentario</p>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#29384a]">
            <User className="h-3.5 w-3.5" />
            <span>{review.client_name ?? 'Cliente'}</span>
            {review.client_email && <span className="text-[#29384a]/60">· {review.client_email}</span>}
            <span className="text-[#29384a]/40">·</span>
            <span>{new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          {review.status !== 'approved' && (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => patch({ status: 'approved' })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
            </button>
          )}
          {review.status !== 'rejected' && (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => patch({ status: 'rejected' })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Rechazar
            </button>
          )}
          {review.status === 'approved' && (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => patch({ featured: !review.featured })}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                review.featured
                  ? 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                  : 'border-[#d8cbb5] bg-[#f8f4eb] text-[#29384a] hover:bg-[#f0e8d5]'
              }`}
            >
              <Award className="h-3.5 w-3.5" /> {review.featured ? 'Quitar destacado' : 'Destacar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
