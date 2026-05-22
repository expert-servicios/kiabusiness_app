# QA Kia Lead/Client + Thread Replies

## Caso 1 - Lead Nuevo

Número desconocido escribe "Hola".

- Kia resuelve `contactStatus = lead`.
- Muestra viabilidad / contratar / llamada.
- No muestra estado de expediente.

## Caso 2 - Cliente Existente

Número vinculado a `profiles.role = client` escribe "Hola".

- Kia resuelve `contactStatus = client`.
- Muestra estado de expediente / enviar documentos / hablar equipo / nuevo servicio.
- No pide nombre/email si ya existen.

## Caso 3 - Cliente con Varios Expedientes

Cliente envía documento.

- El webhook guarda el media.
- Kia pregunta a qué expediente corresponde.
- No asocia automáticamente si hay más de un expediente abierto.

## Caso 4 - Lead Envía Documento

Lead envía imagen/PDF.

- Se guarda el media.
- Kia pide identificación o trámite.
- No lo asocia a un expediente inexistente.

## Caso 5 - Admin Responde Mensaje Seleccionado

Admin selecciona un mensaje inbound y responde.

- Aparece barra "Respondiendo a...".
- El payload incluye `replyToMessageId`.
- DB guarda `reply_to_message_id`.
- UI muestra cita sobre el mensaje enviado.

## Caso 6 - IA Responde Mensaje Seleccionado

Admin selecciona un mensaje y pulsa IA.

- `/api/admin/whatsapp/ai-compose` recibe `replyTo`.
- La IA redacta respuesta centrada en ese mensaje.
- No contesta solo de forma genérica al historial.

## Caso 7 - Seguridad

Se envía `replyToMessageId` de otro teléfono.

- `/api/admin/whatsapp` devuelve 400.
- No se envía WhatsApp.
- No se guarda conversación outbound.

## Caso 8 - Compatibilidad

Enviar sin `replyTo`.

- Texto normal funciona.
- Media normal funciona.
- Catálogo y plantillas siguen funcionando.
