import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { getAuthUrl } from '@/lib/integrations/google-calendar';
import { createOAuthState, setOAuthStateCookie } from '@/lib/auth/oauth-state';

// GET /api/auth/google-calendar — initiate OAuth2 flow
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const oauthState = await createOAuthState({
    provider: 'google_calendar',
    userId: user.id,
  });
  const url = await getAuthUrl(oauthState.state);
  const response = NextResponse.redirect(url);
  setOAuthStateCookie(response, oauthState.cookieValue);
  return response;
}
