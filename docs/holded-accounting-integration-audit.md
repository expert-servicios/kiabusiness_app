# EXPERT — Auditoría de Integración Holded (Contabilidad)

**Fecha:** 2026-05-23  
**Autor:** Arquitecto FS / Tech Lead EXPERT  
**Versión:** 1.0 — documento vivo

---

## 0. Contexto del encargo

Este documento precede cualquier implementación. Su función es establecer la fotografía real del estado actual, las decisiones ya cerradas, los riesgos concretos y el plan de fases. Ningún código se escribe antes de que este documento esté aprobado.

---

## 1. Qué existe actualmente

### 1.1 Integración Holded (`lib/integrations/holded.ts`)

Integración única, basada en **una API key global** (`HOLDED_API_KEY` como variable de entorno de servidor). No hay soporte multi-tenant ni multi-cliente.

**Bases URL activas en el código:**

| Base URL | API | Uso actual |
|---|---|---|
| `https://api.holded.com/api/invoicing/v1` | Invoicing v1 | Contactos, documentos (invoice, estimate), pagos |
| `https://api.holded.com/api/crm/v1` | CRM v1 | Funnels, leads, etapas |
| `https://api.holded.com/api/projects/v1` | Projects v1 | Proyectos, tareas |

**Funciones exportadas activas:**

| Función | Uso actual | Disparada por |
|---|---|---|
| `syncOrderToHolded` | Crea contacto + invoice en Holded | Stripe webhook `checkout.session.completed` |
| `syncSubscriptionToHolded` | Crea contacto + invoice mensual | Stripe webhook `customer.subscription.created` |
| `syncLeadToHolded` | Crea contacto en Holded | Admin manual desde `/admin/saas-leads` |
| `syncProjectToHolded` | Crea proyecto en Holded Projects | Admin manual desde expediente |
| `syncQuoteToHolded` | Alias de `syncOrderToHolded` | Admin desde presupuesto |
| `listDocuments` | Lista facturas/presupuestos | Admin `/api/admin/integrations/holded/status` |
| `listFunnels` | Lista funnels CRM | Admin status check |
| `listProjects` | Lista proyectos | Admin status check |
| `listTasks` | Lista tareas | Admin status check |
| `findContactByEmail` | Busca contacto por email | Interno (upsertContact) |
| `createContact` | Crea contacto | Interno |
| `upsertContact` | Find-or-create | Todas las funciones sync |
| `createInvoice` | Crea factura | syncOrder, syncSubscription |
| `getHoldedRuntimeConfig` | Lee feature flags | Admin status |

**Feature flags activos:**

```env
HOLDED_SYNC_ENABLED=true/false
HOLDED_SYNC_DRY_RUN=false
HOLDED_SYNC_QUOTES=true
HOLDED_CREATE_INVOICES_FROM_STRIPE=false   ← por defecto desactivado
HOLDED_CRM_FUNNEL_ID=
HOLDED_CRM_DEFAULT_STAGE_ID=
HOLDED_PROJECT_DEFAULT_LIST_ID=
HOLDED_DEFAULT_QUOTE_DOC_TYPE=estimate
HOLDED_DEFAULT_TAX_ID=
HOLDED_DEFAULT_NUM_SERIE_ID=
HOLDED_DEFAULT_SALES_CHANNEL_ID=
HOLDED_DEFAULT_BANK_ID=
```

### 1.2 Base de datos — Tablas existentes relevantes

| Tabla | Estado | Descripción |
|---|---|---|
| `profiles` | ✅ Activa | Usuario EXPERT. Tiene `profile_completed`, `billing_ready`, `client_type`, `tax_id`, `billing_country`, `stripe_customer_id`, `active_company_id` |
| `companies` | ✅ Activa | Entidades fiscales (SL, SA, autónomo…). `cif_nif`, `forma_juridica`, `stripe_customer_id` |
| `profile_companies` | ✅ Activa | Many-to-many profiles ↔ companies. Rol: `owner`, `member` |
| `leads` | ✅ Activa | Leads captados desde web/formulario |
| `cases` | ✅ Activa | Expedientes. Tiene `company_id` nullable |
| `quotes` | ✅ Activa | Presupuestos. Tiene `docs_checklist` |
| `orders` | ✅ Activa | Pedidos/pagos. Tiene `holded_invoice_id`, `holded_sync_event_id`, `holded_sync_error`, `holded_synced_at`, `company_id` |
| `subscriptions` | ✅ Activa | Suscripciones Stripe. Tiene `company_id`, `metadata` (donde se guarda `holded.*`) |
| `documents` | ✅ Activa | Documentos subidos al expediente |
| `external_mappings` | ✅ Activa | Mappings idempotentes provider ↔ entidad local ↔ entidad externa |
| `integration_sync_events` | ✅ Activa | Audit log de cada operación de sync |
| `holded_demos` | ✅ Activa | Solicitudes de demo Holded desde funnel EXPERT |
| `saas_leads` | ✅ Activa | Leads SaaS/Holded (puede sincronizarse a Holded CRM manualmente) |
| `service_readiness_assessments` | ✅ Activa | Resultados de readiness checks por servicio |
| `company_data_suggestions` | ✅ Activa | Sugerencias de enriquecimiento de datos de empresa (BORME/VIES/OC) |

