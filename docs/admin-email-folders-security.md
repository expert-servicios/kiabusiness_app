# Correo 360 — comprobaciones de seguridad

- DDL aplicado exclusivamente mediante Supabase migration tooling.
- No se han modificado ni eliminado filas de `email_events`, `email_inbox_cache` o `email_threads`.
- RLS habilitado en las dos tablas nuevas.
- Políticas restringidas a perfiles activos con rol `admin` u `owner`.
- Carpetas del sistema no son editables ni eliminables desde las políticas/API.
- Security Advisor ejecutado después de la migración: no aparecieron avisos específicos para `admin_email_folders` ni `admin_email_item_state`.
- Los avisos existentes del proyecto se tratan como deuda previa y no se modifican dentro de esta fase para evitar cambios de seguridad no relacionados.
