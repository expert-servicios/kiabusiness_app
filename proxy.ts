import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // getUser() re-validates JWT with Supabase Auth server on each request
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAuthPath = pathname === '/auth/login' || pathname === '/auth/signup';

  if (user && (isProtectedPath || isAuthPath)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.status === 'inactive') {
      if (isProtectedPath) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('error', 'inactive');
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect /dashboard and /admin — admin role check is in app/(protected)/admin/layout.tsx
  if (!user && isProtectedPath) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/login', '/auth/signup']
};