**Tablas NO existentes todavía (necesarias para el nuevo modelo):**

| Tabla | Estado | Necesaria para |
|---|---|---|
| `client_integrations` | ❌ No existe | Conexión Holded por cliente/empresa |
| `accounting_period_snapshots` | ❌ No existe | Resumen trimestral contable |
| `accounting_anomalies` | ❌ No existe | Detección de anomalías |
| `transaction_matches` | ❌ No existe | Conciliación Stripe / GoCardless / Holded |
| `holded_sync_jobs` | ❌ No existe | Cola de jobs de sincronización |

### 1.3 Endpoints actuales

**Admin — Holded:**

| Endpoint | Método | Función |
|---|---|---|
| `/api/admin/integrations/holded/status` | GET | Read-only probe: funnels, leads, proyectos, tareas, impuestos, presupuestos, facturas |
| `/api/admin/integration-sync-events` | GET | Lista eventos de sync (con filtros por provider) |
| `/api/admin/integrations/holded/sync-lead` | POST | Sync manual lead → Holded CRM |
| `/api/admin/integrations/holded/sync-project` | POST | Sync manual caso → Holded Projects |
| `/api/admin/integrations/holded/sync-quote` | POST | Sync manual presupuesto → Holded estimate |

**Stripe webhook (llama a Holded):**

| Evento | Acción en Holded |
|---|---|
| `checkout.session.completed` (payment) | `syncOrderToHolded` → contacto + invoice |
| `checkout.session.completed` (subscription) | Solo upsert suscripción en EXPERT; sync posterior via `customer.subscription.created` |
| `customer.subscription.created` | `syncSubscriptionToHolded` → contacto + invoice mensual |

**Cliente:**

| Endpoint | Método | Función |
|---|---|---|
| `/api/subscriptions/checkout` | POST | Validación `profile_completed` + `billing_ready` → Stripe Checkout |

### 1.4 Panel Admin — secciones relevantes

- `/admin/integraciones` — muestra estado Holded (checks read-only), Gmail, Google Calendar, y log de `integration_sync_events`
- `/admin/saas-leads` — sync manual de saas_leads a Holded CRM
- `/admin/expedientes/[id]` — sync manual de caso a Holded Projects
- `/admin/presupuestos/[id]` — sync manual de presupuesto a Holded estimate

### 1.5 Readiness checks existentes

Definidos en `lib/data/service-readiness-checks.ts`. Checks activos:

| Slug | Servicio | ¿Tiene pregunta de Holded? |
|---|---|---|
| `holded-pack-starter` | Pack Holded | Sí (¿tienes cuenta?) |
| `holded-migracion-sin-inventario` | Migración | Sí |
| `holded-migracion-con-inventario` | Migración inventario | Sí |
| `holded-modulo-formacion` | Formación | Sí |
| `plan-avanzado` | Plan mensual gest. | No (falta) |
| `plan-colaborativo` | Plan mensual gest. | Superficial (no bloquea) |
| `plan-presupuesto-personalizado` | Plan personalizado | No |

**Brechas detectadas:** Los planes mensuales (`plan-avanzado`, `plan-colaborativo`) no validan Holded como requisito bloqueante en el readiness actual. La pregunta `necesita_holded` del Plan Colaborativo acepta "No, usamos otro sistema" como `continue_checkout` — esto contradice la arquitectura nueva.

### 1.6 Documento anterior de referencia

`docs/holded-sync-action-plan.md` (2026-05-09) — describe un modelo orientado a usar Holded CRM y Holded Projects como pipeline operativo de EXPERT. **Este documento queda SUPERSEDIDO** por la arquitectura aquí definida.

---

## 2. Qué se mantiene

