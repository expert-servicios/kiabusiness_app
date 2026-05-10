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
- Holded: CRM, proyectos, contactos, presupuestos/facturacion controlada y reporting financiero
- Google reCAPTCHA v3: proteccion anti-spam de formularios publicos
- Preparacion para WhatsApp Business e IA supervisada

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
4. EXPERT deja trazabilidad operativa y, cuando procede, sincroniza contacto, lead, proyecto o documento con Holded sin duplicar Stripe/banco.
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

HOLDED_API_KEY=
HOLDED_SYNC_ENABLED=true
HOLDED_SYNC_QUOTES=true
HOLDED_CREATE_INVOICES_FROM_STRIPE=false
HOLDED_CRM_FUNNEL_ID=
HOLDED_CRM_DEFAULT_STAGE_ID=
HOLDED_PROJECT_DEFAULT_LIST_ID=
HOLDED_DEFAULT_QUOTE_DOC_TYPE=estimate

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_MIN_SCORE=0.5

CALENDLY_ONBOARDING_URL=
CALENDLY_FORMACION_URL=

NEXT_PUBLIC_APP_URL=https://kseniailicheva.com
ADMIN_EMAILS=soy@kseniailicheva.com
```

## Panel admin actual

- `/admin`: bandeja operativa con acciones que requieren atencion.
- `/admin/usuarios`: usuarios, roles y limpieza segura de usuarios spam sin actividad operativa.
- `/admin/presupuestos`: gestion de presupuestos y sincronizacion manual con Holded.
- `/admin/expedientes`: expedientes, checklist documental y sincronizacion de proyecto Holded.
- `/admin/saas-leads`: leads B2B del piloto SaaS y sincronizacion con Holded CRM.
- `/admin/integraciones`: estado de Holded y eventos de sincronizacion.

## Estado actual

Fase 0 completada: el proyecto compila, las migraciones locales se validaron con Supabase local y el panel admin ya funciona como bandeja operativa.

Bloque actual: cerrar P0 remoto, consolidar sincronizacion Holded desde admin, reforzar automatizaciones por estado y mantener la arquitectura preparada para multi-tenant futuro.
