# EXPERT - Plan de accion para sincronizacion Holded

Ultima actualizacion: 2026-05-09

## Aclaracion de alcance

Holded ya se sincroniza con Stripe. Por tanto, EXPERT no debe crear facturas desde Stripe en Holded por defecto, porque podria duplicar la facturacion.

El uso prioritario de la API de Holded para nuestro dashboard es:

- CRM: leads, funnels, etapas y seguimiento comercial.
- Proyectos: proyectos, tareas, listas, estados, tiempos y resumen operativo.
- Contactos/clientes: lectura y mapping con perfiles/clientes de EXPERT.
- Presupuestos y facturacion: sincronizar presupuestos EXPERT con documentos Holded (`estimate`/`proform`) y facturacion (`invoice`) con control de duplicados.
- Finanzas: Stripe y banco ya sincronizan con Holded, asi que EXPERT debe coordinar y auditar, no crear documentos a ciegas.

## Objetivo

Sincronizar el dashboard operativo de EXPERT con Holded sin sustituir Holded ni duplicar su integracion nativa con Stripe.

EXPERT debe seguir siendo la capa de captacion, portal cliente, documentacion, comunicacion, automatizacion y visibilidad operativa. Holded debe seguir siendo la fuente para CRM, proyectos, contactos, facturacion, conciliacion y reporting financiero.

## Fuentes oficiales revisadas

- Holded Academy: API, requisitos, seguridad de la API key, metodos HTTP, JSON y fechas Unix: https://help.holded.com/en/articles/6896051-how-to-generate-and-use-the-holded-api
- API key: https://developers.holded.com/reference/api-key-1
- Contactos: https://developers.holded.com/reference/list-contacts-1 y https://developers.holded.com/reference/create-contact-1
- CRM funnels: https://developers.holded.com/reference/list-funnels-1
- CRM leads: https://developers.holded.com/reference/list-leads-1, https://developers.holded.com/reference/create-lead-1 y https://developers.holded.com/reference/update-lead-stage-1
- Proyectos: https://developers.holded.com/reference/list-projects, https://developers.holded.com/reference/create-project y https://developers.holded.com/reference/update-project
- Tareas de proyectos: https://developers.holded.com/reference/list-tasks y https://developers.holded.com/reference/create-task
- Resumen de proyecto: https://developers.holded.com/reference/get_projects-projectid-summary
- Documentos/presupuestos/facturas: https://developers.holded.com/reference/create-document-1, https://developers.holded.com/reference/getdocument-1 y https://developers.holded.com/reference/list-documents-1
- Servicios/productos: https://developers.holded.com/reference/create-service y https://developers.holded.com/reference/list-products-1
- Impuestos: https://developers.holded.com/reference/gettaxes
- Pagos: https://developers.holded.com/reference/create-payment-1
- Series de numeracion y canales de venta: https://developers.holded.com/reference/get-numbering-series-1 y https://developers.holded.com/reference/list-sales-channels-1

## Principios de integracion

1. La API key de Holded solo vive en servidor: nunca en frontend, nunca como `NEXT_PUBLIC_*`.
2. Stripe es la fuente de verdad del cobro y Holded ya recibe esa informacion por su integracion nativa.
3. Toda llamada a Holded debe dejar rastro en `integration_sync_events`.
4. Toda entidad sincronizada debe tener mapping estable: EXPERT local ID, Stripe ID y Holded external ID.
5. La sincronizacion debe ser idempotente: reintentos no deben duplicar contactos, leads, proyectos, tareas ni facturas.
6. El dashboard admin debe mostrar errores, pendientes y reintentos. Una integracion invisible se convierte en trabajo manual.
7. Preparar desde ahora el camino SaaS: en fase futura, la configuracion ira a `tenant_integrations` y no a variables globales.
8. Crear presupuestos/facturas via API es valido, pero solo con mapping idempotente y verificacion de que no existe ya documento equivalente por Stripe/banco.

## Estado actual del proyecto

Ya existe una base util:

