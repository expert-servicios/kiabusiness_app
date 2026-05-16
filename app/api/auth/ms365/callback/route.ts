import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeMs365Code } from '@/lib/integrations/microsoft365';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/admin/correo?error=oauth_denied', request.url));
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));

  try {
    const tokens = await exchangeMs365Code(code);
    const admin = getSupabaseAdmin();

    await admin.from('ms365_tokens').upsert({
      id: 'admin',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      email: tokens.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.redirect(new URL('/admin/correo?connected=1', request.url));
  } catch (err) {
    console.error('[MS365 OAuth callback]', err);
    return NextResponse.redirect(new URL('/admin/correo?error=exchange_failed', request.url));
  }
}
