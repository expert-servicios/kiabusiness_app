# EXPERT - Roadmap maestro de implementacion

Ultima actualizacion: 2026-06-04

## Vision

EXPERT es una plataforma operativa digital para asesorias, gestorias y despachos profesionales. Las asesorias son los clientes: contratan EXPERT para digitalizar y automatizar su operativa — gestion de expedientes, documentos, empresas de sus clientes, pagos, comunicaciones y cumplimiento fiscal.

Dominio canonico: `expertconsulting.es`.

EXPERT ESTUDIOS PROFESIONALES, SLU opera como tenant inicial y caso de uso de referencia.

Regla principal:

> Construir el sistema operativo que toda asesoria necesita, validarlo con la propia operativa de EXPERT y escalarlo como SaaS multi-tenant.

## Principios

- Las asesorias son los clientes (tenants). Sus clientes finales son los usuarios del portal.
- Priorizar automatizacion y reduccion de trabajo manual para la asesoria.
- La web publica de `expertconsulting.es` comunica la propuesta de valor a asesorias, no a clientes finales B2C.
- Separar `tenants` (asesorias) de `companies` (empresas de sus clientes).
- No hardcodear servicios, estados, plantillas, branding o integraciones si pueden ser configurables por tenant.
- Stripe es fuente de verdad de cobros.
- Holded sera fuente de verdad de contactos, facturas, contabilidad y reporting financiero.
- Kia es el copiloto operativo interno: widget flotante in-app para gestionar empresas conectadas, consultar datos y ejecutar acciones asistidas. No es un chatbot de captacion.
- WhatsApp es canal de notificaciones salientes, no interfaz principal de Kia.
- La IA debe ser supervisada, auditable y trazable.
- Toda funcionalidad nueva debe clasificarse como captacion, conversion, operacion, comunicacion, automatizacion, retencion o escalabilidad SaaS.

## Fase 0 - Saneamiento tecnico

Estado: completada el 2026-05-07.

Tipo: operacion, escalabilidad SaaS.

Objetivo: recuperar una base estable antes de construir producto nuevo.

Entregado:

- Conflictos de merge eliminados.
- `package.json` y `package-lock.json` recuperados.
- `npm install` ejecutado.
- Supabase local inicializado con `supabase/config.toml`.
- Migraciones validadas localmente con Docker y `supabase db reset --local`.
- `npm run lint` migrado a ESLint y verificado.
- `npm run typecheck` pasa.
- `npm run build` pasa.
- Rutas duplicadas `app/(app)` eliminadas.
- APIs alineadas con schema real:
  - `orders`
  - `documents`
  - `client-documents`
- `next.config.ts` fija `turbopack.root` para evitar lockfiles externos.

Criterios de aceptacion:

- [x] `npm run typecheck` pasa.
- [x] `npm run build` pasa.
- [x] `npm run lint` pasa.
- [x] `rg "^(<<<<<<<|=======|>>>>>>>)"` no devuelve resultados.
- [x] Los flujos de presupuesto, pago, expediente y documento usan tablas existentes.

## Fase 1 - Fuente de verdad documental

Estado: en curso.

Tipo: operacion, escalabilidad SaaS.

Objetivo: que el proyecto tenga documentacion clara para ejecutar sin perder el hilo.

Tareas:

- Mantener `docs/roadmap.md` como roadmap principal.
- Mantener `docs/master-checklist.md` como checklist de cumplimiento.
- Mantener `docs/architecture.md` como arquitectura operativa.
- Revisar README y dejarlo alineado con la vision actual.
- Documentar decisiones arquitectonicas:
  - tenants separados de companies,
  - servicios configurables,
  - estados configurables,
  - plantillas por tenant,
  - integraciones por tenant.

Criterios de aceptacion:

- [x] Roadmap limpio y actualizado.
- [x] Checklist maestro limpio y actualizado.
- [x] Arquitectura limpia y actualizada.
- [ ] README actualizado.

## Fase 2 - Web publica orientada a asesorias

Estado: en revision (pivot B2B aprobado 2026-06-04).

Tipo: captacion, conversion, escalabilidad SaaS.

Objetivo: que `expertconsulting.es` comunique con claridad que EXPERT es una plataforma para asesorias, gestorias y despachos. La captacion B2C residual (servicios de Ksenia) se mantiene como operativa interna pero no es el mensaje principal de la web.

Entregado (base):

