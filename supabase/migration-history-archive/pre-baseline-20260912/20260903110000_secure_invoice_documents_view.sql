alter view public.v_invoice_documents
set (security_invoker = true);

revoke all privileges on table public.v_invoice_documents from public;
revoke all privileges on table public.v_invoice_documents from anon;
revoke all privileges on table public.v_invoice_documents from authenticated;

grant select on table public.v_invoice_documents to authenticated;
grant select on table public.v_invoice_documents to service_role;