- `lib/integrations/holded.ts` usa `HOLDED_API_KEY` en servidor.
- El webhook de Stripe llama a Holded tras pagos puntuales, pero la creacion de facturas queda protegida por `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` por defecto.
- Se pueden crear contactos y documentos Holded de forma controlada.
- Existe cliente API base para CRM: funnels, leads y etapas.
- Existe cliente API base para Projects: proyectos, tareas y resumen.
- Existe cliente API base para documentos: `estimate`, `proform` e `invoice`.
- Existe migracion `external_mappings` y helper de codigo para idempotencia.
- Existen endpoints admin de sincronizacion para leads, proyectos, presupuestos y facturas.
- El admin puede sincronizar presupuestos desde la tarjeta de presupuesto.
- El admin puede sincronizar expedientes como proyectos Holded desde el detalle de expediente.
- Existe endpoint admin de estado Holded con checks read-only.
- `/admin/integraciones` muestra estado Holded y flags activos sin exponer datos sensibles.
- Smoke test read-only local OK: funnels, leads, proyectos, tareas, impuestos, presupuestos y facturas respondieron HTTP 200.
- Se guardan IDs de Holded en `orders.metadata.holded`.
- Se ha preparado `integration_sync_events` para auditoria.
- Existe `/admin/integraciones` para ver eventos de sincronizacion.

Brechas antes de considerar esto listo:

- La migracion P0 debe aplicarse en Supabase remoto para que `integration_sync_events` exista en produccion.
- La migracion `external_mappings` debe aplicarse en Supabase remoto.
- La conexion remota desde este entorno falla: `db.<project>.supabase.co` no resuelve y el pooler probado no acepta las credenciales actuales.
- El conector usa una busqueda de contacto por email que debe reforzarse con `customId`, NIF/CIF/VAT o mapping propio.
- `saas_leads` ya puede sincronizarse manualmente como lead CRM de Holded desde `/admin/saas-leads`.
- Falta completar mapping automatico entre `cases`/`quotes`/`profiles` de EXPERT y leads/proyectos/tareas de Holded.
- Las facturas necesitan configuracion fiscal real: impuestos, serie de numeracion, idioma, vencimiento y canal de venta.
- Las suscripciones no deben facturarse en Holded solo por `customer.subscription.created`; lo correcto es crear factura al evento de invoice pagada de Stripe.
- Falta sincronizacion de vuelta Holded -> EXPERT para numero de factura, estado pagado/parcial/no pagado y metadatos contables.
- Falta boton de reintento/manual sync en admin.

## Modelo de sincronizacion recomendado actualizado

### Direccion 1: EXPERT -> Holded CRM/Projects

Se ejecuta cuando EXPERT genera actividad operativa o comercial:

- Lead entra desde web o formulario de presupuesto.
- Presupuesto se cualifica.
- Cliente compra o acepta un servicio.
- Se crea expediente en EXPERT.
- Falta documentacion o hay una tarea interna pendiente.

Acciones:

1. Resolver o crear contacto en Holded.
2. Crear o actualizar lead CRM en Holded.
3. Asignar funnel y etapa segun estado comercial.
4. Crear proyecto Holded cuando el lead se convierte en expediente real.
5. Crear tareas Holded desde checklist/documentacion/acciones internas.
6. Guardar mapping local/external.
7. Registrar evento de sincronizacion con request, response, estado y error si existe.

### Direccion 2: Holded CRM/Projects -> EXPERT

Se ejecuta para enriquecer el dashboard:

- Leer funnels y etapas para mapear pipeline.
- Leer leads y estados.
- Leer proyectos, tareas y resumen de proyecto.
- Detectar proyectos/tareas bloqueadas o atrasadas.
- Mostrar en admin lo que requiere accion ahora.

Acciones:

1. Obtener lead/proyecto/tarea por ID o por listado incremental.
2. Actualizar metadata local con estado Holded, etapa, proyecto, tareas y fechas.
3. Marcar discrepancias entre EXPERT y Holded.
4. Registrar evento `from_external`.

### Direccion 3: EXPERT -> Holded presupuestos/facturacion

Se ejecuta cuando EXPERT genera actividad comercial con valor documental:

- Presupuesto creado en EXPERT.
- Presupuesto enviado al cliente.
- Presupuesto aceptado.
- Pago confirmado por Stripe.
- Cobro conciliado por banco/Stripe en Holded.

Acciones:

1. Crear o actualizar contacto Holded.
2. Crear documento Holded `estimate` o `proform` desde `quotes`.
3. Guardar mapping `quotes.id` -> `holded_document_id`.
4. Cuando el presupuesto se acepta/paga, crear o localizar `invoice` en Holded.
5. Asociar `orders`, `stripe_payment_id` y, si aplica, movimiento bancario/cobro Holded.
6. Leer estado de documento/factura desde Holded para mostrarlo en EXPERT.
7. Registrar todos los pasos en `integration_sync_events`.

Regla anti-duplicados:

