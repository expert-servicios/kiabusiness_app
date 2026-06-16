-- Add 'processing' status constraint and updated_at column to email_queue.
-- 'processing' is set atomically before sending to prevent concurrent cron workers
-- from double-sending the same email.

ALTER TABLE public.email_queue
  DROP CONSTRAINT IF EXISTS email_queue_status_check;

ALTER TABLE public.email_queue
  ADD CONSTRAINT email_queue_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'failed'));

ALTER TABLE public.email_queue
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP INDEX IF EXISTS email_queue_pending_idx;
CREATE INDEX IF NOT EXISTS email_queue_pending_idx
  ON public.email_queue (scheduled_at)
  WHERE status = 'pending';
