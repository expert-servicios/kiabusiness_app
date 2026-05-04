# Plan de implementación por fases

## Resumen del proyecto

EXPERT es una plataforma SaaS para EXPERT ESTUDIOS PROFESIONALES, SLU, especializada en asesoría fiscal, legal y administrativa en España.

El objetivo es crear un sistema completo que permita a una sola persona gestionar:

- Captación y conversión de leads
- Venta online de servicios y suscripciones
- Gestión operativa de casos y documentos
- Comunicación con clientes
- Administración interna completa
- Preparación para WhatsApp Business y asistentes de IA

## Estructura de la plataforma

- `app/(public)`: sitio público corporativo y páginas legales.
- `app/(protected)`: área cliente y panel admin.
- `lib/schemas`: validaciones de datos.
- `lib/integrations`: adaptadores para Supabase, Stripe, Resend, WhatsApp y AI.
- `supabase/migrations`: definición del esquema SQL y políticas RLS.
- `docs/implementation-plan.md`: este documento.
- `.env.example`: plantilla con variables de entorno.

## Fase 1: Fundamentos y autenticación

### Objetivo
Establecer la base de seguridad y acceso a la plataforma.

### Tareas

- Configurar Supabase Auth con magic link y Google OAuth.
- Crear middleware que proteja `/dashboard` y `/admin`.
- Implementar el contexto de usuario y el hook `useAuth()`.
- Verificar que los roles `client` y `admin` se respetan.
- Confirmar que las rutas protegidas no se pueden acceder sin sesión.

### Resultado esperado

- Usuarios pueden iniciar sesión.
- Clientes acceden a su dashboard.
- Admin solo accede al panel administrativo.

## Fase 2: API core y flujo comercial

### Objetivo
Establecer las rutas y entidades que soportan leads, presupuestos, pagos y casos.

### Tareas

- Crear la API de recepción de presupuestos (`/api/quotes`).
- Implementar el checkout de Stripe (`/api/checkout`).
- Configurar webhooks de Stripe con verificación de firma.
- Crear ordenes (`orders`) y casos (`cases`) tras pago confirmado.
- Implementar actualización de estado de casos con historial.
- Crear endpoints para documentos, pedidos y mensajes.

### Resultado esperado

- Un lead puede enviarse desde el sitio público.
- Un servicio puede pagarse con Stripe.
- Stripe activa el flujo operativo: order + case.
- El caso registra cambios de estado y queda disponible en el dashboard.

## Fase 3: Integración de pagos y suscripciones

### Objetivo
Habilitar pagos online reales y suscripciones mensuales.

### Tareas

- Configurar Stripe con precios fijos y planes recurrentes.
- Asociar `services` con `stripe_price_id`.
- Generar sesiones de checkout correctas.
- Crear suscripciones y registrar su estado en la base de datos.
- Generar links a customer portal de Stripe.

### Resultado esperado

- El checkout funciona con precios reales.
- Se pueden gestionar suscripciones desde el portal.
- Los pagos recurrentes se rastrean en el sistema.

## Fase 4: Emails transaccionales y seguimiento

### Objetivo
Automatizar comunicaciones en todos los eventos clave.

### Tareas

- Crear plantillas de email para:
  - confirmación de pedido
  - pago confirmado
  - solicitud de documentos
  - documentos rechazados
  - actualización de estado del caso
  - servicio completado
  - solicitud de reseña
  - quote recibido
  - quote respondido
  - suscripción creada
  - pago de suscripción fallido
- Enviar emails desde el backend con Resend.
- Registrar eventos de correo en `email_events`.
- Implementar webhook de Resend para entrega/rebote.

### Resultado esperado

- Los clientes reciben emails automatizados.
- El admin puede revisar logs de email.
- El sistema usa Resend como fuente de la verdad.

## Fase 5: Dashboards de cliente y admin

### Objetivo
Entregar interfaces operativas para cliente y administrador.

### Tareas cliente

- Panel de usuario con:
  - resumen de casos activos
  - lista de servicios y estados
  - documentos requeridos y carga de archivos
  - pagos, facturas y suscripciones
  - mensajes de caso
  - solicitudes de reseña pendientes
- Vista de detalle de caso con historial y acciones.

### Tareas admin

- Panel de admin con:
  - métricas de casos abiertos y necesidades de acción
  - gestión de clientes y casos
  - CRUD de servicios y categorías
  - revisión de documentos
  - gestión de presupuestos y conversión a pago
  - moderación de reseñas
  - control de suscripciones
  - registros de email
  - preparación para WhatsApp

### Resultado esperado

- El cliente puede operar sin depender del admin.
- El admin gestiona el negocio desde una sola interfaz.

## Fase 6: Preparación para WhatsApp y AI

### Objetivo
Diseñar la arquitectura para integraciones futuras sin bloquear el lanzamiento.

### Tareas

