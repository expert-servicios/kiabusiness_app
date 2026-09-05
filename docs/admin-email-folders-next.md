# Correo 360 — siguiente cierre

1. Añadir selector `Mover a...` en el encabezado del hilo abierto.
2. Enviar `source_kind=inbox_thread`, proveedor y `conversationId` a `/api/admin/correo/folders`.
3. Refrescar recuentos sin recargar la página.
4. Para enviados, usar `source_kind=sent_event` y `email_events.id`.
5. Mantener `email_threads.case_id` como vínculo operativo con expediente y reflejarlo también en `admin_email_item_state.case_id` cuando se mueva desde contexto de expediente.
6. Completar cache de Gmail OAuth / Gmail SA / Microsoft 365 para que Cliente 360 y Correo compartan la misma fuente entrante.
