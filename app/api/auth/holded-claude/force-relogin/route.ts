/**
 * GET /api/auth/holded-claude/force-relogin
 *
 * Clears the __session bridge cookie and redirects the user to the
 * login page, which after auth returns them to the `next` URL
 * (the MCP server's authorize endpoint).
 *
 * Called when the MCP server detects the user previously revoked the
 * connector and needs fresh consent, not a transparent re-auth.
 */

import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = '__session';

function isSafeMcpRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowed = (process.env.HOLDED_MCP_BASE_URLS ?? 'claude.expertconsulting.es,claude.verifactu.business')
      .split(',').map(h => h.trim().toLowerCase());
    return parsed.protocol === 'https:' && allowed.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get('next');

  if (!next || !isSafeMcpRedirect(next)) {
    return new NextResponse('Redirect URL inválida', { status: 400 });
  }

  // Build the bridge URL that will set a fresh cookie after login
  const bridgeUrl = new URL('/api/auth/holded-claude', request.url);
  bridgeUrl.searchParams.set('next', next);

  // Redirect to login with the bridge as the post-login destination
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirectTo', bridgeUrl.toString());

  const response = NextResponse.redirect(loginUrl.toString());

  // Clear the stale __session cookie
  response.cookies.set(SESSION_COOKIE, '', {
    maxAge  : 0,
    path    : '/',
    secure  : true,
    sameSite: 'none',
    domain  : process.env.HOLDED_MCP_COOKIE_DOMAIN ?? undefined,
  });

  return response;
}
