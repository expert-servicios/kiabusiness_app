alter table public.email_attachment_documents
  add column if not exists conversation_id text,
  add column if not exists subject text,
  add column if not exists from_email text,
  add column if not exists message_date timestamptz;

create index if not exists email_attachment_documents_conversation_idx
  on public.email_attachment_documents(provider, account_email, conversation_id)
  where conversation_id is not null;
