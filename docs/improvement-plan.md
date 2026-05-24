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

Estado: [ ]

Tipo: seguridad, Supabase, escalabilidad SaaS.

Riesgo: `client_integrations.encrypted_api_key` esta en una tabla expuesta con `grant select` a `authenticated`. RLS limita filas, pero no columnas. Un cliente podria leer su ciphertext si usa la Data API directamente.

Archivos principales:

- `supabase/migrations/20260523160000_client_integrations_and_sync_jobs.sql`
- `lib/integrations/holded/holded-auth.ts`
- `lib/security/encryption.ts`

Criterio de aceptacion:

- `authenticated` no puede seleccionar `encrypted_api_key`.
- El frontend solo puede leer columnas seguras (`api_key_last4`, estado, permisos, timestamps).
- La lectura server-side para descifrar sigue usando service role o schema privado.
- Existe query de verificacion documentada.

Opciones validas:

- Mover secretos a tabla privada no expuesta.
- Crear vista segura con `security_invoker = true` y revocar acceso directo a la tabla.
- Separar `client_integrations` publico de `client_integration_secrets`.

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

Estado: [ ]

Tipo: pagos, operacion, Stripe.

Riesgo: los reintentos de Stripe pueden reenviar emails y repetir sincronizaciones Holded aunque el `order` ya exista.

Archivos principales:

- `app/api/stripe/webhook/route.ts`
- `supabase/migrations/*`
- `lib/integrations/holded.ts`

Criterio de aceptacion:

- Se registra `stripe_event_id` en una tabla con constraint unico.
- Cada evento se procesa una vez o se marca como ya procesado.
- Emails y syncs quedan protegidos contra duplicados.
- Checkout Sessions y Billing siguen siendo las APIs principales.

### IMP-005 - Pasar side effects de Holded a cola durable

Estado: [ ]

Tipo: operacion, Holded, fiabilidad.

Riesgo: sincronizaciones Holded lanzadas con `.then()` desde webhooks pueden no terminar en runtime serverless.

Archivos principales:

- `app/api/stripe/webhook/route.ts`
- `supabase/migrations/20260523160000_client_integrations_and_sync_jobs.sql`
- `lib/integrations/holded.ts`
- `lib/integrations/holded/`

Criterio de aceptacion:

- El webhook crea/actualiza un job o evento durable.
- La ejecucion Holded se hace en ruta controlada, cron o worker.
- Hay reintento manual visible desde `/admin/integraciones`.
- Fallos Holded no bloquean pagos ni creacion de expedientes.

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

Estado: [ ]

Tipo: seguridad, comunicacion.

Riesgo: algunas plantillas de email insertan campos del usuario sin escapar, por ejemplo contacto y presupuestos.

Archivos principales:

- `lib/email/templates.ts`
- `app/api/contact/route.ts`
- `app/api/quotes/route.ts`

Criterio de aceptacion:

- Todo contenido de usuario se escapa antes de interpolar HTML.
- Solo helpers controlados generan HTML permitido.
- Emails de prueba mantienen formato correcto.

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

Estado: [~]

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
- [ ] `supabase migration list --local` o verificacion remota equivalente.
- [ ] Canary manual desde `/admin/kia-health`.
- [ ] Prueba manual WABA con usuarios amigos/testers.

Notas:

- Implementado en local el 2026-05-23/24: arquitectura `lib/ai/kia`, decision logs, health checks, canary runner, API admin, cron protegido, panel admin, badge en Panel Gerente, docs y fixtures.
- Pendiente aplicar migraciones en Supabase remoto. En local no se verifico con `supabase migration list --local` porque el Postgres local no estaba levantado en `127.0.0.1:54322`.
- El 2026-05-24 se intento `supabase db push --db-url $DATABASE_URL --dry-run`; no conecto porque el host directo de Supabase resuelve por IPv6 y esta maquina no tiene ruta valida. Siguiente paso: usar connection string pooler IPv4-compatible del Dashboard o enlazar proyecto Supabase en un entorno con IPv6.
- Las nuevas capacidades deben permanecer bajo flags hasta completar canary manual y prueba real controlada.

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

Estado: [ ]

Tipo: automatizacion, retencion, operacion.

Criterio de aceptacion:

- Recordatorios de documentacion pendiente.
- Seguimiento de presupuestos abiertos.
- Alertas de pago fallido visibles y accionables.
- Resumen diario admin.

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
