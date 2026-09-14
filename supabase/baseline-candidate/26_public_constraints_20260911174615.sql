-- Candidate current-schema baseline delta for issue #143.
-- Exact constraint names/definitions introduced by production migration
-- 20260911174615_client_accounting_records.

alter table public.client_accounting_records add constraint client_accounting_records_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.client_accounting_records add constraint client_accounting_records_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES client_integrations(id) ON DELETE CASCADE;
alter table public.client_accounting_records add constraint client_accounting_records_integration_id_record_type_extern_key UNIQUE (integration_id, record_type, external_id);
alter table public.client_accounting_records add constraint client_accounting_records_pkey PRIMARY KEY (id);
alter table public.client_accounting_records add constraint client_accounting_records_record_type_check CHECK (record_type = ANY (ARRAY['sales_invoice'::text, 'purchase_invoice'::text, 'tax'::text, 'bank_movement'::text]));
