-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: company open-data tables
-- Applied: 2026-05-28
-- ─────────────────────────────────────────────────────────────────────────────

-- ── company_data_suggestions ─────────────────────────────────────────────────
-- Stores company suggestions returned by the resolver, pending user confirmation.
-- Suggestions are never auto-applied — accepted=true only after user action.

-- Drop old schema if it exists (column name clash: user_id vs profile_id)
DROP TABLE IF EXISTS public.company_data_suggestions CASCADE;

CREATE TABLE public.company_data_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_name    TEXT,
  input_tax_id  TEXT,
  suggestion    JSONB NOT NULL,
  source        TEXT NOT NULL,
  confidence    TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  accepted      BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_data_suggestions_profile ON public.company_data_suggestions(profile_id);
CREATE INDEX idx_company_data_suggestions_accepted ON public.company_data_suggestions(accepted);

ALTER TABLE public.company_data_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestions_select_own"
  ON public.company_data_suggestions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "suggestions_update_own"
  ON public.company_data_suggestions FOR UPDATE
  USING (auth.uid() = profile_id);

-- Service role can insert (via admin client) and update
CREATE POLICY "suggestions_service_insert"
  ON public.company_data_suggestions FOR INSERT
  WITH CHECK (true);  -- restricted to service role via RLS bypass

-- ── company_open_data_query_logs ─────────────────────────────────────────────
-- Privacy-safe audit log. Input hash (SHA-256) instead of raw value.

CREATE TABLE IF NOT EXISTS public.company_open_data_query_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  input_hash    TEXT NOT NULL,        -- SHA-256 of (inputType + ':' + normalised input)
  input_type    TEXT NOT NULL CHECK (input_type IN ('name', 'taxId')),
  sources_queried TEXT[] NOT NULL DEFAULT '{}',
  result_count  INTEGER NOT NULL DEFAULT 0,
  cache_hit     BOOLEAN NOT NULL DEFAULT FALSE,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_open_data_logs_profile ON public.company_open_data_query_logs(profile_id);
CREATE INDEX idx_company_open_data_logs_created ON public.company_open_data_query_logs(created_at DESC);

ALTER TABLE public.company_open_data_query_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read via service role; users cannot read audit logs
CREATE POLICY "open_data_logs_deny_user_select"
  ON public.company_open_data_query_logs FOR SELECT
  USING (false);  -- service role bypasses RLS

-- ── company_data_sources_log ─────────────────────────────────────────────────
-- General resolver audit log (name / CIF queries).

CREATE TABLE IF NOT EXISTS public.company_data_sources_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source        TEXT NOT NULL,
  query         JSONB NOT NULL DEFAULT '{}',
  result_count  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL CHECK (status IN ('ok', 'error', 'empty')),
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_data_sources_log_user ON public.company_data_sources_log(user_id);
CREATE INDEX idx_company_data_sources_log_created ON public.company_data_sources_log(created_at DESC);

ALTER TABLE public.company_data_sources_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sources_log_deny_user_select"
  ON public.company_data_sources_log FOR SELECT
  USING (false);

-- ── profile_companies link table ─────────────────────────────────────────────
-- Links auth users to companies with a role (owner, admin, member, viewer).

CREATE TABLE IF NOT EXISTS public.profile_companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, company_id)
);

CREATE INDEX idx_profile_companies_profile ON public.profile_companies(profile_id);
CREATE INDEX idx_profile_companies_company ON public.profile_companies(company_id);

ALTER TABLE public.profile_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_companies_select_own"
  ON public.profile_companies FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "profile_companies_insert_own"
  ON public.profile_companies FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "profile_companies_delete_own"
  ON public.profile_companies FOR DELETE
  USING (auth.uid() = profile_id);