- Nunca crear factura si ya existe mapping `orders.id` -> `holded_invoice`.
- Nunca crear factura si Holded ya tiene documento equivalente con la referencia EXPERT/Stripe.
- Si Holded crea factura por Stripe/banco, EXPERT debe importar y enlazar, no volver a crear.

### Direccion financiera: lectura, conciliacion y creacion controlada

Como Holded ya se sincroniza con Stripe, EXPERT debe usar finanzas con lectura, conciliacion y creacion controlada:

- Leer documentos/facturas si queremos mostrarlas en portal cliente o admin.
- Leer pagos/estado contable si ayuda a conciliacion operativa.
- Crear presupuestos y facturas solo en flujos controlados con idempotencia y mapping.

## Modelo financiero controlado

### Direccion financiera A: EXPERT -> Holded

Se ejecutara para presupuestos/facturas EXPERT con ownership claro:

- Presupuesto EXPERT -> Holded `estimate` o `proform`.
- Presupuesto aceptado/pagado -> Holded `invoice`, si no existe ya.
- Factura creada por Stripe/banco en Holded -> EXPERT importa mapping/estado.
- Admin marca un presupuesto como aceptado y pagado -> EXPERT sincroniza documento con Holded.

Acciones:

1. Resolver o crear contacto en Holded.
2. Resolver servicio/producto Holded asociado al servicio EXPERT.
3. Crear documento `estimate`, `proform` o `invoice` en Holded segun fase.
4. Opcionalmente enlazar pago/cobro en Holded si decidimos reflejar Stripe/banco en EXPERT.
5. Guardar mapping local/external.
6. Registrar evento de sincronizacion con request, response, estado y error si existe.

### Direccion financiera B: Holded -> EXPERT

Se ejecuta para enriquecer el dashboard:

- Refrescar factura por `documentId`.
- Listar facturas por rango de fechas para conciliacion.
- Leer impuestos, servicios, productos, series y canales de venta para configurar mappings.
- Leer pagos si se decide mostrar conciliacion o estado contable.

Acciones:

1. Obtener documento Holded por ID.
2. Actualizar metadata local con numero, estado, pagado/parcial/no pagado, fecha y total.
3. Marcar discrepancias entre Stripe y Holded.
4. Registrar evento `from_external`.

## Fase A - Preparacion segura

Tipo: operacion, automatizacion, escalabilidad SaaS.

Objetivo: que el entorno pueda sincronizar sin fugas ni datos duplicados.

Tareas:

- Aplicar la migracion P0 en Supabase remoto.
- Confirmar que la API key actual de Holded tiene permisos de lectura y escritura. Holded indica que solo la primera API key tiene sincronizacion bidireccional; las adicionales pueden quedar solo lectura.
- Crear variable opcional `HOLDED_SYNC_ENABLED=true`.
- Crear variable opcional `HOLDED_SYNC_DRY_RUN=false` para pruebas sin crear documentos reales.
- Crear variable opcional `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` para impedir duplicados por defecto.
- Crear variable opcional `HOLDED_SYNC_QUOTES=true` para presupuestos EXPERT -> Holded.
- Definir en `.env.example` placeholders, nunca valores reales:
  - `HOLDED_API_KEY`
  - `HOLDED_CRM_FUNNEL_ID`
  - `HOLDED_CRM_DEFAULT_STAGE_ID`
  - `HOLDED_PROJECT_DEFAULT_LIST_ID`
  - `HOLDED_DEFAULT_QUOTE_DOC_TYPE`
  - `HOLDED_DEFAULT_TAX_ID`
  - `HOLDED_DEFAULT_NUM_SERIE_ID`
  - `HOLDED_DEFAULT_SALES_CHANNEL_ID`
  - `HOLDED_DEFAULT_BANK_ID`
- Documentar si EXPERT usara una serie propia para facturas generadas desde web.

Criterios de aceptacion:

- La tabla `integration_sync_events` existe en remoto.
- El dashboard `/admin/integraciones` carga eventos reales.
- No hay secretos en git.
- Una llamada read-only de prueba a `/crm/v1/funnels` funciona desde servidor.
- Una llamada read-only de prueba a `/projects/v1/projects` funciona desde servidor.

## Fase B - Mappings estables

Tipo: operacion, automatizacion, escalabilidad SaaS.

Objetivo: evitar duplicados y preparar multi-tenant.

Crear una tabla generica recomendada:

