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

- `kia-system-prompt.ts`: prompt maestro con contrato XML.
- `kia-context-builder.ts`: contexto pequeno y tipado desde Supabase y catalogo.
- `kia-output-schema.ts`: `KiaDecision` validado con Zod.
- `kia-provider-router.ts`: Anthropic/OpenAI con fallback.
- `kia-tool-definitions.ts`: herramientas con schema estricto.
- `kia-tool-executor.ts`: validacion server-side y ejecucion no critica.
- `kia-decision-engine.ts`: orquestador de contexto, proveedor, reparacion, herramientas y logs.
- `kia-decision-log.ts`: persistencia auditable.
- `kia-evals.ts`: base para fixtures y checks antes de pruebas reales.
- `kia-response-variation.ts`: reglas anti-repeticion para comparar respuestas nuevas con mensajes recientes.

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
```

`KIA_STRUCTURED_AI_ADMIN_ENABLED` y `KIA_STRUCTURED_AI_WABA_ENABLED` permiten apagar un canal sin apagar la arquitectura completa.

La observabilidad operativa vive en `docs/kia-health-check.md` y `/admin/kia-health`.
