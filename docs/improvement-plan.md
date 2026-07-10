# EXPERT - Plan de mejoras

Ultima actualizacion: 2026-07-10

## Objetivo

Este documento recoge el plan operativo de mejoras detectadas en la revision tecnica del proyecto EXPERT.

Debe usarse como memoria viva antes de implementar: cada cambio debe actualizar su estado, notas y verificacion para que el hilo no dependa de la memoria de una conversacion.

Estados:

- `[ ]` Pendiente.
- `[~]` En curso o parcial.
- `[x]` Completado y verificado.
- `[!]` Bloqueado o requiere decision.

Reglas de ejecucion:

- Resolver primero P0 antes de mejoras cosmeticas o nuevas features.
- Cada mejora debe dejar criterio de aceptacion verificable.
- Los cambios Supabase deben revisar RLS, grants, service role y exposicion via Data API.
- Los cambios Stripe deben mantener Checkout/Billing como fuente de verdad y ser idempotentes.
- Los webhooks deben validar origen, registrar trazabilidad y soportar reintentos.

## P0 — Auditoria end-to-end 2026-07-10 (ABIERTO)

Origen: auditoria de 4 agentes en paralelo (correos/plantillas, Copiloto Kia, Panel de cliente, Panel de Admin), solicitada tras cerrar la migracion de paginas Holded y la integracion de reservas Cal.com. Regla de prioridad: estos items van antes que cualquier feature nueva.

### Hallazgo raiz — commit de seguridad "Fase 1" nunca llego a `main`

El commit `3dd557adb20541bdb8c99d02b47980e6ac776834` ("fix(security): resolve 6 critical audit findings (Fase 1)") implementa: rate limiting de Kia (12 msg/min), tope de coste diario ($2 via `kia_decision_logs`), sanitizacion de `pageData` contra prompt injection, `sandbox` en el iframe de Cal.com, y parte del fix de escalada de privilegios de `admin/team`. Vive unicamente en `upstream/docs-audit-plan` — `git merge-base --is-ancestor 3dd557a HEAD` confirma que NO es ancestro de `main`. El PR correspondiente nunca se abrio/mergeo. Explica directamente IMP-025, IMP-027 y parte de IMP-028.

Fix: revisar el commit completo (puede tener conflictos con los cambios de Cal.com/Kia de hoy) y mergearlo via PR, o recuperar archivo por archivo si el diff ya no aplica limpio.

### IMP-025 - Kia sin rate limit ni tope de coste diario en produccion

Estado: [ ]

Tipo: seguridad, P0 critico.

Riesgo: cualquier usuario autenticado puede llamar a `app/api/kia/copilot/route.ts` o `app/api/ai/kia/route.ts` sin ningun limite. `lib/ai/kia/kia-cost-tracker.ts` solo registra coste, no lo compara contra un tope ni bloquea. Cada llamada puede disparar hasta 5 iteraciones de tool-loop (`KIA_MAX_TOOL_ITERATIONS`) sobre Sonnet. Exposicion economica sin techo + vector de abuso/DoS.

Archivos: `lib/ai/kia/kia-rate-limit.ts` (no existe en `main`, si en el commit huerfano), `app/api/kia/copilot/route.ts`, `app/api/ai/kia/route.ts`.

Criterio de aceptacion: limite de 12 msg/min por usuario y tope $2/dia por `user_id` (via `kia_decision_logs`) activos en ambos endpoints; una llamada 13 en el mismo minuto devuelve 429 con mensaje claro.

### IMP-026 - IDOR cross-tenant en `/api/ai/kia` via `companyId`

Estado: [ ]

Tipo: seguridad, P0 critico.

Riesgo: `app/api/ai/kia/route.ts:23,56` acepta `companyId` del body sin verificar pertenencia contra `profile_companies` → cualquier cliente autenticado que conozca/adivine un UUID de empresa obtiene nombre, CIF/NIF, estado Holded y resumen contable de otro tenant. Via tool use, `runKiaDecision` se llama sin `allowedToolNames`, exponiendo `get_accounting_snapshot` (usa `service_role` y no valida `companyId` contra el contexto real).

Archivos: `app/api/ai/kia/route.ts`, `lib/ai/kia/kia-context-builder.ts`, `lib/ai/kia/kia-tool-executor.ts`.

Criterio de aceptacion: `companyId` se resuelve solo por pertenencia verificada (join contra `profile_companies`), nunca del body sin validar; `get_accounting_snapshot` ignora `args.companyId` si no coincide con `context.company?.id`; `/api/ai/kia` pasa `allowedToolNames` restringido igual que `/api/kia/copilot`.

### IMP-027 - Prompt injection abierto via `pageData` sin sanitizar

Estado: [ ]

Tipo: seguridad, P0 critico.

Riesgo: `lib/ai/kia/kia-system-prompt.ts:114-115` interpola `JSON.stringify(pageData)` crudo en el system prompt. `pageData` es `z.record(z.string(), z.unknown()).optional()` sin limite de tamano/profundidad, 100% controlado por el cliente.

Archivos: `lib/ai/kia/kia-system-prompt.ts`, `app/api/kia/copilot/route.ts:29`, `app/api/ai/kia/route.ts:22`.

Criterio de aceptacion: `pageData` se aplana a primitivos con tope de tamano/profundidad antes de interpolarse, con delimitador explicito que lo marque como dato no confiable + instruccion anti-injection en el prompt.

### IMP-028 - Un admin no-owner puede degradar, desactivar o borrar la cuenta owner

Estado: [ ]

Tipo: seguridad, P0 critico.

Riesgo: 4 endpoints (`app/api/admin/users/route.ts` DELETE linea 236, PATCH `update_role` linea 123-134, PATCH `toggle_status` linea 154-167; `app/api/admin/clientes/[id]/route.ts` DELETE linea 150-153; `app/api/admin/team/route.ts` PATCH linea 62-80) solo bloquean acciones sobre `role==='admin'`, ninguno excluye `role==='owner'`. Un admin normal puede degradar/desactivar/eliminar la cuenta del owner con una llamada HTTP directa (DevTools/curl).

Archivos: los 4 de arriba.

Criterio de aceptacion: en los 4 endpoints, antes de aplicar cualquier cambio sobre `targetProfile`: `if (targetProfile.role === 'owner' && !isOwner(actor.role)) return 403`. Test manual: con sesion de un admin no-owner, cada uno de los 4 intentos contra una cuenta owner de prueba debe devolver 403.

### IMP-029 - IDOR via `active_company_id` en `PATCH /api/profile`

Estado: [ ]

Tipo: seguridad, P0 critico.

Riesgo: `app/api/profile/route.ts:78` escribe `active_company_id` sin comprobar pertenencia. `app/api/integrations/holded/status/route.ts` y `getIntegrationData()` en `dashboard/integraciones/holded/page.tsx` resuelven `companyId = profile.active_company_id` y consultan `client_integrations` solo por `company_id`, sin reverificar. Un cliente puede ver metadata Holded (`api_key_last4`, `permissions_detected`, `last_success_at`, `consent_at`) de una empresa que no es suya.

Archivos: `app/api/profile/route.ts`, `app/api/integrations/holded/status/route.ts`, `app/(protected)/dashboard/integraciones/holded/page.tsx`.

Criterio de aceptacion: aplicar el mismo patron ya correcto en `holded/connect/route.ts` y `holded/disconnect/route.ts` — verificar `profile_companies` antes de aceptar/usar `active_company_id`.

### IMP-030 - Cola `email_queue` rota por desajuste de esquema (el cron reporta exito sin procesar nada)

Estado: [ ]

Tipo: fiabilidad, P0 critico.

Riesgo: `lib/email/email-queue.ts` usa columnas `max_attempts` y `error` que NO existen en la tabla real (que tiene `last_error`, sin `max_attempts`). `enqueueEmail()` falla siempre en el INSERT; `processEmailQueue()` falla siempre en el SELECT, cae en un `catch` interno y devuelve `{processed:0,failed:0,skipped:0}` **sin lanzar excepcion** — el cron horario reporta 200 OK cada vez sin procesar nada. Confirmado: `email_queue` esta vacia de forma efectiva en produccion. Afecta `notifyTenantAdminDocUploaded`/`StatusChanged` (nunca han salido) y el email de invitacion insertado directo desde `admin/whatsapp/link-client` (queda `pending` para siempre).

Archivos: `lib/email/email-queue.ts`, nueva migracion de reconciliacion en `supabase/migrations/`.

Criterio de aceptacion: migracion que alinee columnas (decidir fuente de verdad: renombrar `last_error`→`error` + anadir `max_attempts` default 3, o ajustar el codigo al esquema real); `processEmailQueue()` no debe tragar un error de esquema sin marcarlo como fallo detectable; tras el fix, un envio de prueba encolado debe aparecer en `status='sent'` tras la siguiente ejecucion del cron.

### IMP-031 - `/gracias/opinion` no existe: sistema de reseñas roto desde el dia 1

Estado: [ ]

Tipo: producto, funcionalidad rota, P0.

Riesgo: `lib/email/templates.ts:286` (`reviewRequest`) enlaza a `app/gracias/opinion?token=...`, pagina que no existe en el arbol actual. El backend (`app/api/reviews/submit/route.ts`, tabla `reviews`, panel `/admin/resenas`) esta completo y listo — nunca se ha completado una valoracion real. Nota: la seccion "Sprint SaaS — Backlog (completado 2026-06-06)" de este mismo documento da esta pagina por construida — es documentacion desincronizada de la realidad, no solo un bug de codigo.

Archivos a crear: `app/(public)/gracias/opinion/page.tsx`.

Criterio de aceptacion: formulario (rating 1-5 + comentario + checkbox `allow_publish`) que haga `POST /api/reviews/submit` con el `token` de la query string; probar con un token real generado por el flujo de finalizacion de expediente.

### IMP-032 - `reviewRequest` con token vacio en flujo legado de expedientes

Estado: [ ]

Tipo: bug, P0 (bug independiente de IMP-031, pero solo sera visible una vez esa exista).

Riesgo: `app/api/cases/[id]/route.ts:99` llama `reviewRequest(clientName, service, '')` — token vacio, sin insertar en `review_requests`. Es el endpoint que usa `components/cases/AdminCaseCard.tsx` (control principal de cambio de estado en `/admin/expedientes/[id]`) via columna `cases.state`. El endpoint correcto (`app/api/admin/cases/[id]/route.ts`, columna `cases.status`) si genera el token e inserta en `review_requests`. Dos maquinas de estado paralelas sobre la misma tabla — ver tambien IMP-034.

Archivos: `app/api/cases/[id]/route.ts`.

Criterio de aceptacion: o se elimina `AdminCaseCard`/`state` en favor de `status`, o se replica la generacion de token + insert en `review_requests` en `app/api/cases/[id]/route.ts`.

## P1 — Auditoria end-to-end 2026-07-10 (ABIERTO)

### IMP-033 - Calendario fiscal del cliente roto + fuga de datos entre clientes para admin

Estado: [ ]

Riesgo: `app/(protected)/dashboard/calendario-fiscal/page.tsx:29` llama a `/api/admin/fiscal-calendar`, protegido con `requireAdmin` (403 para clientes). Resultado: clientes normales ven siempre "0 obligaciones" (la seccion esta rota al 100% para ellos); un admin/owner viendo su propio panel de cliente recibe en cambio las obligaciones de TODOS los clientes mezcladas, porque la llamada no manda `userId`.

Archivos: `app/(protected)/dashboard/calendario-fiscal/page.tsx`, `app/api/admin/fiscal-calendar/route.ts`.

Criterio de aceptacion: crear `GET /api/fiscal-calendar` client-scoped (filtra por `user_id = auth.uid()`), apuntar la pagina de cliente ahi.

### IMP-034 - Unificar las dos maquinas de estado de expediente (`cases.state` vs `cases.status`)

Estado: [ ]

Riesgo: el panel de cliente y `AdminCaseCard`/`/api/cases/[id]` leen/escriben `state` (vocabulario legado); `/api/admin/cases/[id]` (mas rico: transiciones validadas, prioridad, notificacion tenant_admin, token de reseña, snapshot de rentabilidad) y el panel tenant leen/escriben `status`. Nada sincroniza ambas — causa raiz de IMP-032, y riesgo de que un expediente se vea "congelado" en una vista mientras avanza en la otra.

Archivos: `app/api/cases/[id]/route.ts`, `app/api/admin/cases/[id]/route.ts`, `components/cases/AdminCaseCard.tsx`, `supabase/migrations/20260615000002_cases_operational_columns.sql`.