```sql
create table public.external_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  local_entity text not null,
  local_id text not null,
  external_entity text not null,
  external_id text not null,
  tenant_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, local_entity, local_id, external_entity),
  unique (provider, external_entity, external_id)
);
```

Uso inicial:

- `profiles` / `clients` -> `holded_contact`
- `quotes` / `saas_leads` -> `holded_lead`. `saas_leads` ya usa mapping idempotente via `external_mappings`.
- `quotes` -> `holded_estimate` o `holded_proform`
- `orders` -> `holded_invoice`
- `stripe_payment_id` -> `holded_payment` o documento Holded relacionado si se importa desde Stripe/banco
- `cases` -> `holded_project`
- `tasks` / checklist documental -> `holded_task`
- `subscriptions` o `stripe_invoices` -> `holded_invoice` si EXPERT necesita mostrar/conciliar facturacion recurrente
- `services` -> `holded_service` o `holded_product`

Criterios de aceptacion:

- Repetir un webhook o job no crea un segundo lead/proyecto/tarea para la misma entidad.
- Cambiar email del cliente no rompe el vinculo con Holded.
- Cada entidad visible en dashboard tiene un ID local y, si aplica, un ID Holded.

## Fase C - CRM Holded

Tipo: captacion, conversion, operacion.

Objetivo: que EXPERT pueda usar Holded CRM como pipeline comercial sin duplicar trabajo.

Tareas:

- Leer funnels desde `/api/crm/v1/funnels`.
- Configurar funnel principal de EXPERT.
- Mapear estados EXPERT -> etapas Holded:
  - nuevo lead,
  - cualificado,
  - presupuesto enviado,
  - pendiente de pago,
  - convertido,
  - perdido/cerrado.
- Crear lead Holded cuando entra solicitud desde EXPERT.
- Crear lead Holded manualmente desde `/admin/saas-leads` para validar el pipeline B2B antes de automatizarlo.
- Actualizar etapa Holded cuando cambia estado de quote/lead.
- Crear tareas CRM para seguimiento de presupuesto si no responde.
- Mostrar en dashboard admin:
  - leads sin etapa,
  - presupuestos abiertos,
  - oportunidades bloqueadas,
  - proximas acciones comerciales.

Criterios de aceptacion:

- Un lead de EXPERT aparece en Holded CRM con contacto y etapa correcta.
- Cambiar estado en EXPERT actualiza etapa o metadata en Holded.
- El dashboard muestra pipeline comercial accionable.

## Fase D - Proyectos Holded

Tipo: operacion, automatizacion.

Objetivo: que cada expediente real de EXPERT tenga su reflejo operativo en Holded Projects cuando aporte valor.

Tareas:

- Leer proyectos desde `/api/projects/v1/projects`.
- Crear proyecto Holded cuando un expediente pasa a fase operativa.
- Guardar mapping `cases.id` -> `holded_project_id`.
- Crear listas/tareas segun checklist documental y workflow interno.
- Actualizar proyecto con cliente/contacto, fecha, vencimiento, status y etiquetas.
- Leer resumen de proyecto para detectar carga, progreso o bloqueo.
- Mostrar en admin:
  - proyectos sin tarea siguiente,
  - tareas vencidas,
  - expedientes con documentos pendientes,
  - tareas por revisar.

Criterios de aceptacion:

- Un caso EXPERT puede abrir proyecto Holded asociado.
- Las tareas criticas se ven en ambos sistemas.
- El dashboard responde "que requiere accion ahora".

## Fase E - Contactos y clientes

Tipo: operacion, comunicacion.

Objetivo: mantener una vista coherente de cliente sin depender solo del email.

Tareas:

- Resolver contacto por mapping estable antes que por email.
- Usar `customId` o campo equivalente para identificar cliente EXPERT cuando sea viable.
- Sincronizar datos basicos: nombre, email, telefono, empresa, NIF/CIF/VAT si existe.
- Evitar subir documentacion sensible a Holded si EXPERT debe ser el repositorio seguro.

Criterios de aceptacion:

- Un cliente EXPERT tiene maximo un contacto Holded principal.
- Cambios operativos no generan duplicados.

## Fase F - Catalogo fiscal Holded

Tipo: operacion, escalabilidad SaaS.

Objetivo: configurar la facturacion correctamente antes de automatizar volumen.

Tareas:

