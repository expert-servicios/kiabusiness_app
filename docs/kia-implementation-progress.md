# Kia Implementation Progress

Ultima actualizacion: 2026-05-25

## Estado general

Kia ya no es solo un fallback de texto libre. El proyecto tiene una capa incremental de decision estructurada, observabilidad, health checks y auditoria, manteniendo el motor determinista de WABA como primera linea.

## Implementado

- Arquitectura `lib/ai/kia` con system prompt, contexto estructurado, schema `KiaDecision`, provider router, tool definitions, executor, redaccion y decision logs.
- Compatibilidad con `waba-ai.ts` y fallback Anthropic/OpenAI.
- Integracion incremental en Admin Compose y WABA fallback/free-consult bajo feature flags.
- Evals locales con fixtures en `tests/fixtures/kia` y script `npm run kia:eval`.
- Kia Health con canaries, grader determinista, runner, summary, alertas, API admin, cron protegido y panel `/admin/kia-health`.
- Badge/resumen de Kia Health en Panel Gerente.
- Kia Auditor con reglas, grader determinista, APIs y panel admin.
- Migracion de persistencia de Kia Auditor con `kia_auditor_reviews` y `kia_auditor_rule_results`.
- Clasificador documental conectado a `runKiaDecision` cuando el flag lo permite.
- Anti-repeticion conversacional: Kia revisa historial antes de responder, evita repetir frases/CTA/estructura y reintenta una vez si detecta respuesta demasiado parecida.
- Deteccion de anomalia `repeated_answer_loop` para respuestas repetitivas.
- Canary anti-repeticion con historial sintetico y umbral de similitud.
- Quick replies estructuradas en `KiaDecision`, normalizador `Otro` / `Другое` y manejo de `btn_other`.
- Guardia de idioma por ultimo mensaje: el `locale` explicito del ultimo inbound manda sobre el historial.
- Voz de Kia reforzada: se presenta como Kia, asistente virtual de EXPERT, y habla de si misma en femenino.
- Compatibilidad temporal del API de anomalías Health con esquema antiguo (`resolved`) y nuevo (`status`).

## Verificado

```bash
npm run typecheck
npm run kia:eval
npm run kia:auditor:test
npm run build
```

Resultado local anterior: typecheck, 161 evals de Kia, 21 fixtures de Kia Auditor y build pasan.

## Ejecucion 2026-05-25

- Supabase remoto responde por Data API para:
  - `kia_decision_logs`
  - `kia_health_runs`
  - `kia_health_check_results`
  - `kia_behavior_anomalies`
  - `kia_auditor_reviews`
  - `kia_auditor_rule_results`
  - `client_integration_secrets`
- La ruta Postgres directa sigue bloqueada desde esta maquina: `db.<project-ref>.supabase.co` resuelve solo por IPv6 y la red local no tiene salida IPv6.
- El pooler correcto es `aws-0-eu-west-2.pooler.supabase.com`, pero el password de `DATABASE_URL` no autentica. La CLI local y `supabase@latest` fallan igual para `db push`.
- Con token Supabase con permisos, la CLI ya pudo enlazar el repo a `ybtpqscmqrrjjmuoryap` y la Management API permitio ejecutar SQL de reparacion.
- Se detecto desfase de esquema remoto en `kia_behavior_anomalies`: remoto antiguo usa `resolved/resolved_at`; codigo nuevo espera `status/updated_at`.
- Creadas y aplicadas en remoto por Management API las migraciones de reparacion:
  - `20260525162302_kia_health_schema_repair.sql`
  - `20260525172343_kia_rls_repair.sql`
  - `20260525172441_kia_grants_repair.sql`