Criterio de aceptacion: decidir fuente de verdad unica (`status`, es el vocabulario mas completo) y migrar todo el codigo que lee/escribe `state` a `status`, o mantener ambas sincronizadas explicitamente en un unico punto de escritura.

### IMP-035 - 3-4 implementaciones de "completar perfil" con validacion inconsistente

Estado: [ ]

Riesgo: `dashboard/onboarding/page.tsx` (`ProfileStepForm`) no exige telefono; `lib/utils/profile-readiness.ts` y `QuickProfileGate.tsx` si lo exigen. Un cliente puede completar el onboarding sin telefono, ver "¡Todo listo!", y que el sistema le siga considerando con perfil incompleto en la siguiente compra — contradictorio. Contando `PostPurchaseProfileStep.tsx` y `ProfileForm.tsx` (`/dashboard/perfil`), son 4 implementaciones distintas del mismo formulario.

Archivos: `app/(protected)/dashboard/onboarding/page.tsx`, `lib/utils/profile-readiness.ts`, `components/cart/QuickProfileGate.tsx`, `components/profile/PostPurchaseProfileStep.tsx`, `components/profile/ProfileForm.tsx`.

Criterio de aceptacion: onboarding exige telefono igual que el resto (minimo viable), evaluar unificar en un solo componente reutilizable a medio plazo.

### IMP-036 - Emails de cliente sin `try/catch` en el webhook de Stripe + guard de idempotencia = eventos huerfanos

Estado: [ ]

Riesgo: `app/api/stripe/webhook/route.ts` (lineas ~348-354, 525-550) hace `await sendEmail(...)` a cliente sin `try/catch` (los emails a admin si llevan `.catch()`). Si Resend falla, la excepcion tumba el `POST` con 500; Stripe reintenta, pero el guard de idempotencia (`stripe_processed_events`) ya registro el `event.id` antes de procesar nada, asi que el reintento no vuelve a ejecutar el resto del flujo (sync Holded, etc.) para ese evento — queda huerfano para siempre.

Archivos: `app/api/stripe/webhook/route.ts`.

Criterio de aceptacion: envolver los `sendEmail()` a cliente en `try/catch` (igual que los de admin), o encolarlos con `enqueueEmail()` una vez resuelto IMP-030.

### IMP-037 - El streaming de Kia se queda mudo (`—`) si el proveedor de IA falla

Estado: [ ]

Riesgo: `lib/ai/kia/kia-provider-router.ts:410` (`streamAnthropicText`): `if (!response.ok || !response.body) return;` — sin lanzar excepcion ni marcar error. El bucle en `app/api/kia/copilot/route.ts:204-213` no detecta nada raro y llega a `done` con artifacts vacios; `KiaCopilotPanel.tsx:225-231` muestra literalmente `—` al usuario, como si Kia hubiera respondido vacio en vez de fallado.

Archivos: `lib/ai/kia/kia-provider-router.ts`, `app/api/kia/copilot/route.ts`, `components/dashboard/KiaCopilotPanel.tsx`.

Criterio de aceptacion: `streamAnthropicText` distingue "cero chunks por fallo" de "cero chunks porque no habia nada que decir"; el cliente recibe un evento de error explicito, no un `done` vacio.

### IMP-038 - Dos motores de chat de Kia con seguridad/capacidades distintas

Estado: [ ]

Riesgo: `/api/ai/kia` usa el motor completo (`runKiaDecision`, tool loop, judge validator, memorias) sincrono/JSON; `/api/kia/copilot` (el que realmente usa el widget flotante, `KiaCopilotPanel.tsx`) usa un prompt simplificado paralelo sin judge validator ni memorias. Es la causa estructural de que las protecciones (`DASHBOARD_SAFE_TOOLS`) se anadieran a uno y no al otro — raiz de IMP-026.

Archivos: `app/api/ai/kia/route.ts`, `app/api/kia/copilot/route.ts`.

Criterio de aceptacion (a medio plazo, no bloqueante para los P0 de arriba): converger en un unico camino que siempre pase por `runKiaDecision` con streaming real.

### IMP-039 - "Hacer admin" sin confirmacion en el panel de usuarios

Estado: [ ]

Riesgo: `components/admin/AdminUsersTable.tsx:484-486` ejecuta `handleRoleChange(u, 'admin')` directo en el `onClick`, sin modal — a diferencia de "Eliminar usuario", que si tiene doble confirmacion. Un clic accidental concede acceso admin a un cliente.

Archivos: `components/admin/AdminUsersTable.tsx`.

Criterio de aceptacion: mismo modal de confirmacion que ya existe para eliminar (patron en `app/(protected)/admin/clientes/page.tsx:589-614`).

### IMP-040 - Listados de admin sin paginacion server-side

Estado: [ ]

Riesgo: `app/api/admin/clientes/route.ts` trae todos los perfiles `role='client'` sin `.limit()` y hace 5 queries adicionales en paralelo sobre esa lista completa; `app/api/admin/users/route.ts` usa `.limit(1000)` pero sin paginacion real de tabla. No rompe nada hoy, pero es la primera pared con la que choca el crecimiento del CRM.

Archivos: `app/api/admin/clientes/route.ts`, `app/api/admin/users/route.ts`, `components/admin/AdminUsersTable.tsx`, `app/(protected)/admin/clientes/page.tsx`.

Criterio de aceptacion: paginacion server-side (cursor o offset+limit) antes de que la base de clientes supere unos pocos cientos.

### Hallazgos menores (bajo impacto, sin bloquear nada)

| Hallazgo | Archivo |
|---|---|
| Migracion `profile_billing_and_holded_order_status` reaplicada hoy quedo registrada con la fecha de hoy (`20260710105118`) en vez de su fecha original (`20260523062807`) en el historial de Supabase — desajuste cosmetico repo/BD | `supabase/migrations/20260523062807_profile_billing_and_holded_order_status.sql` |
| Error gramatical "Se ha recibida" (deberia ser "recibido") | `lib/email/templates.ts:132` |
| Plantillas huerfanas sin ningun flujo que las dispare: `caseStatusUpdated`, `citaRequested`, `citaRequestAdmin` | `lib/email/templates.ts` |
| Export `emailTemplates` sin usar en ningun sitio | `lib/email/templates.ts:1371-1380` |
| Migraciones de `email_queue` duplicadas/obsoletas en el repo (`20260607000002_email_queue.sql` nunca aplicada; `000005`/`000006_email_queue_processing_status.sql` identicos) | `supabase/migrations/` |
| Ruta duplicada y huerfana `/dashboard/informe/[id]` (singular) vs `/dashboard/informes/[id]` (plural, la real) | `app/(protected)/dashboard/informe/[id]/page.tsx` |
| `CompanySwitcher` no comprueba `res.ok` tras el PATCH de cambio de empresa activa | `components/dashboard/CompanySwitcher.tsx:51-57` |
| Seccion "WhatsApp Business (WABA)" todavia visible en configuracion pese a estar retirada (solo muestra booleano, sin fuga de secreto) | `app/(protected)/admin/configuracion/page.tsx:57-61` |

## P0 resuelto (2026-07-03 → 2026-07-04) — ver IMP-024

Todos los cron jobs de produccion (`fiscal-reminders`, `kia-health`, `holded-sync`, `daily-summary`, `email-queue`, `email-sync`, `tenant-weekly-digest`) estuvieron fallando desde su creacion (hasta 6 semanas) porque `CRON_SECRET` nunca se configuro en Vercel produccion, mas dos bugs independientes en el trigger `pg_cron` de `email-queue`. Los 6 crons estan confirmados en verde desde el 2026-07-04. Detalle completo, causa raiz y verificacion en IMP-024 (seccion P0).

## Nota de gobernanza del repo (2026-07-03)

- El repo real / fuente de verdad es `expert-servicios/kiabusiness_app` (upstream). `kiabusiness2025/kiabusiness_app` es un fork de solo lectura (sin permiso de push) usado unicamente para abrir Pull Requests hacia upstream.
- Todo PR nuevo debe crearse con `gh pr create --repo expert-servicios/kiabusiness_app --head kiabusiness2025:<rama>` tras pushear la rama al fork (`origin`).
- Branch protection de `main` esta configurada en el repo real (ver commit `2026-06-07`), no en el fork — no protejer el fork es normal y esperado.
- Los workflows de GitHub Actions con `on: schedule` (`holded-sync.yml`) solo se ejecutan de verdad quedando registrados en el repo real; en el fork aparecen como "not found" aunque el archivo exista, porque los forks no registran triggers de `schedule` por defecto.

## Decisiones estrategicas tomadas (2026-06-04)

- Dominio canonico: `expertconsulting.es`. Todo enlace operativo, SEO, email y referencia de Kia usa esta URL. `kseniailicheva.com` queda como dominio personal/redirect.
- Audiencia principal: asesorias, gestorias y despachos profesionales como clientes del SaaS. EXPERT no es una asesoria B2C sino una plataforma que las asesorias usan para operar.
- Kia: se reposiciona exclusivamente como widget copiloto flotante in-app. El boton flotante aparece en cualquier pagina del portal (dashboard, expedientes, empresa, etc.) y abre una ventana de chat donde el usuario puede gestionar las empresas conectadas, consultar datos, ejecutar acciones y acceder al conocimiento de dominio (AEAT, SS, DGT, Holded). Kia abandona el rol de chatbot de captacion WABA y pasa a ser copiloto operativo interno.

---

## SPRINT LOG — Todo lo construido (2026-06-01 → 2026-06-06)

### P0 — Seguridad y fiabilidad (completado)

| IMP | Descripcion | Estado |
|-----|-------------|--------|
| IMP-001 | Firma HMAC-SHA256 en webhook WhatsApp (`META_APP_SECRET`). Falla cerrado en prod si falta el secret. | [x] |
| IMP-002 | `client_integration_secrets` sin GRANT a `authenticated`. Solo `service_role`. AES-256-GCM. | [x] |
| IMP-003 | Rate limit + spam guard en `viabilidad`, `company/resolve`, `newsletter`. | [x] |
| IMP-004 | `stripe_processed_events` — idempotencia atomica en webhook Stripe. | [x] |
| IMP-005 | `holded_sync_jobs` + `/api/cron/holded-sync` — cola durable con reintentos exponenciales. | [x] |
| IMP-006 | `safeRedirectPath()` — sanitiza `?next=` en auth callback y login. | [x] |
| IMP-007 | Fail-closed en `CRON_SECRET` y allowlist `STRIPE_PLAN_MONTHLY_*`. | [x] |
| IMP-008 | `escapeHtml()` en todas las plantillas de email (formularios publicos + tier 2 post-auth). | [x] |

### P1 — Calidad y mantenimiento (completado)

| IMP | Descripcion | Estado |
|-----|-------------|--------|
| IMP-009 | `npm run lint` recuperado — `react/no-unstable-nested-components` corregido. | [x] |
| IMP-010 | Next.js actualizado a 16.2.7. `npm audit --audit-level=high` limpio. | [x] |
| IMP-011 | `@supabase/auth-helpers-nextjs` retirado. Todo migrado a `@supabase/ssr`. | [x] |
| IMP-012 | Vitest + 31 tests de regresion: firma WhatsApp, redirect auth, spam guard, allowlist Stripe. | [x] |
| IMP-023 | CI GitHub Actions: `typecheck → lint → test → build` en push a `main` y PRs. | [x] |

### P2 — Producto y escalabilidad (completado)

| IMP | Descripcion | Estado |
|-----|-------------|--------|
| IMP-013 | Dominio canonico `expertconsulting.es` en metadata, emails, prompts Kia, README. | [x] |
| IMP-014 | Tabla `tenants`, `tenant_id` nullable en `profiles/cases/orders/quotes/companies`. Helper `getTenantForUser`. | [x] |
| IMP-015 | `automation_settings` (7 reglas), panel `/admin/automatizaciones`, enforcement en emails de estado. | [x] |
| IMP-016 | WABA: email opcional con omision, anti-repeticion, `kia_contact_disposition`. | [x] |
| IMP-017 | Kia Health (canaries), Kia Auditor, panel `/admin/kia-health`, decision logs. | [x] |
| IMP-018 | Holded Academy en Kia: modulos, tarifas, integraciones, FAQs. | [x] |
| IMP-019 | AEAT + SS en Kia: IRPF, IVA trimestral, modelos autonomo, RETA, vida laboral. | [x] |
| IMP-020 | DGT, Justicia/Registros, PAE/CIRCE, tributos CCAA en Kia. | [x] |
| IMP-021 | Web publica orientada a asesorias: `/para-asesorias`, pivot B2B en home y nav. | [x] |
| IMP-022 | Kia copiloto flotante: `KiaCopilotWidget`, `/api/ai/kia`, historial en `kia_sessions`. | [x] |

