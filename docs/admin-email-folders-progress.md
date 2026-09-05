# Correo 360 rollout

## Fase funcional cerrada
- migración segura de carpetas y estado de organización ya existente;
- RLS para Admin/Owner activos;
- carpetas protegidas Entrantes/Enviados;
- CRUD de carpetas personalizadas;
- API idempotente para mover elementos;
- recuento de Entrantes/Enviados desde fuentes reales;
- panel visual de carpetas en `/admin/correo`;
- selector visual `Mover a...` dentro del hilo seleccionado;
- restauración a Entrantes/Enviados eliminando solo el estado de organización, sin borrar el correo fuente;
- los hilos movidos a carpetas personalizadas dejan de reaparecer en Entrantes después de refrescar;
- sincronización uniforme de lecturas Gmail OAuth, Gmail Service Account y Microsoft 365 hacia `email_inbox_cache`;
- apertura del contenido completo desde carpetas personalizadas cuando el proveedor permite recuperar el hilo;
- conservación de contexto `client_id`, `company_id` y `case_id` al organizar correos;
- acceso directo desde un correo organizado a Cliente 360 cuando existe `client_id`;
- validación servidor de coherencia expediente/cliente/entidad antes de guardar contexto;
- envío de nuevos correos Microsoft 365 corregido: `Nuevo correo` llama a Microsoft Graph `/sendMail` y solo confirma éxito tras la llamada real;
- actualización inmediata de contadores de carpetas después de un movimiento;
- pruebas de regresión ampliadas.

## Seguridad y datos
Este cierre es exclusivamente de aplicación. No requiere DDL nuevo ni migración de datos históricos. No modifica ni elimina filas de `email_events` o `email_inbox_cache`; la restauración desde una carpeta personalizada elimina únicamente su fila organizativa en `admin_email_item_state`.

## Gate de entrega
La rama debe superar TypeScript, ESLint y Vitest y ambos previews Vercel antes de fusionarse en `main`.
