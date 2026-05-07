# EXPERT - Roadmap maestro de implementacion

Ultima actualizacion: 2026-05-07

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

Estado: en curso.

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

Estado: pendiente.

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

Estado: pendiente.

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

Estado: pendiente.

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

Estado: pendiente.

Tipo: comunicacion, automatizacion, retencion.

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
