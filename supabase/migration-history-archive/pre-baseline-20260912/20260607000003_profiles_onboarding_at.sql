-- Tracking de onboarding: cuándo el usuario completó el wizard inicial.
-- NULL = aún no completado → muestra el banner en el dashboard.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed_at is
  'Timestamp (UTC) en el que el usuario completó el wizard de configuración inicial. '
  'NULL si el onboarding está pendiente.';

-- Índice ligero para reporting/funnel analytics
create index if not exists profiles_onboarding_pending_idx
  on public.profiles (created_at)
  where onboarding_completed_at is null;
