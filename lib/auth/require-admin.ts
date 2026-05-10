import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function requireAdminClient(request: NextRequest): Promise<SupabaseAdminClient | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session?.user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', sessionData.session.user.id)
    .single();

  return profile?.role === 'admin' ? admin : null;
}
