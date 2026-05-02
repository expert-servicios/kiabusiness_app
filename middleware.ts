import { serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createServerSupabaseClient } from './lib/integrations/supabase';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerSupabaseClient(request);
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!session?.user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith('/admin')) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
