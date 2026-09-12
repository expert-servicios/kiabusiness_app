create table public.email_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  recipient_email text not null,
  subject text not null,
  resend_id text,
  status text not null default 'sent'
    check (status in ('sent', 'delivered', 'bounced', 'failed')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_events enable row level security;

create policy "admin all email_events" on public.email_events
for all using (public.is_admin()) with check (public.is_admin());
