# Kia AI Architecture Audit

Ultima actualizacion: 2026-05-23

## 1. Partes ya implementadas

- `lib/integrations/kia-engine.ts` contiene la maquina de estados determinista de Kia para WABA: bienvenida, lead/client routing, menus, precalificacion, readiness/viabilidad, checkout protegido, llamada de 15 minutos y fallback IA.
- `app/api/webhooks/whatsapp/route.ts` orquesta WABA: valida firma Meta, resuelve contacto, registra conversaciones, maneja media, ejecuta Kia Engine, side effects y fallback IA.
- `lib/integrations/kia-contact-resolver.ts` separa lead/client por telefono, perfil, casos abiertos, obligaciones fiscales y ultimo estado lead.
- `lib/integrations/waba-ai.ts` ya enruta texto libre por `AI_PROVIDER`, `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`, modelos configurables y fallback entre proveedores.
- `app/api/admin/whatsapp/ai-compose/route.ts` ya genera borradores para admin con contexto de contacto, historial, replyTo, checklists y fuentes oficiales.
- `components/admin/WhatsAppInbox.tsx` conserva la bandeja admin y toma manual de conversaciones.
- `lib/integrations/official-sources.ts` aporta fuentes oficiales para consultas fiscales, laborales, juridicas, extranjeria y mercantiles.
- Readiness/viabilidad/checkout existen en `lib/data/service-readiness-checks.ts`, `lib/data/viability-checks.ts`, `app/api/services/readiness/route.ts`, `app/api/services/checkout/route.ts`, `app/api/subscriptions/checkout/route.ts` y `/contratar`.
- Holded tiene auditoria y base avanzada: `client_integrations`, `integration_sync_events`, `external_mappings`, `service_readiness_assessments`, pantalla cliente de conexion y cliente unificado `lib/integrations/holded/holded-client.ts`.

## 2. Partes que no deben tocarse salvo bug

- Kia Engine sigue siendo la primera linea para flujos deterministas.
- La escalacion humana no es salida comercial normal. Casos complejos, sanciones, dudas o requerimientos llevan a llamada/reunion, viabilidad, informacion o checkout.
- `needs_review` queda reservado para fallo tecnico, IA vacia, ambiguedad extrema, error real de validacion o toma manual admin.
- No sustituir botones/listas deterministas por texto libre.
- No pedir API keys Holded por WhatsApp/email; solo panel seguro.
- Checkout sigue protegido por login, perfil, billing y readiness cuando aplica.
- Holded sigue siendo contabilidad/facturacion/datos financieros, no CRM operativo de EXPERT.
- No ejecutar cambios contables, fiscales, documentales o de facturacion desde IA sin validacion backend/admin.

## 3. Piezas que usan texto libre

- `generateKiaAiResponse` en `app/api/webhooks/whatsapp/route.ts` genera respuesta WABA libre o JSON simple de botones.
- `app/api/admin/whatsapp/ai-compose/route.ts` genera borradores libres para compose/edit.
- `lib/integrations/waba-ai.ts` devuelve `text` sin schema estructurado.
- `buildOfficialSourceContext` aporta contexto textual, no decision estructurada.
- La clasificacion documental estructurada todavia no esta centralizada en una decision IA auditable.

## 4. Piezas que necesitan output estructurado

- WABA fallback/free consult: intent, nextAction, confidence, decisionSummary, toolRequests y reglas aplicadas.
- Admin AI compose: respuesta a mensaje seleccionado, contacto lead/client, razon de CTA y limites comerciales.
- Clasificacion documental: tipo/subtipo, confidence, sugerencia de expediente/checklist y extractedData.
- Readiness/viabilidad razonada: no reemplazar reglas, pero explicar resultado y siguiente paso.
- Checkout decision: link protegido, bloqueo por perfil/billing/readiness y warnings.
- Accounting/anomaly/company status: resumen estimado, anomalías, next best actions y advertencias.

## 5. Side effects existentes

- WABA: enviar mensajes, botones/listas, registrar `whatsapp_conversations`, marcar `needs_review`, notificar admin y persistir `kia_sessions`.
- Kia Engine: `createCase`, `saveLead`, `sendDocsEmail`, `sendPaymentLink`, `needsAiFallback`, `escalate`.
- Checkout: crear Stripe Checkout desde backend protegido.
- Readiness: persistir `service_readiness_assessments`.
- Holded: sincronizaciones manuales/legacy y cliente read-first para contactos, facturas, impuestos, bancos y documentos.
- Media WABA: descargar/guardar adjuntos y asociar a expediente cuando el contacto es cliente.

