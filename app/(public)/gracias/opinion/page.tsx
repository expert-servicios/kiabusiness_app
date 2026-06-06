'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function OpinionPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4eb]">
        <Loader2 className="h-6 w-6 animate-spin text-[#d7a33a]" />
      </main>
    }>
      <OpinionContent />
    </Suspense>
  );
}

function OpinionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [allowPublish, setAllowPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Por favor selecciona una valoración.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment: comment.trim() || undefined, allow_publish: allowPublish }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al enviar la valoración.'); return; }
      setDone(true);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4eb] px-6">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">Enlace inválido</h1>
          <p className="mt-3 text-[#29384a]">Este enlace no es válido. Usa el botón del email que te enviamos al finalizar tu expediente.</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4eb] px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
          <h1 className="font-serif text-3xl font-bold text-[#07111d]">¡Muchas gracias!</h1>
          <p className="mt-3 text-lg text-[#29384a]">Tu valoración ha quedado registrada. Nos ayuda a mejorar y a ayudar a más personas.</p>
          <p className="mt-6 text-sm text-[#29384a]/70">Puedes cerrar esta página.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#f8f4eb] px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">¿Cómo fue tu experiencia?</h1>
          <p className="mt-2 text-sm text-[#29384a]">Tu opinión nos ayuda a mejorar el servicio y a llegar a más personas que lo necesitan.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Star rating */}
            <div>
              <p className="mb-3 text-sm font-semibold text-[#07111d]">Tu valoración *</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        star <= (hover || rating)
                          ? 'fill-[#d7a33a] stroke-[#d7a33a]'
                          : 'fill-transparent stroke-[#d8cbb5]'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-xs text-[#29384a]">
                  {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#07111d]" htmlFor="comment">
                Comentario <span className="font-normal text-[#29384a]">(opcional)</span>
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={800}
                placeholder="Cuéntanos qué te pareció el servicio, qué mejorarías o qué fue lo que más valoraste..."
                className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm text-[#07111d] placeholder-[#29384a]/50 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
              />
              <p className="mt-1 text-right text-xs text-[#29384a]/50">{comment.length}/800</p>
            </div>

            {/* Allow publish */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3">
              <input
                type="checkbox"
                checked={allowPublish}
                onChange={(e) => setAllowPublish(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#d7a33a]"
              />
              <span className="text-sm text-[#29384a]">
                Autorizo a EXPERT a publicar mi valoración (de forma anónima o con mi nombre) en la web y materiales de comunicación.
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full rounded-xl bg-[#d7a33a] py-3.5 text-sm font-bold uppercase tracking-wide text-[#061321] transition hover:bg-[#c88b25] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar mi valoración'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
