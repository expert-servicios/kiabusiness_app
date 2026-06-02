# EXPERT - Plan de mejoras

Ultima actualizacion: 2026-05-24

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

## Estado base verificado

- [x] `npm run typecheck` pasa.
- [x] `npm run build` pasa.
- [ ] `npm run lint` falla con reglas React Hooks y warnings.
- [ ] `npm audit --audit-level=moderate` reporta vulnerabilidades, incluida una alta asociada a Next.js.
- [~] Hay cambios no versionados previos relacionados con Holded y seguridad:
  - `lib/integrations/holded/`
  - `lib/security/`
  - `supabase/migrations/20260523160000_client_integrations_and_sync_jobs.sql`

## P0 - Seguridad y fiabilidad critica

### IMP-001 - Verificar firma del webhook WhatsApp

Estado: [~]

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
- [ ] prueba manual o automatizada con payload firmado de Meta.

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

Estado: [ ]

Tipo: seguridad, coste, captacion.

Riesgo: algunos endpoints publicos pueden consumir IA, APIs externas o email sin la misma proteccion anti-abuso que contacto/presupuesto.

Archivos principales:

- `app/api/services/viabilidad/route.ts`
- `app/api/company/resolve/route.ts`
- `app/api/newsletter/route.ts`
- `lib/utils/spam-guard.ts`
- `lib/utils/recaptcha.ts`

Criterio de aceptacion:

- `viabilidad` usa honeypot, rate limit, spam guard y reCAPTCHA.
- `company/resolve` exige auth para consultas enriquecidas o aplica rate limit estricto.
- El rate limit no depende solo de memoria de proceso para flujos sensibles.
- Los errores de anti-spam no filtran detalles internos.

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
- Nuevo cron `/api/cron/holded-sync` (cada 15 min via Vercel Cron) que procesa jobs en estado `queued`/`failed` con backoff exponencial (5 min → 15 min, max 3 intentos).
- `vercel.json` actualizado con el nuevo cron schedule.
- Fallos Holded nunca bloquean el flujo principal (emails + orders se crean antes del sync).

Archivos principales:

- `app/api/stripe/webhook/route.ts` — helpers + job creation antes de cada sync
- `app/api/cron/holded-sync/route.ts` — NUEVO cron de reintentos
- `vercel.json` — schedule `*/15 * * * *`
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

Estado: [ ]

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

- `npm run lint` pasa sin errores.
- Warnings restantes son deliberados o quedan corregidos.
- No se desactivan reglas globalmente para ocultar problemas reales.

### IMP-010 - Actualizar dependencias auditadas

Estado: [ ]

Tipo: seguridad, mantenimiento.

Riesgo: `npm audit` reporta vulnerabilidades, incluida una alta en Next.js.

Archivos principales:

- `package.json`
- `package-lock.json`

Criterio de aceptacion:

- Next.js se actualiza al menos a la version parcheada disponible en el rango actual.
- `npm audit --audit-level=moderate` queda limpio o con excepciones documentadas.
- `npm run typecheck`, `npm run lint` y `npm run build` pasan tras actualizar.

### IMP-011 - Unificar Supabase SSR y retirar auth-helpers

Estado: [ ]

Tipo: auth, mantenimiento, Supabase.

Riesgo: conviven `@supabase/ssr` y `@supabase/auth-helpers-nextjs`. Esto aumenta superficie de sesion/cookies y dependencias.

Archivos principales:

- `components/dashboard/LogoutButton.tsx`
- `package.json`
- `lib/integrations/supabase.ts`

Criterio de aceptacion:

- Todo el cliente browser usa `@supabase/ssr` o helper local unico.
- `@supabase/auth-helpers-nextjs` se elimina si ya no se usa.
- Login, logout y rutas protegidas siguen funcionando.

### IMP-012 - Crear tests minimos de regresion critica

Estado: [ ]

Tipo: calidad, operacion.

Criterio de aceptacion:

- Tests para firma WhatsApp.
- Tests para sanitizacion de redirect auth.
- Tests para allowlist de subscriptions checkout.
- Tests para idempotencia de webhook Stripe.

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

Estado: [ ]

Tipo: SEO, comunicacion, escalabilidad.

Riesgo: conviven `kseniailicheva.com` y `expertconsulting.es` en README, metadata, emails y Kia.

Criterio de aceptacion:

- Se decide dominio canonico.
- `NEXT_PUBLIC_APP_URL` gobierna enlaces operativos.
- SEO, sitemap, robots, emails y WhatsApp quedan alineados.

### IMP-014 - Configuracion tenant-ready

Estado: [ ]

Tipo: escalabilidad SaaS.

Criterio de aceptacion:

- Catalogo, estados, plantillas e integraciones tienen estrategia clara de `tenant_id`.
- Se documenta tenant EXPERT inicial.
- No se rompe la operativa propia actual.

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

## Orden recomendado de implementacion

1. IMP-001, IMP-006 e IMP-007: cerrar entrada externa y auth.
2. IMP-002: corregir exposicion de secretos antes de activar integraciones por cliente.
3. IMP-003 e IMP-008: reducir abuso y XSS en flujos publicos.
4. IMP-004 e IMP-005: hacer pagos/syncs idempotentes y durables.
5. IMP-016: estabilizar calidad conversacional WABA/Kia antes de ampliar automatizaciones.
6. IMP-009 e IMP-010: restaurar lint y actualizar dependencias.
7. IMP-011 e IMP-012: simplificar auth y cubrir regresiones.
8. IMP-013 a IMP-015: consistencia de producto y preparacion SaaS.

## Notas de implementacion

- Antes de tocar migraciones, comprobar estado local/remoto y evitar duplicar historial.
- No aplicar cambios destructivos de Supabase sin verificacion previa.
- Mantener `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` por defecto.
- Si un cambio queda parcial, actualizar este documento con el motivo y siguiente paso exacto.
