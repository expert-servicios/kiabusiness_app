import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Calendar, GraduationCap } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { computeProfileReadiness } from '@/lib/utils/profile-readiness';
import { getCalOnboardingUrl, getCalFormacionUrl } from '@/lib/utils/cal';
import { PostPurchaseProfileStep } from '@/components/profile/PostPurchaseProfileStep';

const HOLDED_MIGRATION_SLUGS = ['holded-migracion-sin-inventario', 'holded-migracion-con-inventario'];

interface Props {
  searchParams: Promise<{ source?: string; service?: string }>;
}

function ThankYou() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-serif text-4xl">¡Gracias!</h1>
      <p className="mt-3 text-brand-slate">Operación completada (pago).</p>
    </main>
  );
}

function HoldedBookingSection() {
  const onboardingUrl = getCalOnboardingUrl();
  const formacionUrl = getCalFormacionUrl();
  if (!onboardingUrl && !formacionUrl) return null;

  return (
    <div className="mx-auto mt-10 max-w-3xl border border-[#D4A017]/25 bg-[#F8F6F1] p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Acompañamiento incluido</p>
      <h2 className="mt-2 font-serif text-xl font-bold text-[#0D1B2A]">Reserva tu onboarding y formación</h2>
      <p className="mt-2 text-sm leading-6 text-[#23364D]">
        Tu servicio incluye 1 hora de onboarding gratuita y 2 horas de formación especializada. Reserva ambas sesiones cuando te venga bien.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {onboardingUrl && (
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            <Calendar className="h-4 w-4" />
            Reservar onboarding (1h)
          </a>
        )}
        {formacionUrl && (
          <a
            href={formacionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10"
          >
            <GraduationCap className="h-4 w-4" />
            Reservar formación (2h)
          </a>
        )}
      </div>
    </div>
  );
}

export default async function GraciasPagoPage({ searchParams }: Props) {
  const { service } = await searchParams;
  const showHoldedBooking = Boolean(service && HOLDED_MIGRATION_SLUGS.includes(service));

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
    return (
      <>
        <ThankYou />
        {showHoldedBooking && <HoldedBookingSection />}
      </>
    );
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,billing_ready,habitual_address_ready')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <>
        <ThankYou />
        {showHoldedBooking && <HoldedBookingSection />}
      </>
    );
  }

  const readiness = computeProfileReadiness(profile);

  if (readiness.billingReady && readiness.habitualAddressReady) {
    return (
      <>
        <ThankYou />
        {showHoldedBooking && <HoldedBookingSection />}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl">¡Gracias!</h1>
        <p className="mt-3 text-brand-slate">Pago confirmado.</p>
      </div>
      <PostPurchaseProfileStep profile={profile} missingBilling={!readiness.billingReady} />
      {showHoldedBooking && <HoldedBookingSection />}
    </main>
  );
}
