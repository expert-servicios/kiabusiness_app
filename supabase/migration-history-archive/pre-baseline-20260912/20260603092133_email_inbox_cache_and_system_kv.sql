-- Recovered verbatim from production migration ledger (#143).
CREATE TABLE IF NOT EXISTS email_inbox_cache (
  thread_id        TEXT PRIMARY KEY,
  provider         TEXT NOT NULL DEFAULT 'gmail',
  subject          TEXT NOT NULL DEFAULT '',
  from_name        TEXT NOT NULL DEFAULT '',
  from_email       TEXT NOT NULL DEFAULT '',
  snippet          TEXT NOT NULL DEFAULT '',
  date             TIMESTAMPTZ NOT NULL,
  unread           BOOLEAN NOT NULL DEFAULT false,
  has_attachment   BOOLEAN NOT NULL DEFAULT false,
  case_id          UUID REFERENCES cases(id) ON DELETE SET NULL,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_inbox_cache_date_idx ON email_inbox_cache(date DESC);
CREATE INDEX IF NOT EXISTS email_inbox_cache_unread_idx ON email_inbox_cache(unread) WHERE unread = true;
CREATE TABLE IF NOT EXISTS system_kv (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO system_kv (key, value)
VALUES ('email_unread_count', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;
ALTER TABLE email_inbox_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_kv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON email_inbox_cache USING (false) WITH CHECK (false);
CREATE POLICY "service_role_only" ON system_kv USING (false) WITH CHECK (false);
