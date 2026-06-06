import { cookies } from 'next/headers';
import { Star, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { ReviewModerationCard } from '@/components/admin/ReviewModerationCard';

interface Review {
  id: string;
  case_id: string;
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

async function fetchReviews(status: string): Promise<Review[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl(`/api/admin/resenas?status=${status}`), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reviews ?? [];
  } catch {
    return [];
  }
}

export default async function ResenasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = 'pending' } = await searchParams;
  const reviews = await fetchReviews(status);

  const tabs = [
    { key: 'pending', label: 'Pendientes', Icon: Clock },
    { key: 'approved', label: 'Aprobadas', Icon: CheckCircle2 },
    { key: 'rejected', label: 'Rechazadas', Icon: XCircle },
    { key: 'all', label: 'Todas', Icon: Star },
  ];

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl px-6">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#07111d]">Reseñas</h1>
            <p className="mt-1 text-sm text-[#29384a]">Modera y publica las valoraciones de clientes.</p>
          </div>
          {avgRating && (
            <div className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2.5">
              <Award className="h-4 w-4 text-[#d7a33a]" />
              <span className="text-sm font-bold text-[#07111d]">{avgRating}</span>
              <span className="text-xs text-[#29384a]">/ 5 · {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-[#d8cbb5] bg-white p-1">
          {tabs.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={`?status=${key}`}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                status === key
                  ? 'bg-[#d7a33a] text-[#061321]'
                  : 'text-[#29384a] hover:bg-[#f8f4eb]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </a>
          ))}
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-12 text-center text-sm text-[#29384a]">
            No hay reseñas en este estado.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewModerationCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