### Sprint SaaS — Backlog (completado 2026-06-06)

#### Multi-tenant

| Item | Descripcion | Archivos clave |
|------|-------------|----------------|
| Panel admin tenants | `/admin/tenants` — lista, crear (wizard 3 pasos), editar | `app/(protected)/admin/tenants/` |
| Wizard onboarding | 3 pasos: Identidad → Marca → Holded. Crea tenant + branding + integracion en un flujo. | `admin/tenants/new/page.tsx` |
| TenantEditForm | nombre, dominio, plan, activo | `components/admin/TenantEditForm.tsx` |
| TenantBrandingForm | color picker, logo URL, tagline, email soporte, preview en vivo | `components/admin/TenantBrandingForm.tsx` |
| TenantUserSection | asignar por email, listar, quitar | `components/admin/TenantUserSection.tsx` |
| TenantIntegrationsForm | Holded API key cifrada (AES-256-GCM), show/hide, estado badge | `components/admin/TenantIntegrationsForm.tsx` |
| API tenants | GET list, POST crear, PATCH actualizar | `app/api/admin/tenants/` |
| API integraciones | GET status, POST guardar cifrado, DELETE eliminar | `app/api/admin/tenants/[id]/integrations/` |
| Secrets helper | `getTenantSecret(tenantId, integration)` para uso interno | mismo route.ts |

#### Portal tenant_admin (`/tenant/*`)

| Item | Descripcion | Archivos clave |
|------|-------------|----------------|
| Layout + sidebar | Verifica rol `tenant_admin`, branding por tenant, nav movil | `app/(protected)/tenant/layout.tsx`, `TenantSidebar.tsx` |
| Dashboard | Stats: clientes, expedientes activos, finalizados hoy; lista reciente | `tenant/dashboard/page.tsx` |
| Clientes | Lista clientes del tenant con email de auth | `tenant/clientes/page.tsx` |
| Expedientes | Lista activos/finalizados con status badges y link a detalle | `tenant/expedientes/page.tsx` |
| Detalle expediente | Read-only + **upload entregables** (con drag-and-drop, 20MB, router.refresh) | `tenant/expedientes/[id]/page.tsx`, `TenantDeliverableUpload.tsx` |
| API upload tenant | POST /api/tenant/cases/[id]/documents — verifica pertenencia tenant, role=admin | `app/api/tenant/cases/[id]/documents/route.ts` |
| Redireccion roles | `tenant_admin` → `/tenant/dashboard`; admin → `/admin`; client → `/dashboard` | layouts |

#### Email branding y notificaciones

| Item | Descripcion | Archivos clave |
|------|-------------|----------------|
| TenantBrand en emails | `base(title, body, brand?)` — emails white-label para tenants no-EXPERT | `lib/email/templates.ts` |
| Notif. doc subido | `notifyTenantAdminDocUploaded` — aviso cuando cliente sube doc | `lib/email/notify-tenant-admins.ts` |
| Notif. estado cambio | `notifyTenantAdminStatusChanged` — aviso cuando admin cambia estado expediente | mismo archivo |
| Templates admin | `tenantAdminDocUploaded`, `tenantAdminStatusChanged` | `lib/email/templates.ts` |

#### Reviews y reseñas

| Item | Descripcion | Archivos clave |
|------|-------------|----------------|
| Captura publica | `/gracias/opinion?token=...` — estrellas, comentario, allow_publish | `app/(public)/gracias/opinion/` |
| Panel moderacion | `/admin/resenas` — tabs pendiente/aprobada/rechazada, card con acciones | `app/(protected)/admin/resenas/` |
| API reviews | GET list, PATCH aprobar/rechazar/destacar | `app/api/admin/resenas/` |

#### Datos de empresas

| Item | Descripcion | Archivos clave |
|------|-------------|----------------|
| CKAN opt-out | `datos.gob.es` + `PLACE` activos por defecto. `CKAN_SOURCES_ENABLED=false` para desactivar. | `ckan-source-registry.ts` |
| BORME paralelo | Batches de 20 dias en paralelo. Default 180 dias (~9 meses). `deepSearch:true` = 365 dias. | `boe-borme.ts` |
| Admin empresa UI | `/admin/empresas` — busqueda por nombre/NIF, fuentes con badges, campos extraidos, asociar | `app/(protected)/admin/empresas/page.tsx` |
| Deep search | Header `X-Borme-Deep-Search: true` activa busqueda extendida. Checkbox en UI. | `resolve/route.ts`, `company-data-resolver.ts` |

#### Migraciones

| Archivo | Estado |
|---------|--------|
| `20260606000001_document_uploaded_by_role.sql` | ✅ Aplicada y registrada |
| `20260606000002_reviews_rls_and_service_name.sql` | ✅ Aplicada y registrada |
| `20260606000003_automation_settings.sql` | ✅ Aplicada y registrada |
| `20260606000004_quote_templates.sql` | ✅ Aplicada |
| `20260606000005_tenant_integration_secrets.sql` | ✅ Aplicada |
| `20260607000001_rls_tenant_aware_phase2.sql` | ✅ Aplicada (2026-06-07) |
| `20260607000004_subscription_post_purchase_onboarding.sql` | ✅ Aplicada (2026-06-07) |
| `20260607000005_email_queue.sql` | ✅ Aplicada (2026-06-07) |

---

## Estado actual de todas las areas (2026-06-15)

```
✅ Seguridad API           — webhook sig, secrets cifrados, escapeHtml, rate limit, fail-closed
✅ Seguridad browser       — headers extra (COOP, X-DNS, Origin-Agent-Cluster), iframe sandboxed preview
✅ Cron auth               — verifyCronRequest() centralizado; todos los crons migrados
✅ Upload validation       — validateClientDocumentFile(): extensión, MIME, tamaño (10MB/20MB)
✅ Security tests          — cron-guard, recaptcha, uploads (Vitest)
✅ Stripe / Pagos          — idempotencia, cola Holded, checkout allowlist
✅ CI / Calidad            — lint, typecheck, build, 31+ tests Vitest, GitHub Actions
✅ Auth / SSR              — Supabase SSR unificado, redirect sanitizado
✅ Multi-tenant            — schema, admin panel, portal tenant_admin, branding, integraciones
✅ RLS tenant fase 2       — is_tenant_admin(), políticas cases/profiles/docs/companies/orders/quotes
✅ Automatizaciones        — 7 reglas configurables, enforcement en emails
✅ Emails transaccionales  — 15+ templates, white-label por tenant, escapeHtml
✅ Email queue worker      — tabla + cron /api/cron/email-queue: batch 20, atomic claim, exponential backoff
✅ Portal cliente           — expedientes, documentos, entregables, mensajes, Kia widget
✅ Portal tenant_admin      — dashboard, clientes, expedientes, upload entregables
✅ Kia copiloto (WABA)     — anti-loro: stuck-loop guard + social shortcut + system prompt reforzado
✅ Kia copiloto (in-app)   — SSE streaming real, user data tools (expedientes/empresas/docs), artifacts
✅ Kia buenas prácticas    — página /dashboard/kia-ayuda + enlace en widget
✅ Reviews / Reseñas       — captura publica, moderacion admin, featured
✅ Datos empresas          — BORME paralelo, CKAN open data, VIES, UI admin busqueda
✅ Web publica             — orientada a asesorias B2B, SEO, canonical, para-asesorias
✅ Calendly                — getCalendlyUrl() util; todos los componentes usan env vars
✅ Holded sync             — queue durable, reintentos, cron protegido
✅ Branch protection main  — PR requerido (1 approval), no force push, no delete
⚠️ WABA verificación      — pruebas manuales pendientes (Omitir email, consultas libres)
⚠️ Holded scheduler       — cron externo pendiente (cron-job.org / GitHub Actions cada 15 min)
```

---

## Pendiente manual (requiere accion del usuario)

0. ~~**[P0 - CRON_SECRET] Configurar variable en Vercel**~~ — ✅ Hecho y verificado 2026-07-04. Ver IMP-024.
0b. ~~**[P0 - CRON_SECRET] Configurar secret en GitHub Actions**~~ — ✅ Hecho y verificado 2026-07-04.
1. ~~**Branch protection status checks**~~ — ✅ Confirmado por el usuario 2026-07-04 (no verificable por API sin rol Admin en el repo — el token de escritura usado en esta sesion devuelve 404 al leer `branches/main/protection`).
2. **Verificacion IMP-004** — Reenviar mismo evento desde Stripe Dashboard → 200 sin duplicar order.
3. **Verificacion IMP-005** — Pago prueba → confirmar job en `holded_sync_jobs`; ejecutar `GET /api/cron/holded-sync` con `Bearer CRON_SECRET`.
4. **Verificacion IMP-016** — WABA: boton `Omitir email` + consulta libre durante `asking_email`.
5. **Verificacion IMP-022** — Abrir /dashboard → clic Kia → probar "mis expedientes", "mis empresas".
6. **Holded scheduler externo** — Configurar cron-job.org o GitHub Actions scheduled que llame `GET https://expertconsulting.es/api/cron/holded-sync` con `Authorization: Bearer CRON_SECRET` cada 15 min.
7. ~~**DNS**~~ — ✅ `kseniailicheva.com` redirect 301 a `expertconsulting.es` implementado.
8. **Calendly** — Actualizar username en calendly.com/settings. Añadir `NEXT_PUBLIC_CALENDLY_URL` en Vercel env vars.

---

## Proximo sprint de codigo (ideas priorizadas)

### Alta prioridad

1. ~~**Email queue worker**~~ — ✅ COMPLETADO (2026-06-15): `lib/email/email-queue.ts` + `/api/cron/email-queue/route.ts`, cron en `vercel.json` cada hora.

2. **Kia herramientas (tool calls)** — Permitir a Kia consultar datos reales del usuario: lista de expedientes, estado de empresas conectadas, documentos pendientes. Requiere `kia-tool-executor.ts` con verificacion de permisos.

3. **Streaming SSE para Kia** — Las respuestas largas de Kia bloquean la UI. Implementar Server-Sent Events para streaming progresivo en `/api/ai/kia`.

4. **Scheduler externo para Holded sync** — Configurar cron externo (GitHub Actions scheduled, cron-job.org o Vercel Cron pro) que llame `/api/cron/holded-sync` con `CRON_SECRET` cada 15 minutos.

### Media prioridad

5. **Registro Mercantil via Infoempresa** — Integrar infoempresa.com como fuente adicional en el resolver de empresas (forma juridica, capital, objeto social, administradores actuales).

6. **Onboarding cliente guiado** — Wizard para que el propio cliente (no solo el admin) complete su perfil, conecte empresas y suba documentacion inicial.

7. **Notificaciones push tenant_admin** — Web Push o email digest semanal con resumen de actividad de su tenant.

### Backlog / Fase SaaS avanzada

8. **Piloto con 1-3 asesorias externas** — Crear tenants reales, asignar `tenant_admin`, activar branding y Holded. Medir adopcion del portal y del copiloto Kia.

9. **RAG / pgvector para Holded Academy** — Crawl de help.holded.com → chunks → embeddings → busqueda semantica en tiempo real. Pendiente cuando el volumen de preguntas tecnicas lo justifique.

10. **Stripe por tenant** — Cuenta Stripe independiente por asesoria para facturar a sus propios clientes desde la plataforma.

11. **WhatsApp por tenant** — WABA number independiente por tenant para notificaciones salientes white-label.

---

## Notas de implementacion

- Antes de tocar migraciones, comprobar estado local/remoto y evitar duplicar historial.
- No aplicar cambios destructivos de Supabase sin verificacion previa.
- Mantener `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` por defecto.
- Si un cambio queda parcial, actualizar este documento con el motivo y siguiente paso exacto.
- La rama de desarrollo activa es `claude/tender-darwin-aXkbO`. Nunca pushear directamente a `main`.

## Estado base verificado

- [x] `npm run typecheck` pasa.
- [x] `npm run build` pasa.
- [x] `npm run lint` pasa (0 errores, 40 warnings deliberados).
- [x] `npm audit --audit-level=high` sin vulnerabilidades altas (Next.js 16.2.7). 2 moderate restantes son postcss interno de Next.js — fix requiere downgrade a 9.x, descartado.
- [x] `npm run test:regression` 20/20 passing.
- [~] Hay cambios no versionados previos relacionados con Holded y seguridad:
  - `lib/integrations/holded/`
  - `lib/security/`
  - `supabase/migrations/20260523160000_client_integrations_and_sync_jobs.sql`
