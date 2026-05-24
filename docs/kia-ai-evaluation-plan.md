# Kia AI Evaluation Plan

Ultima revision: 2026-05-23

## Objetivo

Probar la arquitectura antes de activar flujos publicos. Los fixtures viven en `tests/fixtures/kia` y el script se ejecuta con:

```bash
npm run kia:eval
```

## Checks minimos

- Intent correcto.
- `nextAction` correcto.
- No pedir API key por WhatsApp.
- No crear checkout si falta login, perfil o billing.
- No usar `needs_review` salvo casos permitidos.
- No inventar normativa.
- Generar `decisionSummary`.
- `rulesApplied` no vacio.
- JSON valido.
- No filtrar secretos.

## Bateria automatizada actual

`npm run kia:eval` valida fixtures unitarios y suites por canal. La bateria actual cubre 161 casos:

- lead flow.
- checkout.
- viabilidad fiscal/juridica.
- readiness Holded.
- planes mensuales.
- seguridad API key Holded.
- cliente existente.
- expedientes.
- documentos.
- admin compose con mensaje seleccionado.
- estado de empresa.
- anomalias contables.
- casos permitidos de `needs_review`.
- anti-tests.
- flujo ruso.

## Fases

1. Fixtures estaticos sin proveedor externo.
2. `KIA_AI_EVAL_MODE=true` para heuristicas locales.
3. Admin compose con logs.
4. WABA fallback en entorno controlado.
5. Revision manual de conversaciones reales anonimizadas.