## 6. Herramientas backend existentes

- Resolver contacto lead/client: `resolveKiaContactContext`.
- Obtener checklists: `getServiceChecklist`, `getChecklistsByCategory`.
- Fuentes oficiales: `buildOfficialSourceContext`.
- Registro de servicios/checkout: `getService`, `getServiceCheckoutByPriceId`.
- Readiness: `getReadinessCheck`, `calculateReadinessResult`.
- Holded: `createHoldedClient`, `resolveHoldedAuth`, permisos y estado de conexion.
- Supabase admin/server clients para perfiles, casos, documentos, conversaciones, companies e integraciones.

## 7. Herramientas faltantes

- Definiciones formales de tools con schema estricto y validadores zod.
- Ejecutor central de tool calls con permisos por canal.
- Decision log auditable.
- Context builder pequeño y tipado para Kia.
- Provider router estructurado compatible Anthropic/OpenAI.
- Output schema central `KiaDecision`.
- Redaccion de logs y hashing de inputs.
- Evals/fixtures antes de activar en clientes reales.
- Clasificador documental con decision estructurada.
- Next best action y company/accounting summaries auditables.

## 8. Prompts actuales

- WABA fallback tiene prompt embebido en `app/api/webhooks/whatsapp/route.ts`, con reglas de identidad IA, alcance, fuentes oficiales, formato texto/botones y diferenciacion lead/client.
- Admin compose tiene prompt embebido en `app/api/admin/whatsapp/ai-compose/route.ts`, con modo edit/compose, contexto de cliente, replyTo, checklists y fuentes oficiales.
- No existe prompt maestro versionado en `lib/ai/kia`.
- No existe separacion modular por core policy, lead/client/accounting/document/checkout flows.

## 9. Donde se usa Anthropic/OpenAI

- `lib/integrations/waba-ai.ts` consulta Anthropic Messages API o OpenAI chat completions segun `AI_PROVIDER` y claves disponibles.
- WABA fallback consume `generateWabaAiText`.
- Admin AI compose consume `generateWabaAiText`.
- `official-sources.ts` puede usar OpenAI para busqueda oficial si existe `OPENAI_API_KEY`.

## 10. Riesgos antes de pruebas reales

- Respuestas IA no estructuradas pueden incumplir reglas o perder trazabilidad.
- Admin compose puede responder al hilo entero en vez de a `replyTo` si el prompt no es suficientemente explicito.
- `needs_review` puede usarse como comodin si no se valida el output.
- Tool calls sin validador podrian ejecutar acciones fuera de flujo.
- Logs IA podrian contener datos sensibles si no se redactan.
- Sin feature flags, una integracion WABA directa podria afectar conversaciones reales.
- Sin evals, es dificil detectar regresiones de checkout/readiness/Holded.
- Supabase cambio reciente: tablas nuevas pueden no exponerse automaticamente a Data/GraphQL API; para logs se debe usar RLS/admin y no grants publicos.

## 11. Plan incremental

1. Crear `lib/ai/kia` sin conectar a produccion.
2. Definir tipos, schemas, prompt maestro y contexto estructurado.
3. Crear provider router compatible con `waba-ai.ts`.
4. Crear decision logs con RLS/admin y redaccion.
5. Crear tools con schema estricto y executor validado.
6. Crear evals y fixtures.
7. Integrar primero en `admin/whatsapp/ai-compose` bajo feature flag.
8. Integrar despues en WABA fallback/free_consult bajo feature flag.
9. Incorporar clasificacion documental.
10. Incorporar company/accounting summaries como estimaciones pendientes de revision profesional.
11. Ejecutar QA manual documentada antes de activar flags en produccion.

## 12. Notas de buenas practicas externas

- Anthropic recomienda estructurar prompts complejos con XML tags para separar instrucciones, contexto, ejemplos y formato.
- Anthropic documenta `strict: true` en tool use para forzar inputs compatibles con JSON Schema.
- Extended thinking puede ayudar en tareas complejas, pero la fuente auditable debe ser `decisionSummary`, `rulesApplied`, tool calls y resultados resumidos, no pensamiento interno completo.
