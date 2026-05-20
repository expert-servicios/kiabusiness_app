-- Fase 7: Kia bot sessions + WhatsApp conversation extra columns
-- Applied via Supabase MCP in previous session — IF NOT EXISTS guards make this idempotent.

-- kia_sessions: persistent state machine for Kia WhatsApp bot
CREATE TABLE IF NOT EXISTS public.kia_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number   text        NOT NULL UNIQUE,
  client_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  lang           text        NOT NULL DEFAULT 'es',
  flow           text        NOT NULL DEFAULT 'welcome',
  step           text        NOT NULL DEFAULT 'init',
  service_id     text,
  precal_step    int         NOT NULL DEFAULT 0,
  data           jsonb       NOT NULL DEFAULT '{}',
  name           text,
  email          text,
  priority       text        NOT NULL DEFAULT 'normal',
  escalated      boolean     NOT NULL DEFAULT false,
  last_activity  timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kia_sessions_escalated_idx
  ON public.kia_sessions(escalated) WHERE escalated = true;

CREATE INDEX IF NOT EXISTS kia_sessions_flow_step_idx
  ON public.kia_sessions(flow, step);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_kia_sessions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS kia_sessions_updated_at ON public.kia_sessions;
CREATE TRIGGER kia_sessions_updated_at
  BEFORE UPDATE ON public.kia_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_kia_sessions_updated_at();

ALTER TABLE public.kia_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin manage kia_sessions" ON public.kia_sessions
  FOR ALL USING (is_admin());

-- WhatsApp conversations: extra columns added after initial migration
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS needs_review  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_responded  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at       timestamptz,
  ADD COLUMN IF NOT EXISTS case_id       uuid        REFERENCES public.cases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS media_url     text,
  ADD COLUMN IF NOT EXISTS media_type    text;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_phone_idx
  ON public.whatsapp_conversations(phone_number);

CREATE INDEX IF NOT EXISTS whatsapp_conversations_needs_review_idx
  ON public.whatsapp_conversations(needs_review) WHERE needs_review = true;
