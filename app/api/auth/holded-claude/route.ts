/**
 * GET /api/auth/holded-claude
 *
 * Auth bridge between the Holded MCP server and EXPERT.
 *
 * Called after the user logs in via /auth/holded-claude (the page).
 * Sets the __session JWT cookie on the EXPERT domain, then redirects
 * the user back to the MCP server's `next` URL.
 *
 * The __session cookie is verified by the MCP server (on the same parent
 * domain once claude.expertconsulting.es is active) to confirm the user's
 * identity without requiring them to re-enter their email.
 *
 * Query params:
 *   next  — the MCP authorize URL to redirect back to (required)
 *   uid   — Supabase user ID (passed by the page after Supabase auth)
 *   email — verified email
 *   name  — display name (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';

const SESSION_COOKIE = '__session';
const SESSION_TTL_S  = 3600; // 1 hour — enough to complete the consent flow

function getSessionSecret(): Uint8Array | null {
  const secret = process.env.HOLDED_MCP_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

function isSafeMcpRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow redirects to known MCP server hostnames
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

  const secret = getSessionSecret();
  if (!secret) {
    // Bridge not configured — redirect to next without cookie (MCP will show email form)
    return NextResponse.redirect(next);
  }

  // Verify Supabase session
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    // Not logged in — redirect to login, which will come back here
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl.toString());
  }

  // Sign __session JWT
  const token = await new SignJWT({
    uid  : user.id,
    email: user.email,
    name : user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_S}s`)
    .sign(secret);

  const response = NextResponse.redirect(next);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, // MCP server reads it via cookie header (server-side), not browser JS
    secure  : true,
    sameSite: 'none', // Required for cross-site redirect flow
    maxAge  : SESSION_TTL_S,
    path    : '/',
    // Set on parent domain so claude.expertconsulting.es can read it
    domain  : process.env.HOLDED_MCP_COOKIE_DOMAIN ?? undefined,
  });

  return response;
}
