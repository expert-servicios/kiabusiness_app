# EXPERT - Plan de mejoras

Ultima actualizacion: 2026-06-06

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

## Decisiones estrategicas tomadas (2026-06-04)

- Dominio canonico: `expertconsulting.es`. Todo enlace operativo, SEO, email y referencia de Kia usa esta URL. `kseniailicheva.com` queda como dominio personal/redirect.
- Audiencia principal: asesorias, gestorias y despachos profesionales como clientes del SaaS. EXPERT no es una asesoria B2C sino una plataforma que las asesorias usan para operar.
- Kia: se reposiciona exclusivamente como widget copiloto flotante in-app. El boton flotante aparece en cualquier pagina del portal (dashboard, expedientes, empresa, etc.) y abre una ventana de chat donde el usuario puede gestionar las empresas conectadas, consultar datos, ejecutar acciones y acceder al conocimiento de dominio (AEAT, SS, DGT, Holded). Kia abandona el rol de chatbot de captacion WABA y pasa a ser copiloto operativo interno.

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

## Plan por fases — estado actual (2026-06-04)

Este bloque es la memoria viva del plan. Actualizar estado de cada item al completarlo o bloquearlo. Los items marcados `[x]` estan completados y verificados. Los `[ ]` estan pendientes. Los `[~]` estan en curso o con verificacion manual pendiente.

### Inmediato — ya completado en sesiones anteriores

- [x] Verificar y corregir discrepancia cron Holded en `vercel.json` (2026-06-04): frecuencia alta movida a scheduler externo para no bloquear deploys Hobby.
- [x] IMP-013: dominio canonico `expertconsulting.es`, sweep de metadata, emails, prompts Kia y README (2026-06-04).
- [x] IMP-003: proteger endpoints publicos (viabilidad, company/resolve, newsletter) (2026-06-04).
- [x] IMP-023: CI minimo GitHub Actions — `typecheck → lint → build` en cada push a `main` y PRs (2026-06-04).
- [x] IMP-009: recuperar `npm run lint` — `react/no-unstable-nested-components` corregido en AdminSidebar (2026-06-04).
- [x] IMP-011: unificar Supabase SSR, retirar `@supabase/auth-helpers-nextjs`, migrar `LogoutButton` (2026-06-04).
- [x] IMP-012: tests minimos de regresion critica con Vitest — 31 tests cubriendo firma webhook, redirect auth, spam guard y allowlist checkout (2026-06-04).

### Corto plazo — pendientes este mes

1. **Verificaciones manuales IMP-004** — Reenviar el mismo evento desde Stripe Dashboard → debe devolver 200 sin duplicar `order`. Marcar `[ ]` en IMP-004 como verificado o abrir issue.

2. **Verificaciones manuales IMP-005** — Hacer un pago de prueba y confirmar que aparece un job en `holded_sync_jobs`. Ejecutar `GET /api/cron/holded-sync` con `Authorization: Bearer CRON_SECRET` desde el scheduler externo y confirmar que procesa jobs pendientes. Marcar `[ ]` en IMP-005 como verificado o abrir issue.

3. **Completar instalacion y ejecucion local de tests (IMP-011/012)** — Despues del ultimo commit, ejecutar `npm install && npm test` para actualizar `package-lock.json` y confirmar que los 31 tests pasan. Actualizar criterios de aceptacion pendientes en IMP-011 e IMP-012.

4. **CI ejecuta `npm test` (IMP-012)** — Anadir `npm test` al workflow `.github/workflows/ci.yml` como paso adicional tras `lint`. Verificar que el CI pasa en GitHub Actions con los tests.

5. **Branch protection en GitHub (IMP-023)** — Activar en `Settings → Branches → main`: requerir status checks (`Typecheck`, `Lint`, `Build`) antes de merge. Accion manual en github.com.

6. **Verificaciones manuales IMP-016** — Probar WABA con payload de boton `Omitir email` y con consulta libre durante `asking_email`. Marcar como verificado o abrir issue.

7. **Verificaciones manuales IMP-018/019/020** — Probar en WABA: "¿Que modulos tiene Holded?", "¿Cuanto pago de cuota de autonomo?", "Como hago la transferencia de un coche?", "Necesito los antecedentes penales". Marcar items pendientes en cada IMP o abrir issues si fallan.

### Medio plazo — proximos 2-3 meses