| Elemento | Justificación |
|---|---|
| `lib/integrations/holded.ts` — funciones de invoicing/contactos | Se mantiene como capa base. Se refactoriza para soporte multi-integración pero la lógica HTTP se reutiliza |
| `integration_sync_events` | Es la tabla de auditoría. Se amplía (company_id, client_id, integration_id) pero no se rompe |
| `external_mappings` | Mappings idempotentes. Se amplía con `company_id` explícito si aún no lo tiene |
| `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` | Valor por defecto correcto. Se mantiene |
| `syncOrderToHolded` / `syncSubscriptionToHolded` | Se mantienen como path legacy de la cuenta EXPERT global. Se coexiste con el nuevo modelo multi-integración |
| `orders.holded_invoice_id`, `orders.holded_sync_event_id` | Se mantienen. Son trazabilidad de la cuenta EXPERT global |
| `/admin/integraciones` | Se amplía — no se reescribe desde cero |
| `service_readiness_assessments` | Se mantiene. Se amplían las preguntas de los planes mensuales |
| Readiness checks de servicios Holded | Se mantienen. Son checks de onboarding de producto, no de contabilidad |
| `holded_demos` | Se mantiene. Es el funnel de captación para nuevos usuarios Holded |

---

## 3. Qué se desactiva o queda legacy

| Elemento | Acción | Razón |
|---|---|---|
| `syncProjectToHolded` | **Legacy** — añadir comentario, desactivar en flujos nuevos | Holded Projects no es fuente operativa de expedientes EXPERT |
| `syncLeadToHolded` | **Legacy** — mantener para saas_leads (flujo B2B específico), NO activar para leads normales | Holded CRM no es el CRM operativo de EXPERT |
| `listFunnels`, `listProjects`, `listTasks` | **Legacy / admin-only** | Solo para diagnóstico. No activos en flujos de cliente ni en workflows automáticos |
| `HOLDED_CRM_FUNNEL_ID`, `HOLDED_CRM_DEFAULT_STAGE_ID`, `HOLDED_PROJECT_DEFAULT_LIST_ID` | **Legacy** | No se usan en flujos nuevos. Se mantienen para la cuenta EXPERT global si el admin decide sincronizar manualmente |
| `docs/holded-sync-action-plan.md` | **Supersedido** — marcar como legacy en el documento | La nueva arquitectura lo reemplaza completamente |
| Flujos de sync automático de leads/proyectos a Holded desde webhooks | **No activar en nuevos flows** | Holded CRM/Projects no son fuente de verdad operativa |
| Feature flags nuevos necesarios: | | |
| `HOLDED_SYNC_CRM_ENABLED=false` | Nueva variable | Bloquea creación de leads en Holded CRM desde flujos automáticos |
| `HOLDED_SYNC_PROJECTS_ENABLED=false` | Nueva variable | Bloquea creación de proyectos en Holded desde flujos automáticos |
| `HOLDED_SYNC_ACCOUNTING_ENABLED=true` | Nueva variable | Habilita sync contable (facturas, impuestos, bancos) desde cuenta cliente |
| `HOLDED_SYNC_FINANCE_ENABLED=true` | Nueva variable | Habilita sync financiero (bancos, conciliación) |

---

## 4. Qué se debe migrar o crear

### 4.1 Modelo de integración multi-cliente

**Crear tabla `client_integrations`** (ver spec Fase 2). Almacena la conexión Holded de cada empresa/cliente con:
- API key cifrada (nunca en texto plano)
- `api_key_last4` para mostrar en UI
- `permissions_detected` jsonb — lo que la API key puede hacer
- `status`: pending / active / failed / revoked / disabled
- `sync_mode`: read_only / read_write
- Soporte para `mode`: expert_account (cuenta EXPERT global) | client_account (cuenta del cliente)

La cuenta EXPERT global (`HOLDED_API_KEY`) se puede modelar como un registro `mode=expert_account` sin `client_id` específico, para unificar el modelo.

### 4.2 Cifrado de secretos

**Crear `lib/security/encryption.ts`** con `encryptSecret` / `decryptSecret` usando `SECRET_ENCRYPTION_KEY`. No loguear, no devolver al frontend, no meter en query params.

### 4.3 Pantalla cliente "Conectar Holded"

**Crear `app/(protected)/dashboard/integraciones/holded/page.tsx`** y componentes asociados. Es la única pantalla donde el cliente introduce su API key. El flujo es:
1. Cliente introduce API key
2. EXPERT prueba conexión (`POST /api/integrations/holded/test`)
3. Se detectan permisos
4. Cliente confirma y guarda (`POST /api/integrations/holded/connect`)
5. API key se cifra y guarda en `client_integrations`
6. API key nunca vuelve al frontend

### 4.4 Readiness para planes mensuales

Actualizar `plan-avanzado` y `plan-colaborativo` en `lib/data/service-readiness-checks.ts` para:
- Preguntar si tiene o puede obtener Holded
- Preguntar si puede obtener API key
- Bloquear `continue_checkout` si no tiene/puede Holded

Actualizar `app/api/subscriptions/checkout/route.ts` para:
- Validar existencia de `client_integrations` activa con provider=holded
- Devolver `409 holded_connection_required` si falta

