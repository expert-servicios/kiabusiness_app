# Kia Copilot, Holded y Dashboard Visual

Fecha: 2026-06-03

## Estado Actual

Kia ya tiene una base estructurada:

- `lib/ai/kia/kia-decision-engine.ts` produce decisiones JSON, logs y reglas aplicadas.
- `app/api/kia/copilot/route.ts` es el endpoint autenticado del chat Kia Copilot en dashboard.
- `lib/ai/kia/kia-tool-definitions.ts` define herramientas para Holded, informes, estado de empresa y enlaces seguros.
- `lib/ai/kia/kia-tool-executor.ts` ejecuta herramientas backend con validadores.
- `lib/reports/report-generator.ts` puede extraer datos de Holded, calcular KPIs, generar resumen IA y guardar un informe.
- `components/dashboard/reports/*` ya muestra graficos y tablas del informe.
- `app/(protected)/dashboard/estado-empresa/page.tsx` ya muestra estado fiscal-contable trimestral con datos Holded.
- `lib/integrations/official-sources.ts` ya busca o aporta fuentes oficiales, pero antes no estaba conectado al Decision Engine general.

## Mejoras Aplicadas

1. Kia Decision Engine ahora inyecta fuentes oficiales cuando la consulta lo requiere.
2. Kia Copilot ya no depende del flag global `KIA_AI_TOOLS_ENABLED`; usa `KIA_COPILOT_TOOLS_ENABLED`.
3. Kia Copilot ejecuta solo herramientas seguras de dashboard:
   - `get_holded_connection_status`
   - `get_holded_invoices`
   - `get_holded_contacts`
   - `get_holded_bank_balance`
   - `get_company_status_snapshot`
   - `generate_company_report`
   - `generate_holded_connection_link`
4. Kia Copilot devuelve artefactos UI:
   - informe visual con enlace,
   - enlace seguro para conectar Holded,
   - tablas resumidas de facturas o bancos.
5. El panel `KiaCopilotPanel` renderiza esos artefactos dentro del chat.
6. Se corrigio la busqueda de integracion Holded en `kia-tool-executor`: usa `context.company.id`, no `companyId`.
7. Si el usuario pide informe, graficos, dashboard, IVA o resumen de Holded, Copilot puede generar informe visual desde Holded.

## Resultado Esperado

Kia Copilot puede actuar de forma mas parecida a Claude:

- Responde en conversacion natural.
- Usa contexto del dashboard.
- Consulta fuentes oficiales cuando procede.
- Usa herramientas backend en vez de inventar datos.
- Si Holded esta conectado, genera informe visual con graficos.
- Si Holded no esta conectado, muestra enlace seguro al panel.
- No pide API keys por chat.
- No presenta impuestos ni modifica contabilidad.

## Brechas Pendientes

- Streaming de respuesta tipo Claude.
- Ventana de artefactos grande tipo "canvas" para graficos dentro del chat.
- Botones de accion mas ricos: regenerar informe, exportar Excel/PDF, abrir Estado de empresa.
- RAG completo de Holded Academy con chunks y embeddings.
- Memoria persistente de conversaciones de Kia Copilot, no solo historial local del componente.
- Analisis fiscal avanzado con comparativa trimestral, anomalias y recomendaciones accionables.
- Tests canarios especificos para Copilot + Holded + artefactos.

## Reglas De Seguridad

- Holded sigue siendo fuente de datos contables, no CRM operativo de EXPERT.
- Kia puede leer y resumir datos; no puede modificar contabilidad.
- Los resumenes fiscales deben indicar que son estimados y pendientes de revision profesional.
- Las API keys nunca se solicitan ni se muestran en chat.
- Las herramientas del Copilot quedan aisladas por allowlist.
