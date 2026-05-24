# Kia AI Output Schemas

Ultima revision: 2026-05-23

## KiaDecision

`KiaDecision` es el contrato principal para decisiones internas:

- `version`: actualmente `1.0`.
- `taskType`: tarea solicitada.
- `contactStatus`: `lead`, `client` o `unknown`.
- `intent`: intencion clasificada.
- `userMessage`: texto breve listo para canal.
- `nextAction`: siguiente accion operativa.
- `toolRequests`: herramientas solicitadas, no ejecutadas por la IA.
- `dataToSave`: datos candidatos, siempre validados por backend.
- `confidence`: 0 a 1.
- `requiresMeeting`: si conviene llamada/reunion.
- `requiresManualReview`: solo para casos permitidos.
- `decisionSummary`: resumen auditable.
- `rulesApplied`: reglas aplicadas.
- `missingData`: datos minimos que faltan.
- `warnings`: avisos no bloqueantes.

`nextAction` incluye tambien `get_case_status` para consultas de cliente/expediente, manteniendo la ejecucion real como tool/backend validado.

## Reglas

- JSON invalido se repara una vez.
- Si la reparacion falla, se devuelve fallback seguro.
- `requiresManualReview=true` no puede ser salida comercial normal.
- No se guarda razonamiento oculto completo.