### 4.5 Sync contable read-first

**Crear jobs de lectura** para: facturas emitidas, facturas recibidas, impuestos, bancos, movimientos. Solo lectura en primera fase. Registrar en `integration_sync_events`.

### 4.6 Snapshots y resumen 303

**Crear `accounting_period_snapshots`** como tabla de snapshots trimestrales calculados desde datos de Holded sincronizados. Alimenta el dashboard cliente.

**Crear `lib/accounting/model-303-summary.ts`** para generar resumen estimado de IVA por trimestre. Siempre etiquetado "estimado — pendiente de revisión profesional".

### 4.7 Dashboard cliente "Estado de empresa"

Crear o actualizar `app/(protected)/dashboard/resumen-empresa/page.tsx` con selector de empresa, selector de trimestre, y todos los KPIs contables. Empty state si no hay Holded conectado.

---

## 5. Riesgos de duplicidad

### 5.1 Facturas duplicadas Stripe ↔ Holded

**Riesgo crítico — ya mitigado parcialmente.**

- Holded tiene integración nativa con Stripe. Si está activa, Holded ya recibe los pagos de Stripe y puede crear facturas automáticamente.
- Si EXPERT también llama a `createInvoice` via API, se duplica la factura.
- `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` protege por defecto, pero solo en la cuenta EXPERT global.
- **Para cuentas de cliente**: cuando el cliente conecte su Holded, hay que detectar si tiene integración Stripe activa antes de crear facturas via API.
- **Mitigación**: el flag `createInvoicesFromStripe` se aplica también en el nuevo modelo. En modo `read_only` nunca se crean facturas. En modo `read_write`, se verifica mapping idempotente antes de crear.

### 5.2 Contactos duplicados

**Riesgo medio.**

- La búsqueda actual de contactos es por email (`findContactByEmail`).
- Si el cliente cambia email o tiene múltiples emails, puede crearse un segundo contacto.
- **Mitigación**: usar `external_mappings` para guardar `profiles.id` → `holded_contact_id` y comprobar el mapping antes de buscar por email.

### 5.3 Facturas duplicadas suscripciones

**Riesgo alto — actualmente sin mitigación completa.**

- `customer.subscription.created` llama a `syncSubscriptionToHolded` que crea una factura mensual en Holded.
- Si Holded ya recibió esa factura via Stripe native, hay duplicado.
- **Mitigación inmediata**: el flag `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` desactiva la creación. Pero `syncSubscriptionToHolded` sigue creando contacto e intentando crear factura. Hay que asegurarse de que el flag se respeta también dentro de `syncSubscriptionToHolded`.

### 5.4 Proyectos duplicados en Holded

**Riesgo medio — solo vía sync manual.**

- Si el admin usa "Sincronizar a Holded Projects" varias veces para el mismo expediente sin mapping guardado, puede crear proyectos duplicados.
- **Mitigación**: `external_mappings` con unique constraint `(provider, local_entity, local_id, external_entity)` evita duplicados si se consulta antes de crear. La función `syncProjectToHolded` actualmente NO consulta mappings antes de crear.
- **Acción**: añadir consulta previa de mapping en `syncProjectToHolded` si se mantiene activa.

### 5.5 Movimientos bancarios duplicados

**Riesgo futuro (GoCardless + Holded).**

- Si GoCardless y Holded muestran el mismo movimiento bancario, sin tabla `transaction_matches`, aparecerá duplicado en el resumen.
- **Mitigación**: tabla `transaction_matches` con matching por importe + fecha + referencia + contraparte.

---

## 6. Riesgos de seguridad

### 6.1 API key en variable de entorno global (cuenta EXPERT)

**Riesgo bajo — ya correctamente gestionado.**

- `HOLDED_API_KEY` solo se usa en servidor (`lib/integrations/holded.ts`).
- No hay ningún `NEXT_PUBLIC_HOLDED_*`.
- Nunca se devuelve al cliente.
- **Acción**: mantener. Documentar en `.env.example`.

### 6.2 API key de clientes — riesgo de exposición

**Riesgo alto — nuevo modelo, requiere implementación.**

- Las API keys de clientes son secretos. Si se guardan en texto plano en Supabase, cualquier fuga de BD compromete todas las integraciones.
- **Mitigación obligatoria**: cifrado AES-256 con `SECRET_ENCRYPTION_KEY` antes de insertar en `client_integrations.encrypted_api_key`. Solo descifrar en servidor, nunca en cliente.
- El frontend solo ve `api_key_last4` (los últimos 4 caracteres de la key sin cifrar).
- Nunca devolver `encrypted_api_key` en respuestas de API al frontend.
- Nunca loguear la API key ni almacenarla en `integration_sync_events.request_payload`.