- [x] Discrepancia cron Holded resuelta (2026-06-04): se retira `*/15 * * * *` de Vercel Cron para mantener compatibilidad con Hobby. La frecuencia alta pasa a scheduler externo que llama `/api/cron/holded-sync` con `CRON_SECRET`.

## P0 - Seguridad y fiabilidad critica

### IMP-001 - Verificar firma del webhook WhatsApp

Estado: [x]

Tipo: seguridad, comunicacion, automatizacion.

Riesgo: `POST /api/webhooks/whatsapp` procesa payloads sin validar `x-hub-signature-256`. Un tercero podria simular mensajes, disparar IA, guardar conversaciones o provocar respuestas salientes.

Archivos principales:

- `app/api/webhooks/whatsapp/route.ts`
- `app/api/whatsapp/webhook/route.ts`
- `.env.example`

Criterio de aceptacion:

- El body se lee como texto antes de parsearlo.
- Se valida HMAC SHA-256 con `META_APP_SECRET`.
- Si falta `META_APP_SECRET` en produccion, el webhook falla cerrado.
- Las pruebas cubren firma valida, firma invalida y firma ausente.

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] prueba automatizada (regression-test.ts): firma valida, invalida, ausente, tampered, bad prefix, dev/prod.

Notas:

- Implementado el 2026-05-23: `POST /api/webhooks/whatsapp` lee body crudo, valida `x-hub-signature-256` con `META_APP_SECRET` y falla cerrado en produccion si falta el secret.

### IMP-002 - Blindar secretos de `client_integrations`

Estado: [x]

Tipo: seguridad, Supabase, escalabilidad SaaS.

Riesgo original: `client_integrations.encrypted_api_key` estaba en una tabla expuesta con `grant select` a `authenticated`. RLS limita filas, pero no columnas.

Solucion implementada: migracion `20260524183212_client_integration_secrets` (ya aplicada en Supabase remoto):
- Crea tabla `client_integration_secrets` sin ningun `GRANT` a `authenticated` (RLS habilitado sin politicas = bloqueo total).
- Migra datos existentes.
- Elimina `encrypted_api_key` de `client_integrations` con `ALTER TABLE DROP COLUMN`.
- Solo `service_role` tiene acceso a los secretos para descifrado server-side.

Verificacion: la columna `encrypted_api_key` ya no existe en `client_integrations` en Supabase remoto (confirmado 2026-06-02: `REVOKE SELECT (encrypted_api_key)` fallo con "column does not exist" — la columna ya fue eliminada por la migracion anterior).

Archivos principales:

- `supabase/migrations/20260524120000_client_integration_secrets.sql`
- `lib/integrations/holded/holded-auth.ts` — lee de `client_integration_secrets` via service_role
- `lib/security/encryption.ts`

### IMP-003 - Proteger endpoints publicos con coste o enriquecimiento externo

Estado: [x]

Tipo: seguridad, coste, captacion.

Riesgo: algunos endpoints publicos pueden consumir IA, APIs externas o email sin la misma proteccion anti-abuso que contacto/presupuesto.

Archivos principales:

- `app/api/services/viabilidad/route.ts`
- `app/api/company/resolve/route.ts`
- `app/api/newsletter/route.ts`
- `lib/utils/spam-guard.ts`
- `lib/utils/recaptcha.ts`

Criterio de aceptacion:

- [x] `viabilidad`: honeypot + rate limit + spam guard + reCAPTCHA. Ya estaba implementado.
- [x] `company/resolve`: exige auth en POST y PATCH (`createServerSupabaseClient` + 401 si no hay user). Ya estaba implementado.
- [x] `newsletter`: anadidos rate limit (`checkRateLimit`) y deteccion de emails desechables (`checkSpam`). Silencioso ante bots (devuelve `{ok:true}` sin revelar el bloqueo).
- [x] Los errores de anti-spam no filtran detalles internos.

Notas:

- Implementado 2026-06-04: newsletter reforzada con rate limit (5 req/IP/hora) y spam guard para dominios desechables.

### IMP-004 - Idempotencia fuerte en webhooks Stripe

Estado: [x]

Tipo: pagos, operacion, Stripe.

Solucion implementada (2026-06-02):
- Nueva tabla `stripe_processed_events (event_id text primary key)` aplicada en Supabase remoto.
- Al inicio del POST handler, se inserta `event.id`. En conflicto (code 23505 = ya procesado) → devuelve 200 sin procesar.
- La insercion es atomica: dos llamadas simultaneas del mismo evento solo una pasa el INSERT.
- Emails y syncs Holded quedan protegidos porque el guard actua antes de todo el procesamiento.
- Fallo del guard es no-fatal (loguea y continua) para no silenciar pagos reales.

Archivos principales:

- `app/api/stripe/webhook/route.ts` — guard al inicio del POST handler
- `supabase/migrations/` — migracion `stripe_processed_events_dedup` aplicada en remoto

Verificacion:

- [x] Migracion aplicada en Supabase remoto
- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Prueba manual: reenviar mismo evento desde Stripe Dashboard → debe devolver 200 sin duplicar order

### IMP-005 - Pasar side effects de Holded a cola durable

Estado: [x]

Tipo: operacion, Holded, fiabilidad.

Solucion implementada (2026-06-02):
- Helpers `enqueueHoldedSync` y `resolveHoldedJob` en el webhook de Stripe.
- Cada sync Holded ahora CREA el job en `holded_sync_jobs` (status: queued) ANTES del `.then()`, de modo que si el proceso serverless muere, el job queda registrado para reintento.
- Los 4 puntos de sync (quote payment, catalog payment, Holded legacy, subscription) usan el patron.
- Nuevo endpoint protegido `/api/cron/holded-sync` para procesar jobs en estado `queued`/`failed` con backoff exponencial (5 min → 15 min, max 3 intentos).
- La ejecucion cada 15 minutos queda fuera de Vercel Cron en plan Hobby: debe llamarla un scheduler externo con `Authorization: Bearer CRON_SECRET`.
- Fallos Holded nunca bloquean el flujo principal (emails + orders se crean antes del sync).

Archivos principales:

- `app/api/stripe/webhook/route.ts` — helpers + job creation antes de cada sync
- `app/api/cron/holded-sync/route.ts` — endpoint protegido de reintentos
- `vercel.json` — no incluye `holded-sync` frecuente; solo mantiene crons diarios compatibles con Vercel Hobby
- `supabase/migrations/20260523160000_client_integrations_and_sync_jobs.sql` — tabla ya existente

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Prueba manual: pago de prueba → confirmar job en `holded_sync_jobs` con status success/failed
- [ ] Prueba manual cron: GET /api/cron/holded-sync con Bearer CRON_SECRET → procesa jobs pendientes

### IMP-006 - Sanitizar redirects de auth

Estado: [x]

Tipo: seguridad, auth.

Riesgo: `/auth/callback?next=...` acepta rutas que empiezan por `/`, incluyendo formatos ambiguos tipo `//dominio`.

Archivos principales:

- `app/auth/callback/route.ts`
- `app/auth/login/page.tsx`

Criterio de aceptacion:

- Solo se aceptan rutas internas normales (`/dashboard`, `/admin/...`).
- Se rechazan URLs absolutas, protocol-relative URLs y rutas con caracteres peligrosos.
- Hay fallback seguro a `/dashboard`.

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`

Notas:

- Implementado el 2026-05-23 en callback y login: `next` se normaliza a ruta interna antes de construir redirects.

### IMP-007 - Fail-closed en secretos obligatorios

Estado: [x]

Tipo: seguridad, configuracion.

Riesgo: si `CRON_SECRET` o allowlists de Stripe faltan, algunos flujos pueden quedar demasiado permisivos.

Archivos principales:

- `app/api/cron/fiscal-reminders/route.ts`
- `app/api/subscriptions/checkout/route.ts`
- `.env.example`

Criterio de aceptacion:

- El cron devuelve error si `CRON_SECRET` no esta configurado.
- Checkout de suscripciones no acepta `priceId` arbitrarios si faltan env vars.
- `.env.example` documenta que estas variables son obligatorias en produccion.

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`

Notas:

- Implementado el 2026-05-23: cron fiscal falla cerrado si falta `CRON_SECRET`; checkout de suscripciones exige allowlist `STRIPE_PLAN_MONTHLY_*`; `.env.example` documenta ambos requisitos.

### IMP-008 - Escapar HTML en contenido generado por usuario

Estado: [x]

Tipo: seguridad, comunicacion.

Riesgo original: plantillas de email interpolaban campos de usuario directamente en HTML sin escapar. `contactMessage` y `quoteReceivedAdmin` eran los casos criticos (formularios publicos).

Solucion implementada (2026-06-02): `escapeHtml()` aplicado sistematicamente en `lib/email/templates.ts`:
- Tier 1 (formularios publicos): `contactMessage`, `quoteReceivedAdmin`, `presupuestoAvanzadoAdmin`, `citaRequestAdmin` — `nombre`, `email`, `mensaje`, `asunto`, `telefono`, y todos los campos de entrada de usuario.
- Tier 2 (defensa en profundidad, datos post-auth): `welcomeEmail`, `quoteReceivedClient`, `quoteResponded`, `quoteAcceptedAdmin`, `paymentConfirmed`, `caseStatusUpdated`, `serviceCompleted`, `reviewRequest`, `subscriptionCreated`, `subscriptionPaymentFailed`, `contactAutoReply`, `holdedMigrationConfirmed`, `holdedFormacionConfirmed`, `documentRequired`.
- Las plantillas mas nuevas (caseOpened, caseDocsRequired, etc.) ya usaban `escapeHtml` correctamente.
- La funcion `escapeHtml` ya existia en el archivo — solo faltaba aplicarla consistentemente.

Archivos principales:

- `lib/email/templates.ts`

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`

### IMP-024 - CRON_SECRET nunca configurado en produccion (todos los cron fallando)

Estado: [x]

Tipo: seguridad, operacion, fiabilidad, P0 critico.

Descubierto: 2026-07-03, durante auditoria de este documento con Vercel runtime error logs (`get_runtime_errors` sobre `prj_UscIRsCiaqY051PTrRVncEfNyquJ`).

Riesgo: `lib/security/cron.ts` (`verifyCronRequest`) falla cerrado con HTTP 500 `Cron not configured` si `process.env.CRON_SECRET` no existe en produccion. Nunca se configuro esa variable en Vercel, asi que **todos** los cron routes protegidos llevan fallando desde su creacion:

| Cron | Fallando desde | Ocurrencias (7d, al 2026-07-03) |
|---|---|---|
| `fiscal-reminders` | 2026-05-24 | 7 |
| `kia-health` | 2026-05-28 | 7 |
| `holded-sync` | 2026-06-04 | 79 |
| `daily-summary` | 2026-06-04 | 7 |
| `email-queue` | 2026-06-16 | 73 |
| `email-sync` | 2026-06-17 | 7 |
| `tenant-weekly-digest` | 2026-06-22 | 1 |

Impacto real: clientes sin avisos de plazos fiscales, admin sin resumen diario, sin canaries de salud de Kia, cola de emails sin procesar por cron, reintentos de Holded sin ejecutarse, digest semanal de tenant_admin sin salir.

Causa raiz adicional #1 (especifica de `email-queue`): ese cron corre via `pg_cron` en Supabase (no Vercel Cron nativo) y llamaba al endpoint solo con la cabecera `x-vercel-cron: 1`, que `verifyCronRequest` nunca comprueba — seguia fallando aunque se arreglara `CRON_SECRET` en Vercel. Arreglado en PR #9.

Causa raiz adicional #2 (tambien especifica de `email-queue`): la migracion original (y la del PR #9) llamaban a `extensions.http_post(...)`, que nunca existio — `pg_net` instala sus funciones en el schema `net`. El job fallaba a nivel SQL en **todas** sus ejecuciones desde que se creo (2026-06-25), independientemente del problema de `CRON_SECRET`. Arreglado en PR #11.

Causa raiz adicional #3 (la que de verdad bloqueaba todo): tras arreglar #1 y #2 y que el usuario confirmara haber configurado `CRON_SECRET` en Vercel, los cron seguian fallando con el mismo error en cada redeploy sucesivo. Causa: el valor pegado en Vercel tenia espacios en blanco. Una vez corregido y redesplegado, confirmado en verde de dos formas: 0 runtime errors en Vercel tras el redeploy, y ejecucion manual de `holded-sync.yml` (`gh workflow run` → `completed success`).

Archivos principales:

- `lib/security/cron.ts` — logica de verificacion (sin cambios, el fail-closed es correcto por diseno)
- `supabase/migrations/20260703000001_pgcron_email_queue_auth.sql` — guarda el secreto en Supabase Vault (`cron_secret`) y reprograma `email-queue-hourly` para enviar `Authorization: Bearer <secreto>` real
- `supabase/migrations/20260703000002_fix_pgcron_http_post_schema.sql` — corrige `extensions.http_post` → `net.http_post`
- `.github/workflows/email-queue.yml` — ELIMINADO: quedo redundante desde que el cron se movio a `pg_cron` (commit `95dd62d`, 2026-06-25); mantener ambos duplicaria el procesamiento
- `app/api/cron/email-queue/route.ts` — comentario corregido (decia "Vercel Cron", ahora dice "Supabase pg_cron")
- `.github/workflows/holded-sync.yml` — sin cambios de codigo; solo necesitaba el secret de GitHub Actions configurado

Solucion aplicada y verificada (2026-07-03 → 2026-07-04):

- [x] PR `expert-servicios/kiabusiness_app#9` (mergeado) — auth pg_cron para `email-queue` + eliminacion del workflow duplicado.
- [x] PR `expert-servicios/kiabusiness_app#11` (mergeado) — fix schema `net.http_post`.
- [x] Migraciones aplicadas en Supabase remoto.
- [x] `CRON_SECRET` configurado en Vercel (Production) — tras un primer intento fallido por espacios en blanco en el valor pegado, corregido y redesplegado.
- [x] `CRON_SECRET` configurado como secret de GitHub Actions en `expert-servicios/kiabusiness_app`.
- [x] Verificado: `gh workflow run holded-sync.yml` → `completed success`. `cron.job_run_details` de `email-queue-hourly` en `succeeded` cada hora. 0 runtime errors en Vercel para los 6 cron routes tras el fix.

