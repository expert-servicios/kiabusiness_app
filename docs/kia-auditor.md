# Kia Auditor

Fecha: 2026-05-23

## Qué es

Kia Auditor es el agente interno de revisión de comportamiento de Kia. Evalúa si Kia siguió las reglas de EXPERT, protegió datos sensibles, eligió el flujo correcto y produjo una siguiente acción adecuada.

**Kia Auditor NO es Kia Health.** La diferencia:

| | Kia Health | Kia Auditor |
|---|---|---|
| Mide | Salud técnica, latencia, canaries | Calidad, comportamiento, reglas |
| Revisa | Si el sistema funciona | Si Kia se comporta bien |
| Genera | Anomalías técnicas | Reviews auditables |
| Actúa | Auto-disable en fallos críticos | Crea anomalías y NBAs |

## Arquitectura

```
lib/ai/kia-auditor/
├── kia-auditor-types.ts         — Tipos TypeScript
├── kia-auditor-rules.ts         — Definición de 20 reglas
├── kia-auditor-grader.ts        — Grader determinista
├── kia-auditor-prompt.ts        — Prompt para LLM judge
├── kia-auditor-engine.ts        — Engine principal + persist
├── kia-auditor-reports.ts       — Formateo y clasificación
├── kia-auditor-fixtures.ts      — Fixtures de test (13 casos)
└── kia-auditor-public-guidelines.ts — Constantes de buenas prácticas
```

## Reglas

Kia Auditor evalúa 20 reglas distribuidas en 4 tipos:

- **Deterministas** (grader por código): 16 reglas
- **LLM judge** (cualitativas): 4 reglas
- **Críticas** (fallo = review fail): 10 reglas

Ver detalle en `docs/kia-auditor-rules.md`.

## Flujo de auditoría

1. Cargar datos (decision log, conversación o mensaje)
2. Redactar secretos con `kia-redaction.ts`
3. Aplicar grader determinista (sin LLM)
4. Si no hay fallo crítico → llamar LLM judge para criterios cualitativos
5. Combinar resultados → calcular score y status
6. Persistir en `kia_auditor_reviews` + `kia_auditor_rule_results`
7. Si fallo crítico → crear `kia_behavior_anomaly` + NBA
8. Devolver review

## Tablas DB

### `kia_auditor_reviews`
Review completa. Campos clave: `source_type`, `overall_status`, `score`, `findings`, `rules_passed`, `rules_failed`, `recommendations`.

### `kia_auditor_rule_results`
Resultado por regla individual. Referenciado por `review_id`.

## API Admin

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/admin/kia-auditor` | GET | Summary 7 días + lista reglas |
| `/api/admin/kia-auditor/review` | POST | Ejecutar auditoría |
| `/api/admin/kia-auditor/reviews` | GET | Listar reviews (paginado) |
| `/api/admin/kia-auditor/reviews/:id/ack` | POST | Acknowledge review |
| `/api/admin/kia-auditor/rules` | GET | Reglas con stats 30 días |

## Panel Admin

Ruta: `/admin/kia-auditor`

Incluye: overview con score y estado, top reglas falladas, lista de reviews, botones de auditoría manual, matriz de reglas con stats 30 días.

## Variables de entorno

```env
# Activar LLM judge (opcional, default: true si ANTHROPIC_API_KEY existe)
KIA_AUDITOR_LLM_ENABLED=true
```

## Tests

```bash
npm run kia:auditor:test
```

Ejecuta el grader determinista sobre 13 fixtures. Sale con código 1 si alguna regla crítica no se detecta.
