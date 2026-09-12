-- email_queue: cola transaccional para envío de emails con reintentos y trazabilidad.
-- status: pending → processing → sent | failed

CREATE TABLE IF NOT EXISTS public.email_queue (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email     text        NOT NULL,
  subject      text        NOT NULL,
  html         text        NOT NULL,
  event_type   text,
  metadata     jsonb,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts     int         NOT NULL DEFAULT 0,
  last_error   text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para el worker: procesa pending ordered por scheduled_at
CREATE INDEX IF NOT EXISTS email_queue_status_scheduled_idx
  ON public.email_queue (status, scheduled_at)
  WHERE status IN ('pending', 'failed');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_email_queue_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_email_queue_updated_at ON public.email_queue;
CREATE TRIGGER trg_email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_email_queue_updated_at();

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_queue' AND policyname = 'admin all email_queue'
  ) THEN
    CREATE POLICY "admin all email_queue" ON public.email_queue
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

COMMENT ON TABLE public.email_queue IS 'Cola de emails transaccionales con soporte de reintentos. Worker procesa filas en estado pending/failed.';