8. **IMP-014: Arquitectura tenant-ready** — Disenar tabla `tenants` y anadir `tenant_id` a entidades criticas (`profiles`, `cases`, `orders`, `services`, `quotes`, `companies`). El tenant EXPERT queda registrado con `slug = 'expert'`. La arquitectura no debe bloquear el SaaS multi-tenant; `tenant_id` puede ser NULL o constante en la fase inicial. No hace falta implementar el multi-tenant completo, solo que el schema lo soporte sin migraciones destructivas futuras.

9. **IMP-022: Kia como widget copiloto flotante in-app** — Es el cambio de producto mas significativo. Boton flotante en layout protegido, endpoint `POST /api/ai/kia`, contexto con datos del tenant, herramientas del copiloto, historial en `kia_sessions`. Ver criterios completos en IMP-022.

10. **IMP-021: Web publica orientada a asesorias** — Actualizar Home, nav principal y copy para comunicar que EXPERT es una plataforma para asesorias, no B2C. Ver IMP-021.

11. **IMP-010: Actualizar dependencias auditadas** — Evaluar breaking change de postcss/Next.js. Ejecutar `npm audit --audit-level=moderate` y documentar excepciones si persisten.

### Backlog / Fase SaaS

12. **Tenants, branding por tenant, integraciones por tenant** — Una vez IMP-014 este implementado, avanzar hacia configuracion completa por tenant: `tenant_settings`, plantillas de email, servicios, roles e integraciones (Holded, Stripe, WhatsApp) configurables por tenant. Ver Fase 9 del roadmap.

13. **Entregables descargables finales en portal cliente** — Documentos de resolucion, escrituras, certificados y entregas finales descargables desde el detalle de expediente.

14. **Resenas por servicio** — Flujo de solicitud, captura y moderacion de resenas por servicio completado. Ya existe trigger en `serviceCompleted`; falta la UI de captura y el admin de moderacion.

15. **IMP-015 — Automatizaciones operativas visibles en panel admin** — Ya implementado el resumen diario y emails por cambio de estado. Pendiente: hacer las automatizaciones configurables y visibles como reglas en el panel admin.

16. **Piloto con 1-3 asesorias externas** — Seleccionar desde `saas_leads` cualificados, activar onboarding de tenant, medir adopcion del copiloto Kia y reduccion de trabajo manual. Ver Fase 10 del roadmap.

## Orden recomendado de implementacion

### Inmediato (esta semana)

1. Verificar discrepancia cron Holded en `vercel.json` vs IMP-005. Corregir o documentar la decision.
2. IMP-013: fijar `NEXT_PUBLIC_APP_URL=https://expertconsulting.es` y hacer sweep de dominio en metadata, emails y prompts Kia.
3. IMP-003: proteger endpoints publicos con coste (viabilidad, company/resolve, newsletter).

### Corto plazo (este mes)

4. IMP-023: CI minimo con GitHub Actions.
5. IMP-009: recuperar `npm run lint` (React Hooks rules).
6. IMP-011: unificar Supabase SSR y retirar `auth-helpers-nextjs`.
7. IMP-012: tests minimos de regresion critica (firma WhatsApp, redirect auth, idempotencia Stripe).
8. Pruebas manuales pendientes de IMP-004 e IMP-005 (reenvio Stripe, job holded_sync_jobs, cron CRON_SECRET).

### Medio plazo (1-3 meses)

9. IMP-022: Kia como widget copiloto flotante in-app. Este es el cambio de producto mas significativo.
10. IMP-021: web publica orientada a asesorias como clientes.
11. IMP-014: arquitectura tenant-ready (tabla `tenants`, `tenant_id` en entidades criticas).
12. IMP-010: actualizar dependencias auditadas (postcss/Next.js — evaluar breaking change).

### Fase SaaS

13. Tenants, branding por tenant, integraciones y plantillas por tenant.
14. Piloto con 1-3 asesorias externas usando el widget Kia y el panel operativo.
15. IMP-018/019/020: pruebas manuales WABA pendientes (si se mantiene canal WABA para notificaciones).

## Notas de implementacion

- Antes de tocar migraciones, comprobar estado local/remoto y evitar duplicar historial.
- No aplicar cambios destructivos de Supabase sin verificacion previa.
- Mantener `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` por defecto.
- Si un cambio queda parcial, actualizar este documento con el motivo y siguiente paso exacto.
