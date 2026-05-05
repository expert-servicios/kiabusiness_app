import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          }
        }
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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

          if (profile && !profile.welcome_email_sent) {
            const name = profile.full_name ?? user.email.split('@')[0];
            const tpl = welcomeEmail(name);
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
        // Welcome email failure must not block login
        console.error('[auth/callback] welcome email error:', emailError);
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin));
}