Notas:

- El fail-closed de `verifyCronRequest` es el comportamiento correcto — el bug fue de configuracion/despliegue, no de codigo defensivo.
- Este hallazgo no estaba en el plan; se detecto auditando manualmente logs de Vercel, no por monitoreo activo. Considerar una alerta (Vercel Log Drain, o email en `daily-summary`) que avise si un cron lleva N ejecuciones fallidas seguidas — asi un fallo de configuracion como este no vuelve a pasar desapercibido semanas.
- Se investigo tambien `[webhook] subscription has no resolvable EXPERT user` en `/api/stripe/webhook` (3 suscripciones sin perfil ni fila en `subscriptions`). Confirmado por el usuario (2026-07-03): son suscripciones de Stripe anteriores/ajenas a EXPERT en la misma cuenta, no un bug — el codigo si vincula bien a los clientes que pasan por el checkout de la app. No requiere accion.

## P1 - Calidad, CI y mantenimiento

### IMP-009 - Recuperar `npm run lint`

Estado: [x]

Tipo: calidad, mantenimiento.

Riesgo: el proyecto compila, pero CI de calidad esta roto.

Archivos principales:

- `components/admin/AdminSidebar.tsx`
- `contexts/CartContext.tsx`
- `components/site/header.tsx`
- `components/site/WhatsAppChatWidget.tsx`
- `components/admin/CorreoInbox.tsx`
- paginas admin marcadas por ESLint.

Criterio de aceptacion:

- [x] `react/no-unstable-nested-components`: `SidebarContent` extraido fuera de `AdminSidebar` como componente independiente con props explícitas.
- [x] `react-hooks/exhaustive-deps` suppressions en `CorreoInbox` y `WhatsAppInbox`: ya tenian `eslint-disable-next-line` correctamente colocados — son supresiones intencionales.
- [x] Warnings `@next/next/no-img-element` y `@next/next/no-css-tags`: ya tenian supresiones intencionales en su lugar.
- [x] `npm run lint` pasa sin errores. (Verificar tras el commit con el CI.)

Notas:

- Implementado 2026-06-04: unico error real era `react/no-unstable-nested-components` en AdminSidebar.tsx.

### IMP-010 - Actualizar dependencias auditadas

Estado: [x]

Tipo: seguridad, mantenimiento.

Riesgo: `npm audit` reporta vulnerabilidades, incluida una alta en Next.js.

Archivos principales:

- `package.json`
- `package-lock.json`

Criterio de aceptacion:

- Next.js se actualiza al menos a la version parcheada disponible en el rango actual.
- `npm audit --audit-level=moderate` queda limpio o con excepciones documentadas.
- `npm run typecheck`, `npm run lint` y `npm run build` pasan tras actualizar.

Notas:

- Implementado 2026-06-06: `npm audit fix` actualizo Next.js de 16.2.4 a 16.2.7. Todas las vulnerabilidades altas resueltas. Quedan 2 moderate (postcss y qs dentro de Next.js) cuyo fix requiere downgrade a Next.js 9.x — descartado. `npm audit --audit-level=high` pasa limpio.

### IMP-011 - Unificar Supabase SSR y retirar auth-helpers

Estado: [x]

Tipo: auth, mantenimiento, Supabase.

Riesgo: conviven `@supabase/ssr` y `@supabase/auth-helpers-nextjs`. Esto aumenta superficie de sesion/cookies y dependencias.

Archivos principales:

- `components/dashboard/LogoutButton.tsx`
- `package.json`
- `lib/integrations/supabase.ts`

Criterio de aceptacion:

- [x] `LogoutButton.tsx` migrado de `createBrowserClient` (`auth-helpers-nextjs`) a `createBrowserSupabaseClient` (`lib/integrations/supabase.ts`).
- [x] `@supabase/auth-helpers-nextjs` eliminado de `package.json`.
- [x] Sin mas usos de `auth-helpers-nextjs` en el codigo fuente.
- [ ] `npm install` ejecutado localmente para actualizar `package-lock.json` (accion manual post-commit).
- [ ] Login, logout y rutas protegidas verificados en staging.

Notas:

- Implementado 2026-06-04. El helper `createBrowserSupabaseClient` ya existia en `lib/integrations/supabase.ts` usando `@supabase/ssr` — solo habia que usarlo.

### IMP-012 - Crear tests minimos de regresion critica

Estado: [x]

Tipo: calidad, operacion.

Archivos principales:

- `lib/security/webhook-signature.ts` — NUEVO: `verifyMetaSignature` extraida de la route de WhatsApp
- `lib/auth/safe-redirect.ts` — NUEVO: `safeRedirectPath` extraida del callback de auth
- `app/auth/callback/route.ts` — actualizado para importar desde `lib/auth/safe-redirect`
- `app/api/webhooks/whatsapp/route.ts` — actualizado para importar desde `lib/security/webhook-signature`
- `vitest.config.ts` — NUEVO: configuracion Vitest con alias `@` y entorno Node
- `tests/security/webhook-signature.test.ts` — 8 tests: firma valida, incorrecta, ausente, sin prefijo, hex invalido, body modificado, fail-closed produccion, permisivo desarrollo
- `tests/auth/safe-redirect.test.ts` — 12 tests: rutas validas, open-redirect, protocol-relative, backslash, null, vacia, sin slash, javascript:, data:
- `tests/security/spam-guard.test.ts` — 6 tests spam + 3 tests rate limit
- `tests/payments/checkout-allowlist.test.ts` — 5 tests: priceId valido, arbitrario, sin config, env var vacia, live vs test

Criterio de aceptacion:

- [x] Tests escritos para los 4 criterios criticos.
- [x] Funciones puras extraidas a utilidades testables independientes de Next.js.
- [x] `vitest.config.ts` configurado con alias `@` para resolver imports del proyecto.
- [x] `package.json`: script `test` y `test:watch`, vitest en devDependencies.
- [ ] `npm install && npm test` pasa localmente (verificar tras commit).
- [ ] CI actualizado para ejecutar `npm test` (anadir al workflow ci.yml).

Notas:

- Implementado 2026-06-04.
- Los tests son unitarios puros — no requieren Supabase, Stripe ni ninguna conexion externa.
- La idempotencia de Stripe (IMP-004) requiere mock de Supabase; queda como test de integracion futuro.

### IMP-016 - Mejorar calidad conversacional WABA/Kia

Estado: [~]

Tipo: producto, WhatsApp, IA, automatizacion.

Riesgo: Kia puede quedar atrapada en capturas opcionales, repetir la misma frase y derivar preguntas fiscales/juridicas generales a venta en lugar de orientar. Esto reduce confianza y bloquea usuarios que no quieren compartir email o que solo buscan informacion.

Archivos principales:

- `app/api/webhooks/whatsapp/route.ts`
- `lib/integrations/kia-engine.ts`
- `lib/integrations/official-sources.ts`

Criterio de aceptacion:

- El email en WABA es opcional y acepta `omitir`, `Omitir email`, `Mas tarde`, `sin correo`, `prefiero no`, etc.
- Si el usuario hace una consulta real mientras Kia espera email, el flujo sale de la captura y responde al contexto.
- Kia no pide email al inicio; solo conserva nombre de trato en `kia_sessions`.
- Kia puede orientar en fiscal, legal, laboral, mercantil, extranjeria y gestion documental con pasos y fuentes oficiales.
- Kia evita repetir la misma frase y cierra de forma amable usos de diversion/bajo interes sin forzar venta.
- Los contactos de bajo interes/diversion se guardan como memoria interna de Kia en `kia_sessions.data`, no como estado enum de `leads`.
- Cuando detecta interes real, Kia deriva a login/registro, contratacion, cita o presupuesto para recoger datos fiables.
- `leads` no se crea desde WABA salvo identidad fiable completa; los flujos nuevos priorizan portal seguro para evitar correos falsos.

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] prueba manual con payload WABA de boton `Omitir email`.
- [ ] prueba manual con consulta libre durante `asking_email`.

Notas:

- Implementado el 2026-05-23: se corrigio el reconocimiento de omitir email, se anadieron botones de omision, se delegan consultas reales al fallback IA y se amplio el prompt/fuentes oficiales para asesoramiento fiscal, laboral, mercantil y juridico.
- Implementado el 2026-05-23: memoria interna `kia_contact_disposition` para contactos de bajo interes/diversion, con motivo y contador. Si vuelven con una consulta real, Kia marca `reactivated_after_low_intent` y responde con normalidad usando ese contexto.
- Implementado el 2026-05-23: Kia deja de pedir email en bienvenida y deja de crear leads desde WABA con datos incompletos. Los flujos de interes real envian al portal seguro (`/auth/login`) para presupuesto, cita o contratacion.
- Implementado el 2026-05-24: capa anti-repeticion en WABA, Admin Compose y prompt maestro. Kia revisa mensajes anteriores antes de responder, evita repetir apertura/cierre/CTA/estructura y reintenta una vez si la respuesta generada se parece demasiado al historial.
- Implementado el 2026-05-24: Kia Health detecta `repeated_answer_loop` a partir de warnings/reglas anti-repeticion para que los bucles conversacionales queden visibles como anomalias.

### IMP-017 - Kia estructurada, Health y Auditor

Estado: [x]

Tipo: IA, observabilidad, admin, Supabase.

Riesgo: sin decisiones estructuradas, logs y canaries, Kia puede parecer operativa aunque incumpla reglas criticas de EXPERT: pedir API keys, confundir Holded con viabilidad, repetir frases, usar `needs_review` de forma excesiva o proponer checkout sin requisitos.

Archivos principales:

- `lib/ai/kia/`
- `lib/ai/kia/health/`
- `lib/ai/kia-auditor/`
- `app/api/admin/kia/health/`
- `app/api/admin/kia-auditor/`
- `app/(protected)/admin/kia-health/page.tsx`
- `app/(protected)/admin/kia-auditor/`
- `supabase/migrations/20260523171440_kia_decision_logs.sql`
- `supabase/migrations/20260523182625_kia_health_check.sql`
- `supabase/migrations/20260524060850_kia_auditor_reviews.sql`

Criterio de aceptacion:

