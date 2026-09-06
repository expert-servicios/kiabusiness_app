# EXPERT Admin — auditoría de huecos de producción

Fecha: 2026-09-06

## Estado verificado

- PR #113 desplegado correctamente en ambos proyectos Vercel.
- Contratación de servicios y suscripciones ya usa la entidad fiscal seleccionada y valida `profile_companies` + readiness fiscal de `companies`.
- El modelo de producción ya contiene `company_id` en `checkout_sessions`, `orders` y `subscriptions`, con los triggers forward-only de herencia de entidad activos.
- El hardening de `search_path` aplicado el 2026-09-05 eliminó los cuatro warnings `function_search_path_mutable` objetivo.
- No se han reescrito ni reconciliado históricos financieros.

## Huecos de producción priorizados

### P0 — Calidad de datos en flujos nuevos

Mantener alertas visibles para cualquier `checkout_session`, `subscription` u `order` creado después de activar el alcance multi-entidad que aparezca sin `company_id`.

Regla: solo alertar y revisar manualmente. Nunca rellenar, fusionar o reasignar automáticamente históricos financieros.

### P1 — Bandeja operativa Admin

Implementar una cola central de revisión con enlaces directos a la superficie donde resolver cada incidencia:

- checkout `open` con más de 24 h;
- suscripción `past_due`, `unpaid`, `incomplete` o `incomplete_expired`;
- tarea abierta vencida;
- documento `pendiente`;
- expediente vencido o sin `next_action`;
- integración con `last_error`;
- pedido con `holded_sync_error`;
- cliente con onboarding incompleto;
- anomalías nuevas sin `company_id`.

La primera versión es deliberadamente de solo lectura. No expira Stripe Checkout Sessions, no corrige estados, no reintenta Holded y no reasigna entidades.

### P1 — Documentación 360

El inventario normalizado, señales visuales de duplicado, historial y vínculo a checklist ya están implementados. Pendiente siguiente: búsqueda/filtro más rico y semántica consistente de recibido / generado / entregable.

### P1 — Comunicaciones 360

La ficha ya incorpora comunicaciones y operaciones de correo/adjuntos. Pendiente siguiente: cierre de cobertura de hilos reales, búsqueda por entidad/canal y revisión del vínculo manual cuando no exista resolución automática.

### P1 — Seguridad restante

Los warnings de `SECURITY DEFINER` ejecutable por `anon`/`authenticated`, configuración Auth y versión de Postgres deben revisarse por separado. No revocar permisos automáticamente porque algunas funciones participan en políticas RLS.

### P2 — Búsqueda global

Existe `GlobalSearch`, pero todavía cubre principalmente cliente, expediente, cita, presupuesto y documento. Falta ampliar a NIF/CIF, razón social, Stripe IDs, Holded IDs y referencias de facturación.

## Preflight de la bandeja operativa — 2026-09-06

Lectura de producción antes de implementar:

- checkout abierto >24 h: 1;
- suscripciones problemáticas: 0;
- tareas vencidas: 0;
- documentos pendientes: 7;
- expedientes vencidos: 0;
- expedientes sin siguiente acción: 0;
- integraciones con error: 0;
- pedidos con error Holded: 0;
- perfiles cliente incompletos: 0;
- `active_company_id` inválido: 0;
- hilos email no leídos: 0.

Estos conteos son una fotografía operativa, no datos a corregir automáticamente.

## Orden de ejecución actualizado

1. Bandeja operativa Admin de solo lectura.
2. Calidad de datos: alertas explícitas para nuevos registros sin entidad y posibles relaciones inconsistentes.
3. Completar búsqueda global por identificadores financieros/fiscales.
4. Cerrar pendientes de Comunicaciones 360 y Documentación 360.
5. Revisar warnings de seguridad restantes con preflight específico por función/policy.
