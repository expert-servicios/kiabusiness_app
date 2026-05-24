# Kia Auditor — Auditoría Previa

Fecha: 2026-05-23
Autor: Análisis previo a implementación

---

## 1. Logs existentes

### Tablas de logs referenciadas en código (pendientes de migración)

| Tabla | Estado | Código que la usa |
|---|---|---|
| `kia_decision_logs` | ⚠️ Código listo, tabla NO existe | `lib/ai/kia/kia-decision-log.ts` |
| `kia_health_runs` | ⚠️ Código listo, tabla NO existe | `lib/ai/kia/health/kia-health-runner.ts` |
| `kia_health_check_results` | ⚠️ Código listo, tabla NO existe | `lib/ai/kia/health/kia-health-runner.ts` |
| `kia_behavior_anomalies` | ⚠️ Código listo, tabla NO existe | `lib/ai/kia/health/kia-health-alerts.ts` |

### Tablas existentes relacionadas

| Tabla | Estado | Uso |
|---|---|---|
| `kia_sessions` | ✅ Existe | Estado de conversación WhatsApp |
| `kia_cart_items` | ✅ Existe | Items de carrito Kia |
| `kia_reports` | ✅ Existe | Informes generados por Kia |
| `next_best_actions` | ✅ Existe | Acciones NBA generadas |
| `leads` | ✅ Existe | Leads captados |

### Tablas a crear con Kia Auditor

| Tabla | Propósito |
|---|---|
| `kia_auditor_reviews` | Reviews completas de auditoría |
| `kia_auditor_rule_results` | Resultados por regla individual |

---

## 2. Decisiones de Kia que se guardan

En `kia-decision-log.ts`, cada llamada al motor de decisión guarda:

```
provider, model, task_type, channel, contact_status,
client_id, lead_id, case_id, company_id,
input_hash (SHA-256, redactado),
output_json (redactado con kia-redaction.ts),
decision_summary, rules_applied[], confidence,
requires_meeting, requires_manual_review,
tool_calls (redactado), tool_results_summary (redactado),
error
```

**Redacción aplicada** (`kia-redaction.ts`):
- Emails → `[email]`
- Teléfonos → `[phone]`
- IBANs → `[iban]`
- API keys (`sk-`, `rk-`, `pk-`, `whsec`, `xoxb`, `AIza`, `key`, `token`) → `[secret]`
- Campos con `api_key`, `apikey`, `secret`, `token` en nombre → `[secret]`

**Flag de control**: `KIA_AI_DECISION_LOGS_ENABLED=false` desactiva logs.

---

## 3. Qué puede revisar Kia Auditor

### ✅ Fuentes disponibles para auditar

| Fuente | Datos accesibles | Condición |
|---|---|---|
| `kia_decision_logs` | Decisión completa redactada, canal, contactStatus, rules_applied, confidence, tool_calls | Tabla pendiente de migración |
| `kia_health_runs` | Score, estado, duración, proveedor | Tabla pendiente de migración |
| `kia_health_check_results` | Check por check, input redactado, expected vs actual | Tabla pendiente de migración |
| `kia_behavior_anomalies` | Anomalías detectadas, tipo, severity | Tabla pendiente de migración |
| `kia_sessions` | Flow, step, lang, service_id, estado de sesión | Existente |
| `next_best_actions` | Acciones generadas, tipo, prioridad, estado | Existente |
| `wa_conversations` | Mensajes WhatsApp (si existe la tabla) | Verificar |
| Fixture sintético | JSON de prueba para reglas deterministas | Siempre disponible |

---

## 4. Qué NO debe revisar Kia Auditor

| Datos | Razón |
|---|---|
| API keys desencriptadas | NUNCA. Se guardan cifradas con AES-256-GCM |
| Contraseñas de usuarios | Fuera de scope absoluto |
| Tokens de sesión | Fuera de scope |
| Datos bancarios completos | RGPD y seguridad |
| Documentos originales (binario) | Solo metadata/clasificación |
| Contenido completo de emails | Solo metadata si fuera necesario |
| NIF/NIE/CIF en texto libre | Solo valores ya redactados |
| Datos de menores | Protección especial |

