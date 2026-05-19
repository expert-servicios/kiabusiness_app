import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeGmailCode } from '@/lib/integrations/gmail';

// GET /api/auth/google-gmail/callback?code=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  if (!code) {
    return NextResponse.redirect(`${appUrl}/admin/correo?error=oauth_denied`);
  }

  try {
    const tokens = await exchangeGmailCode(code);
    const admin = getSupabaseAdmin();

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

    return NextResponse.redirect(`${appUrl}/admin/correo?connected=gmail`);
  } catch (err) {
    console.error('[Gmail OAuth callback]', err);
    return NextResponse.redirect(`${appUrl}/admin/correo?error=oauth`);
  }
}
