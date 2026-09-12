-- Add cal_uid to appointments for idempotent Cal.com webhook upserts.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cal_uid text UNIQUE;
