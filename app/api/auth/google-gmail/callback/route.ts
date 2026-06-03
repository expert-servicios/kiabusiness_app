import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeGmailCode } from '@/lib/integrations/gmail';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { clearOAuthStateCookie, verifyOAuthState } from '@/lib/auth/oauth-state';

function redirectClearingState(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  clearOAuthStateCookie(response);
  return response;
}

// GET /api/auth/google-gmail/callback?code=...&state=<nonce>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = getPublicAppUrl();

  const oauthState = await verifyOAuthState(request, 'google_gmail', state);
  if (!code || !oauthState.ok || !oauthState.requiresAdmin) {
    return redirectClearingState(`${appUrl}/admin/correo?error=oauth_denied`);
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== oauthState.userId) {
    return redirectClearingState(`${appUrl}/admin/correo?error=oauth_denied`);
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('role,status')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.status === 'inactive' || (profile?.role !== 'admin' && profile?.role !== 'owner')) {
      return redirectClearingState(`${appUrl}/admin/correo?error=oauth_denied`);
    }

    const tokens = await exchangeGmailCode(code);

    await admin.from('gmail_tokens').upsert(
      {
        id: 'admin',
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date:   tokens.expiry_date,
        email:         tokens.email ?? null,
        scope:         tokens.scope ?? null,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    return redirectClearingState(`${appUrl}/admin/correo?connected=gmail`);
  } catch (err) {
    console.error('[Gmail OAuth callback]', err);
    return redirectClearingState(`${appUrl}/admin/correo?error=oauth`);
  }
}
