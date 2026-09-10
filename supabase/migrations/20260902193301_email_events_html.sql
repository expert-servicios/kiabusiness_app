alter table public.email_events add column if not exists html text;

comment on column public.email_events.html is
  'Rendered HTML body as sent to Resend. Nullable for rows created before this column existed.';
