import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas /dashboard/* y /admin/*
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    // TODO: Verificar sesión con Supabase
    // const session = await supabase.auth.getSession();
    // if (!session) {
    //   return NextResponse.redirect(new URL('/auth/login', request.url));
    // }

    // Para admin, verificar también el rol
    // if (pathname.startsWith('/admin') && session.user.user_metadata.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
