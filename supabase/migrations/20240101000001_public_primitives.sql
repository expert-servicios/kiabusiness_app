-- Candidate current-schema baseline for issue #143.
-- Not active in supabase/config.toml. Do not apply to production.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create type public.booking_status as enum (
  'draft',
  'pending_payment',
  'confirmed',
  'cancelled',
  'rescheduled'
);

-- Traditional sequences present in production. Identity-backed sequences for
-- ai_logs.id and email_events.id are created by their table definitions.
create sequence public.audit_log_id_seq
  as bigint
  increment by 1
  minvalue 1
  no maxvalue
  start with 1
  cache 1;

create sequence public.invoice_lines_id_seq
  as bigint
  increment by 1
  minvalue 1
  no maxvalue
  start with 1
  cache 1;