---

## 5. Reglas evaluables por código (deterministas)

Estas reglas no requieren LLM. Se evalúan sobre el JSON de decisión:

| Regla | Método | Campo revisado |
|---|---|---|
| `json_schema_valid` | Zod parse del `kiaDecisionSchema` | `output_json` |
| `decision_summary_required` | `decisionSummary.trim() !== ''` | `decision_summary` |
| `rules_applied_required` | `rulesApplied.length > 0` | `rules_applied` |
| `confidence_in_range` | `0 <= confidence <= 1` | `confidence` |
| `no_api_key_in_output` | Regex `API_KEY_RE` sobre `output_json` string | Todos los campos texto |
| `no_secret_echo` | Regex `API_KEY_RE + IBAN_RE` sobre texto | Texto de respuesta |
| `needs_review_justified` | `requiresManualReview` solo si `confidence < 0.4` o error | `requires_manual_review` + `confidence` |
| `checkout_requires_auth_flag` | Si `nextAction === 'send_checkout_link'` → `rules_applied` debe incluir `checkout_requires_auth` | `next_action` |
| `holded_no_viability` | Si `taskType` incluye `holded` o `readiness` → `intent !== 'viability'` | `task_type`, `intent` |
| `tax_no_presentation_claim` | Palabras `presentar`, `presentado`, `ha sido presentado` en `decision_summary` | `decision_summary` |
| `no_accounting_write_claim` | Palabras `modificado`, `creado asiento`, `cambiado factura` en `decision_summary` | `decision_summary` |
| `next_action_not_null` | `nextAction !== null && nextAction !== ''` | `next_action` |
| `correct_language_flag` | Si `channel === 'waba'` → detectar idioma en `userMessage` vs `decisionSummary` | `user_message`, `decision_summary` |

---

## 6. Reglas que requieren LLM judge

Estas reglas necesitan capacidad de razonamiento lingüístico:

| Regla | Por qué necesita LLM |
|---|---|
| `no_normative_hallucination` | Detectar invención de plazos, importes, normativas |
| `response_clarity` | Evaluar si la respuesta es clara y accionable |
| `professional_tone` | Evaluar si el tono es profesional y empático |
| `context_not_ignored` | Verificar si Kia ignoró contexto relevante del cliente |
| `response_not_too_long` | Evaluar si la respuesta es demasiado larga o poco accionable |
| `lead_vs_client_correct` | Verificar si el tratamiento de lead/cliente es coherente con el contexto |
| `public_guidance_alignment` | Verificar alineación con página pública de buenas prácticas |

---

## 7. Reglas que requieren revisión humana

| Regla | Por qué requiere humano |
|---|---|
| `complex_tax_advice_review` | Asesoramiento fiscal complejo requiere criterio profesional |
| `legal_claim_verification` | Afirmaciones jurídicas requieren verificación de abogado |
| `anomaly_escalation` | Anomalías contables complejas requieren revisión contable |
| `client_data_dispute` | Disputas sobre datos de cliente requieren revisión humana |
| `critical_audit_findings` | Hallazgos críticos del auditor requieren acknowledgment admin |

---

## 8. Huecos antes de pruebas reales

| Gap | Impacto | Acción |
|---|---|---|
| Tablas kia_decision_logs/health_runs no existen | Alto — sin datos para auditar | Crear migración con esta implementación |
| `KIA_AI_DECISION_LOGS_ENABLED` puede estar en false | Medio — no se generan logs | Documentar que debe estar en true en producción |
| `kia_sessions` no guarda el texto del mensaje de respuesta | Medio — solo tenemos la decisión, no la respuesta literal | Auditor trabaja sobre decision_json |
| Sin datos históricos en producción | Alto al inicio | Auditor opera sobre fixtures hasta que se acumulen logs |
| Kia Health checks no persisten (tablas ausentes) | Alto — anomalías se pierden | Resolver con misma migración |
| `wa_conversations` puede no existir o tener estructura diferente | Medio | Auditor de conversaciones es opcional hasta verificar |
