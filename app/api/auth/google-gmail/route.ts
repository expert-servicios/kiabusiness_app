import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getGmailAuthUrl } from '@/lib/integrations/gmail';

// GET /api/auth/google-gmail — admin-only: initiate Gmail OAuth2 flow
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));

  const url = await getGmailAuthUrl();
  return NextResponse.redirect(url);
}
