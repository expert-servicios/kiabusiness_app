# Kia Lead/Client + Thread Replies

Actualizacion 2026-05-23: la capa `lib/ai/kia` aporta decision estructurada y logs auditables para respuestas no deterministas. No cambia la resolucion lead/client ni convierte `needs_review` en salida comercial normal.

## Arquitectura

Kia decide el flujo al inicio de cada interacción con `resolveKiaContactContext(admin, phone)` en `lib/integrations/kia-contact-resolver.ts`.

- `lead`: número sin profile cliente vinculado, o contacto que solo existe como lead.
- `client`: profile/portal vinculado, rol cliente, expedientes o historial administrativo.

El webhook pasa ese contexto a `processKiaStep` y al fallback IA. El motor no crea un bot paralelo: sigue usando `kia_sessions`, `whatsapp_conversations`, `cases` y `leads`.

## Estados

Lead Flow recomendado:

- `lead_start`
- `lead_identify`
- `lead_service_selection`
- `lead_viability`
- `lead_call_preventa`
- `lead_auth_required`
- `lead_profile_required`
- `lead_ready_to_contract`
- `lead_human_review`

Client Flow recomendado:

- `client_start`
- `client_case_select`
- `client_case_status`
- `client_send_docs`
- `client_profile_update`
- `client_invoice_payment`
- `client_new_service`
- `client_human_support`

## Decisión de Status

1. Se normaliza el teléfono a dígitos.
2. Se busca `profiles.phone` o `profiles.whatsapp_number` por coincidencia de últimos 9 dígitos.
3. Si hay profile cliente o expedientes, el contexto es `client`.
4. Si no hay profile, se busca `leads.phone`.
5. Si no hay lead, se devuelve un contexto mínimo `lead`.

El contexto incluye `openCases`, `pendingFiscalObligations`, flags de perfil/facturación cuando existen, `lastLeadStatus` y `lastSelectedService`.

## Reply To

WhatsApp Inbox permite seleccionar un mensaje y responderlo. El POST de `/api/admin/whatsapp` valida que `replyToMessageId` pertenece al mismo `phone_number` normalizado antes de enviar.

Se guardan estas columnas en `whatsapp_conversations`:

- `reply_to_message_id`
- `reply_to_whatsapp_message_id`
- `quoted_body_snapshot`
- `quoted_direction`
- `quoted_created_at`

El panel renderiza el snapshot, sin resolver recursivamente mensajes antiguos.

## Limitación WABA

La integración conserva una cita visual compatible anteponiendo un texto corto al cuerpo o caption cuando la API usada no ofrece quote nativo. El snapshot visible se limita a 120 caracteres y se omite si rompería el límite de texto/caption.

## Fase 2

Para clientes que pidan nuevos servicios, no se crean leads duplicados. Si se necesita pipeline comercial separado, añadir `commercial_opportunities` o registrar eventos comerciales vinculados a `client_id`.
