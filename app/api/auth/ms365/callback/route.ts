import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeMs365Code } from '@/lib/integrations/microsoft365';
import { clearOAuthStateCookie, verifyOAuthState } from '@/lib/auth/oauth-state';

function redirectClearingState(url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  clearOAuthStateCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const oauthState = await verifyOAuthState(request, 'ms365', state);
  if (error || !code || !oauthState.ok || !oauthState.requiresAdmin) {
    return redirectClearingState(new URL('/admin/correo?error=oauth_denied', request.url));
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== oauthState.userId) {
    return redirectClearingState(new URL('/admin/correo?error=oauth_denied', request.url));
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('role,status')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.status === 'inactive' || (profile?.role !== 'admin' && profile?.role !== 'owner')) {
      return redirectClearingState(new URL('/admin/correo?error=oauth_denied', request.url));
    }

    const tokens = await exchangeMs365Code(code);

    await admin.from('ms365_tokens').upsert({
      id: 'admin',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      email: tokens.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return redirectClearingState(new URL('/admin/correo?connected=1', request.url));
  } catch (err) {
    console.error('[MS365 OAuth callback]', err);
    return redirectClearingState(new URL('/admin/correo?error=exchange_failed', request.url));
  }
}
