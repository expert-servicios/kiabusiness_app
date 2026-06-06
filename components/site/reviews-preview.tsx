import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  service_name: string | null;
  created_at: string;
}

async function fetchPublicReviews(): Promise<Review[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from('reviews')
      .select('id,rating,comment,service_name,created_at')
      .eq('status', 'approved')
      .eq('allow_publish', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function ReviewsPreview() {
  const reviews = await fetchPublicReviews();

  if (reviews.length === 0) return null;

  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section className="bg-[#06111f] py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-2 flex items-center justify-center gap-2">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className="h-5 w-5 fill-[#d7a33a] stroke-[#d7a33a]" />
          ))}
          <span className="ml-1 text-lg font-bold text-[#d7a33a]">{avg}</span>
        </div>
        <h2 className="text-center font-serif text-3xl font-bold uppercase tracking-wide">
          Opiniones reales de clientes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-white/65">
          Las valoraciones se publican únicamente después de finalizar un servicio y con autorización del cliente.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex flex-col rounded-2xl border border-[#c88b25]/35 bg-[#0D1B2A] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= r.rating ? 'fill-[#d7a33a] stroke-[#d7a33a]' : 'fill-transparent stroke-white/20'}`}
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-white/80">
                {r.comment ? `"${r.comment}"` : 'Servicio excelente.'}
              </p>
              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/50">
                {r.service_name && <span className="font-semibold text-[#d7a33a]/80">{r.service_name} · </span>}
                {new Date(r.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
