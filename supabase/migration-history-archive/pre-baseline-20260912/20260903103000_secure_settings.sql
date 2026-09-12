alter table public.settings enable row level security;

revoke all privileges on table public.settings from public;
revoke all privileges on table public.settings from anon;
revoke all privileges on table public.settings from authenticated;

grant select, insert, update, delete
on table public.settings
to service_role;
