# Changelog

## 2026-05-04 (sesión 5 — Fase 5)

- Añadida migración `supabase/migrations/20260503160000_add_messages_table.sql`: tabla `messages` con RLS (acceso por case_id para admin y clientes propietarios).
- Actualizado `next.config.ts`: `bodySizeLimit: '10mb'` en `serverActions` para subida de archivos.
- Creado `GET /api/profile` + `PATCH /api/profile`: lectura y edición de `full_name` y `phone` del usuario autenticado.
- Creado `GET /api/cases/[id]/documents` + `POST /api/cases/[id]/documents`: listado y subida de archivos a Supabase Storage (`client-documents`), con registro en tabla `documents`.
- Creado `GET /api/cases/[id]/messages` + `POST /api/cases/[id]/messages`: hilo de mensajes de caso con join de perfil; rol verificado dinámicamente.
- Creado `PATCH /api/documents/[id]`: admin aprueba o rechaza documentos (estado: pendiente/revisado/rechazado).
- Creados `GET /api/admin/emails` y `GET /api/admin/subscriptions`: endpoints de solo lectura para vistas administrativas.
- Creadas páginas cliente:
  - `/dashboard/expedientes`: lista de casos activos y finalizados con estado visual.
  - `/dashboard/expedientes/[id]`: detalle de caso con `DocumentUpload` y `CaseMessageThread` en grid 2 columnas.
  - `/dashboard/perfil`: formulario editable de nombre y teléfono con `ProfileForm`.
- Creados componentes:
  - `DocumentUpload`: carga de archivos con estado visual de documentos.
  - `CaseMessageThread`: hilo de mensajes alineados por rol; Ctrl+Enter para enviar.
  - `ProfileForm`: PATCH a `/api/profile` con feedback inline.
- Creadas páginas admin:
  - `/admin/emails`: tabla con los últimos 200 registros de `email_events` con estado y tipo de evento.
  - `/admin/suscripciones`: lista de suscripciones con plan, estado y fechas de renovación/cancelación.
- Actualizados `admin/page.tsx` (añadidos cards Emails y Suscripciones) y `dashboard/page.tsx` (botón Mi perfil y pasos como enlaces clicables).
- Build verificado — sin errores.

## 2026-05-03 (sesión 4 — Fase 4)

- Añadida migración `supabase/migrations/20260503150000_add_email_events_table.sql`: tabla `email_events` con RLS (admin puede ver todos los registros).
- Creado `lib/email/templates.ts`: 11 plantillas HTML con identidad visual EXPERT (base responsive, fondo cream, cabecera navy, botones gold). Plantillas: `quoteReceivedClient`, `quoteReceivedAdmin`, `quoteResponded`, `quoteAcceptedAdmin`, `paymentConfirmed`, `caseStatusUpdated`, `serviceCompleted`, `reviewRequest`, `subscriptionCreated`, `subscriptionPaymentFailed`, `documentRequired`.
- Creado `lib/email/send.ts`: helper `sendEmail()` que envía vía Resend y registra en `email_events` (resend_id, status, metadata).
- Actualizado `POST /api/quotes`: usa `sendEmail` con `quoteReceivedClient` + `quoteReceivedAdmin`. Eliminado bloque raw de Resend.
- Actualizado `PATCH /api/quotes/[id]`: envía `quoteResponded` cuando admin fija importe; envía `quoteAcceptedAdmin` cuando status → `accepted`.
- Actualizado `app/api/stripe/webhook/route.ts`: envía `paymentConfirmed` en `checkout.session.completed` (pago único); envía `subscriptionCreated` en `customer.subscription.created`; envía `subscriptionPaymentFailed` cuando estado → `past_due`.
- Actualizado `PATCH /api/cases/[id]`: envía `caseStatusUpdated` en cambios de estado; envía `serviceCompleted` + `reviewRequest` al pasar a `finalizado`.
- Creado `POST /api/resend/webhook`: verifica firma con `standardwebhooks`, actualiza `email_events.status` a `delivered`, `bounced` o `failed`.
- Build verificado — sin errores.

