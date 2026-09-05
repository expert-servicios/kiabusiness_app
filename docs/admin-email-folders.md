# Correo 360 — carpetas y trazabilidad

## Objetivo

Unificar la organización del correo del Panel Admin sin duplicar ni reescribir los mensajes originales.

Fuentes canónicas existentes:
- `email_events`: envíos EXPERT/Resend.
- `email_inbox_cache`: cache de bandeja de entrada por proveedor.
- `email_threads`: vínculo de conversación con expediente.

Capa de organización añadida:
- `admin_email_folders`: carpetas del sistema y personalizadas.
- `admin_email_item_state`: asignación de un hilo/evento a carpeta y, cuando exista, cliente/empresa/expediente.

## Reglas de integridad

1. `Entrantes` y `Enviados` son carpetas del sistema y no se pueden renombrar ni eliminar.
2. Las carpetas personalizadas se pueden crear, renombrar y eliminar.
3. Eliminar una carpeta personalizada nunca elimina el correo original; `folder_id` queda a `NULL` por FK `ON DELETE SET NULL`.
4. Un mismo elemento fuente solo puede tener un estado de organización por `(source_kind, provider, source_key)`.
5. No se corrige, fusiona ni elimina historial de `email_events`.
6. El acceso queda restringido a roles Admin/Owner activos.

## Estado de implementación

- Esquema + RLS: aplicado.
- CRUD de carpetas: implementado.
- Movimiento idempotente de elementos: API implementada.
- Panel de carpetas en `/admin/correo`: implementado.
- Integración del selector “Mover a…” dentro de cada hilo: siguiente paso de UI.
- Sincronización consistente Gmail/Outlook → `email_inbox_cache`: debe cerrarse antes de considerar Entrantes una fuente 360 completa.
