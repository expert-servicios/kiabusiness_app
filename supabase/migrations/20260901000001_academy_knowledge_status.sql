-- Admin-managed override for the editorial status of an Academy knowledge
-- article. The article's *baseline* status still lives in its Markdown
-- frontmatter (content/academy/gestion-laboral/knowledge/*.md) — that
-- requires a PR like the rest of the versioned content. This table lets an
-- admin promote/demote an article's *displayed* status (e.g. review ->
-- validated once the operational validation checklist is done) without a
-- code deploy. A row here, when present, overrides the frontmatter value;
-- absence means "use the frontmatter status as-is".
create table if not exists public.academy_knowledge_status (
  slug         text primary key,
  status       text not null check (status in ('draft', 'review', 'validated', 'pending_update', 'outdated')),
  admin_note   text,
  validated_by uuid references auth.users(id) on delete set null,
  updated_at   timestamptz not null default now()
);

alter table public.academy_knowledge_status enable row level security;

-- Read/write only via the admin-checked API routes, which use the
-- service-role client — RLS here is defense-in-depth, not the active gate
-- (same pattern as academy_enrollments' client-facing route).
create policy "admin all academy_knowledge_status"
  on public.academy_knowledge_status
  for all
  using (public.is_admin())
  with check (public.is_admin());