- [x] `/para-asesorias` existe con formulario B2B que guarda en `saas_leads`.
- [x] Formulario B2B con nombre, email, empresa, clientes, herramientas, problema y consentimiento.
- [x] API publica usa escritura server-side, no insercion anonima directa.

Pendiente (ver IMP-021):

- [ ] Actualizar Home para que el hero y propuesta de valor principal se dirijan a asesorias.
- [ ] Promover `/para-asesorias` como pagina de conversion principal en navegacion.
- [ ] Revisar y reorientar copy de servicios, planes y blog.
- [ ] Ajustar menu publico a audiencia B2B:
  - Para asesorias
  - Funcionalidades
  - Integraciones (Holded, Stripe)
  - Precios
  - Contacto
  - Acceso
- [ ] Alinear todas las URLs con `expertconsulting.es` (ver IMP-013).
- [ ] Vista admin `/admin/saas-leads` para gestionar leads de pilotos.

## Fase 3 - Estandarizacion de catalogo

Estado: pendiente.

Tipo: conversion, operacion, escalabilidad SaaS.

Objetivo: que categorias, servicios, planes y formularios sean consistentes y evolucionables.

Tareas:

- Revisar `lib/utils/catalog.ts`.
- Separar datos configurables de presentacion.
- Estandarizar paginas de categoria y servicio.
- Preparar servicios para futura tabla `tenant_services`.
- Evitar textos y estados rigidos cuando puedan ser plantillas.

Criterios de aceptacion:

- Cada servicio tiene categoria, descripcion, CTA, datos de conversion y camino operativo claro.
- El catalogo puede migrar a configuracion por tenant sin rehacer la web.

## Fase 4 - Portal cliente por proxima accion

Estado: parcialmente completada el 2026-05-07.

Entregado:

- Dashboard cliente orientado a proxima accion (primary action banner, KPIs, expedientes activos).
- Expediente detail con barra de progreso operativa y guidance panel por estado.
- Mensaje contextual por estado: que falta, que estamos haciendo, que sigue.
- Checklist documental visible en detalle de expediente cliente.
- Editor admin de checklist documental por expediente.
- Checklist de onboarding/presupuesto persistido hasta la creacion del expediente tras pago.

Tipo: operacion, comunicacion, retencion.

Objetivo: que el cliente siempre entienda que ha contratado, que falta, en que estado esta y cual es el siguiente paso.

Tareas:

- Crear resumen de proxima accion.
- Mostrar documentos pendientes por checklist.
- Mostrar estado de expediente y siguiente paso.
- Mostrar descargas finales.
- Mostrar pagos, facturas y suscripciones.
- Preparar resenas por servicio.

Criterios de aceptacion:

- El dashboard cliente prioriza accion y claridad, no decoracion.
- Cada expediente tiene estado, documentos requeridos y entregables visibles.

## Fase 5 - Admin operativo

Estado: parcialmente completada el 2026-05-07.

Entregado:

- Admin dashboard rediseñado como bandeja operativa: seccion "Requiere atencion ahora" + "En seguimiento".
- Vista de leads SaaS (/admin/saas-leads) con estados gestionables (nuevo, contactado, cualificado, descartado).
- API admin para saas_leads con GET + PATCH de estado.
- Bandeja admin alineada con estados nuevos y legacy de expedientes: documentacion pendiente, documentos por revisar, en tramitacion, pendiente externo y resolucion por entregar.
- Bandeja admin con pagos recurrentes en incidencia (`past_due`/`unpaid`) y mensajes de cliente sin responder.
- Admin de usuarios con borrado seguro para limpiar usuarios spam sin actividad operativa.

Tipo: operacion, automatizacion.

Objetivo: que el admin vea que requiere accion ahora.

Tareas:

- Bandeja de expedientes bloqueados.
- Documentos por revisar.
- Presupuestos sin responder.
- Pagos fallidos.
- Mensajes sin responder.
- Resumen diario operativo.

Criterios de aceptacion:

- El admin puede priorizar trabajo diario desde una sola vista.
- Los dashboards dejan de ser solo KPIs y pasan a ser bandeja operativa.

## Fase 6 - Holded

Estado: base completada, alcance corregido y plan CRM/Projects documentado el 2026-05-09.

Entregado:

