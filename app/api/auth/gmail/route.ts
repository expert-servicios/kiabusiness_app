import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getGmailAuthUrl } from '@/lib/integrations/gmail';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));

  return NextResponse.redirect(getGmailAuthUrl());
}
