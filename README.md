# EXPERT Platform

EXPERT es una plataforma operativa digital construida primero para la asesoria propia de Ksenia Ilicheva y EXPERT ESTUDIOS PROFESIONALES, SLU, con vision de evolucion hacia un SaaS vertical para asesorias, gestorias y despachos profesionales.

## Datos base

- Dominio publico: `kseniailicheva.com`
- Email principal: `soy@kseniailicheva.com`
- WhatsApp Business: `+34 696 55 04 80`
- Empresa: `EXPERT ESTUDIOS PROFESIONALES, SLU`
- CIF: `B44991776`
- Direccion: `C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)`

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase: Postgres, Auth, Storage y RLS
- Stripe: Checkout, pagos puntuales, suscripciones y webhooks
- Resend: emails transaccionales
- Preparacion para Holded, WhatsApp Business e IA supervisada

## Estructura

- `app/(public)`: web publica, servicios, planes, blog y paginas legales.
- `app/(protected)`: portal cliente y panel admin.
- `app/api`: endpoints de negocio, webhooks e integraciones.
- `lib/integrations`: adaptadores de Supabase, Stripe, Resend, WhatsApp e IA.
- `lib/schemas`: validaciones Zod.
- `supabase/migrations`: schema SQL, RLS y buckets.
- `docs/roadmap.md`: roadmap maestro.
- `docs/master-checklist.md`: checklist de cumplimiento.
- `docs/architecture.md`: arquitectura operativa.

## Flujo operativo core

1. Cliente solicita presupuesto o compra online.
2. Stripe confirma pago.
3. Supabase crea `order` y expediente.
4. Holded debe crear cliente/factura cuando se integre el conector.
5. Resend o WhatsApp notifican.
6. Cliente gestiona documentos desde el panel seguro.
7. Admin revisa, comunica estado y entrega resultados.

## Comandos

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Variables principales

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
RESEND_FROM_EMAIL=soy@kseniailicheva.com

NEXT_PUBLIC_APP_URL=https://kseniailicheva.com
ADMIN_EMAILS=soy@kseniailicheva.com
```

## Estado actual

Fase 0 completada: el proyecto compila, el build pasa y las rutas duplicadas principales fueron retiradas. La siguiente prioridad es crear `/para-asesorias`, consolidar navegacion publica y preparar Holded.
