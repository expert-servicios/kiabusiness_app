# EXPERT - Arquitectura operativa

Ultima actualizacion: 2026-06-04

## Vision

EXPERT es una plataforma operativa digital para asesorias, gestorias y despachos profesionales. Las asesorias son los clientes (tenants): contratan EXPERT para digitalizar y automatizar su operativa.

Dominio canonico: `expertconsulting.es`.
Tenant inicial y caso de uso de referencia: EXPERT ESTUDIOS PROFESIONALES, SLU.

La arquitectura debe resolver la operativa real de hoy sin cerrar la puerta al SaaS multi-tenant de manana.

## Fases

### Fase actual: plataforma operativa para asesorias (tenant unico)

Objetivo: gestionar expedientes, documentos, clientes, pagos, comunicaciones y cumplimiento fiscal para una asesoria. Reducir trabajo manual. Validar el producto con la operativa de EXPERT.

### Fase futura: SaaS multi-tenant para asesorias

Objetivo: que cualquier asesoria pueda activar su propio tenant en EXPERT y operar con su branding, servicios, plantillas, integraciones y clientes. Kia Copiloto es el diferenciador principal.

## Modulos actuales

- Web publica (`expertconsulting.es`): orientada a asesorias como clientes. Home, propuesta de valor B2B, planes, integraciones, contacto y acceso.
- Auth: Google OAuth y magic link.
- Pipeline comercial: lead -> quote -> Stripe checkout -> order -> case.
- Portal cliente (asesoria): expedientes, documentos, empresas conectadas, presupuestos, suscripciones, perfil y Kia Copiloto flotante.
- Admin: usuarios, presupuestos, expedientes, documentos, emails, suscripciones, integraciones Holded/Stripe, dashboard operativo NBA y reportes.
- Storage: bucket privado `client-documents`.
- Comunicaciones: Resend (email transaccional) y WhatsApp Business (notificaciones salientes).
- Pagos: Stripe one-time payments, suscripciones y customer portal.
- IA: Kia Copiloto widget flotante in-app. Ver seccion Kia.

## Flujo operativo ideal

Asesoria contrata EXPERT -> se crea tenant -> configura integracion Holded -> admin crea o importa expediente -> Stripe cobra -> Supabase crea `order` y `case` -> Holded sincroniza contacto/factura -> Resend notifica al cliente -> cliente gestiona documentacion en el portal -> Kia Copiloto asiste al operador en cualquier momento desde el widget flotante.

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

Separacion de conceptos:

- `tenant`: asesoria, gestoria o despacho que usa EXPERT como sistema. Es el cliente de EXPERT.
- `company`: empresa, autonomo o entidad fiscal gestionada por la asesoria. Es el cliente de la asesoria.
- `profile`: usuario del sistema (operadores de la asesoria y, opcionalmente, sus clientes finales).

Tenant inicial: EXPERT ESTUDIOS PROFESIONALES, SLU con `slug = 'expert'`.

Tablas a crear (ver IMP-014):

- `tenants` — id, slug, name, domain, settings jsonb, created_at
- `tenant_settings` — configuracion por tenant
- `tenant_branding` — logo, colores, dominio personalizado
- `tenant_integrations` — Holded, Stripe, WhatsApp por tenant
- `tenant_email_templates` — plantillas por tenant
- `tenant_automation_rules` — reglas de automatizacion por tenant
- `tenant_roles` — roles y permisos por tenant
- `tenant_services` — catalogo de servicios por tenant

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

WhatsApp se usa exclusivamente como canal de notificaciones salientes: avisos de estado de expediente, recordatorios de documentacion pendiente, confirmaciones de pago y enlaces al portal seguro. No es la interfaz principal de Kia ni repositorio documental.

### Kia Copiloto (IA)

Kia es el copiloto operativo interno de EXPERT. Se accede mediante un boton flotante en la esquina inferior derecha de cualquier pagina del portal (dashboard, expedientes, empresa, admin). Al activarlo, se abre una ventana de chat lateral.

Capacidades del copiloto:

- Consultar y resumir el estado de las empresas conectadas del tenant.
- Responder preguntas sobre expedientes activos, documentacion pendiente e integraciones.
- Orientar en tramites fiscales, laborales, mercantiles, de extranjeria y de trafico usando conocimiento de dominio curado (AEAT, SS, DGT, Holded Academy, PAE, Justicia, CCAA).
- Guiar al usuario por flujos del sistema: conectar Holded, crear un expediente, subir documentacion.
- Ejecutar acciones asistidas con confirmacion humana previa: enviar email, actualizar estado, crear nota.

Arquitectura del widget:

- `components/KiaCopilotWidget.tsx` — boton flotante + ventana de chat (posicion fixed).
- `app/api/ai/kia/route.ts` — endpoint de chat in-app con streaming.
- `lib/ai/kia/kia-context-builder.ts` — contexto enriquecido con tenant, empresas, expedientes activos, pagina actual.
- `lib/ai/kia/kia-tool-definitions.ts` y `kia-tool-executor.ts` — herramientas del copiloto.
- `kia_sessions` en Supabase — historial de sesion vinculado a usuario y tenant.

Reglas de la IA:

- Toda salida se registra y clasifica: automatica permitida / borrador para revision / requiere intervencion humana.
- Las acciones con efecto externo requieren confirmacion del usuario.
- El motor de decision estructurado actua como primera linea; el LLM entra cuando el determinismo no es suficiente.
- Health checks y auditor Kia vigilan el comportamiento en produccion.

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
