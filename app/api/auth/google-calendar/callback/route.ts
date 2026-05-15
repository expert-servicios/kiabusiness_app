import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeCode } from '@/lib/integrations/google-calendar';

// GET /api/auth/google-calendar/callback?code=...&state=<userId>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard/calendario-fiscal?error=oauth`);
  }

  try {
    const tokens = await exchangeCode(code);
    const admin = getSupabaseAdmin();

    await admin.from('google_tokens').upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return NextResponse.redirect(`${appUrl}/dashboard/calendario-fiscal?connected=1`);
  } catch (err) {
    console.error('Google Calendar OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/calendario-fiscal?error=oauth`);
  }
}
