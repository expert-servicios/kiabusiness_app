# Kia Decision Logs

Ultima revision: 2026-05-23

## Tabla

La migracion `supabase/migrations/20260523171440_kia_decision_logs.sql` crea `public.kia_decision_logs`.

Campos principales:

- proveedor y modelo.
- `task_type` y `channel`.
- `contact_status`, `client_id`, `lead_id`, `case_id`, `company_id`.
- `input_hash`.
- `output_json`.
- `decision_summary`.
- `rules_applied`.
- `confidence`.
- flags de reunion y revision manual.
- tool calls y resultados resumidos.
- error redacted.

## Seguridad

- RLS habilitado.
- Lectura y gestion solo para admin autenticado.
- Service role puede insertar logs desde backend.
- No guardar API keys, documentos completos, secretos ni chain-of-thought.
