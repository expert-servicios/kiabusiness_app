-- Sprint E: Add operational case columns expected by admin cases API.
-- The cases table was created with a `state` enum (pendiente_documentacion, en_revision…).
-- The admin API evolved to use a `status` text column with a cleaner workflow vocabulary,
-- plus priority, next_action, due_date and service_id for richer case management.
-- This migration adds those columns and backfills status from the existing state values.
-- The `state` column is kept for backward compatibility with client-facing routes.

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS status     text,
  ADD COLUMN IF NOT EXISTS priority   text        NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS due_date   timestamptz,
  ADD COLUMN IF NOT EXISTS service_id text;

-- Backfill status from state using the new workflow vocabulary
UPDATE public.cases
SET status = CASE state::text
  WHEN 'pendiente_documentacion' THEN 'pendiente_cliente'
  WHEN 'docs_pendientes'         THEN 'pendiente_cliente'
  WHEN 'en_revision'             THEN 'en_revision'
  WHEN 'en_proceso'              THEN 'en_revision'
  WHEN 'docs_recibidos'          THEN 'en_revision'
  WHEN 'en_tramitacion'          THEN 'en_revision'
  WHEN 'pendiente_externo'       THEN 'en_revision'
  WHEN 'resolucion_recibida'     THEN 'listo_para_presentar'
  WHEN 'presentado'              THEN 'presentado'
  WHEN 'entregado'               THEN 'finalizado'
  WHEN 'finalizado'              THEN 'finalizado'
  WHEN 'nuevo'                   THEN 'nuevo'
  ELSE                                'nuevo'
END
WHERE status IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE public.cases
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'nuevo';

-- Constraint for valid status values (must match CaseStatus in lib/cases/case-status.ts)
ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE public.cases
  ADD CONSTRAINT cases_status_check
  CHECK (status IN ('nuevo','pendiente_cliente','en_revision','listo_para_presentar','presentado','finalizado','bloqueado'));

-- Constraint for valid priority values
ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_priority_check;
ALTER TABLE public.cases
  ADD CONSTRAINT cases_priority_check
  CHECK (priority IN ('baja','media','alta','critica'));

-- Indexes for admin query patterns
CREATE INDEX IF NOT EXISTS cases_status_idx   ON public.cases (status);
CREATE INDEX IF NOT EXISTS cases_priority_idx ON public.cases (priority) WHERE priority != 'media';
CREATE INDEX IF NOT EXISTS cases_due_date_idx ON public.cases (due_date) WHERE due_date IS NOT NULL;
