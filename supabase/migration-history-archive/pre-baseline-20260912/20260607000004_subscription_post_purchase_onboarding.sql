-- Track post-purchase Claude onboarding per subscription.
-- Stored on subscriptions (not profiles) so that if a user cancels and resubscribes
-- the wizard appears again.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS post_purchase_onboarding_at timestamptz;

-- Dashboard banner query: active subscriptions pending onboarding
CREATE INDEX IF NOT EXISTS subscriptions_pending_onboarding_idx
  ON public.subscriptions (client_id, post_purchase_onboarding_at)
  WHERE status IN ('active', 'trialing')
    AND post_purchase_onboarding_at IS NULL;
