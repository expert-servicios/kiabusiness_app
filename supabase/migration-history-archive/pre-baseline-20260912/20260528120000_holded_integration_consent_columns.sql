-- Add consent tracking and user-selected permissions to client_integrations
-- Applied: 2026-05-28

ALTER TABLE public.client_integrations
  ADD COLUMN IF NOT EXISTS permissions_enabled JSONB,
  ADD COLUMN IF NOT EXISTS consent_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version     TEXT;

CREATE INDEX IF NOT EXISTS idx_client_integrations_consent_at
  ON public.client_integrations (consent_at)
  WHERE consent_at IS NOT NULL;

COMMENT ON COLUMN public.client_integrations.permissions_enabled IS
  'Subset of permissions_detected that the user explicitly enabled during the consent flow. Null = all detected permissions enabled (legacy rows).';
COMMENT ON COLUMN public.client_integrations.consent_at IS
  'Timestamp when the user accepted the consent modal (RGPD audit trail).';
COMMENT ON COLUMN public.client_integrations.consent_version IS
  'Version of the consent form shown to the user (e.g. "1.0"). Allows re-showing consent if terms change.';
