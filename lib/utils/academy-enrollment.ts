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

  const { data: enrollment } = await getSupabaseAdmin()
    .from('academy_enrollments')
    .select('id')
    .eq('client_id', user.id)
    .eq('program_slug', programSlug)
    .eq('status', 'active')
    .maybeSingle();

  return { user, enrolled: Boolean(enrollment) };
}
