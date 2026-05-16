import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeGmailCode } from '@/lib/integrations/gmail';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/admin/gmail?error=oauth_denied', request.url));
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));

  try {
    const tokens = await exchangeGmailCode(code);
    const admin = getSupabaseAdmin();

    await admin.from('gmail_tokens').upsert({
      id: 'admin',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email: tokens.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.redirect(new URL('/admin/gmail?connected=1', request.url));
  } catch (err) {
    console.error('[Gmail OAuth callback]', err);
    return NextResponse.redirect(new URL('/admin/gmail?error=exchange_failed', request.url));
  }
}
