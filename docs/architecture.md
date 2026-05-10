# EXPERT - Arquitectura operativa

Ultima actualizacion: 2026-05-07

## Vision

EXPERT es una plataforma operativa digital construida primero para la asesoria propia de Ksenia Ilicheva y EXPERT ESTUDIOS PROFESIONALES, SLU.

La arquitectura debe resolver la operativa real de hoy sin cerrar la puerta al SaaS multi-tenant de manana.

## Fases

### Fase actual: asesoria digital propia

Objetivo: vender servicios online, gestionar clientes, automatizar expedientes, centralizar documentos, comunicar estados, gestionar pagos y reducir trabajo manual.

### Fase futura: SaaS vertical para asesorias

Objetivo: ofrecer el mismo sistema operativo digital a asesorias, gestorias, despachos pequenos y profesionales que gestionan tramites, documentos y clientes.

## Modulos actuales

- Web publica: Home, servicios, planes, Holded, blog, contacto y presupuesto.
- Auth: Google OAuth y magic link.
- Pipeline comercial: lead -> quote -> Stripe checkout -> order -> case.
- Portal cliente: expedientes, documentos, presupuestos, suscripciones y perfil.
- Admin: usuarios, presupuestos, expedientes, documentos, emails, suscripciones y reportes.
- Storage: bucket privado `client-documents`.
- Comunicaciones: Resend y base para WhatsApp.
- Pagos: Stripe one-time payments, suscripciones y customer portal.

## Flujo operativo ideal

Cliente compra en EXPERT -> Stripe cobra -> Supabase crea `order` y `case` -> Holded crea cliente/factura -> Resend o WhatsApp notifican -> panel cliente gestiona documentacion -> IA ayuda a clasificar, resumir y proponer borradores.

## Datos principales

- `profiles`: usuarios y rol base.
- `leads`: solicitudes entrantes.
- `quotes`: presupuestos.
- `orders`: pagos confirmados.
- `cases`: expedientes operativos.
- `documents`: documentos asociados a expedientes.
- `messages`: comunicacion trazable en panel.
- `subscriptions`: planes mensuales.
- `email_events`: trazabilidad Resend.
- `whatsapp_conversations`: base de conversaciones operativas.
- `ai_logs`: salidas IA auditables.
- `companies`: empresas o actividades fiscales de clientes.
- `saas_leads`: interes B2B para pilotos y futura validacion SaaS.
- `integration_sync_events`: trazabilidad de sincronizaciones con Holded y futuras integraciones.

## Preparacion multi-tenant

`companies` no equivale a `tenants`.

- `tenant`: asesoria, gestoria o despacho que usa EXPERT como sistema.
- `company`: empresa, autonomo o entidad fiscal de un cliente final.

Tablas a preparar:

- `tenants`
- `tenant_settings`
- `tenant_branding`
- `tenant_integrations`
- `tenant_email_templates`
- `tenant_whatsapp_templates`
- `tenant_automation_rules`
- `tenant_roles`
- `tenant_services`

Regla de evolucion: cada entidad critica debe poder recibir `tenant_id` sin reescribir el producto completo.

## Integraciones

### Stripe

Stripe es fuente de verdad de cobros, suscripciones y customer portal. Los pagos confirmados crean `orders` y activan automatizaciones.

### Holded

Holded sera fuente de verdad para contactos, clientes, facturas, productos/servicios, contabilidad y reporting financiero.

EXPERT no sustituye Holded. EXPERT es la capa de captacion, workflow, documentacion, comunicacion y automatizacion.

Cada sincronizacion con Holded debe dejar rastro en `integration_sync_events` para que el dashboard pueda mostrar si la operacion se completo, fallo o quedo omitida por configuracion.

### Resend

Resend gestiona email transaccional. Los eventos quedan en `email_events`.

### WhatsApp Business

WhatsApp debe usarse para avisos, recordatorios, confirmaciones y enlaces al panel seguro. No debe ser repositorio documental ni sustituir el portal cliente.

### IA

La IA es una capa de eficiencia operativa supervisada. Toda salida debe registrarse y clasificarse como:

- automatica permitida,
- borrador para revision,
- requiere intervencion humana.

## Seguridad

- RLS habilitado en tablas sensibles.
- Service role solo en rutas server-side.
- Documentos privados por defecto.
- URLs firmadas para descarga documental.
- Webhooks Stripe/Resend verificados como fuente de eventos externos.
- Separacion de rol `admin` y `client`.

## Reglas de producto

No crear pantallas decorativas. Cada nueva funcionalidad debe reducir trabajo manual o tener una justificacion clara.

Categorias obligatorias para nuevas funcionalidades:

- captacion
- conversion
- operacion
- comunicacion
- automatizacion
- retencion
- escalabilidad SaaS
