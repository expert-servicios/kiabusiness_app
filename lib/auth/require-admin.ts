import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function requireAdminClient(request: NextRequest): Promise<SupabaseAdminClient | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'owner' ? admin : null;
}
