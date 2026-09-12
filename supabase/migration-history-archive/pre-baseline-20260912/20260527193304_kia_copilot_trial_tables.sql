ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_start timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS trial_status text CHECK (trial_status IN ('trialing','converted','canceled','expired')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_slug text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS subscription_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES profile_companies(id) ON DELETE SET NULL,
  plan_slug text NOT NULL DEFAULT 'copilot',
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_start timestamptz NOT NULL DEFAULT now(),
  trial_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','converted','canceled','expired','blocked')),
  started_from text CHECK (started_from IN ('dashboard','waba','public_page','admin')),
  holded_connected_at timestamptz,
  first_copilot_use_at timestamptz,
  trial_end_reminder_sent_at timestamptz,
  holded_not_connected_reminder_sent_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_trials_company_plan_active_idx ON subscription_trials (company_id, plan_slug) WHERE status IN ('trialing','converted');
CREATE UNIQUE INDEX IF NOT EXISTS subscription_trials_client_plan_active_idx ON subscription_trials (client_id, plan_slug) WHERE company_id IS NULL AND status IN ('trialing','converted');
CREATE INDEX IF NOT EXISTS subscription_trials_status_idx ON subscription_trials (status);
CREATE INDEX IF NOT EXISTS subscription_trials_client_idx ON subscription_trials (client_id);
CREATE INDEX IF NOT EXISTS subscription_trials_trial_end_idx ON subscription_trials (trial_end);
CREATE INDEX IF NOT EXISTS subscription_trials_stripe_sub_idx ON subscription_trials (stripe_subscription_id);
ALTER TABLE subscription_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_trials_service_role_all" ON subscription_trials FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "subscription_trials_client_read" ON subscription_trials FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE OR REPLACE FUNCTION update_subscription_trials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS subscription_trials_updated_at_trigger ON subscription_trials;
CREATE TRIGGER subscription_trials_updated_at_trigger BEFORE UPDATE ON subscription_trials FOR EACH ROW EXECUTE FUNCTION update_subscription_trials_updated_at();
COMMENT ON TABLE subscription_trials IS 'Canonical record of Kia Copilot free trials. One active/converted trial per company+plan. Never stores API keys or secrets.';
COMMENT ON COLUMN subscription_trials.status IS 'trialing=active trial | converted=paid after trial | canceled=canceled before end | expired=ended without payment | blocked=admin blocked';
COMMENT ON COLUMN subscription_trials.started_from IS 'Origin channel: dashboard | waba | public_page | admin';
