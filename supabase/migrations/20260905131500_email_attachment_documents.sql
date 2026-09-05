create table if not exists public.email_attachment_documents (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('gmail', 'ms365')),
  account_email text not null,
  message_id text not null,
  attachment_id text not null,
  document_id uuid not null references public.documents(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  original_name text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  unique (provider, account_email, message_id, attachment_id)
);

create index if not exists email_attachment_documents_document_idx
  on public.email_attachment_documents(document_id);
create index if not exists email_attachment_documents_client_idx
  on public.email_attachment_documents(client_id, created_at desc);
create index if not exists email_attachment_documents_case_idx
  on public.email_attachment_documents(case_id, created_at desc);

alter table public.email_attachment_documents enable row level security;

create policy "admin all email attachment documents"
  on public.email_attachment_documents
  for all
  using (public.is_admin())
  with check (public.is_admin());
