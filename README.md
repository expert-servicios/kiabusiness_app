# EXPERT Platform

Base de producto SaaS para una asesoría fiscal/legal/administrativa en España usando Next.js 15 + Supabase + Stripe + Resend.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + UI modular estilo premium
- Supabase (Postgres/Auth/Storage/RLS)
- Stripe (pagos, suscripciones, checkout, webhooks)
- Resend (emails transaccionales)
- Zod + React Hook Form

## Estructura principal

- `app/(public)`: web corporativa y páginas de conversión.
- `app/(app)/dashboard`: área privada cliente.
- `app/(app)/admin`: panel administrativo.
- `lib/schemas`: validaciones de dominio.
- `lib/integrations`: clientes para Supabase/Stripe/Resend.
- `supabase/migrations`: esquema SQL con RLS.
- `docs/architecture.md`: blueprint modular.

## Flujo operativo core

1. Lead entra por formulario público.
2. Admin cualifica y emite presupuesto.
3. Cliente acepta y paga vía Stripe Checkout.
4. Webhook marca pago y abre expediente.
5. Cliente sube documentos en bucket privado.
6. Admin finaliza expediente y dispara reseña verificada.

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

## Pendientes para producción

- Implementar rutas API y server actions reales (webhooks, checkout, customer portal, reseñas).
- Conectar formularios RHF + Zod a tablas Supabase.
- Añadir colas/cron para recordatorios y reintentos de email.
- Test E2E de flujos críticos (lead->quote->payment->case).
