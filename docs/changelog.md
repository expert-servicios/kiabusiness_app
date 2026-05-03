# Changelog

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
