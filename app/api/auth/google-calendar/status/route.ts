import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ connected: false });

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('google_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ connected: !!data });
}
