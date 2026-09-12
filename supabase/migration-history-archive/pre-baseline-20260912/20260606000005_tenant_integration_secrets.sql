-- Per-tenant integration secrets (Holded, WhatsApp, etc.)
-- No GRANT to authenticated — only service_role reads/writes.
CREATE TABLE IF NOT EXISTS public.tenant_integration_secrets (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  integration  text        NOT NULL,
  encrypted_secret text   NOT NULL,
  meta         jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, integration)
);

ALTER TABLE public.tenant_integration_secrets ENABLE ROW LEVEL SECURITY;
-- No RLS policies: service_role bypasses RLS, authenticated cannot access this table.
