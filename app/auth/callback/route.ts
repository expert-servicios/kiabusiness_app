import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin));
  }

  // Build redirect URL before creating response so cookies are set on it
  const redirectUrl = new URL(next.startsWith('/') ? next : '/dashboard', origin);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin));
  }

  // Send welcome email on first login (non-blocking)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const admin = getSupabaseAdmin();
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, welcome_email_sent')
        .eq('id', user.id)
        .single();

      // Extract first name from Google OAuth metadata if profile has none
      const metaGivenName = user.user_metadata?.given_name as string | undefined;
      const metaFullName = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
      const derivedFirstName = metaGivenName ?? metaFullName?.split(' ')[0];

      if (profile && !profile.full_name && derivedFirstName) {
        await admin
          .from('profiles')
          .update({ full_name: derivedFirstName })
          .eq('id', user.id);
      }

      const displayName = profile?.full_name ?? derivedFirstName ?? user.email.split('@')[0];

      if (profile && !profile.welcome_email_sent) {
        const tpl = welcomeEmail(displayName);
        await sendEmail({
          to: user.email,
          eventType: 'user.welcome',
          ...tpl,
          metadata: { user_id: user.id }
        });
        await admin
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('id', user.id);
      }
    }
  } catch (emailError) {
    console.error('[auth/callback] welcome email error:', emailError);
  }

  return response;
}
