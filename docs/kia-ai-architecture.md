# Kia AI Architecture

Ultima revision: 2026-05-24

## Objetivo

Kia deja de depender solo de texto libre y gana una capa incremental de decision estructurada. El motor determinista actual sigue mandando en WABA; la nueva capa vive en `lib/ai/kia` y se activa por flags.

## Principios

- No reescribir `kia-engine.ts`, `waba-ai.ts`, WABA, checkout, readiness ni Holded.
- La IA decide y resume; el backend valida y ejecuta.
- No se guarda chain-of-thought. Se guarda `decisionSummary`, reglas, confianza, proveedor, herramientas y resultados resumidos.
- `needs_review` solo se permite para fallo tecnico, salida invalida, ambiguedad extrema o toma manual admin.
- La llamada de 15 minutos es la via humana comercial; no es una escalacion tecnica normal.

## Modulos

- `kia-system-prompt.ts`: prompt maestro con contrato XML, few-shot y addendum de sub-agente.
- `kia-context-builder.ts`: contexto pequeno y tipado desde Supabase y catalogo; carga memorias RAG en paralelo.
- `kia-output-schema.ts`: `KiaDecision` validado con Zod.
- `kia-provider-router.ts`: Anthropic/OpenAI con fallback; routing Sonnet/Haiku/GPT-4o por tarea.
- `kia-tool-definitions.ts`: herramientas con schema estricto.
- `kia-tool-executor.ts`: validacion server-side y ejecucion no critica.
- `kia-decision-engine.ts`: orquestador de contexto, proveedor, reparacion, herramientas y logs.
- `kia-decision-log.ts`: persistencia auditable con tokens, coste e iteraciones.
- `kia-evals.ts`: base para fixtures y checks antes de pruebas reales.
- `kia-response-variation.ts`: reglas anti-repeticion para comparar respuestas nuevas con mensajes recientes.
- `kia-progress.ts`: tipos `KiaProgressEvent` para streaming SSE (F4).
- `kia-memory-store.ts`: generacion de embedding y persistencia en `kia_memories` (F5).
- `kia-memory-retriever.ts`: busqueda pgvector por similitud y formateo de bloque de contexto (F5).
- `kia-feedback-store.ts`: parseo de botones `kia_fb_g:`/`kia_fb_b:` y persistencia de valoraciones (F6).
- `kia-few-shot-provider.ts`: recuperacion de ejemplos positivos para inyeccion en prompt (F6).
- `kia-sub-agent-router.ts`: seleccion de perfil fiscal/holded/case segun intent y tarea (F7).
- `kia-cost-tracker.ts`: estimacion y acumulacion de costes por modelo e iteracion (F8).
- `kia-ocr-extractor.ts`: extraccion OCR de facturas via GPT-4o Vision (F3).

## Anti-repeticion

Antes de responder, Kia debe revisar `conversation.recentMessages` y el mensaje seleccionado si existe. Si la respuesta candidata se parece demasiado a una respuesta reciente de Kia/EXPERT, el decision engine reintenta una vez manteniendo la misma decision operativa pero cambiando redaccion, apertura, cierre, CTA y estructura.

Si no logra mejorar la redaccion, conserva la respuesta segura y registra warning/regla para que Kia Health pueda crear una anomalia `repeated_answer_loop`.

## Activacion

Por defecto todo queda apagado salvo logs:

```env
KIA_STRUCTURED_AI_ENABLED=false
KIA_STRUCTURED_AI_ADMIN_ENABLED=false
KIA_STRUCTURED_AI_WABA_ENABLED=false
KIA_AI_DECISION_LOGS_ENABLED=true
KIA_AI_PROVIDER_ROUTER_ENABLED=true
KIA_AI_TOOLS_ENABLED=false
```

La activacion puede hacerse en produccion con usuarios amigos/testers, siempre con logs y kill switch. Para encender todo el experimento conversacional sin herramientas criticas:

```env
KIA_STRUCTURED_AI_ENABLED=true
KIA_STRUCTURED_AI_ADMIN_ENABLED=true
KIA_STRUCTURED_AI_WABA_ENABLED=true
KIA_AI_TOOLS_ENABLED=false
KIA_AI_DOCUMENT_CLASSIFICATION_ENABLED=false
KIA_AI_ACCOUNTING_SUMMARY_ENABLED=false
KIA_AI_MEMORY_ENABLED=true
KIA_AI_FEEDBACK_ENABLED=true
KIA_AI_SUB_AGENTS_ENABLED=true
```

`KIA_STRUCTURED_AI_ADMIN_ENABLED` y `KIA_STRUCTURED_AI_WABA_ENABLED` permiten apagar un canal sin apagar la arquitectura completa.

La observabilidad operativa vive en `docs/kia-health-check.md` y `/admin/kia-health`.

La documentacion de las fases F1-F8 vive en `docs/kia-f1-f8-intelligence.md`.
