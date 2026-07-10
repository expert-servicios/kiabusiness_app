import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { computeProfileReadiness } from '@/lib/utils/profile-readiness';
import { PostPurchaseProfileStep } from '@/components/profile/PostPurchaseProfileStep';

function ThankYou() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-serif text-4xl">¡Gracias!</h1>
      <p className="mt-3 text-brand-slate">Operación completada (pago).</p>
    </main>
  );
}

export default async function GraciasPagoPage() {
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
    return <ThankYou />;
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('client_type,company,tax_id,address,city,postal_code,province,billing_country,habitual_address,habitual_city,habitual_postal_code,habitual_province,habitual_country,billing_ready,habitual_address_ready')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return <ThankYou />;
  }

  const readiness = computeProfileReadiness(profile);

  if (readiness.billingReady && readiness.habitualAddressReady) {
    return <ThankYou />;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl">¡Gracias!</h1>
        <p className="mt-3 text-brand-slate">Pago confirmado.</p>
      </div>
      <PostPurchaseProfileStep profile={profile} missingBilling={!readiness.billingReady} />
    </main>
  );
}