- Leer impuestos desde `/taxes`.
- Leer o crear servicios desde `/services`.
- Leer productos desde `/products` si algun item debe tratarse como producto.
- Leer series de numeracion desde `/numberingseries/{type}`.
- Leer canales de venta desde `/saleschannels`.
- Crear pantalla admin "Configuracion Holded" con:
  - impuesto por defecto,
  - serie de factura,
  - canal de venta,
  - banco/cuenta para pagos si aplica,
  - modo draft/aprobado si aplica,
  - idioma por defecto.

Criterios de aceptacion:

- El admin ve si falta configuracion fiscal antes de activar sync real.
- Una factura de prueba se crea con impuesto, serie y descripcion correctos.

## Fase G - Presupuestos EXPERT -> Holded

Tipo: conversion, operacion, automatizacion.

Objetivo: que cada presupuesto comercial importante de EXPERT tenga documento equivalente en Holded.

Tareas:

- Mapear `quotes` con documento Holded `estimate` o `proform`.
- Definir `HOLDED_DEFAULT_QUOTE_DOC_TYPE=estimate` o `proform`.
- Al crear/enviar presupuesto, crear documento Holded con:
  - contacto,
  - descripcion,
  - items,
  - impuestos,
  - vencimiento,
  - referencia EXPERT.
- Al modificar presupuesto, actualizar documento si todavia no esta aceptado/pagado.
- Al aceptar presupuesto, actualizar estado/mapping y preparar facturacion.
- Mostrar en admin:
  - presupuesto sin documento Holded,
  - documento Holded desactualizado,
  - presupuesto aceptado pendiente de factura.

Criterios de aceptacion:

- Un presupuesto EXPERT crea un unico documento Holded.
- El admin puede abrir/ver el mapping del documento.
- Reintentar sync no duplica presupuestos.

## Fase H - Facturacion EXPERT <-> Holded

Tipo: automatizacion, operacion, conversion.

Objetivo: compra/pago EXPERT -> factura trazable en Holded sin duplicar Stripe/banco.

Flujo:

1. `checkout.session.completed` con `mode=payment`.
2. EXPERT crea/actualiza `orders`.
3. EXPERT crea expediente si corresponde.
4. EXPERT asegura contacto Holded.
5. EXPERT busca mapping/documento Holded existente por quote/order/Stripe reference.
6. Si no existe y el modo de creacion esta activo, EXPERT crea documento Holded `invoice`.
7. Si existe por integracion Stripe/banco, EXPERT importa mapping y estado.
8. EXPERT guarda:
   - `holded_contact_id`,
   - `holded_invoice_id`,
   - numero de factura si la respuesta lo incluye o tras `GET document`,
   - `sync_event_id`.
9. Admin ve resultado en `/admin/integraciones`.
10. Cliente ve la factura/estado en su zona privada cuando lo habilitemos.

Criterios de aceptacion:

- Si Holded falla, el pago y expediente no fallan.
- El admin ve el fallo y puede reintentar.
- No se duplica factura al reintentar webhook.
- No se duplica factura si Holded ya la recibio via Stripe/banco.

## Fase I - Suscripciones y facturacion recurrente

Tipo: automatizacion, operacion, retencion.

Objetivo: reflejar planes mensuales en EXPERT usando Holded como fuente financiera final.

Cambio recomendado:

- Mantener `customer.subscription.created` solo para guardar la suscripcion.
- Usar eventos de Stripe `invoice.payment_succeeded` para enlazar periodo cobrado con Holded.
- Primero buscar/importar factura creada por integracion Stripe-Holded.
- Crear factura via API solo si se decide que EXPERT debe ser origen documental para ese caso.
- Registrar el periodo facturado y el Stripe invoice ID.

Flujo:

1. Stripe confirma invoice pagada.
2. EXPERT localiza `subscription`.
3. EXPERT crea o recupera contacto Holded.
4. EXPERT busca factura Holded asociada al periodo/Stripe invoice.
5. Si no existe y el modo de creacion esta activo, EXPERT crea factura Holded por el periodo.
6. EXPERT guarda:
   - `holded_contact_id`,
   - `holded_invoice_id`,
   - numero de factura si la respuesta lo incluye o tras `GET document`,
   - `sync_event_id`.
7. Si `invoice.payment_failed`, no crear factura nueva; crear alerta admin y comunicacion al cliente.

Criterios de aceptacion:

- Cada periodo mensual tiene como maximo una factura Holded.
- Pagos fallidos aparecen como alerta operativa, no como factura pagada.
- La factura puede verse desde EXPERT si el mapping existe.

## Fase J - Dashboard y reintentos

Tipo: operacion, automatizacion.

Objetivo: que el dashboard sirva para trabajar, no solo mirar.

