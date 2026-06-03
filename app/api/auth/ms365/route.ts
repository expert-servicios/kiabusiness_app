import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getMs365AuthUrl } from '@/lib/integrations/microsoft365';
import { createOAuthState, setOAuthStateCookie } from '@/lib/auth/oauth-state';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return NextResponse.redirect(new URL('/auth/login?error=inactive', request.url));
  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const oauthState = await createOAuthState({
    provider: 'ms365',
    userId: user.id,
    requiresAdmin: true,
  });
  const response = NextResponse.redirect(getMs365AuthUrl(oauthState.state));
  setOAuthStateCookie(response, oauthState.cookieValue);
  return response;
}
