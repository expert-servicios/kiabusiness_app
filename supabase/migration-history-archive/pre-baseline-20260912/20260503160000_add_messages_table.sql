create table public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_role text not null check (sender_role in ('admin', 'client')),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "admin all messages" on public.messages
for all using (public.is_admin()) with check (public.is_admin());

create policy "client own case messages" on public.messages
for select using (
  exists (
    select 1 from public.cases c
    where c.id = messages.case_id and c.client_id = auth.uid()
  )
);

create policy "client send message" on public.messages
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.cases c
    where c.id = messages.case_id and c.client_id = auth.uid()
  )
);