### 6.3 API key por WhatsApp/email/chat

**Riesgo de ingeniería social — mitigación UX y de Kia.**

- Kia debe instruir explícitamente al cliente a NO enviar la API key por WhatsApp.
- El flujo de Kia solo dirige al Panel Cliente para introducir la key.
- La UI del Panel Cliente debe mostrar texto claro: "Introduce la API key solo aquí. No la envíes por WhatsApp, correo ni chat."

### 6.4 Permisos Holded desconocidos

**Riesgo medio.**

- Si el cliente conecta una API key con permisos de escritura, EXPERT podría modificar datos contables involuntariamente.
- **Mitigación**: detectar permisos en el test de conexión. En primera fase, operar siempre en `sync_mode=read_only`. Solo pasar a `read_write` cuando el admin lo apruebe explícitamente y el cliente lo autorice.

### 6.5 Inyección en sync events / logs

**Riesgo bajo — precaución activa.**

- `request_payload` y `response_payload` en `integration_sync_events` no deben contener API keys, tokens ni credenciales.
- Asegurarse de que los helpers de logging filtren campos sensibles antes de insertar.

### 6.6 Acceso admin a datos contables de clientes

**Riesgo de privacidad.**

- Los datos contables del cliente (facturas, bancos, importes) son sensibles.
- RLS debe restringir que un cliente vea datos de otro cliente.
- El admin puede ver todo, pero debe quedar auditado en `audit_logs`.

---

## 7. Mapa de entidades EXPERT ↔ Holded

### 7.1 Modelo actual (cuenta EXPERT global)

| Entidad EXPERT | Entidad Holded | Dirección | Tabla de mapping |
|---|---|---|---|
| `profiles` / `clients` | `holded_contact` | → | `external_mappings` |
| `quotes` | `holded_estimate` / `holded_proform` | → | `external_mappings` |
| `orders` | `holded_invoice` | → | `orders.holded_invoice_id` + `external_mappings` |
| `subscriptions` (Stripe) | `holded_invoice` (mensual) | → | `subscriptions.metadata.holded.*` |
| `cases` | `holded_project` | → (legacy, no activo) | `external_mappings` |
| `saas_leads` / `leads` | `holded_lead` (CRM) | → (legacy, no activo) | `external_mappings` |

### 7.2 Modelo nuevo (cuenta cliente por empresa)

| Entidad Holded (cliente) | Entidad EXPERT | Dirección | Tabla de mapping |
|---|---|---|---|
| `holded_invoice` (emitida) | Sincronizada a snapshot | ← (lectura) | `accounting_period_snapshots` |
| `holded_invoice` (recibida/compras) | Sincronizada a snapshot | ← (lectura) | `accounting_period_snapshots` |
| `holded_tax` | Normalizado a resumen 303 | ← (lectura) | `accounting_period_snapshots` |
| `holded_bank_account` | Vista en dashboard | ← (lectura) | — |
| `holded_bank_movement` | Conciliación con Stripe/GoCardless | ← (lectura) | `transaction_matches` |
| `holded_inbox_document` | Clasificado y vinculado a caso | ← (lectura) + → (escritura condicional) | `external_mappings` |
| `holded_contact` | `companies` / `profiles` | ← (lectura para enriquecer) | `external_mappings` |

### 7.3 Fuentes de verdad consolidadas

| Dato | Fuente de verdad | Sistema receptor |
|---|---|---|
| Identidad cliente | EXPERT `profiles` | Holded (contacto) |
| Expediente | EXPERT `cases` | Holded (legacy project — no activo) |
| Factura emitida EXPERT→cliente | Holded (via Stripe native o API) | EXPERT (importa mapping) |
| Factura proveedor/compra | Holded | EXPERT (lectura para resumen) |
| IVA repercutido / soportado | Holded | EXPERT (lectura para resumen 303) |
| Movimientos bancarios | GoCardless / Holded banco | EXPERT (lectura para conciliación) |
| Cobros | Stripe | Holded (via native) + EXPERT |
| Suscripción activa | Stripe | EXPERT `subscriptions` |
| Estado expediente | EXPERT `cases.state` | — (no Holded) |
| Comunicaciones | EXPERT (WABA, Gmail) | — (no Holded) |

---

## 8. Endpoints actuales usados (inventario completo)

### Holded API — endpoints llamados actualmente

