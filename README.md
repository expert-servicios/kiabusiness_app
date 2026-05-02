# EXPERT Platform

Plataforma SaaS para EXPERT ESTUDIOS PROFESIONALES, SLU, especializada en asesoría fiscal, legal y administrativa en España.

- Dominio público: `kseniailicheva.com`
- Correo principal: `soy@kseniailicheva.com`
- WhatsApp Business: `+34 696 55 04 80`
- Empresa: `EXPERT ESTUDIOS PROFESIONALES, SLU`
- CIF: `B44991776`
- Dirección: `C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)`

## Objetivo del proyecto

Crear una plataforma escalable y segura que permita a una sola persona gestionar servicios, clientes, pagos, expedientes, documentos y comunicaciones con el mínimo esfuerzo manual.

## Stack principal

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)
- Stripe Checkout + Billing + Webhooks
- Resend para emails transaccionales
- Preparación para WhatsApp Business y AI asistido

## Estructura clave

- `app/(public)`: sitio público y páginas legales.
- `app/(protected)`: área cliente y admin.
- `lib/schemas`: validación de datos con Zod.
- `lib/integrations`: clientes y adaptadores (Supabase, Stripe, Resend, WhatsApp, AI).
- `supabase/migrations`: esquema SQL con tablas y políticas RLS.
- `docs/architecture.md`: arquitectura general.
- `docs/implementation-plan.md`: plan de implementación por fases.
- `.env.example`: plantilla de variables de entorno.

## Documentación disponible

- `docs/architecture.md`
- `docs/implementation-plan.md`
- `.env.example`

## Páginas legales preparadas

- `/aviso-legal`
- `/privacidad`
- `/cookies`
- `/condiciones`

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PLAN_MONTHLY_99=
STRIPE_PLAN_MONTHLY_199=
STRIPE_PLAN_MONTHLY_349=

# Resend
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
RESEND_FROM_EMAIL=soy@kseniailicheva.com

# WhatsApp / Meta Cloud (futuro)
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# AI (futuro)
AI_PROVIDER_API_KEY=
AI_PROVIDER=

# General
NEXT_PUBLIC_APP_URL=https://kseniailicheva.com
ADMIN_EMAILS=soy@kseniailicheva.com
```

## Próximos pasos

1. Revisar `docs/implementation-plan.md` para el plan por fases.
2. Crear el documento `.env.example` con los valores a completar.
3. Mantener el diseño público actual asociado a `kseniailicheva.com`.
4. Iniciar implementación de funcionalidades en el orden propuesto.
