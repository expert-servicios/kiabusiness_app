-- Fix: leads upsert via WhatsApp (onConflict:'phone') requires a unique index.
-- Without it every Kia saveLead call inserts a new duplicate row instead of updating.
-- Also make email nullable so WhatsApp contacts captured before sharing their email
-- can still be saved without a placeholder value.

-- 1. Unique index on phone for upsert deduplication (partial: only non-null phones).
create unique index if not exists leads_phone_unique_idx
  on public.leads (phone)
  where phone is not null;

-- 2. Make email nullable — WhatsApp leads are identified by phone, not email.
alter table public.leads
  alter column email drop not null;

-- 3. Make client_type nullable — WhatsApp leads don't always declare their type up front.
alter table public.leads
  alter column client_type drop not null;

-- 4. Make category and service nullable for the same reason.
alter table public.leads
  alter column category drop not null;

alter table public.leads
  alter column service drop not null;
