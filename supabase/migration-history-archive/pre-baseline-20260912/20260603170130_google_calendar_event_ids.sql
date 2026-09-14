-- Recovered verbatim from production migration ledger (#143).
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