- `lib/integrations/holded.ts`: cliente API base (contactos/facturas heredadas del primer enfoque).
- Integracion en webhook Stripe: tras pago confirmado, sync non-blocking a Holded.
- Holded IDs guardados en orders.metadata.holded.
- `integration_sync_events`: registro auditable de sincronizaciones con Holded.
- `/admin/integraciones`: vista interna de eventos de sincronizacion Holded.
- Degradacion elegante si HOLDED_API_KEY no esta configurado.
- Plan de accion detallado: `docs/holded-sync-action-plan.md`.
- Criterio actualizado: Holded ya sincroniza con Stripe/banco; la API propia debe cubrir CRM, proyectos, clientes, presupuestos y facturacion con control de duplicados.
- `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` protege por defecto contra facturas duplicadas desde webhooks Stripe.
- Cliente API base para Holded CRM: funnels, leads y etapas.
- Cliente API base para Holded Projects: proyectos, tareas y resumen.
- Cliente API base para documentos Holded: `estimate`, `proform` e `invoice`.
- Migracion `external_mappings` creada para mappings idempotentes.
- Helper `lib/integrations/external-mappings.ts` creado y conectado a sync de presupuestos/facturas.
- Endpoints admin creados:
  - `POST /api/admin/integrations/holded/sync-lead`
  - `POST /api/admin/integrations/holded/sync-project`
  - `POST /api/admin/integrations/holded/sync-quote`
  - `POST /api/admin/integrations/holded/sync-invoice`
- Boton admin en presupuestos para sincronizar documento Holded.
- Boton admin en detalle de expediente para sincronizar proyecto Holded.
- Endpoint `GET /api/admin/integrations/holded/status` creado para comprobar API/configuracion sin exponer datos sensibles.
- `/admin/integraciones` muestra estado de Holded, checks read-only y flags activos.
- `/admin/saas-leads` permite sincronizar leads B2B como leads CRM en Holded.

Pendiente:

- Configurar variable HOLDED_API_KEY en produccion.
- Aplicar migracion P0 en Supabase remoto.
- Aplicar migracion `external_mappings` en Supabase remoto.
- Completar automatizacion de `quotes` -> leads Holded y actualizacion de etapas CRM.
- Verificar en remoto los mappings `quotes` -> presupuestos Holded.
- Verificar en remoto los mappings `orders`/Stripe payments -> facturas Holded sin duplicados.
- Verificar en remoto los mappings `cases` -> proyectos Holded.
- Verificar en remoto los mappings checklist/tareas -> tareas Holded.
- Anadir reintentos manuales y refresco Holded CRM/Projects -> EXPERT en admin.
- Mostrar presupuestos/facturas/pagos en dashboard con conciliacion Holded/Stripe/banco.

Tipo: operacion, automatizacion, escalabilidad SaaS.

Objetivo: integrar Holded sin sustituirlo.

Tareas:

- Copiar/adaptar el conector existente.
- Crear `lib/integrations/holded`.
- Configurar variables `HOLDED_*`.
- Crear contacto/cliente tras pago o alta.
- Crear factura desde `orders`.
- Guardar mapping entre Stripe, Supabase y Holded.
- Preparar `tenant_integrations` para futuro.

Criterios de aceptacion:

- Pago confirmado en Stripe puede producir factura/contacto en Holded.
- Los errores de Holded son trazables y no rompen el flujo principal.

## Fase 7 - Emails, WhatsApp y automatizaciones

Estado: parcialmente completada el 2026-05-10.

Tipo: comunicacion, automatizacion, retencion.

Entregado:

- reCAPTCHA v3 cargado de forma global cuando existe `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
- Verificacion server-side centralizada antes de crear leads o enviar emails publicos.
- Formularios protegidos: contacto, solicitud de presupuesto, presupuesto avanzado, demo Holded, newsletter y lead B2B SaaS.
- Newsletter reforzada con honeypot, rate limit, spam guard y reCAPTCHA.

Tareas:

- Refinar emails transaccionales.
- Emails por cambio de estado.
- Recordatorios de documentacion pendiente.
- Seguimiento de presupuestos.
- Alertas de pago fallido.
- WhatsApp Business para avisos y enlaces al panel.
- Crear `automation_rules` y preparar reglas por tenant.

## Fase 8 - Kia: copiloto operativo in-app

Estado: reorientado (decision 2026-06-04).

Tipo: IA, producto, operacion, automatizacion, escalabilidad SaaS.

Decision estrategica: Kia se convierte en un widget copiloto flotante que aparece en cualquier pagina del portal. El usuario hace clic en el boton flotante y se abre una ventana de chat donde puede gestionar las empresas conectadas, consultar datos de expedientes, resolver dudas fiscales/legales y ejecutar acciones asistidas. El motor WABA queda como canal de notificaciones salientes, no como interfaz de Kia.

Entregado (base de conocimiento y motor):

- [x] Motor de decision estructurado con schema validado, `decisionSummary` y `rulesApplied`. Ver IMP-017.
- [x] Health checks y canary runner con panel `/admin/kia-health`. Ver IMP-017.
- [x] Kia Auditor con reglas criticas y panel `/admin/kia-auditor`. Ver IMP-017.
- [x] Conocimiento Holded Academy (modulos, tarifas, integraciones, FAQs). Ver IMP-018.
- [x] Conocimiento AEAT y Seguridad Social (IRPF, IVA, autonomos, RETA, modelos). Ver IMP-019.
- [x] Mapa de fuentes oficiales: DGT, Justicia/Registros, PAE/CIRCE, tributos autonomicos. Ver IMP-020.
- [x] Anti-repeticion, redaccion de datos sensibles, provider router con fallback. Ver IMP-016/017.

Tareas pendientes (ver IMP-022):

- [ ] Widget flotante `<KiaCopilotWidget />` en layout protegido.
- [ ] Endpoint de chat in-app `POST /api/ai/kia` (separado del webhook WABA).
- [ ] Contexto enriquecido con datos del tenant: empresas conectadas, expedientes activos, integraciones.
- [ ] Herramientas del copiloto: consultar empresa, listar expedientes, estado de Holded, buscar cliente.
- [ ] Historial de sesion en `kia_sessions` vinculado a usuario y tenant.
- [ ] Confirmacion humana antes de acciones con efecto externo.
- [ ] Clasificacion obligatoria de cada salida IA:
  - automatica permitida,
  - borrador para revision,
  - requiere intervencion humana.
- [Futuro] Agentes especializados por tarea: leads, documental, comunicaciones, expediente, fiscal/legal, contenido, operativo diario.
- [Futuro] Opcion B Holded Academy: crawler periodico -> chunks -> embeddings -> Supabase pgvector -> busqueda semantica para preguntas tecnicas de configuracion Holded.

## Fase 9 - Multi-tenant para asesorias

Estado: pendiente (ver IMP-014).

Tipo: escalabilidad SaaS.

Objetivo: que cada asesoria que contrate EXPERT opere con su propio tenant: sus clientes, empresas, expedientes, plantillas, integraciones y branding son propios y aislados del resto.

Modelo de datos:

- `tenant`: la asesoria/gestoria/despacho que usa EXPERT.
- `company`: empresa, autonomo o entidad fiscal de un cliente de la asesoria.
- `profile`: usuario del sistema (tanto el personal de la asesoria como, opcionalmente, sus clientes finales).

Tareas:

- [ ] Crear tabla `tenants` con `id`, `slug`, `name`, `domain`, `settings jsonb`, `created_at`.
- [ ] Crear tabla `tenant_settings` con configuracion por tenant: branding, servicios, plantillas, roles, integraciones activas.
- [ ] Anadir `tenant_id` a entidades criticas: `cases`, `orders`, `quotes`, `companies`, `profiles`.
- [ ] Rol `tenant_admin` para el administrador de cada asesoria.
- [ ] Tenant EXPERT registrado como tenant inicial con `slug = 'expert'`.
- [ ] Kia Copiloto opera en el contexto del tenant del usuario autenticado.
- [ ] Integraciones (Holded, Stripe, WhatsApp) configurables por tenant.
- [ ] Plantillas de email y automatizacion por tenant.

## Fase 10 - Piloto SaaS con asesorias externas

Estado: pendiente.

Tipo: escalabilidad SaaS, captacion, retencion.

Objetivo: validar con 1-3 asesorias externas que el sistema reduce trabajo manual y es adoptable sin formacion intensiva. El widget Kia Copiloto es el diferenciador principal del piloto.

Tareas:

- [ ] Seleccionar pilotos desde `saas_leads` cualificados.
- [ ] Activar onboarding de tenant: configuracion basica, integracion Holded, primer expediente.
- [ ] Medir: tiempo de onboarding, expedientes gestionados, acciones del copiloto Kia, reduccion de correos manuales.
- [ ] Recoger feedback estructurado.
- [ ] Priorizar mejoras por reduccion de trabajo manual demostrada.