- Crear adaptadores de WhatsApp con stubs:
  - `sendWhatsAppMessage()`
  - `handleWhatsAppWebhook()`
  - `mapWhatsAppMessageToClient()`
  - `logWhatsAppConversation()`
- Crear adaptadores de IA con stubs:
  - `classifyQuote()`
  - `suggestServiceCategory()`
  - `draftAdminReply()`
  - `summarizeCaseHistory()`
  - `detectMissingDocuments()`
- Implementar registro en `ai_logs`.
- Agregar consentimiento y número de WhatsApp en el perfil.

### Resultado esperado

- La plataforma está lista para conectar Meta Cloud y proveedores de IA.
- Los registros de conversación y confianza existen en la base.

## Páginas legales preparadas

- `/aviso-legal`
- `/privacidad`
- `/cookies`
- `/condiciones`

Estas páginas se generan con la información legal de la empresa y estarán publicadas en el sitio.

## Documentos clave

- `docs/architecture.md`: arquitectura general y eventos clave.
- `docs/implementation-plan.md`: plan faseado y checklist.
- `.env.example`: plantilla de variables de entorno.

## Orden de implementación recomendado

1. Autenticación y seguridad.
2. API core y flujo de pago.
3. Stripe y suscripciones.
4. Emails transaccionales.
5. Dashboards cliente/admin.
6. Preparación de WhatsApp y AI.

## Estado actual

- **Fase 1: Autenticación y seguridad** — COMPLETADA
  - Autenticación por email mágico con Supabase implementada.
  - Inicio de sesión con Google OAuth habilitado.
  - Middleware protege `/dashboard` y `/admin`.
  - Página de registro `/auth/signup` creada.

- **Fase 2: API core y flujo comercial** — COMPLETADA
  - `POST /api/quotes`: recepción de solicitudes de presupuesto con email automático.
  - `GET /api/quotes`: lista de presupuestos por rol (RLS).
  - `PATCH /api/quotes/[id]`: admin actualiza importe, estado y caducidad.
  - `POST /api/quotes/[id]/checkout`: genera sesión de Stripe Checkout.
  - `POST /api/stripe/webhook`: verifica firma, crea `order` y `case` tras pago.
  - `GET /api/cases`: lista expedientes por rol (RLS).
  - `PATCH /api/cases/[id]`: admin cambia estado del expediente con audit log.
  - `GET /api/admin/stats`: métricas reales para el panel admin.
  - Dashboard cliente con datos reales (presupuestos, expedientes, pagos).
  - Panel admin con datos reales y acceso a expedientes.
  - Página `admin/expedientes` con cambio de estado en tiempo real.

- **Fase 3: Integración de pagos y suscripciones** — COMPLETADA (2026-05-03)
  - Tabla `subscriptions` con RLS; `stripe_customer_id` en `profiles`.
  - `POST /api/subscriptions/checkout`: checkout en modo `subscription`.
  - `GET /api/subscriptions`: lista suscripciones por rol.
  - `POST /api/customer-portal`: acceso al portal Stripe de facturación.
  - Webhook actualizado: maneja `subscription.created/updated/deleted`.
  - Dashboard cliente: página `/dashboard/suscripciones` con estado, planes y portal.

- **Fase 4: Emails transaccionales** — COMPLETADA (2026-05-03)
  - Tabla `email_events` (log de todos los envíos con resend_id y status).
  - 11 plantillas HTML en `lib/email/templates.ts` con identidad visual EXPERT.
  - Helper `sendEmail()` en `lib/email/send.ts` (envío + log automático).
  - Disparadores activos: quote.received, quote.responded, quote.accepted, payment.confirmed, case.status.updated, service.completed, review.request, subscription.created, subscription.payment_failed.
  - Webhook Resend (`/api/resend/webhook`): actualiza estado de entrega/rebote en `email_events`.

- **Fase 5: Dashboards cliente y admin** — COMPLETADA (2026-05-04)
  - API: profile (GET + PATCH), documents por caso (GET + POST), messages por caso (GET + POST), documents admin (PATCH), admin/emails (GET), admin/subscriptions (GET).
  - Componentes: `DocumentUpload`, `CaseMessageThread`, `ProfileForm`.
  - Páginas cliente: `/dashboard/expedientes`, `/dashboard/expedientes/[id]`, `/dashboard/perfil`.
  - Páginas admin: `/admin/emails`, `/admin/suscripciones`.
  - Navegación actualizada: admin panel incluye cards de Emails y Suscripciones; dashboard cliente incluye acceso directo a perfil y pasos clicables.

- **Siguiente fase**: Fase 6 — Preparación para WhatsApp y AI.

## Limpieza previa a la implementación

- Eliminar archivos de diseño no usados y documentos de soporte redundantes.
- Mantener el diseño público actual de `kseniailicheva.com`.
- Ajustar `config/brand.ts` con el email oficial `soy@kseniailicheva.com`.
