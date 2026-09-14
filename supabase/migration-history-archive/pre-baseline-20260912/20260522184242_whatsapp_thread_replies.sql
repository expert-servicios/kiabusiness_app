-- WhatsApp Inbox: internal threaded replies.
-- Stores an immutable quote snapshot so the CRM can render context even if the
-- original message is later edited, deleted, or hidden by retention rules.

alter table public.whatsapp_conversations
  add column if not exists reply_to_message_id uuid references public.whatsapp_conversations(id) on delete set null,
  add column if not exists reply_to_whatsapp_message_id text,
  add column if not exists quoted_body_snapshot text,
  add column if not exists quoted_direction text check (quoted_direction is null or quoted_direction in ('inbound', 'outbound')),
  add column if not exists quoted_created_at timestamptz;

create index if not exists whatsapp_conversations_reply_to_idx
  on public.whatsapp_conversations(reply_to_message_id);
