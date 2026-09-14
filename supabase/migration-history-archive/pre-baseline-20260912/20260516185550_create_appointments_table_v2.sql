CREATE TABLE IF NOT EXISTS appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text,
  service         text NOT NULL,
  preferred_date  date NOT NULL,
  preferred_time  text NOT NULL DEFAULT 'mañana',
  notes           text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','cancelled','rescheduled')),
  confirmed_date  date,
  confirmed_time  text,
  meeting_url     text,
  admin_notes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_insert_appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admin_all_appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
