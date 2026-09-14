-- ── Auto-create profile when a new auth user is created ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'client';
begin
  -- Auto-assign admin role for the owner account
  if new.email = 'soy@kseniailicheva.com' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    assigned_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Track welcome email to avoid duplicates ───────────────────────────────────
alter table public.profiles
  add column if not exists welcome_email_sent boolean not null default false;

-- ── Ensure admin role for existing owner account (if already registered) ─────
do $$
declare
  owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'soy@kseniailicheva.com' limit 1;
  if owner_id is not null then
    update public.profiles
      set role = 'admin', welcome_email_sent = true
      where id = owner_id;
  end if;
end;
$$;

-- ── Newsletter subscribers ────────────────────────────────────────────────────
create table public.newsletter_subscribers (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null unique,
  name        text,
  source      text        not null default 'website',
  confirmed   boolean     not null default false,
  unsubscribed_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "admin all newsletter_subscribers" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- Allow anonymous inserts (public signup form)
create policy "public insert newsletter" on public.newsletter_subscribers
  for insert with check (true);
