/**
 * Holded authentication layer.
 *
 * Resolves the correct API key for a given integration:
 *   - For mode=expert_account: reads HOLDED_API_KEY env var directly.
 *   - For mode=client_account: loads the row from client_integrations,
 *     decrypts encrypted_api_key using SECRET_ENCRYPTION_KEY,
 *     and returns the plaintext key — server-side only.
 *
 * The decrypted key NEVER leaves this module in any response payload.
 * It is returned only as a typed HoldedAuthConfig used to build HTTP headers.
 */

import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { decryptSecret } from '@/lib/security/encryption';
import { HoldedAuthError, HoldedIntegrationError } from './holded-errors';

export interface HoldedAuthConfig {
  apiKey    : string;
  baseUrl   : string;
  crmUrl    : string;
  projectsUrl: string;
}

const BASE_URL      = 'https://api.holded.com/api/invoicing/v1';
const CRM_URL       = 'https://api.holded.com/api/crm/v1';
const PROJECTS_URL  = 'https://api.holded.com/api/projects/v1';

/** Build standard Holded request headers from an API key. Never log the key. */
export function buildHoldedHeaders(apiKey: string): HeadersInit {
  return { key: apiKey, 'Content-Type': 'application/json' };
}

/**
 * Resolves auth config for the EXPERT global account (HOLDED_API_KEY env var).
 * Used by legacy sync functions in lib/integrations/holded.ts.
 */
export function getExpertAccountAuth(): HoldedAuthConfig {
  const apiKey = process.env.HOLDED_API_KEY;
  if (!apiKey) throw new HoldedAuthError('/global', 'HOLDED_API_KEY not set');
  return { apiKey, baseUrl: BASE_URL, crmUrl: CRM_URL, projectsUrl: PROJECTS_URL };
}

/**
 * Resolves auth config for a specific client integration stored in client_integrations.
 *
 * @param integrationId - UUID of the client_integrations row.
 * @throws HoldedIntegrationError if the row is not found, not active, or key cannot be decrypted.
 * @throws HoldedAuthError if the decrypted key is empty or malformed.
 */
export async function getClientIntegrationAuth(integrationId: string): Promise<HoldedAuthConfig> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('client_integrations')
    .select('id, status, mode, encrypted_api_key, provider')
    .eq('id', integrationId)
    .single();

  if (error || !data) {
    throw new HoldedIntegrationError(
      `client_integrations row not found for id=${integrationId}: ${error?.message ?? 'no data'}`
    );
  }

  if (data.status !== 'active') {
    throw new HoldedIntegrationError(
      `Integration ${integrationId} is not active (status=${data.status}). Connect Holded first.`
    );
  }

  if (!data.encrypted_api_key) {
    throw new HoldedIntegrationError(
      `Integration ${integrationId} has no encrypted API key stored.`
    );
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(data.encrypted_api_key);
  } catch (decryptErr) {
    throw new HoldedIntegrationError(
      `Failed to decrypt API key for integration ${integrationId}: ${decryptErr instanceof Error ? decryptErr.message : String(decryptErr)}`
    );
  }

  if (!apiKey) {
    throw new HoldedAuthError(`/integration/${integrationId}`, 'Decrypted API key is empty');
  }

  return { apiKey, baseUrl: BASE_URL, crmUrl: CRM_URL, projectsUrl: PROJECTS_URL };
}

/**
 * Resolves auth from either the EXPERT global account or a specific client integration.
 * Pass integrationId=null to use the global EXPERT account.
 */
export async function resolveHoldedAuth(integrationId: string | null): Promise<HoldedAuthConfig> {
  if (!integrationId) return getExpertAccountAuth();
  return getClientIntegrationAuth(integrationId);
}
