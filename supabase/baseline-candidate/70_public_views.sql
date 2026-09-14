-- Candidate current-schema baseline for issue #143.
-- Public views at snapshot gate 20260911174615.
-- Both production views use security_invoker=true.

create view public.v_invoice_documents
with (security_invoker=true)
as
select d.id,
       d.company_id,
       d.owner_id as invoice_id,
       d.owner_type,
       d.kind,
       d.mime_type,
       d.title,
       d.doc_type,
       d.created_at
from public.documents d
where d.owner_type = 'invoice'::text;

create view public.v_servicios_con_pagos
with (security_invoker=true)
as
select s.id as servicio_id,
       s.email,
       s.servicio,
       s.activo,
       s.fecha_inicio,
       s.factura_url,
       p.status as pago_status,
       p.amount as pago_amount,
       p.currency as pago_currency,
       p.created_at as pago_created_at
from public.servicios_cliente s
left join lateral (
  select p_1.id,
         p_1.user_id,
         p_1.customer_email,
         p_1.payment_intent_id,
         p_1.amount,
         p_1.currency,
         p_1.status,
         p_1.metadata,
         p_1.created_at,
         p_1.stripe_session_id
  from public.pagos_expert p_1
  where p_1.customer_email = s.email
  order by p_1.created_at desc
  limit 1
) p on true;
