import { randomUUID } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

export type SubscriptionCheckoutClaimState = 'claimed' | 'open' | 'expired' | 'manual_review' | 'retry';

export interface SubscriptionCheckoutClaim {
  acquired: boolean;
  claimId: string | null;
  state: SubscriptionCheckoutClaimState;
  stripeSessionId: string | null;
  ownerToken: string;
}

type RpcClaim = {
  acquired?: boolean;
  claim_id?: string | null;
  state?: SubscriptionCheckoutClaimState;
  stripe_session_id?: string | null;
};

export async function claimSubscriptionCheckout(
  admin: SupabaseAdmin,
  params: { userId: string; companyId: string; intentKey: string; leaseSeconds?: number },
): Promise<SubscriptionCheckoutClaim> {
  const ownerToken = randomUUID();
  const { data, error } = await admin.rpc('claim_subscription_checkout', {
    p_user_id: params.userId,
    p_company_id: params.companyId,
    p_intent_key: params.intentKey,
    p_owner_token: ownerToken,
    p_lease_seconds: params.leaseSeconds ?? 120,
  });
  if (error) throw new Error(`Could not claim subscription checkout: ${error.message}`);

  const row = (data ?? {}) as RpcClaim;
  return {
    acquired: row.acquired === true,
    claimId: row.claim_id ?? null,
    state: row.state ?? 'retry',
    stripeSessionId: row.stripe_session_id ?? null,
    ownerToken,
  };
}

export function subscriptionCheckoutStripeIdempotencyKey(claimId: string): string {
  return `subscription-checkout/${claimId}`;
}

export async function finalizeSubscriptionCheckoutClaim(
  admin: SupabaseAdmin,
  claim: Pick<SubscriptionCheckoutClaim, 'claimId' | 'ownerToken'>,
  stripeSessionId: string,
): Promise<void> {
  if (!claim.claimId) throw new Error('Missing subscription checkout claim id');
  const { error } = await admin.rpc('finalize_subscription_checkout_claim', {
    p_claim_id: claim.claimId,
    p_owner_token: claim.ownerToken,
    p_stripe_session_id: stripeSessionId,
  });
  if (error) throw new Error(`Could not finalize subscription checkout claim: ${error.message}`);
}

export async function expireSubscriptionCheckoutClaim(
  admin: SupabaseAdmin,
  claim: Pick<SubscriptionCheckoutClaim, 'claimId' | 'ownerToken'>,
  errorMessage?: string,
): Promise<void> {
  if (!claim.claimId) return;
  const { error } = await admin.rpc('expire_subscription_checkout_claim', {
    p_claim_id: claim.claimId,
    p_owner_token: claim.ownerToken,
    p_error: errorMessage ?? null,
  });
  if (error) throw new Error(`Could not expire subscription checkout claim: ${error.message}`);
}

export async function flagSubscriptionCheckoutClaimReview(
  admin: SupabaseAdmin,
  claim: Pick<SubscriptionCheckoutClaim, 'claimId' | 'ownerToken'>,
  errorMessage: string,
): Promise<void> {
  if (!claim.claimId) return;
  const { error } = await admin.rpc('flag_subscription_checkout_claim_review', {
    p_claim_id: claim.claimId,
    p_owner_token: claim.ownerToken,
    p_error: errorMessage,
  });
  if (error) throw new Error(`Could not flag subscription checkout claim for review: ${error.message}`);
}
