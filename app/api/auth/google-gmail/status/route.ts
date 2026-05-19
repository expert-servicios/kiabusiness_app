import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// GET /api/auth/google-gmail/status
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ connected: false });

  const { data: tokenRow } = await admin.from('gmail_tokens').select('email').eq('id', 'admin').single();
  return NextResponse.json({ connected: !!tokenRow, email: tokenRow?.email ?? null });
}
