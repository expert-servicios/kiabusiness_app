-- IMP-030: lib/email/email-queue.ts has always expected columns `error` and
-- `max_attempts`, but the table that actually got created has `last_error`
-- and no `max_attempts` at all. Every insert/select from the worker has been
-- failing silently since the queue was created — this aligns schema to code.
alter table public.email_queue rename column last_error to error;
alter table public.email_queue add column if not exists max_attempts integer not null default 3;