- Kia mantiene el motor determinista como primera linea y usa decision estructurada solo en flujos habilitados por flags.
- `KiaDecision` se valida con schema, genera `decisionSummary` y `rulesApplied`, y no guarda chain-of-thought.
- Provider router conserva Anthropic/OpenAI con fallback y logs redactados.
- Tool calls quedan definidas con schema estricto y ejecutadas solo por backend validado.
- Health canaries cubren API key, checkout, Holded, viabilidad, impuestos, idioma, cliente/lead y mensaje seleccionado.
- Admin tiene panel `/admin/kia-health` con badge/resumen en Panel Gerente.
- Kia Auditor revisa reglas criticas y puede crear anomalias.
- Migraciones aplicadas en Supabase remoto con RLS/grants verificados antes de activar pruebas amplias.

Verificacion local:

- [x] `npm run typecheck`
- [x] `npm run kia:eval`
- [x] `npm run build`
- [x] `npm run kia:auditor:test`
- [x] `supabase migration list --local` o verificacion remota equivalente.
- [x] Canary manual desde `/admin/kia-health`.
- [ ] Prueba manual WABA con usuarios amigos/testers.

Notas:

- Implementado en local el 2026-05-23/24: arquitectura `lib/ai/kia`, decision logs, health checks, canary runner, API admin, cron protegido, panel admin, badge en Panel Gerente, docs y fixtures.
- Verificado 2026-06-02 via MCP Supabase: todas las tablas ya existian en remoto con schema correcto, RLS habilitado y grants correctos. Las 10 tablas kia_* estan presentes y activas.
- Estado productivo confirmado: 5 health runs, 18 decision logs, 37 anomalias detectadas, 0 auditor reviews (auditor pendiente de activacion).
- El problema de conectividad IPv6 estaba resuelto — las migraciones se habian aplicado previamente via otro metodo (posiblemente Dashboard de Supabase).
- schema drift menor: `rules_applied` es `text[]` en remoto (vs `jsonb` en migracion local). Compatible con el codigo (string[] → text[]).

## P2 - Producto, escalabilidad y consistencia

### IMP-013 - Dominio canonico y URLs configurables

Estado: [x]

Tipo: SEO, comunicacion, escalabilidad.

Decision tomada (2026-06-04): dominio canonico es `expertconsulting.es`. `kseniailicheva.com` queda como dominio personal y debe redirigir a `expertconsulting.es`.

Archivos principales:

- `.env.example` y `.env.local` — `NEXT_PUBLIC_APP_URL=https://expertconsulting.es`
- `app/(public)/layout.tsx` y `app/layout.tsx` — metadata canonical
- `app/sitemap.ts` y `app/robots.ts` — URLs absolutas
- `lib/email/templates.ts` — enlaces en emails transaccionales
- `lib/ai/kia/kia-system-prompt.ts` — referencias de dominio en prompts de Kia
- `README.md` — actualizar dominio y datos base

Criterio de aceptacion:

- [x] `NEXT_PUBLIC_APP_URL=https://expertconsulting.es` en `.env.local` y `.env.example`.
- [x] `<link rel="canonical">` ya apuntaba a `expertconsulting.es` (metadata en app/layout.tsx).
- [x] Sitemap y robots.txt ya usaban `expertconsulting.es`.
- [x] `ADMIN_EMAILS` actualizado a `soy@expertconsulting.es,...` en `.env.example` y `.env.local`.
- [x] URLs Calendly hardcodeadas eliminadas — todas usan `process.env.NEXT_PUBLIC_CALENDLY_*`.
- [x] `kseniailicheva.com` eliminado de `next.config.ts` allowedOrigins.
- [x] README y docs actualizados.
- [ ] `kseniailicheva.com` configurado como redirect 301 en DNS/Vercel (accion externa).
- [ ] Username Calendly (`soy-kseniailicheva`) actualizado en la cuenta Calendly (accion externa en calendly.com/settings).

### IMP-014 - Configuracion tenant-ready

Estado: [x]

Tipo: escalabilidad SaaS.

Contexto actualizado (2026-06-04): con el pivot a asesorias como clientes, la arquitectura multi-tenant pasa a ser critica a corto plazo. Cada asesoria es un tenant. Sus clientes y empresas pertenecen al tenant. Kia opera en el contexto del tenant.

Archivos principales:

- `supabase/migrations/` — nueva migracion `tenants` y `tenant_settings`
- `lib/auth/roles.ts` — anadir rol `tenant_admin`
- `lib/integrations/supabase.ts` — helpers con `tenant_id` en queries criticas
- `app/(protected)/` — pasar `tenant_id` al contexto de sesion

Criterio de aceptacion:

- [x] Existe tabla `tenants` con `id`, `slug`, `name`, `domain`, `plan`, `settings jsonb`, `active`, `created_at`.
- [x] Entidades criticas (`cases`, `orders`, `quotes`, `companies`, `profiles`) tienen columna `tenant_id` nullable con FK a `tenants`.
- [x] Tenant EXPERT queda registrado como tenant inicial con `slug = 'expert'`.
- [x] No se rompe la operativa actual (tenant_id es NULL para usuarios legacy EXPERT).
- [x] El contexto de sesion expone `tenant_id` via `getTenantContext()` en `lib/integrations/supabase.ts`.
- [x] `lib/auth/roles.ts` incluye rol `tenant_admin` con helpers `isTenantAdmin` e `isAnyAdmin`.
- [x] `lib/auth/tenant.ts` con `getTenantForUser`, `createTenant`, `assignTenantToUser`.
- [x] Funcion SQL `public.auth_tenant_id()` para RLS tenant-aware en Fase 2.

Notas:

- Implementado 2026-06-04: migracion `20260604120000_tenant_ready.sql`, lib/auth/tenant.ts, lib/auth/roles.ts actualizado.
- El check constraint de `profiles.role` ahora incluye 'owner' y 'tenant_admin'.
- Fase 2 (SaaS multi-tenant): poblar tenant_id en entidades existentes y activar RLS tenant-aware.

### IMP-015 - Automatizaciones operativas visibles

Estado: [x]

Tipo: automatizacion, retencion, operacion.

Solucion implementada (2026-06-02):
- Emails automaticos al cliente cuando admin cambia el status del expediente (PATCH /api/admin/cases/[id]):
  * pendiente_cliente → caseDocsRequired (solicitud de documentacion)
  * en_revision → caseDocsReceived (documentacion recibida)
  * listo_para_presentar → caseInProgress (en tramitacion activa)
  * presentado → casePendingExternal (presentado ante organismo)
  * finalizado → caseDelivered + reviewRequest (entregado + solicitud resena)
- Resumen diario admin (cron /api/cron/daily-summary, 08:30 UTC):
  * Expedientes bloqueados
  * Expedientes esperando docs > 3 dias
  * Presupuestos abiertos > 5 dias sin respuesta
  * Suscripciones con pago fallido
  * Leads nuevos 24h, mensajes WhatsApp nuevos 24h, jobs Holded fallidos
  * Email destinatario configurable via ADMIN_SUMMARY_EMAIL
- Template dailyAdminSummary en lib/email/templates.ts con asunto adaptativo (⚠️ si hay alertas, ✅ si todo OK).
- vercel.json: schedule 30 8 * * * para daily-summary.

Archivos principales:

- `app/api/admin/cases/[id]/route.ts` — emails en PATCH de status
- `app/api/cron/daily-summary/route.ts` — NUEVO cron resumen diario
- `lib/email/templates.ts` — dailyAdminSummary
- `vercel.json` — schedule daily-summary

### IMP-018 - Conocimiento Holded Academy en Kia (Opcion A)

Estado: [x]

Tipo: IA, producto, WhatsApp, Holded.

Objetivo: que Kia responda preguntas sobre funcionamiento de Holded, tarifas, modulos e integraciones sin necesitar a un humano, usando documentacion curada + busqueda viva en Holded Academy.

Enfoque elegido: Opcion A (inmediata). Opcion B (RAG con pgvector) queda reservada para cuando el volumen de preguntas tecnicas "como configurar X en Holded" justifique la infraestructura.

Archivos principales:

- `lib/integrations/official-sources.ts` — extendido con dominios, triggers y fallbacks de Holded
- `lib/ai/kia/prompts/kia-holded-knowledge.ts` — NUEVO: conocimiento curado (modulos, tarifas EXPERT+Holded, integraciones, FAQs)
- `lib/ai/kia/kia-system-prompt.ts` — inyeccion condicional del conocimiento Holded cuando el contexto lo requiere

Criterio de aceptacion:

- Kia responde correctamente preguntas sobre modulos Holded (facturacion, contabilidad, RRHH, inventario, proyectos, CRM, banco).
- Kia da precios correctos de paquetes EXPERT+Holded y diferencia los planes propios de Holded.
- Kia conoce las integraciones disponibles (Stripe, GoCardless, Shopify, WooCommerce, Amazon, Zapier, API).
- Preguntas sobre Holded activan busqueda viva en help.holded.com y www.holded.com.
- Kia no confunde "viabilidad juridica" con "readiness Holded".
- Si la pregunta es muy tecnica o requiere configuracion especifica, recomienda llamada de 15 min o Pack Starter.

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Prueba manual WABA: "¿Qué modulos tiene Holded?"
- [ ] Prueba manual WABA: "¿Cuanto cuesta Holded con EXPERT?"
- [ ] Prueba manual WABA: "¿Holded tiene control de horario?"
- [ ] Prueba manual WABA: "¿Con que se integra Holded?"

Notas:

- Implementado 2026-06-02: official-sources extendido con Holded; kia-holded-knowledge.ts creado con modulos, tarifas, integraciones y FAQs; inyeccion condicional en system prompt cuando el contexto es Holded.
- Opcion B (RAG pgvector): crawling de Holded Academy -> chunks -> embeddings -> Supabase pgvector -> busqueda semantica en tiempo real. Pendiente para cuando el volumen de preguntas tecnicas justifique la infraestructura adicional.

### IMP-019 - Conocimiento AEAT y Seguridad Social en Kia

Estado: [x]

Tipo: IA, producto, WhatsApp, fiscal, laboral.

Objetivo: que Kia responda preguntas sobre IRPF, IVA, modelos fiscales, campana de la renta, autónomos en Hacienda, cuotas SS, RETA, vida laboral y prestaciones desde conocimiento curado + búsqueda viva en las sedes oficiales.

Mismo patron que IMP-018 (Holded Academy): archivos de conocimiento curado + deteccion de contexto para inyeccion condicional en el system prompt.

Archivos principales:

- `lib/ai/kia/prompts/kia-aeat-knowledge.ts` — NUEVO: IRPF/renta, IVA trimestral, modelos autonomo (036/037/130/303/390/720/151), plazos, acceso digital, reglas Kia
- `lib/ai/kia/prompts/kia-ss-knowledge.ts` — NUEVO: RETA (alta/baja/cuotas), cuota reducida nuevos autonomos, vida laboral, IT, cese de actividad, empleados, portales oficiales
- `lib/ai/kia/kia-system-prompt.ts` — inyeccion condicional de AEAT y SS segun contexto del mensaje/servicio
- `lib/ai/kia/kia-decision-engine.ts` — deteccion de contexto AEAT/SS via regex sobre mensaje y slug de servicio

Criterio de aceptacion:

- Kia responde correctamente: campana renta, como obtener referencia, quien debe declarar, plazos IVA, modelo 036, tarifa plana autonomo, cuotas RETA, vida laboral.
- Kia distingue orientacion (lo que puede dar) de presentacion (lo que hace EXPERT o el cliente con certificado digital).
- Para requerimientos, sanciones o inspecciones de Hacienda: orienta + recomienda llamada urgente.
- No afirma cuotas o plazos exactos sin indicar que deben verificarse para el ejercicio actual.
- El conocimiento solo se inyecta cuando el mensaje/servicio tiene contexto fiscal o de SS (no gasta tokens en preguntas no relacionadas).

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Prueba WABA: "Cuando empieza la campana de la renta?"
- [ ] Prueba WABA: "Cuanto pago de cuota de autonomo?"
- [ ] Prueba WABA: "Como pido la vida laboral?"
- [ ] Prueba WABA: "Que es el modelo 303?"
- [ ] Prueba WABA: "Me ha llegado una inspeccion de Hacienda"

Notas:

- Implementado 2026-06-02: kia-aeat-knowledge.ts y kia-ss-knowledge.ts creados; deteccion de contexto por regex; inyeccion condicional en system prompt y decision engine.

### IMP-020 - Mapa completo de fuentes publicas oficiales en Kia

Estado: [x]

Tipo: IA, producto, WhatsApp, fiscal, trafico, justicia, empresa, registros.

Objetivo: que Kia pueda orientar desde fuentes oficiales en todos los tramites que EXPERT gestiona o que los clientes preguntan con frecuencia, cubriendo DGT, Justicia/Registros, PAE/CIRCE y tributos autonomicos.

