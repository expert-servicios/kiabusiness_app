-- Add WhatsApp lead-capture fields and unique phone index to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source      text,
  ADD COLUMN IF NOT EXISTS notes       text,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz;

-- Partial unique index so upsert({onConflict:'phone'}) works for non-null phones
CREATE UNIQUE INDEX IF NOT EXISTS leads_phone_unique
  ON public.leads(phone)
  WHERE phone IS NOT NULL;