## 2026-05-03 (sesión 3 — Fase 3)

- Añadida migración `supabase/migrations/20260503140000_add_subscriptions_table.sql`:
  - Tabla `subscriptions` con estados Stripe, período de facturación y RLS.
  - Columna `stripe_customer_id` en `profiles`.
- Creado `POST /api/subscriptions/checkout`: genera sesión Stripe en modo `subscription`.
- Creado `GET /api/subscriptions`: lista suscripciones del usuario autenticado (RLS).
- Creado `POST /api/customer-portal`: redirige al portal de facturación de Stripe.
- Actualizado `app/api/stripe/webhook/route.ts`:
  - `checkout.session.completed` en modo `subscription`: guarda `stripe_customer_id` en perfil.
  - `customer.subscription.created`: inserta/upsert en `subscriptions`.
  - `customer.subscription.updated`: actualiza estado y período (usa `items.data[0]`, Stripe API 22.x).
  - `customer.subscription.deleted`: marca como `canceled`.
  - Eliminado handler de `invoice.payment_failed` — cubierto por `subscription.updated`.
- Creada `app/(protected)/dashboard/suscripciones/page.tsx`:
  - Muestra suscripciones activas con estado visual.
  - Si no hay suscripción activa, muestra los 3 planes con botón de alta.
  - Botón "Gestionar suscripción" redirige al portal Stripe.
- Creados componentes: `CustomerPortalButton`, `SubscriptionCheckoutButton`.
- Actualizado dashboard cliente: añade tarjeta de suscripciones activas y CTA de upsell.
- Build verificado con `npm run build` — sin errores.

## 2026-05-03 (sesión 2)

- Corregido bug en `GET /api/quotes`: `client_id` no se incluía en el select, lo que causaba que la columna "Cliente registrado / Lead anónimo" siempre mostrara "Lead anónimo".
- Creado `app/api/cases/route.ts` — `GET /api/cases`: lista expedientes del usuario autenticado (RLS filtra por rol).
- Creado `app/api/cases/[id]/route.ts` — `PATCH /api/cases/[id]`: admin actualiza estado del expediente y registra el cambio en `audit_logs`.
- Creado `app/api/admin/stats/route.ts` — `GET /api/admin/stats`: métricas reales (usuarios, presupuestos pendientes, ingresos, expedientes activos).
- Conectado `app/(protected)/dashboard/page.tsx` con datos reales (presupuestos pendientes, expedientes activos, pagos pendientes).
- Conectado `app/(protected)/admin/page.tsx` con datos reales desde `/api/admin/stats`.
- Creada `app/(protected)/admin/expedientes/page.tsx`: lista de expedientes con `AdminCaseCard` para cambio de estado.
- Creado `components/cases/AdminCaseCard.tsx`: tarjeta de expediente con selector de estado en tiempo real.
- Build verificado con `npm run build` — sin errores.

## 2026-05-03 (sesión 1)

- Añadida migración `supabase/migrations/20260503120000_add_orders_table.sql` para crear la tabla `orders`.
- Actualizado `app/api/stripe/webhook/route.ts` para:
  - registrar la orden tras `checkout.session.completed`
  - actualizar el estado de `quotes` a `paid`
  - crear un `case` vinculado cuando el cliente exista
- Corregido `components/site/footer.tsx` para usar iconos soportados por `lucide-react`.
- Añadidas páginas protegidas de presupuestos:
  - `app/(protected)/dashboard/presupuestos/page.tsx` para clientes.
  - `app/(protected)/admin/presupuestos/page.tsx` para admin.
  - `components/quotes/CheckoutButton.tsx` para iniciar pago desde la lista de presupuestos.
- Verificación exitosa con `npm run build`.