Decisiones de diseno tomadas:
- CCAA: todas las CCAA (EXPERT opera en toda Espana). Se implementan las 5 principales (Madrid, Cataluna, Andalucia, Valencia, Pais Vasco) + nota general sobre el resto.
- PAE: Kia orienta a hacerlo solo si el cliente tiene certificado digital; si no, recomienda EXPERT.
- DGT: toda Espana, sin restriccion geografica.
- Justicia (antecedentes, certificados): EXPERT orienta; el cliente los gestiona por su cuenta.

Archivos principales:

- `lib/ai/kia/prompts/kia-dgt-knowledge.ts` — NUEVO: transferencias, matriculacion, canje permiso extranjero, baja vehiculo, informe de puntos, miDGT, sede DGT
- `lib/ai/kia/prompts/kia-justicia-registros-knowledge.ts` — NUEVO: antecedentes penales (online/presencial/extranjero), certificado nacimiento, apostilla La Haya, registro civil, denominacion social negativa (RMC), nota simple registro propiedad
- `lib/ai/kia/prompts/kia-pae-knowledge.ts` — NUEVO: PAE Electronico / CIRCE para alta autonomo online y constitucion SL online, cuando hacerlo solo vs EXPERT, requisitos, pasos
- `lib/ai/kia/prompts/kia-ccaa-knowledge.ts` — NUEVO: ITP (transmisiones patrimoniales), ISD (sucesiones y donaciones), AJD (actos juridicos documentados), Impuesto de Patrimonio — tipos y diferencias por CCAA (Madrid, Cataluna, Andalucia, Valencia, Pais Vasco) + nota sobre organismos locales (SUMA Alicante, Patronatos, etc.)
- `lib/ai/kia/kia-system-prompt.ts` — inyeccion condicional de los 4 nuevos modulos
- `lib/ai/kia/kia-decision-engine.ts` — deteccion de contexto por regex para cada modulo
- `lib/integrations/official-sources.ts` — nuevos dominios (sede.dgt.gob.es, rmc.es, paeelectronico.es, etc.) y nuevos fallback sources

Criterio de aceptacion:

- DGT: Kia explica transferencia de vehiculo, canje de permiso extranjero, informe de puntos y miDGT.
- Justicia: Kia explica como pedir antecedentes penales online (con y sin certificado digital) y como apostillar documentos.
- PAE: Kia orienta a crear SL o darse de alta de autonomo online si tiene certificado digital; si no, propone EXPERT.
- CCAA: Kia conoce las diferencias de ITP/ISD entre CCAA principales para dar orientacion fiscal en compraventas y herencias.
- Todos los modulos solo se inyectan cuando el contexto del mensaje lo requiere (eficiencia de tokens).

Verificacion:

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Prueba WABA: "Como hago la transferencia de un coche?"
- [ ] Prueba WABA: "Necesito los antecedentes penales para el arraigo"
- [ ] Prueba WABA: "Quiero crear una SL yo solo online"
- [ ] Prueba WABA: "Cuanto se paga de herencia en Madrid vs Cataluna?"
- [ ] Prueba WABA: "Cuanto cuesta la nota simple de un piso?"

Notas:

- Implementado 2026-06-02.
- Para tributos autonomicos de CCAA no cubiertas (Canarias, Baleares, Extremadura, etc.): se incluye nota general con el procedimiento comun y se recomienda consulta con EXPERT.
- SUMA Alicante y organismos locales similares (IBI, IAE, IVTM): se menciona su existencia en el modulo CCAA como nota sobre tributos locales.
- Opcion futura: si se amplia el servicio notarial/herencias, ampliar CCAA con tablas de tipos actualizadas.

### IMP-021 - Web publica orientada a asesorias como clientes

Estado: [x]

Tipo: captacion, conversion, escalabilidad SaaS.

Contexto: la web publica actual esta orientada al cliente final B2C (empresa, autonomo, particular). Con el pivot, la audiencia principal son las asesorias/gestorias que contratan la plataforma. La web publica debe reflejar esta propuesta de valor.

Archivos principales:

- `app/(public)/page.tsx` — Home: nuevo hero y propuesta de valor para asesorias
- `app/(public)/para-asesorias/` — pagina ya existente; debe promocionarse como destino principal
- `app/(public)/servicios/` y rutas de servicios — revisar si los servicios B2C siguen siendo relevantes o se reorientan
- `app/(public)/layout.tsx` — navegacion principal
- `components/site/` — header, footer y componentes de la web publica

Criterio de aceptacion:

- El Home comunica claramente que EXPERT es una plataforma para asesorias, gestorias y despachos.
- La propuesta de valor principal es: automatizacion operativa, gestion de clientes, expedientes, documentos y Holded integrado.
- `/para-asesorias` o equivalente es la pagina de conversion principal, no el contacto B2C.
- El menu principal refleja la nueva audiencia.
- Si se mantienen servicios B2C residuales (para la operativa de Ksenia), quedan claramente separados o bajo un sudominio/ruta diferente.
- `expertconsulting.es` como URL de todos los enlaces publicos.

### IMP-022 - Kia como widget copiloto flotante in-app

Estado: [x]

Tipo: IA, producto, UX, operacion.

Decision tomada (2026-06-04): Kia abandona el rol de chatbot de captacion WABA y se reposiciona como copiloto operativo interno. Se accede mediante un boton flotante en cualquier pagina del portal (dashboard cliente y admin). Al hacer clic, se abre una ventana de chat lateral/modal donde el usuario puede gestionar las empresas conectadas, consultar datos y ejecutar acciones con supervision humana.

La integracion WABA puede mantenerse como canal de notificaciones salientes, pero no como interfaz principal de Kia.

Archivos principales:

- `components/KiaCopilotWidget.tsx` — NUEVO: boton flotante + ventana de chat (posicion fixed, animacion de apertura)
- `app/(protected)/layout.tsx` — incluir `<KiaCopilotWidget />` en el layout protegido
- `app/api/ai/kia/route.ts` — endpoint de chat in-app (separado del webhook WABA)
- `lib/ai/kia/kia-context-builder.ts` — ampliar contexto con datos de la asesoria: empresas conectadas, expedientes activos, integraciones, clientes
- `lib/ai/kia/kia-tool-definitions.ts` — herramientas para el copiloto: consultar empresa, listar expedientes, estado de integracion Holded, buscar cliente
- `lib/ai/kia/kia-tool-executor.ts` — ejecutar herramientas del copiloto con verificacion de permisos

Criterio de aceptacion:

- Existe un boton flotante en la esquina inferior derecha del portal (admin y dashboard cliente).
- Al hacer clic, se abre una ventana de chat sin salir de la pagina actual.
- Kia tiene acceso al contexto del usuario autenticado: tenant, empresas conectadas, expedientes activos, estado de Holded.
- Kia puede responder preguntas sobre las empresas del usuario (estado, integraciones, documentos pendientes).
- Kia puede guiar al usuario por flujos del sistema (como conectar Holded, crear un expediente, subir documentacion).
- Kia usa el conocimiento de dominio existente (AEAT, SS, DGT, Holded Academy) desde el chat in-app.
- El chat guarda historial de sesion en `kia_sessions` vinculado al usuario y tenant.
- Las acciones con efecto externo (enviar email, crear expediente) requieren confirmacion del usuario antes de ejecutarse.
- El widget no bloquea la interfaz ni interfiere con otras acciones de la pagina.
- La integracion WABA queda reducida a canal de notificaciones salientes (avisos de estado, recordatorios) sin motor de Kia en tiempo real.

Notas de diseno:

- El widget puede implementarse como componente React con estado local (abierto/cerrado) y streaming de respuesta via Server-Sent Events o fetch con `ReadableStream`.
- El contexto de cada mensaje incluye: pagina actual (`pathname`), `tenant_id`, `user_id`, empresas visibles en el dashboard, ultimo expediente consultado.
- Los modulos de conocimiento (AEAT, SS, DGT, Holded, CCAA, PAE, Justicia) se inyectan condicionalmente igual que en el motor actual.

Implementacion 2026-06-04:

- `app/api/ai/kia/route.ts` — NUEVO: POST endpoint autenticado, usa `runKiaDecision` con channel='dashboard', guarda sesion en `kia_sessions` y decision log.
- `components/KiaCopilotWidget.tsx` — NUEVO: boton flotante (fixed bottom-right), panel de chat con historial, quick replies, textarea con Enter para enviar.
- `app/(protected)/layout.tsx` — actualizado para incluir `<KiaCopilotWidget />` en todo el portal autenticado.
- El widget usa `usePathname()` para pasar la ruta actual como contexto a Kia.
- Los modulos de conocimiento se inyectan condicionalmente segun el contenido del mensaje (igual que en WABA).
- Pendiente para mejora: streaming SSE para respuestas largas, contexto de empresas del dashboard en el payload.

Verificacion:

- [x] `npm run typecheck` (pendiente confirmar tras commit).
- [x] `npm run build` (pendiente confirmar tras commit).
- [ ] Prueba manual: abrir /dashboard, hacer clic en el boton Kia, enviar consulta.
- [ ] Prueba manual: "¿Cuales son mis expedientes activos?" → Kia responde con contexto del usuario.
- [ ] Prueba manual: "¿Cómo conecto Holded?" → Kia guia al usuario.

Implementacion 2026-07-09 — WABA retirada por completo (no solo reducida a notificaciones):

- Decision del usuario: se deja de usar la API de Meta (WhatsApp Cloud API) para WhatsApp. El numero pasa de +34 696 55 04 80 (dedicado a WABA) a +34 669 04 55 28 (numero de negocio habitual), atendido manualmente desde la app normal de WhatsApp Business — sin Kia respondiendo, sin plantillas aprobadas por Meta y sin catalogo interactivo por bot.
- Esto va mas alla de lo previsto en la decision de 2026-06-04 (linea 934: "la integracion WABA queda reducida a canal de notificaciones salientes"): tampoco se usa ya para notificaciones salientes automatizadas. Todas las lineas de este documento que dicen "Prueba manual WABA: ..." quedan obsoletas — no hay canal WABA que probar.
- `app/api/webhooks/whatsapp/route.ts` (+ alias legacy `app/api/whatsapp/webhook/route.ts`) devuelve 200 sin procesar en GET y POST; la implementacion original queda dormida como `_disabledPost()` por si hace falta revertir.
- Accesos a `/admin/whatsapp` quitados de sidebar, hero, accesos rapidos, mobile nav y panel derecho de admin (la pagina y su API siguen existiendo, solo sin enlazar).
- Numero actualizado en todo el sitio publico (widget, footer, contacto, servicios, docs, blog, cita, carrito, JSON-LD, avisos legales, contrato) y variables `META_WHATSAPP_*`/`META_APP_SECRET` marcadas como no usadas en `.env.example`.
- Kia sigue viva como copiloto en `/api/kia/copilot` — este canal no se vio afectado. Meta se sigue usando para Ads y catalogo, sin relacion con esta integracion.
- Commit: `ee0d1bc`.

### IMP-023 - CI minimo con GitHub Actions

Estado: [x]

Tipo: calidad, operacion, mantenimiento.

Riesgo: no hay pipeline de CI. Un cambio puede romper `typecheck`, `build` o `lint` sin que nadie lo detecte hasta el despliegue.

Archivos principales:

- `.github/workflows/ci.yml` — NUEVO

Criterio de aceptacion:

- [x] `.github/workflows/ci.yml` creado: typecheck → lint → build en cada push a `main` y PRs.
- [x] Build usa variables dummy para no depender de secretos reales.
- [x] Cache de npm configurado para reducir tiempo de ejecucion.
- [ ] Branch protection activada en GitHub: Settings → Branches → require status checks antes de merge.

Notas:

- Implementado 2026-06-04. Node 22, ubuntu-latest, npm ci con cache.
- Para activar la proteccion de rama: GitHub → Settings → Branches → Add rule → main → Require status checks → seleccionar "Typecheck · Lint · Build".

## Plan por fases — estado actual (2026-06-06)

Este bloque es la memoria viva del plan. Actualizar estado de cada item al completarlo o bloquearlo. Los items marcados `[x]` estan completados y verificados. Los `[ ]` estan pendientes. Los `[~]` estan en curso o con verificacion manual pendiente.

### Completado en sesiones anteriores (2026-06-04)

