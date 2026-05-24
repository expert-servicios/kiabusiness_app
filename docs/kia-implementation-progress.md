# Kia Implementation Progress

Ultima actualizacion: 2026-05-24

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

## Verificado

```bash
npm run typecheck
npm run kia:eval
npm run kia:auditor:test
npm run build
```

Resultado local: typecheck, 161 evals de Kia, 13 fixtures de Kia Auditor y build pasan.

## Pendiente antes de retomar

- Aplicar migraciones en Supabase remoto:
  - `20260523171440_kia_decision_logs.sql`
  - `20260523182625_kia_health_check.sql`
  - `20260524060850_kia_auditor_reviews.sql`
- Bloqueo actual para aplicar desde este entorno: `.env.local` usa la connection string directa `db.<project-ref>.supabase.co`, que resuelve solo por IPv6. Esta maquina no puede abrir esa ruta; usar la connection string de Supavisor Session Pooler/Transaction Pooler del Dashboard o enlazar el proyecto con una red compatible.
- Verificar RLS, grants y exposicion via Data API para las tablas nuevas.
- Configurar feature flags de produccion segun el nivel de prueba deseado.
- Ejecutar un canary manual desde `/admin/kia-health`.
- Probar WABA con usuarios amigos/testers, especialmente:
  - no pedir ni repetir API keys,
  - no checkout sin login/perfil/billing/Holded cuando aplique,
  - Holded/planes con readiness, no viabilidad,
  - dudas complejas con llamada de 15 minutos, no `needs_review`,
  - respuestas no repetitivas.
- Anadir un canary especifico de repeticion con dos mensajes consecutivos parecidos.
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
