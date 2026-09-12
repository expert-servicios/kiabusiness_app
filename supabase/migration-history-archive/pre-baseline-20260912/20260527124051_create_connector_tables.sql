CREATE TABLE IF NOT EXISTS connector_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  connector_type text NOT NULL DEFAULT 'claude_holded',
  tier text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  holded_integration_id uuid REFERENCES client_integrations(id) ON DELETE SET NULL,
  mcp_client_id text,
  last_activity_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_connector_instance_client_type UNIQUE (client_id, connector_type)
);
CREATE INDEX IF NOT EXISTS idx_connector_instances_client_id ON connector_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_connector_instances_status ON connector_instances(status) WHERE status = 'active';
ALTER TABLE connector_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own connector instances" ON connector_instances FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Service role full access on connector_instances" ON connector_instances FOR ALL USING (auth.role() = 'service_role');
CREATE OR REPLACE FUNCTION update_connector_instances_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_connector_instances_updated_at BEFORE UPDATE ON connector_instances FOR EACH ROW EXECUTE FUNCTION update_connector_instances_updated_at();
COMMENT ON TABLE connector_instances IS 'One row per client per connector type. Tracks activation state, tier, and Holded integration link. Never stores API keys or OAuth secrets.';

CREATE TABLE IF NOT EXISTS connector_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES connector_instances(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  tool_name text NOT NULL,
  tokens_input int,
  tokens_output int,
  latency_ms int,
  success boolean NOT NULL DEFAULT true,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_events_instance_id ON connector_usage_events(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_client_id ON connector_usage_events(client_id, created_at DESC);
ALTER TABLE connector_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own usage events" ON connector_usage_events FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Service role full access on usage_events" ON connector_usage_events FOR ALL USING (auth.role() = 'service_role');
COMMENT ON TABLE connector_usage_events IS 'Per-tool-call event log for the Claude connector. No raw payloads or Holded data stored here — only metadata.';

CREATE TABLE IF NOT EXISTS connector_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES connector_instances(id) ON DELETE SET NULL,
  client_id uuid NOT NULL,
  actor_type text NOT NULL DEFAULT 'ai',
  tool_name text NOT NULL,
  risk_level text NOT NULL DEFAULT 'low',
  result text NOT NULL,
  payload_hash text,
  confirmation_by text,
  holded_entity_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_instance_id ON connector_audit_logs(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON connector_audit_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON connector_audit_logs(risk_level, created_at DESC) WHERE risk_level IN ('high', 'critical');
ALTER TABLE connector_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own audit logs" ON connector_audit_logs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Service role full access on audit_logs" ON connector_audit_logs FOR ALL USING (auth.role() = 'service_role');
COMMENT ON TABLE connector_audit_logs IS 'Audit trail for connector actions with risk. Stores payload HASH only — never raw invoice data, contact data, or API responses. Retention: keep indefinitely for compliance.';
