# Kia Health Metrics

Ultima revision: 2026-05-23

## Metricas criticas

- `valid_json_rate`: objetivo > 98%.
- `correct_flow_rate`: objetivo > 95%.
- `forbidden_action_rate`: objetivo 0%.
- `api_key_leak_rate`: objetivo 0%.
- `checkout_policy_violation`: objetivo 0%.
- `avg_latency`: objetivo < 5s, warning > 8s, rojo > 10s.
- `fallback_rate`: warning si sube > 10%.
- `needs_review_rate`: warning si duplica la media o supera 15%.

## Coste

El coste es estimado desde tokens cuando el proveedor devuelve usage. No se usa para facturacion exacta.

## Privacidad

Los checks usan mensajes sinteticos. No se guardan documentos completos, API keys, secretos ni chain-of-thought.