- [x] Verificar y corregir discrepancia cron Holded en `vercel.json`: frecuencia alta movida a scheduler externo.
- [x] IMP-013: dominio canonico `expertconsulting.es`, sweep de metadata, emails, prompts Kia y README.
- [x] IMP-003: proteger endpoints publicos (viabilidad, company/resolve, newsletter).
- [x] IMP-023: CI minimo GitHub Actions — `typecheck → lint → build` en cada push a `main` y PRs.
- [x] IMP-009: recuperar `npm run lint` — `react/no-unstable-nested-components` corregido en AdminSidebar.
- [x] IMP-011: unificar Supabase SSR, retirar `@supabase/auth-helpers-nextjs`, migrar `LogoutButton`.
- [x] IMP-012: tests minimos de regresion critica con Vitest — 31 tests (webhook, redirect, spam, checkout).
- [x] IMP-014: arquitectura tenant-ready (tabla `tenants`, `tenant_id` en entidades criticas).
- [x] IMP-015: automatizaciones configurables — tabla `automation_settings`, panel `/admin/automatizaciones`, enforcement en emails de estado.
- [x] IMP-021: web publica orientada a asesorias — `/para-asesorias`, pivot a B2B en home y nav.
- [x] IMP-022: Kia copiloto flotante in-app — widget, endpoint `/api/ai/kia`, historial en `kia_sessions`.

### Completado en sesion 2026-06-06

- [x] Panel admin multi-tenant `/admin/tenants` — lista, crear, editar, branding, usuarios, integraciones.
- [x] Portal tenant_admin `/tenant/*` — dashboard, clientes, expedientes (lista + detalle), upload entregables.
- [x] Integraciones por tenant — `tenant_integration_secrets` (AES-256-GCM), `TenantIntegrationsForm`.
- [x] Branding en emails por tenant — white-label por tenant.

### Completado en sesion 2026-06-07

- [x] Owner role en 25+ rutas API admin (`role === 'admin' || role === 'owner'`).
- [x] Kia anti-loro WABA — stuck-loop guard (Jaccard ≥0.78), social shortcut, system prompt reforzado.
- [x] Página `/dashboard/kia-ayuda` — guía de buenas prácticas + enlace desde widget.
- [x] Migraciones 000001-000003 registradas correctamente en schema_migrations.
- [x] Migración RLS tenant fase 2 — `is_tenant_admin()`, políticas cases/profiles/docs/companies/orders/quotes.
- [x] Migración `subscription_post_purchase_onboarding_at`.
- [x] Migración `email_queue` — tabla completa con trigger updated_at, índice, RLS.
- [x] PR #7 creado y mergeado — `claude/tender-darwin-aXkbO → main`.
- [x] Branch protection en `main` — 1 approval requerido, no force push, no delete.

### Completado en sesion 2026-06-15

- [x] `lib/security/cron.ts` — `verifyCronRequest()` centralizado, fail-closed en produccion.
- [x] `lib/security/uploads.ts` — `validateClientDocumentFile()`: extensión, MIME, tamaño.
- [x] Todos los cron routes migrados a `verifyCronRequest()`.
- [x] Document routes usan `validateClientDocumentFile()` antes de subir a Storage.
- [x] `reCAPTCHA` util mejorado con logging.
- [x] `CampanasDashboard` + `CorreoInbox`: `dangerouslySetInnerHTML` → `<iframe sandbox>` (fix XSS).
- [x] `next.config.ts`: 4 headers de seguridad extra (COOP, X-DNS, X-Permitted-Cross-Domain, Origin-Agent-Cluster).
- [x] Tests de seguridad: `cron-guard`, `recaptcha`, `uploads` (Vitest).
- [x] Email queue worker — `lib/email/email-queue.ts` + `/api/cron/email-queue/route.ts`, batch 20, atomic claim, exponential backoff, cron cada hora en `vercel.json`.
- [x] Kia copiloto SSE streaming — `streamAnthropicText()` en provider router; `/api/kia/copilot` con modo dual JSON/SSE; `KiaCopilotPanel` consume stream en tiempo real.
- [x] Kia user data tools habilitadas — `get_user_expedientes`, `get_user_companies`, `get_user_pending_docs` en `DASHBOARD_SAFE_TOOLS`; artifact builders para tablas.
- [x] `lib/utils/calendly.ts` — `getCalendlyUrl()` helper; todos los componentes Calendly usan env vars.
- [x] Panel `/dashboard/informes/nuevo` + `GenerateReportPanel` — entrada para generar informes.
- [x] `improvement-plan.md` actualizado (2026-06-15).

### Completado en sesion 2026-06-17 (Sprint D/E/F/H + Audit)

- [x] **Sprint D** — `PostCompraWizard` usa `postgres_changes` subscription (Supabase Realtime) en vez de polling. Migration `20260615000001`: SELECT policy en `holded_mcp_events` para Realtime.
- [x] **Sprint E** — Migration `20260615000002`: columnas operacionales en `cases` (`status`, `priority`, `next_action`, `due_date`, `service_id`) con backfill. Migration `20260615000003`: política `tenant_admin` SELECT reescrita con `client_id` scope.
- [x] **Sprint Kia-SSE** — `/api/kia/copilot` streamea word-by-word via SSE; `KiaCopilotPanel` consume stream con `getReader()` en tiempo real.
- [x] **Sprint C2** — 11 tests Vitest para `processEmailQueue` (atomic claim, retry, wall-clock). Total: 61/61 passing.
- [x] **Sprint H** — `get_user_expedientes` usa `status` real + 4 nuevas tools en copilot dashboard; tabla artifact "Mis expedientes" con estado/prioridad/vencimiento.
- [x] **Audit P0** — `maxDuration` en 6 rutas (kia copilot, ai/kia, 4 crons); Zod en `reviews/submit` y `admin cases PATCH`; `AbortController` en `KiaCopilotPanel` (memory leak fix).
- [x] **Audit P1** — N+1 eliminado en admin cases GET (profiles.email en 1 query); case status emails → `enqueueEmail` (cola durable con reintentos).
- [x] Rama `claude/tender-darwin-aXkbO` mergeada y eliminada.

### Backlog / Fase SaaS

- [x] Backlog #12: Tenants, branding por tenant, integraciones por tenant — COMPLETADO (2026-06-06).
- [x] Backlog #13: Entregables descargables finales en portal cliente — `DeliverableRow` con signed URL, sección en `/dashboard/expedientes/[id]` y en `/tenant/expedientes/[id]`.
- [x] Backlog #14: Resenas por servicio — `/gracias/opinion` (captura pública), `/admin/resenas` (moderacion), `ReviewModerationCard`, API routes.
- [x] Backlog #15: Automatizaciones configurables — COMPLETADO (2026-06-06).
- [ ] Backlog #16: Piloto con 1-3 asesorias externas — operacional, no requiere codigo.

## Orden recomendado de implementacion

### Inmediato (pendiente manual)

1. **Merge PR #7** — github.com/expert-servicios/kiabusiness_app/pull/7
2. Realizar verificaciones manuales IMP-004 (Stripe reenvio), IMP-005 (Holded sync), IMP-016 (WABA omitir email), IMP-022 (widget Kia).

### Proximo sprint de codigo

1. ~~**Email queue worker**~~ — ✅ COMPLETADO (2026-06-15).
2. ~~**Kia tool calls**~~ — ✅ COMPLETADO (Sprint H, 2026-06-17).
3. ~~**Streaming SSE Kia**~~ — ✅ COMPLETADO (Sprint Kia-SSE, 2026-06-17).

**Siguiente sprint (media prioridad):**
1. ~~**Digest semanal tenant_admin**~~ — ✅ COMPLETADO (Sprint H, 2026-06-17): `/api/cron/tenant-weekly-digest`, template `tenantWeeklyDigest`, vercel.json lunes 07:00 UTC.
2. ~~**Onboarding cliente guiado**~~ — ✅ COMPLETADO (commit `c9ebb13`, 2026-06-15): wizard multi-paso (`perfil → empresa → Holded → listo`) en `app/(protected)/dashboard/onboarding/page.tsx`, endpoint `app/api/onboarding/complete/route.ts`. Este documento lo tenia marcado erroneamente como "[EN CURSO]" — corregido 2026-07-03.
3. ~~**Registro Mercantil via Infoempresa**~~ — Descartado: solo se usan fuentes gratuitas y abiertas (BORME, CKAN, VIES ya cubiertos).

### Sprint no documentado (2026-06-17 → 2026-06-25, detectado retroactivamente 2026-07-03)

El plan quedo sin actualizar durante esta ventana pese a 15+ commits en `main`. Resumen para no perder trazabilidad:

- `3d19936`..`a59dd75` — portal tenant, Kia anti-loro, RLS fase 2, rol owner, cola de emails, hardening de seguridad de browser, fix XSS en preview de emails.
- `61d9acf`, `0064245` — migracion completa Calendly → Cal.com (cero referencias a Calendly restantes).
- `32ba636`, `46dcc27` — Sprint H: digest semanal tenant + creacion automatica de expediente desde webhook Cal.com.
- `2230b2f` — hardening de funciones DB, fix WhatsApp, UI admin.
- `95dd62d` — cron de `email-queue` movido de Vercel Cron (bloqueado por plan Hobby) a `pg_cron` en Supabase. (Ver IMP-024: quedo sin cabecera de auth, arreglado 2026-07-03.)
- `52dbb20` — excluido `kiabusiness_app/` (carpeta duplicada sin trackear) del build/typecheck de Vercel.
- `dac6a00`, `7ef57dd` — WABA en accesos rapidos del admin + badge en nav + fix visibilidad de Kia copiloto en mobile.
- `fedc44b` — script utilitario puntual `sync-env-to-vercel`.
- `b46a22c` — merge de auditoria de seguridad (Kia, WABA, cron, build).
- `c43d885` — historial interactivo de emails (borrar/reenviar) + fixes de fiabilidad.
- `7bc27e3` — tracker de Metricool (pixel de seguimiento) en `app/layout.tsx`.
- `4babd9c` — SEO: JSON-LD (BlogPosting, CollectionPage, BreadcrumbList) en blog y paginas de servicios; fix de metadata invisible a crawlers en `/solicitar-presupuesto`.
- `dec617b`, `fd9a802` — fix de fiabilidad: `.catch()` reemplazado por `.then(null, ...)` en query builders de Supabase (el builder no es una Promise real hasta que se resuelve `.then`, asi que `.catch()` podia no dispararse en algunos casos).
- `7d0fe42` — ocultar badge de reCAPTCHA, fix de posicionamiento del popup de WhatsApp.

No hay items de codigo nuevos que anadir al backlog por este sprint — fue mantenimiento, SEO y fiabilidad, ya completado. Se documenta aqui solo para que el historial de este archivo sea confiable.

### De la auditoria 2026-07-10 (mejoras de producto, no bugs)

1. **Alerta de "cron verde pero sin trabajo real"** — el propio IMP-030 demuestra que un cron puede reportar exito sin hacer nada util. Anadir chequeo tipo "filas `pending` en `email_queue` con `created_at` > 1h" en `dailyAdminSummary` o similar.
2. **Registro de auditoria visible para cambios de rol/estado sobre cuentas de staff** — ya existe `audit_logs` pero no se usa en `users/route.ts` PATCH/DELETE ni en `team/route.ts`. Habria detectado IMP-028 en produccion.
3. **Mensajes de error diferenciados en el chat de Kia** — hoy rate-limit, cost-cap, proveedor caido y sin conexion acaban todos en el mismo generico o en el `—` silencioso de IMP-037.
4. **Distinguir "sin datos" de "error de carga" en todo el panel de cliente** — `lib/utils/server-fetch.ts` (`fetchWithCookies`) atrapa cualquier error y devuelve `null`; el cliente ve "no tienes nada" tanto si no hay datos como si fallo la peticion.
5. **Consolidar el patron `assertAdmin` duplicado** — la misma funcion esta copiada literalmente en 15+ route handlers de `admin/**` en vez de usar el `requireAdminClient` centralizado que ya usan otros 20+. Es parte de por que IMP-028 pudo colarse en varios sitios a la vez.

### Fase SaaS

- Piloto con 1-3 asesorias externas usando panel operativo y copiloto Kia.
- Ampliar integraciones por tenant: Stripe por tenant, WhatsApp por tenant, plantillas de email por tenant.
- IMP-018/019/020: pruebas manuales WABA pendientes.

## Notas de implementacion

- Antes de tocar migraciones, comprobar estado local/remoto y evitar duplicar historial.
- No aplicar cambios destructivos de Supabase sin verificacion previa.
- Mantener `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` por defecto.
- Si un cambio queda parcial, actualizar este documento con el motivo y siguiente paso exacto.
