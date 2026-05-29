/**
 * Shared-secret auth helper for server-to-server calls from the
 * Holded MCP server (claude.expertconsulting.es) to EXPERT.
 *
 * The MCP server sends: x-expert-shared-secret: <EXPERT_APP_SHARED_SECRET>
 * EXPERT validates with:               HOLDED_MCP_SHARED_SECRET env var
 *
 * Timing-safe comparison to prevent timing attacks.
 */

import { createHash, timingSafeEqual } from 'crypto';

function getSharedSecret(): string | null {
  return process.env.HOLDED_MCP_SHARED_SECRET ?? null;
}

/**
 * Returns true if the request carries a valid shared secret.
 * Always returns false if the env var is not configured.
 */
export function validateMcpSharedSecret(headerValue: string | null): boolean {
  const expected = getSharedSecret();
  if (!expected || !headerValue) return false;

  // Timing-safe compare via equal-length SHA-256 digests
  const a = createHash('sha256').update(headerValue).digest();
  const b = createHash('sha256').update(expected).digest();
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isMcpIntegrationConfigured(): boolean {
  return Boolean(getSharedSecret());
}
