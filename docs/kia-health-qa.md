# Kia Health QA

Ultima revision: 2026-05-23

## Checklist manual

1. Aplicar migraciones en Supabase.
2. Abrir `/admin/kia-health`.
3. Ejecutar canary manual.
4. Verificar que se crea `kia_health_runs`.
5. Verificar que se crean `kia_health_check_results`.
6. Provocar un fallo controlado y verificar `kia_behavior_anomalies`.
7. Acknowledge de anomalía desde panel.
8. Ejecutar `/api/cron/kia-health` con `CRON_SECRET`.
9. Confirmar que Panel Gerente muestra resumen de Kia Health.
10. Confirmar que no se guardan secretos en resultados.

## No hacer

- No usar conversaciones reales completas como input de canary.
- No guardar API keys.
- No depender de un LLM grader.
- No bloquear produccion por warning menor.
- No activar `KIA_AI_TOOLS_ENABLED=true` por defecto.
