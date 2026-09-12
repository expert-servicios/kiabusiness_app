CREATE TABLE IF NOT EXISTS subscription_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  feature_key text NOT NULL,
  tier text,
  active boolean NOT NULL DEFAULT true,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  granted_by text NOT NULL DEFAULT 'stripe_webhook',
  revoked_at timestamptz,
  revoked_by text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entitlements_client_id ON subscription_entitlements(client_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_client_active ON subscription_entitlements(client_id, feature_key) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_entitlements_subscription_id ON subscription_entitlements(subscription_id) WHERE subscription_id IS NOT NULL;
ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own entitlements" ON subscription_entitlements FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Service role full access on entitlements" ON subscription_entitlements FOR ALL USING (auth.role() = 'service_role');
CREATE OR REPLACE FUNCTION update_entitlements_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_entitlements_updated_at BEFORE UPDATE ON subscription_entitlements FOR EACH ROW EXECUTE FUNCTION update_entitlements_updated_at();
COMMENT ON TABLE subscription_entitlements IS 'Granular feature entitlements per client, derived from Stripe subscriptions. Single source of truth for feature access and connector tier. Never store API keys or secrets here.';
