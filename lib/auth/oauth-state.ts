import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export type OAuthProvider = 'google_calendar' | 'google_gmail' | 'ms365';

const OAUTH_STATE_COOKIE = 'expert_oauth_state';
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

type OAuthStatePayload = {
  nonce: string;
  provider: OAuthProvider;
  userId: string;
  requiresAdmin: boolean;
};

function getOAuthStateSecret(): Uint8Array {
  const secret =
    process.env.OAUTH_STATE_SECRET ??
    process.env.INTERNAL_API_SECRET ??
    process.env.HOLDED_MCP_SESSION_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error('OAUTH_STATE_SECRET, INTERNAL_API_SECRET or HOLDED_MCP_SESSION_SECRET is required for OAuth state');
  }

  return new TextEncoder().encode(secret);
}

export async function createOAuthState(params: {
  provider: OAuthProvider;
  userId: string;
  requiresAdmin?: boolean;
}): Promise<{ state: string; cookieValue: string }> {
  const state = crypto.randomUUID();
  const cookieValue = await new SignJWT({
    nonce: state,
    provider: params.provider,
    userId: params.userId,
    requiresAdmin: params.requiresAdmin === true,
  } satisfies OAuthStatePayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_STATE_TTL_SECONDS}s`)
    .sign(getOAuthStateSecret());

  return { state, cookieValue };
}

export function setOAuthStateCookie(response: NextResponse, cookieValue: string): void {
  response.cookies.set(OAUTH_STATE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: '/api/auth',
  });
}

export function clearOAuthStateCookie(response: NextResponse): void {
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/auth',
  });
}

export async function verifyOAuthState(
  request: NextRequest,
  provider: OAuthProvider,
  state: string | null
): Promise<
  | { ok: true; userId: string; requiresAdmin: boolean }
  | { ok: false; reason: string }
> {
  if (!state) return { ok: false, reason: 'missing_state' };

  const cookieValue = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!cookieValue) return { ok: false, reason: 'missing_state_cookie' };

  try {
    const { payload } = await jwtVerify(cookieValue, getOAuthStateSecret());
    if (payload.provider !== provider) return { ok: false, reason: 'provider_mismatch' };
    if (payload.nonce !== state) return { ok: false, reason: 'nonce_mismatch' };
    if (typeof payload.userId !== 'string' || !payload.userId) {
      return { ok: false, reason: 'missing_user' };
    }

    return {
      ok: true,
      userId: payload.userId,
      requiresAdmin: payload.requiresAdmin === true,
    };
  } catch {
    return { ok: false, reason: 'invalid_state_cookie' };
  }
}
