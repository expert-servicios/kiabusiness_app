import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getCatalogService } from '@/lib/utils/catalog';
import { ProfileCompletionWizard } from '@/components/profile/ProfileCompletionWizard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  searchParams: Promise<{ service?: string; from?: string }>;
}

export default async function ContratarPage({ searchParams }: Props) {
  const { service: serviceSlug, from: fromParam } = await searchParams;
  const fromCart = fromParam === 'cart';

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
    const next = `/contratar${serviceSlug ? `?service=${serviceSlug}` : fromCart ? '?from=cart' : ''}`;
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  const admin = getSupabaseAdmin();

  // ── Load profile ──
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name,phone,client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,profile_completed,billing_ready,habitual_address_ready')
    .eq('id', user.id)
    .single();

  // ── Cart mode: show active cart items ─────────────────────────────────────
  if (fromCart) {
    const now = new Date().toISOString();
    const { data: cartItems } = await admin
      .from('kia_cart_items')
      .select('id, service_id, service_label, service_area, stripe_price_id, expires_at')
      .eq('client_id', user.id)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    const items = cartItems ?? [];

    return (
      <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
        <div className="bg-[#0D1B2A] px-6 pb-10 pt-12 text-[#F8F6F1]">
          <div className="mx-auto max-w-lg">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al panel
            </Link>
            <h1 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Tu cesta</h1>
            <p className="mt-3 text-sm text-white/55">
              Servicios añadidos desde WhatsApp. Caduca a las 48 h.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-6 py-10">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-[#e0d9c8] bg-white p-8 text-center">
              <p className="text-[#23364D]/60">Tu cesta está vacía o los servicios han caducado.</p>
              <Link
                href="/servicios"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
              >
                Ver servicios
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const expiresAt = new Date(item.expires_at);
                const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3_600_000));
                const checkoutUrl = item.stripe_price_id
                  ? `/contratar?service=${item.service_id}&source=cart`
                  : null;
                return (
                  <div key={item.id} className="rounded-2xl border border-[#e0d9c8] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0D1B2A]">{item.service_label}</p>
                        <p className="mt-0.5 text-xs text-[#23364D]/50">
                          {item.service_area} · Caduca en {hoursLeft} h
                        </p>
                      </div>
                      {checkoutUrl ? (
                        <Link
                          href={checkoutUrl}
                          className="shrink-0 rounded-xl bg-[#D4A017] px-4 py-2 text-xs font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
                        >
                          Contratar
                        </Link>
                      ) : (
                        <Link
                          href={`/servicios`}
                          className="shrink-0 rounded-xl border border-[#e0d9c8] px-4 py-2 text-xs font-medium text-[#23364D] hover:border-[#D4A017]"
                        >
                          Ver servicio
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-center text-xs text-[#23364D]/40">
                Los items caducan 48 h después de añadirlos desde WhatsApp.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

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