- Verificacion remota:
  - `kia_behavior_anomalies` tiene `status` y `updated_at`.
  - `kia_health_check_results` tiene `decision_log_id`.
  - RLS activo en logs, health, anomalies, auditor y secrets.
  - `anon` sin grants en tablas Kia/secretos.
  - `authenticated` solo SELECT en tablas Kia admin, sin acceso a `client_integration_secrets`.
  - `service_role` con CRUD.
  - Data API: service role OK, anon recibe `permission denied`.
- Configurado `SECRET_ENCRYPTION_KEY` en `.env.local`, Vercel production y Vercel development. Preview queda pendiente si se necesita una rama preview concreta.
- Ejecutado Kia Health persistente contra remoto:
  - Run final post-RLS/grants `d1624025-9108-4b70-8051-5c1e2afe3712`
  - Resultado: `Kia Health amarillo: 28/29 OK, 1 warnings, 0 fallos.`
  - Unico warning: mas de 5 Next Best Actions criticas abiertas.
- Ajustado `supabase/config.toml` a `major_version = 15`, igual que el remoto.
- Verificado despues de cambios:

```bash
npm run typecheck
npx eslint lib/ai/kia/kia-decision-engine.ts lib/ai/kia/health/kia-health-grader.ts
npm run kia:eval
npm run kia:auditor:test
npm run build
```

Resultado: typecheck OK, lint focalizado OK, 161 evals OK, 21 fixtures de Auditor OK y build Next OK.

## Ejecucion 2026-05-24

- Canary Kia no persistente ejecutado con proveedores reales: `Kia Health verde: 11/11 checks OK`.
- WABA Meta verificado por API: token valido, phone number conectado, calidad GREEN y WABA ACTIVE.
- No se ejecuto canary persistente desde `/admin/kia-health` porque las migraciones remotas siguen pendientes y las tablas de logs/health/auditor aun no existen en Supabase remoto.
- No se enviaron mensajes reales a testers porque no hay numeros de prueba configurados en env ni proporcionados en esta sesion.

## Pendiente antes de retomar

- Si queremos volver a usar `supabase db push`, actualizar `DATABASE_URL` con el password DB/pooler vigente. Mientras tanto, SQL remoto funciona por Management API con token autorizado.
- Configurar feature flags de produccion segun el nivel de prueba deseado.
- Abrir `/admin/kia-health` y confirmar visualmente que muestra el run final guardado.
- Probar WABA con usuarios amigos/testers, especialmente:
  - no pedir ni repetir API keys,
  - no checkout sin login/perfil/billing/Holded cuando aplique,
  - Holded/planes con readiness, no viabilidad,
  - dudas complejas con llamada de 15 minutos, no `needs_review`,
  - respuestas no repetitivas.
- Conectar automaticamente `detectKiaProductionAnomalies()` al guardado de `kia_decision_logs` si se quiere crear anomalias en caliente desde produccion.

## Flags recomendados para pruebas con amigos

```env
KIA_STRUCTURED_AI_ENABLED=true
KIA_STRUCTURED_AI_ADMIN_ENABLED=true
KIA_STRUCTURED_AI_WABA_ENABLED=true
KIA_AI_TOOLS_ENABLED=false
KIA_AI_DOCUMENT_CLASSIFICATION_ENABLED=false
KIA_AI_ACCOUNTING_SUMMARY_ENABLED=false
KIA_HEALTH_ENABLED=true
KIA_HEALTH_CANARY_ENABLED=true
KIA_HEALTH_ALERTS_ENABLED=true
```

Mantener herramientas criticas apagadas hasta validar health, auditor y flujos WABA reales.

## No tocar sin motivo

- `lib/integrations/kia-engine.ts` sigue siendo la primera linea determinista.
- `lib/integrations/waba-ai.ts` sigue siendo wrapper compatible.
- La llamada de 15 minutos es la via humana comercial.
- `needs_review` sigue reservado para fallos reales, ambiguedad extrema, output invalido o toma manual admin.
- Kia no pide API keys por WhatsApp/email, no presenta impuestos, no modifica contabilidad y no crea checkout si faltan requisitos.
