# EXPERT - Roadmap maestro de implementacion

Ultima actualizacion: 2026-05-10

## Vision

EXPERT se construye primero como asesoria digital propia para Ksenia Ilicheva y EXPERT ESTUDIOS PROFESIONALES, SLU, pero debe quedar preparada para evolucionar hacia un SaaS vertical para asesorias, gestorias y despachos profesionales.

Regla principal:

> Resolver la operativa propia hoy sin cerrar la puerta al multi-tenant manana.

## Principios

- Priorizar automatizacion y reduccion de trabajo manual.
- Mantener la web publica enfocada en cliente final hasta que el SaaS este listo para pilotos.
- Separar `tenants` de `companies`.
- No hardcodear servicios, estados, plantillas, branding o integraciones si pueden ser configurables.
- Stripe es fuente de verdad de cobros.
- Holded sera fuente de verdad de contactos, facturas, contabilidad y reporting financiero.
- WhatsApp debe llevar al cliente al panel seguro, no sustituirlo.
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

## Fase 2 - Web publica y validacion B2B discreta

Estado: completada el 2026-05-07.

Tipo: captacion, conversion, escalabilidad SaaS.

Objetivo: consolidar captacion B2C y abrir validacion SaaS sin confundir al cliente final.

Tareas:

- Crear `/para-asesorias`.
- Copy base: "Sistema digital para asesorias que quieren automatizar su operativa".
- Formulario B2B:
  - nombre,
  - email,
  - empresa o despacho,
  - numero aproximado de clientes,
  - herramientas actuales,
  - principal problema operativo,
  - interes en piloto,
  - consentimiento.
- Enlazar desde footer.
- Enlazar desde bloque discreto al final de Home.
- No incluir en el menu principal por ahora.
- Ajustar menu publico:
  - Servicios
  - Planes
  - Formacion
  - Recursos
  - Contacto
  - Acceso cliente

Criterios de aceptacion:

- [x] `/para-asesorias` existe y no compite con la venta a cliente final.
- [x] Footer y Home enlazan la pagina B2B de forma secundaria.
- [x] Formulario B2B guarda leads en `saas_leads`.
- [x] API publica usa escritura server-side, no insercion anonima directa.
- La navegacion principal mantiene foco B2C.

Pendiente:

- Ajustar menu publico completo al esquema recomendado.
- Crear vista admin para revisar leads B2B cuando empiecen a llegar pilotos.

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

## Fase 8 - IA supervisada

Estado: pendiente.

Tipo: automatizacion, operacion, escalabilidad SaaS.

Tareas:

- Agente de leads.
- Agente documental.
- Agente de comunicaciones.
- Agente de expediente.
- Agente fiscal/legal supervisado.
- Agente de contenido.
- Agente operativo diario.
- Clasificacion obligatoria de cada salida IA:
  - automatica permitida,
  - borrador para revision,
  - requiere intervencion humana.

## Fase 9 - Multi-tenant minimo

Estado: pendiente.

Tipo: escalabilidad SaaS.

Tareas:

- Crear `tenants`.
- Crear settings, branding, integraciones, plantillas y roles por tenant.
- Definir estrategia de `tenant_id` para entidades criticas.
- Migrar catalogo a configuracion tenant-aware.
- Mantener tenant EXPERT como tenant inicial.

## Fase 10 - Piloto SaaS

Estado: pendiente.

Tipo: escalabilidad SaaS, captacion, retencion.

Objetivo: validar con 1 a 3 asesorias externas.

Tareas:

- Seleccionar pilotos.
- Activar branding/configuracion por tenant.
- Medir uso operativo.
- Recoger feedback.
- Priorizar mejoras por reduccion de trabajo manual.
