import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { getAuthUrl } from '@/lib/integrations/google-calendar';

// GET /api/auth/google-calendar — initiate OAuth2 flow
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const url = await getAuthUrl(user.id);
  return NextResponse.redirect(url);
}
