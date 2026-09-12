alter table public.aeat_credentials enable row level security;

revoke all privileges on table public.aeat_credentials from public;
revoke all privileges on table public.aeat_credentials from anon;
revoke all privileges on table public.aeat_credentials from authenticated;

grant select, insert, update, delete
on table public.aeat_credentials
to service_role;
