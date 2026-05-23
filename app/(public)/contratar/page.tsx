import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getCatalogService } from '@/lib/utils/catalog';
import { ProfileCompletionWizard } from '@/components/profile/ProfileCompletionWizard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  searchParams: Promise<{ service?: string }>;
}

export default async function ContratarPage({ searchParams }: Props) {
  const { service: serviceSlug } = await searchParams;

  // ── Auth check — login obligatorio antes de pago ──
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll : () => cookieStore.getAll(),
        setAll : () => {}
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const next = `/contratar${serviceSlug ? `?service=${serviceSlug}` : ''}`;
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  // ── Load profile ──
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('full_name,phone,client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,profile_completed,billing_ready,habitual_address_ready')
    .eq('id', user.id)
    .single();

  // ── Resolve service ──
  const catalogService = serviceSlug ? getCatalogService(serviceSlug) : undefined;

  if (!catalogService || !catalogService.stripePriceId) {
    return (
      <main className="min-h-screen bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A]">
        <div className="mx-auto max-w-md text-center">
          <p className="text-lg font-semibold">Servicio no disponible para contratación online.</p>
          <p className="mt-2 text-sm text-[#23364D]/60">
            {serviceSlug
              ? 'Este servicio requiere presupuesto personalizado.'
              : 'No se especificó ningún servicio.'}
          </p>
          <Link
            href="/servicios"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver todos los servicios
          </Link>
        </div>
      </main>
    );
  }

  const serviceInfo = {
    name        : catalogService.name,
    priceId     : catalogService.stripePriceId,
    displayPrice: catalogService.price ?? 'Consultar',
    slug        : catalogService.slug,
    category    : catalogService.categoria,
  };

  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 pb-10 pt-12 text-[#F8F6F1]">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/servicios/${catalogService.categoria}/${catalogService.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al servicio
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Contratar servicio</h1>
          <p className="mt-3 text-sm text-white/55">
            Completa los datos y pasa a la pasarela de pago segura con Stripe.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-10">
        <ProfileCompletionWizard
          profile ={profile ?? null}
          service ={serviceInfo}
        />
      </div>
    </main>
  );
}
