-- Quote templates: reusable presets that pre-fill the nueva-cotización form.
-- Amounts are optional (null = admin fills in per quote).

CREATE TABLE IF NOT EXISTS public.quote_templates (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text         NOT NULL,
  title           text         NOT NULL,
  description     text         NOT NULL,
  amount_eur      numeric(10,2),
  expires_in_days integer      NOT NULL DEFAULT 14,
  docs_checklist  text[]       NOT NULL DEFAULT '{}',
  created_by      uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all quote_templates" ON public.quote_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
