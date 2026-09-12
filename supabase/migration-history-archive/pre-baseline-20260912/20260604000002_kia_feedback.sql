-- F6: Kia feedback loop - stores positive/negative ratings for WABA responses.

create table if not exists public.kia_feedback (
  id              uuid primary key default gen_random_uuid(),
  decision_log_id uuid references public.kia_decision_logs(id) on delete set null,
  phone           text not null,
  client_id       uuid references public.profiles(id) on delete set null,
  lead_id         uuid references public.leads(id) on delete set null,
  rating          text not null check (rating in ('positive', 'negative')),
  channel         text not null default 'waba',
  kia_reply       text,
  user_message    text,
  intent          text,
  next_action     text,
  task_type       text,
  created_at      timestamptz not null default now()
);

create index if not exists kia_feedback_decision_log_id_idx
  on public.kia_feedback (decision_log_id)
  where decision_log_id is not null;

create index if not exists kia_feedback_phone_idx
  on public.kia_feedback (phone);

create index if not exists kia_feedback_rating_idx
  on public.kia_feedback (rating);

create index if not exists kia_feedback_created_at_idx
  on public.kia_feedback (created_at desc);

alter table public.kia_feedback enable row level security;

revoke all on public.kia_feedback from anon;
revoke all on public.kia_feedback from authenticated;
grant select, insert, update, delete on public.kia_feedback to service_role;

comment on table public.kia_feedback is
  'Kia AI feedback: positive/negative ratings from WABA users, linked to decision logs for few-shot learning.';
