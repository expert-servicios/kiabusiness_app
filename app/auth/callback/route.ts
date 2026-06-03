import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates';

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/dashboard';
  }

  try {
    const parsed = new URL(value, 'https://expert.local');
    if (parsed.origin !== 'https://expert.local') {
      return '/dashboard';
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/dashboard';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin));
  }

  // Collect cookies written during session exchange so we can apply them
  // to the final redirect response (redirect target is determined after role check)
  const collectedCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach((c) => collectedCookies.push(c as typeof collectedCookies[number]));
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin));
  }

  let redirectPath = next;
  let shouldApplySessionCookies = true;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const admin = getSupabaseAdmin();
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, welcome_email_sent, role, status')
        .eq('id', user.id)
        .single();

      if (profile?.status === 'inactive') {
        redirectPath = '/auth/login?error=inactive';
        shouldApplySessionCookies = false;
      } else {
        // Redirect admins to /admin unless the caller explicitly requested a different page
        if ((profile?.role === 'admin' || profile?.role === 'owner') && next === '/dashboard') {
          redirectPath = '/admin';
        }

        // Backfill display name from OAuth metadata on first login
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
    }
  } catch (emailError) {
    console.error('[auth/callback] welcome email error:', emailError);
  }

  const redirectUrl = new URL(safeRedirectPath(redirectPath), origin);
  const response = NextResponse.redirect(redirectUrl);

  // Apply session cookies to the final redirect response
  if (shouldApplySessionCookies) {
    collectedCookies.forEach(({ name, value, options }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.cookies.set(name, value, options as any);
    });
  }

  return response;
}