| Método | Path | Función |
|---|---|---|
| GET | `/invoicing/v1/contacts?email=...` | Buscar contacto por email |
| POST | `/invoicing/v1/contacts` | Crear contacto |
| GET | `/invoicing/v1/documents/invoice` | Listar facturas (status check) |
| GET | `/invoicing/v1/documents/estimate` | Listar presupuestos (status check) |
| POST | `/invoicing/v1/documents/invoice` | Crear factura |
| GET | `/crm/v1/funnels` | Listar funnels (status check) |
| GET | `/projects/v1/projects` | Listar proyectos (status check) |
| GET | `/projects/v1/tasks` | Listar tareas (status check) |
| POST | `/projects/v1/projects` | Crear proyecto (syncProjectToHolded — legacy) |

### Endpoints internos EXPERT que tocan Holded

| Endpoint EXPERT | Método | Holded al que llama |
|---|---|---|
| `/api/stripe/webhook` | POST | syncOrderToHolded, syncSubscriptionToHolded |
| `/api/admin/integrations/holded/status` | GET | listDocuments, listFunnels, listProjects, listTasks, impuestos |
| `/api/admin/integrations/holded/sync-lead` | POST | syncLeadToHolded |
| `/api/admin/integrations/holded/sync-project` | POST | syncProjectToHolded |
| `/api/admin/integrations/holded/sync-quote` | POST | syncQuoteToHolded |

---

## 9. Endpoints nuevos necesarios

### 9.1 Integración cliente (nuevos)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/integrations/holded/test` | POST | Prueba API key sin guardar. Devuelve permisos detectados |
| `/api/integrations/holded/connect` | POST | Cifra y guarda API key en `client_integrations` |
| `/api/integrations/holded/disconnect` | POST | Revoca integración. Borra/caduca API key |
| `/api/integrations/holded/status` | GET | Estado de la integración del usuario autenticado |

### 9.2 Sync contable (nuevos)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/accounting/sync/sales-invoices` | POST | Leer facturas emitidas desde Holded cliente |
| `/api/accounting/sync/purchase-invoices` | POST | Leer facturas recibidas/compras |
| `/api/accounting/sync/taxes` | POST | Leer tipos de IVA y liquidaciones |
| `/api/accounting/sync/bank-accounts` | POST | Leer cuentas bancarias |
| `/api/accounting/sync/bank-movements` | POST | Leer movimientos bancarios |
| `/api/accounting/snapshot` | POST | Generar snapshot trimestral |
| `/api/accounting/model303` | GET | Obtener resumen estimado Modelo 303 |

### 9.3 Anomalías y conciliación (nuevos)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/accounting/anomalies` | GET | Listar anomalías de la empresa |
| `/api/accounting/anomalies/[id]` | PATCH | Marcar anomalía revisada/ignorada/fixed |
| `/api/accounting/transactions/match` | POST | Proponer match manual entre movimientos |

### 9.4 Admin cockpit contable (nuevos)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/admin/clients/[id]/accounting` | GET | Datos contables del cliente para admin |
| `/api/admin/accounting/sync-now` | POST | Forzar sync desde admin |
| `/api/admin/accounting/anomalies` | GET | Ver anomalías de todos los clientes |

### 9.5 Modificaciones a endpoints existentes

| Endpoint | Cambio necesario |
|---|---|
| `/api/subscriptions/checkout` | Añadir validación: `client_integrations` activa provider=holded (409 si falta) |
| `/api/admin/integrations/holded/status` | Ampliar para mostrar también integraciones de cliente |

---

## 10. Plan de fases

### Fase 1 — Marcar legacy, añadir feature flags, no romper nada (1-2 días)

**Objetivo:** queda claro en código qué no se activa en flujos nuevos.

- [ ] Añadir comentarios `// LEGACY — no activar en flujos nuevos` a `syncProjectToHolded`, `syncLeadToHolded`, `listFunnels`, `listProjects`, `listTasks`
- [ ] Añadir `HOLDED_SYNC_CRM_ENABLED`, `HOLDED_SYNC_PROJECTS_ENABLED`, `HOLDED_SYNC_ACCOUNTING_ENABLED`, `HOLDED_SYNC_FINANCE_ENABLED` a `.env.example` y a `getHoldedRuntimeConfig()`
- [ ] Asegurar que `syncSubscriptionToHolded` respeta `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` de forma explícita (actualmente crea factura siempre que la API está configurada)
- [ ] Añadir `external_mappings` check en `syncProjectToHolded` para evitar duplicado si se mantiene activa para uso manual
- [ ] Actualizar `docs/holded-sync-action-plan.md` con nota de supersedido
- [ ] Crear este documento (`docs/holded-accounting-integration-audit.md`) — completado ✅

**Criterios:** TypeScript pasa. Stripe webhook sigue funcionando. No hay regresión.

---

### Fase 2 — Tabla `client_integrations` + cifrado (2-3 días)

**Objetivo:** modelo multi-integración por cliente, con API keys cifradas.