Tareas:

- Ampliar `/admin/integraciones` con filtros:
  - fallidos,
  - pendientes,
  - entidad local,
  - rango de fechas.
- Crear endpoints admin:
  - `POST /api/admin/integrations/holded/retry`
  - `POST /api/admin/integrations/holded/sync-lead`
  - `POST /api/admin/integrations/holded/sync-project`
  - `POST /api/admin/integrations/holded/sync-task`
  - `POST /api/admin/integrations/holded/sync-quote`
  - `POST /api/admin/integrations/holded/sync-invoice`
  - `POST /api/admin/integrations/holded/refresh-project`
  - `POST /api/admin/integrations/holded/refresh-invoice`
- Mostrar en pedidos/suscripciones:
  - estado sync,
  - factura Holded,
  - ultimo error,
  - accion "reintentar".
- Crear resumen en dashboard admin:
  - syncs fallidas ultimas 24 h,
  - leads sin mapping,
  - expedientes sin proyecto Holded,
  - presupuestos sin documento Holded,
  - pagos sin factura Holded enlazada,
  - tareas vencidas,
  - discrepancias Stripe/Holded/banco.

Criterios de aceptacion:

- Un fallo se puede resolver sin tocar base de datos.
- El admin sabe que leads/proyectos/tareas no estan sincronizados o requieren accion.

## Fase K - Sincronizacion programada

Tipo: automatizacion, operacion.

Objetivo: mantener EXPERT actualizado aunque un webhook falle.

Tareas:

- Crear job cron/server action protegida para:
  - revisar eventos `pending` y `failed`,
  - refrescar funnels, leads, proyectos y tareas,
  - refrescar presupuestos/facturas Holded por ID,
  - detectar facturas Holded sin mapping si usamos importacion,
  - detectar pagos Stripe/banco sin documento enlazado.
- Politica de reintentos:
  - maximo 3 automaticos,
  - despues requiere accion humana.
- Registrar `attempt_count` y `next_retry_at` en una futura ampliacion.

Criterios de aceptacion:

- Los fallos transitorios se recuperan solos.
- Los fallos reales suben como tarea admin.

## Fase L - Preparacion SaaS

Tipo: escalabilidad SaaS.

Objetivo: no cerrar la puerta al multi-tenant.

Cuando haya tenants:

- Mover credenciales de `HOLDED_API_KEY` global a `tenant_integrations`.
- Cifrar credenciales por tenant.
- Mover settings fiscales a `tenant_settings` o `tenant_integrations.metadata`.
- Anadir `tenant_id` a `integration_sync_events` y `external_mappings`.
- Cada tenant tendra su propia cuenta Holded o su propia configuracion de integracion.

Criterios de aceptacion:

- EXPERT puede seguir usando su configuracion actual.
- Un futuro despacho piloto podria conectar su Holded sin tocar codigo.

## Riesgos y decisiones pendientes

- Confirmar si la API key actual es la primera/bidireccional o una API key adicional de solo lectura.
- Confirmar funnel principal de Holded CRM para EXPERT.
- Confirmar etapas comerciales que deben mapearse con estados de presupuestos/expedientes.
- Confirmar si cada expediente EXPERT debe crear siempre un proyecto Holded o solo ciertos servicios.
- Confirmar lista por defecto de tareas dentro de cada proyecto Holded.
- Confirmar si EXPERT debe leer facturas/pagos desde Holded solo para visualizacion o tambien para alertas.
- Confirmar si presupuesto EXPERT debe crearse como `estimate` o `proform`.
- Confirmar cuando se convierte/enlaza una factura: al aceptar presupuesto, al pagar Stripe, o al conciliar cobro en Holded.
- Si algun caso financiero no queda cubierto por Stripe-Holded nativo, decidir explicitamente como facturarlo via API.

## Orden recomendado inmediato

1. Aplicar migracion P0 en Supabase remoto.
2. Proteger la creacion de facturas desde webhooks Stripe con feature flag, mapping e idempotencia.
3. Hacer smoke test read-only con Holded: `/crm/v1/funnels`, `/crm/v1/leads`, `/projects/v1/projects`, `/projects/v1/tasks`.
4. Aplicar migracion `external_mappings` en Supabase remoto.
5. Aplicar migraciones remotas antes de usar los botones en produccion.
6. Crear endpoints de refresh/import desde Holded hacia EXPERT.
7. Mostrar en dashboard admin pipeline, proyectos/tareas, presupuestos/facturas y errores de sync.
