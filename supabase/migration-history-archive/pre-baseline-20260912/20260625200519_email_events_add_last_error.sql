-- Recovered verbatim from production migration ledger (#143).
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS resent_from_id bigint REFERENCES email_events(id) ON DELETE SET NULL;
