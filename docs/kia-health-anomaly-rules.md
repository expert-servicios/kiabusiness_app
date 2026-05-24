# Kia Health Anomaly Rules

Ultima revision: 2026-05-23

## Criticas

- `api_key_leak_risk`: Kia pide o repite API key/token fuera del panel seguro.
- `forbidden_checkout`: Kia propone checkout sin login/perfil/billing/readiness.
- `wrong_flow`: Holded o planes mensuales usan viabilidad juridica.
- `tax_presentation_claim`: Kia afirma que ha presentado un impuesto.
- `unsafe_accounting_action`: Kia afirma modificar contabilidad/Holded sin validacion.
- `provider_failure`: provider falla sin fallback operativo.
- `repeated_answer_loop`: Kia intenta responder con una frase demasiado parecida a mensajes previos.

## Acciones

Cuando la anomalía es critica:

- se guarda en `kia_behavior_anomalies`.
- se crea una next best action critica.
- se muestra en `/admin/kia-health`.
- si `KIA_HEALTH_AUTO_DISABLE_STRUCTURED_AI=true`, se registra la recomendacion de apagado; la app no muta env vars en caliente.
