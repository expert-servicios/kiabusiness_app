-- These legacy/public tables are intentionally server-side only.
-- Preserve service_role access and deny Data API client roles by default.

revoke all on table
  public.users,
  public.memberships,
  public.customers,
  public.invoice_lines,
  public.verifactu_queue,
  public.audit_log,
  public.representatives,
  public.shareholders,
  public.activities,
  public.establishments,
  public.assets_realestate,
  public.assets_vehicles,
  public.doc_templates,
  public.certificates
from public, anon, authenticated;

alter table public.users enable row level security;
alter table public.memberships enable row level security;
alter table public.customers enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.verifactu_queue enable row level security;
alter table public.audit_log enable row level security;
alter table public.representatives enable row level security;
alter table public.shareholders enable row level security;
alter table public.activities enable row level security;
alter table public.establishments enable row level security;
alter table public.assets_realestate enable row level security;
alter table public.assets_vehicles enable row level security;
alter table public.doc_templates enable row level security;
alter table public.certificates enable row level security;

comment on table public.users is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.memberships is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.customers is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.invoice_lines is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.verifactu_queue is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.audit_log is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.representatives is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.shareholders is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.activities is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.establishments is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.assets_realestate is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.assets_vehicles is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.doc_templates is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
comment on table public.certificates is 'Server-side only legacy table. RLS enabled; no anon/authenticated grants.';
