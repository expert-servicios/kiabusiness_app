-- Repair production drift: the original 20260607000003 migration exists in
-- Git history but is absent from the production migration history.
-- This migration is intentionally additive and idempotent: no historical rows
-- are backfilled or otherwise modified.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed_at is
  'Timestamp (UTC) en el que el usuario completó el wizard de configuración inicial. '
  'NULL si el onboarding está pendiente.';

create index if not exists profiles_onboarding_pending_idx
  on public.profiles (created_at)
  where onboarding_completed_at is null;
