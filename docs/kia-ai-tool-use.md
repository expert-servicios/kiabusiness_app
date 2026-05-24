# Kia AI Tool Use

Ultima revision: 2026-05-23

## Contrato

La IA nunca ejecuta cambios criticos directamente. Solo puede solicitar `toolRequests` dentro de `KiaDecision`. El backend valida nombre, argumentos, canal, permisos y estado antes de ejecutar.

## Herramientas iniciales

- `resolve_contact_context`
- `get_client_profile`
- `get_service_registry_item`
- `run_viability_check`
- `run_readiness_check`
- `get_holded_connection_status`
- `create_next_best_action`
- `classify_document`
- `get_case_status`
- `create_internal_task`
- `generate_checkout_gate_link`
- `generate_profile_link`
- `generate_holded_connection_link`
- `get_company_status_snapshot`
- `create_kia_decision_log`

Todas tienen schema Zod y `strict: true` en la definicion expuesta al proveedor.

## Acciones prohibidas como tool directa

- Crear factura.
- Modificar contabilidad.
- Borrar documentos.
- Presentar impuestos.
- Actualizar asientos o facturas en Holded.
- Guardar API keys recibidas por chat.

Estas operaciones requieren backend especifico y confirmacion admin/profesional.

## Canales

El primer uso real es admin compose con `allowTools=false`. La ejecucion de herramientas queda detras de `KIA_AI_TOOLS_ENABLED=true`.
