import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

// Server-side-only check for whether the current request's user has an
// active enrollment for a given academy program. Used to gate student-only
// knowledge base content — never trust a client-side flag for this, per
// docs/courses/gestion-laboral/MASTER_IMPLEMENTATION_PROMPT.md: "No simules
// autorización únicamente ocultando enlaces en la interfaz; valida el
// acceso en servidor."
export async function getActiveEnrollment(programSlug: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, enrolled: false as const };

  const admin = getSupabaseAdmin();

  // Admin deactivation only flips profiles.status — it doesn't revoke the
  // existing Supabase session, and /docs/laboral isn't in the proxy's
  // isProtectedPath check, so a deactivated account could otherwise keep
  // reading gated manuals until its session naturally expires.
  const { data: profile } = await admin
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.status === 'inactive') return { user, enrolled: false as const };

  // A student can legitimately have more than one active row for the same
  // program (e.g. bought twice) — the DB only enforces uniqueness on
  // stripe_payment_id, not on (client_id, program_slug, status). Don't use
  // maybeSingle(), which errors (and returns data: null) on multiple rows.
  const { data: enrollments } = await admin
    .from('academy_enrollments')
    .select('id')
    .eq('client_id', user.id)
    .eq('program_slug', programSlug)
    .eq('status', 'active')
    .limit(1);

  return { user, enrolled: Boolean(enrollments?.length) };
}
