-- Toggle table for automation rules (email notifications, reminders, etc.)
-- Each row is a named automation switch; admin panel reads/writes via RLS.

CREATE TABLE IF NOT EXISTS public.automation_settings (
  key        text        PRIMARY KEY,
  enabled    boolean     NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'automation_settings'
      AND policyname = 'admin all automation_settings'
  ) THEN
    CREATE POLICY "admin all automation_settings" ON public.automation_settings
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Seed default automations (idempotent)
INSERT INTO public.automation_settings (key, enabled) VALUES
  ('case.pendiente_cliente',      true),
  ('case.en_revision',            true),
  ('case.listo_para_presentar',   true),
  ('case.presentado',             true),
  ('case.finalizado',             true),
  ('case.review_request',         true),
  ('admin.daily_summary',         true)
ON CONFLICT (key) DO NOTHING;