- [ ] Migración SQL: `client_integrations`, `holded_sync_jobs`
- [ ] Ampliar `integration_sync_events` con `company_id`, `client_id`, `integration_id`
- [ ] Ampliar `external_mappings` con `company_id` (ya tiene `tenant_id` nullable — evaluar si reutilizar o añadir `company_id` explícito)
- [ ] Crear `lib/security/encryption.ts` — `encryptSecret` / `decryptSecret`
- [ ] Añadir `SECRET_ENCRYPTION_KEY` a `.env.example`
- [ ] Actualizar `lib/integrations/holded.ts` — función `createHoldedClient(integrationId)` que descifra key en servidor y construye headers

**Criterios:** Tests unitarios de cifrado. No se puede obtener API key en texto plano desde frontend. RLS correcta.

---

### Fase 3 — Pantalla "Conectar Holded" en Panel Cliente (3-4 días)

**Objetivo:** el cliente puede conectar su cuenta Holded de forma segura.

- [ ] `app/(protected)/dashboard/integraciones/holded/page.tsx`
- [ ] `components/integrations/HoldedConnectionCard.tsx`
- [ ] `components/integrations/HoldedApiKeyForm.tsx`
- [ ] `components/integrations/HoldedPermissionStatus.tsx`
- [ ] `components/integrations/HoldedConnectionGuide.tsx`
- [ ] `POST /api/integrations/holded/test` — prueba sin guardar
- [ ] `POST /api/integrations/holded/connect` — guarda cifrado
- [ ] `POST /api/integrations/holded/disconnect` — revoca
- [ ] `GET /api/integrations/holded/status` — estado para el cliente

**Criterios:** API key nunca aparece en respuestas. Solo `api_key_last4` visible. Texto claro sobre no enviar por WhatsApp.

---

### Fase 4 — Readiness planes mensuales + bloqueo checkout (2 días)

**Objetivo:** no se puede contratar plan mensual sin Holded.

- [ ] Actualizar `plan-avanzado` readiness check — añadir preguntas Holded obligatorias con blocking
- [ ] Actualizar `plan-colaborativo` readiness check — ídem
- [ ] Actualizar `app/api/subscriptions/checkout/route.ts` — validar `client_integrations` activa
- [ ] Actualizar Kia (`lib/integrations/kia-engine.ts`) — flujo de guía para obtener Holded y API key
- [ ] CTA desde readiness: "Prueba gratuita Holded 14 días" y "Ver tutorial API Holded"

**Criterios:** Un usuario sin integración Holded activa recibe 409 con `connectUrl`. El frontend redirige a `/dashboard/integraciones/holded`.

---

### Fase 5 — Sync contable read-first (4-5 días)

**Objetivo:** leer facturas, impuestos y bancos desde Holded del cliente.

- [ ] `lib/integrations/holded/holded-client.ts` — cliente centralizado
- [ ] `lib/integrations/holded/holded-auth.ts` — descifrado y headers
- [ ] `lib/integrations/holded/holded-errors.ts` — errores y rate limits
- [ ] `lib/integrations/holded/holded-mappers.ts` — normalización de tipos
- [ ] Endpoints sync: sales-invoices, purchase-invoices, taxes, bank-accounts, bank-movements
- [ ] Tabla `holded_sync_jobs` — cola y estado de jobs
- [ ] Registrar todo en `integration_sync_events`

**Criterios:** Solo lectura. No se modifica nada en Holded. Errores quedan trazados.

---

### Fase 6 — Snapshots trimestrales + Modelo 303 MVP (3-4 días)

**Objetivo:** resumen estimado de IVA por trimestre disponible en dashboard.

- [ ] Migración SQL: `accounting_period_snapshots`
- [ ] `lib/accounting/model-303-summary.ts` — función `generateModel303Summary`
- [ ] `POST /api/accounting/snapshot` — genera o actualiza snapshot del trimestre
- [ ] `GET /api/accounting/model303` — devuelve resumen
- [ ] Siempre etiquetado "estimado — pendiente de revisión profesional"

**Criterios:** Las cifras vienen de datos sincronizados trazables. Nunca se muestran datos inventados. Empty state si no hay sync.

---

### Fase 7 — Dashboard cliente "Estado de empresa" (3-4 días)

**Objetivo:** el cliente ve su resumen contable trimestral.

- [ ] `app/(protected)/dashboard/resumen-empresa/page.tsx`
- [ ] `components/dashboard/CompanyStatusSummary.tsx`
- [ ] `components/dashboard/TaxQuarterSummaryCard.tsx`
- [ ] `components/dashboard/AccountingCharts.tsx`
- [ ] `components/dashboard/KiaAccountingAlerts.tsx`
- [ ] `components/dashboard/BankReconciliationCard.tsx`
- [ ] `components/dashboard/PendingDocumentsCard.tsx`
- [ ] Empty state "Conecta Holded para generar tu resumen"

