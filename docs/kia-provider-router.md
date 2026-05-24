# Kia Provider Router

Ultima revision: 2026-05-23

## Funcion

`lib/ai/kia/kia-provider-router.ts` envuelve la configuracion ya existente en `lib/integrations/waba-ai.ts`.

## Orden

- Usa `AI_PROVIDER` como preferencia.
- Si `AI_PROVIDER=anthropic` y `ANTHROPIC_API_KEY` existe, empieza por Anthropic.
- Si falla y `OPENAI_API_KEY` existe, prueba OpenAI.
- Si no hay proveedor, devuelve error estructurado.

## Esfuerzo

- `low`: WABA simple.
- `medium`: admin compose.
- `high`: documentos, viabilidad, readiness, next best action.
- `xhigh`: anomalias contables y estado de empresa.

## Logging

El router registra proveedor, modelo, tarea y error redacted. No registra mensajes completos ni secretos.
