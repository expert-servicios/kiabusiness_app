# Auditoría de huecos de producción — 2026-09-05

## Alcance

Revisión de cierre del trabajo reciente en Admin/Cliente 360, Stripe, onboarding multi-entidad, Comunicaciones 360 y Documentación 360. Este documento distingue funcionalidades ya cerradas, huecos reales de producción, deuda técnica y PR antiguos que no deben fusionarse tal cual.

## Guardrails

- No corregir, fusionar ni borrar automáticamente registros financieros históricos.
- Si aparece un posible duplicado de Stripe, pedidos u Holded, detener la reconciliación y revisar manualmente.
- Cualquier DDL se aplica mediante migración Supabase y requiere preflight previo.
- Después de cambios de seguridad o DDL, volver a ejecutar Security Advisor.
- No inferir entidad para operaciones financieras: la entidad debe ser explícita y pertenecer al cliente.
- Documentos legacy continúan en solo lectura; no se migran ni eliminan automáticamente.

## Estado consolidado

### Cliente 360 / Stripe / comunicaciones

Los PR #95–#101 consolidaron facturación Stripe en contexto de entidad, snapshots de facturación, cola de checkout incompleto y operaciones de comunicación desde Cliente 360.

### Documentación 360 — IMP-028

Completado funcionalmente con PR #102–#108:

- adjuntos de correo visibles y persistidos;
- operaciones controladas sobre documentos canónicos;
- historial/auditoría;
- inventario normalizado de `documents`, `case_documents`, `files` y `user_files`;
- fuentes legacy en solo lectura;
- URLs temporales para documentos privados;
- búsqueda y filtros;
- señalización visual de posibles duplicados sin fusionar ni eliminar;
- vinculación explícita documento → requisito de `cases.docs_checklist`;
- cobertura y documentos pendientes por expediente;
- bloqueo de formatos históricos desconocidos de `received_documents_json`;
- optimistic locking y auditoría de enlace/desenlace.

**Estado: cerrado para el alcance de IMP-028.**

## Huecos de producción encontrados

### P0 — Checkout y facturación multi-entidad

**Problema:** el esquema de producción ya contiene `checkout_sessions.company_id`, `orders.company_id`, `subscriptions.company_id`, `profiles.active_company_id` y `profile_companies`, pero los endpoints actuales de checkout de servicios y suscripciones siguen tomando `billing_ready` y datos fiscales principalmente del perfil. Esto puede mezclar la empresa y la actividad individual de un mismo usuario.

**Impacto:** crítico para clientes que contratan varios planes/servicios para entidades distintas. El caso empresa + autónomo debe generar sesiones, suscripciones, pedidos y posteriores facturas con `company_id` explícito de extremo a extremo.

**Plan de cierre:**

1. Construir un resolver único de billing-readiness por entidad activa.
2. Validar que `active_company_id` pertenece al usuario mediante `profile_companies` antes de iniciar checkout.
3. Persistir `company_id` en `checkout_sessions` y metadata Stripe.
4. Propagar `company_id` en webhook a `orders` / `subscriptions` sin backfill histórico automático.
5. Asegurar que portal de cliente y gestión de suscripción usan la misma entidad.
6. Añadir regresiones para usuario con dos entidades y dos suscripciones independientes.
7. Revisar manualmente cualquier checkout abierto ambiguo antes de alterar datos.

**PR antiguo #72:** no fusionar tal cual. Está muy por detrás de `main` y mezcla decenas de cambios ya absorbidos. Debe sustituirse por un PR focalizado desde `main` actual.

### P0/P1 — Seguridad Supabase

Security Advisor actual mantiene avisos que deben resolverse de forma focalizada:

- funciones con `search_path` mutable, entre ellas `app.assign_master_admin`, `public.increment_helpful_count`, `public.is_admin_email`, `public.is_admin_user`;
- funciones `SECURITY DEFINER` ejecutables por `anon` o `authenticated` que requieren revisar grants/intención (`increment_helpful_count`, `is_admin_email`, `is_admin_user`, `auth_tenant_id`, `is_tenant_admin`);
- expiración OTP superior a la recomendada;
- protección de contraseñas filtradas desactivada;
- versión PostgreSQL con parches de seguridad disponibles.

Las tablas con RLS habilitado y sin policies se revisarán caso por caso: algunas son intencionadamente service-role-only y no deben recibir policies genéricas solo para silenciar el Advisor.

**PR antiguo #62:** no fusionar tal cual. Su corrección de funciones debe revalidarse contra el Advisor actual y reconstruirse sobre `main` actual.

### P1 — Copy comercial Plan Avanzado

La página pública todavía presenta la RENTA anual como incluida en el plan para autónomos. El criterio comercial vigente es que la RENTA anual es un servicio adicional.

**Acción:** corregir el copy en un PR mínimo desde `main` actual y retirar el PR #74 antiguo como superseded.

### P1 — Servicios de constitución / NIF

El PR #42 implementa un checkout antiguo para CIRCE/NIF y está muy desfasado respecto al sistema actual. No debe fusionarse antes de cerrar el scope de entidad del checkout.

**Acción:** reconstruir estos productos/servicios sobre el checkout multi-entidad consolidado y después cerrar #42 como superseded.

## PR antiguos abiertos

| PR | Estado de revisión | Decisión |
|---|---|---|
| #108 Checklist documental | Validado y previews Ready | Fusionado 2026-09-05 |
| #74 Copy Plan Avanzado | Cambio útil, rama obsoleta | Rehacer PR mínimo desde main |
| #72 Checkout por entidad | Necesidad real, rama muy obsoleta | Reimplementar focalizado desde main |
| #62 Security mutable search_path | Necesidad parcial, findings cambiaron | Reimplementar tras preflight actual |
| #42 CIRCE/NIF checkout | Funcionalidad útil, arquitectura antigua | Reimplementar después de P0 multi-entidad |

## Siguiente orden de ejecución

1. Corregir y fusionar copy Plan Avanzado.
2. Cerrar PR antiguos que hayan sido sustituidos por un sucesor explícito.
3. Cerrar P0 checkout multi-entidad sobre `main` actual.
4. Revisar el checkout abierto existente antes de cualquier reconciliación histórica.
5. Endurecimiento de funciones/grants Supabase con migración focalizada y Advisor posterior.
6. Reimplementar checkout CIRCE/NIF sobre el flujo de entidad definitivo.
7. Continuar roadmap: Operations 360 / inbox operativo, búsqueda global, leads comerciales, Telegram, calidad de datos, calendario fiscal, roles/assigned_to y read model escalable.

## Criterios de producción

Un bloque se considera cerrado cuando:

- typecheck, lint y tests están verdes;
- previews de Vercel están Ready cuando aplica;
- no quedan mutaciones históricas implícitas;
- toda operación financiera multi-entidad lleva `company_id` explícito y validado;
- cualquier DDL ha pasado preflight, migración controlada y Security Advisor posterior;
- el PR está fusionado en `main` y el despliegue principal no presenta error.
