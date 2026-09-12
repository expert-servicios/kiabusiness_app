alter table public.stripe_accounts enable row level security;

revoke all privileges on table public.stripe_accounts from public;
revoke all privileges on table public.stripe_accounts from anon;
revoke all privileges on table public.stripe_accounts from authenticated;

grant select, insert, update, delete
on table public.stripe_accounts
to service_role;
