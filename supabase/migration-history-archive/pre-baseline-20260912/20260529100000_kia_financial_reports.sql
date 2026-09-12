-- kia_financial_reports — stores AI-generated company status reports
-- Applied: 2026-05-29

CREATE TABLE IF NOT EXISTS public.kia_financial_reports (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID,
  report_type   TEXT        NOT NULL DEFAULT 'empresa_status',
  period        TEXT,
  title         TEXT        NOT NULL,
  ai_summary    TEXT,
  data          JSONB       NOT NULL DEFAULT '{}',
  generated_by  TEXT        NOT NULL DEFAULT 'kia'
                            CHECK (generated_by IN ('kia', 'admin', 'user')),
  viewed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kia_financial_reports_client
  ON public.kia_financial_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_kia_financial_reports_company
  ON public.kia_financial_reports(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kia_financial_reports_created
  ON public.kia_financial_reports(created_at DESC);

ALTER TABLE public.kia_financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own"
  ON public.kia_financial_reports FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "reports_service_insert"
  ON public.kia_financial_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reports_service_update"
  ON public.kia_financial_reports FOR UPDATE
  USING (true);