**Criterios:** Sin Holded → empty state. Con Holded sin sync → "Sincronizando…". Con sync → datos reales.

---

### Fase 8 — Admin cockpit contable (3-4 días)

**Objetivo:** el admin ve el estado contable de cada cliente.

- [ ] `app/(protected)/admin/clientes/[id]/contabilidad/page.tsx` o integrar en ficha cliente
- [ ] Acciones: sincronizar ahora, reintentar errores, marcar anomalía revisada
- [ ] Ver: logs, snapshots, anomalías, documentos pendientes, movimientos sin conciliar

**Criterios:** Admin puede actuar sin tocar la base de datos directamente.

---

### Fase 9 — Detección de anomalías (3-4 días)

**Objetivo:** Kia y el admin ven problemas contables antes de que el cliente los reporte.

- [ ] Migración SQL: `accounting_anomalies`
- [ ] `lib/accounting/anomaly-detector.ts`
- [ ] Detección: facturas duplicadas, cobros sin factura, docs pendientes, bancos sin conciliar, IVA raro, importes inusuales
- [ ] `GET /api/accounting/anomalies`, `PATCH /api/accounting/anomalies/[id]`
- [ ] Kia puede explicar anomalías pero no corrige sin validación

**Criterios:** Kia dice "he detectado X puntos que conviene revisar". No modifica nada.

---

### Fase 10 — Conciliación Stripe / GoCardless / Holded (3-4 días)

**Objetivo:** sin duplicados entre los tres sistemas.

- [ ] Migración SQL: `transaction_matches`
- [ ] `lib/accounting/transaction-matcher.ts`
- [ ] Matching por: importe + fecha + referencia + stripe_payment_intent_id
- [ ] Crear anomalía si hay conflicto o confianza baja

**Criterios:** Un cobro Stripe no aparece dos veces en el resumen. Un movimiento GoCardless y Holded del mismo importe y fecha se propone como match, no como duplicado.

---

### Fase 11 — Documentos WABA/Gmail → Holded Inbox (opcional, fase avanzada)

**Objetivo:** documentos recibidos de clientes pueden enviarse a Holded Inbox si el cliente lo autoriza.

- [ ] Solo si `sync_mode=read_write` y cliente ha autorizado
- [ ] Solo documentos clasificados y validados por admin
- [ ] Guardar mapping documento EXPERT ↔ Holded inbox document

**Criterios:** No envío automático sin clasificación y permiso.

---

## 11. Criterios de aceptación global

1. EXPERT sigue siendo fuente operativa de clientes, expedientes, comunicaciones y documentos.
2. Holded se limita a contabilidad, facturas, impuestos, bancos y datos fiscales.
3. Holded CRM y Projects no se usan para expedientes nuevos.
4. El cliente conecta Holded desde `/dashboard/integraciones/holded`.
5. La API key se guarda cifrada. Nunca aparece en frontend, logs ni eventos.
6. Plan mensual exige integración Holded activa. Checkout bloqueado si falta.
7. Se sincronizan (lectura) facturas emitidas, recibidas, impuestos y bancos.
8. Se genera snapshot trimestral.
9. Se genera resumen estimado Modelo 303 etiquetado como estimado.
10. Dashboard cliente muestra Estado de empresa.
11. Admin ve cockpit contable con logs, anomalías y acciones.
12. Kia detecta anomalías y guía — no modifica contabilidad sin validación.
13. Stripe y Holded no duplican facturas.
14. Stripe, GoCardless y Holded no duplican movimientos.
15. Todo queda auditado en `integration_sync_events`.
16. Documentación y QA creadas antes de producción.

---

## 12. Decisiones cerradas que no se vuelven a discutir

| Decisión | Estado |
|---|---|
| EXPERT manda en expedientes, clientes, comunicación | CERRADO |
| Holded manda en contabilidad, fiscalidad, finanzas | CERRADO |
| No usar Holded CRM como pipeline operativo EXPERT | CERRADO |
| No usar Holded Projects como gestor de expedientes | CERRADO |
| API key solo en pantalla segura del portal autenticado | CERRADO |
| API key cifrada en base de datos | CERRADO |
| Plan mensual requiere integración Holded activa | CERRADO |
| Primera fase solo lectura de Holded | CERRADO |
| Resumen 303 siempre etiquetado como estimado | CERRADO |
| Kia no modifica contabilidad sin validación | CERRADO |
| No crear facturas duplicadas con Stripe native | CERRADO |

---

*Fin del documento de auditoría. La implementación comienza por la Fase 1.*
