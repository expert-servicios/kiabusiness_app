revoke all privileges on table public.v_invoice_documents from authenticated;

grant select on table public.v_invoice_documents to service_role;
