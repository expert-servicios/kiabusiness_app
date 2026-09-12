-- ── holded_mcp_connections ───────────────────────────────────────────────────
-- Applied: 2026-05-29

CREATE TABLE IF NOT EXISTS public.holded_mcp_connections (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mcp_user_id       TEXT        NOT NULL,
  supabase_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email             TEXT        NOT NULL,
  channel           TEXT        NOT NULL DEFAULT 'claude'
                                CHECK (channel IN ('claude', 'chatgpt', 'mobile', 'dashboard')),
  source            TEXT,
  encrypted_api_key TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'connected'
                                CHECK (status IN ('connected', 'revoked', 'error')),
  legal_accepted_at TIMESTAMPTZ,
  terms_accepted    BOOLEAN     NOT NULL DEFAULT FALSE,
  privacy_accepted  BOOLEAN     NOT NULL DEFAULT FALSE,
  last_activity_at  TIMESTAMPTZ,
  last_tool_used    TEXT,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mcp_user_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_holded_mcp_connections_email
  ON public.holded_mcp_connections (email);
CREATE INDEX IF NOT EXISTS idx_holded_mcp_connections_supabase_user
  ON public.holded_mcp_connections (supabase_user_id)
  WHERE supabase_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_holded_mcp_connections_status
  ON public.holded_mcp_connections (status);

ALTER TABLE public.holded_mcp_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcp_connections_deny_anon" ON public.holded_mcp_connections FOR ALL USING (false);

-- ── holded_mcp_events ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.holded_mcp_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT        NOT NULL,
  channel       TEXT        NOT NULL DEFAULT 'claude',
  user_id_mcp   TEXT,
  tenant_id     TEXT,
  user_email    TEXT,
  payload       JSONB       NOT NULL DEFAULT '{}',
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_holded_mcp_events_user
  ON public.holded_mcp_events (user_id_mcp) WHERE user_id_mcp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_holded_mcp_events_created
  ON public.holded_mcp_events (created_at DESC);

ALTER TABLE public.holded_mcp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcp_events_deny_anon" ON public.holded_mcp_events FOR ALL USING (false);

-- ── security_alerts ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type  TEXT        NOT NULL,
  user_email  TEXT,
  detail      JSONB       NOT NULL DEFAULT '{}',
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type
  ON public.security_alerts (alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved
  ON public.security_alerts (resolved) WHERE resolved = FALSE;

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_alerts_deny_anon" ON public.security_alerts FOR ALL USING (false);

-- ── client_integrations: add channel column ──────────────────────────────────
ALTER TABLE public.client_integrations
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'dashboard';
