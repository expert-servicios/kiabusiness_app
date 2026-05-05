# CHANGELOG — EXPERT Platform

Historial de cambios del proyecto ordenado por fase. Versión de producción en [kseniailicheva.com](https://kseniailicheva.com).

---

## [Fase 7] — UI Polish & Páginas Públicas · 2026-05-05

### Correcciones
- **Favicon y logos rotos** — rutas corregidas en `layout.tsx`, `header.tsx` y `footer.tsx` apuntando a `/logos/EXPERT_logo/`
- **Hero en móvil** — overlay reforzado (`bg-[#0D1B2A]/88`) para garantizar legibilidad del texto en pantallas pequeñas
- **Fondos oscuros** — eliminada imagen de fondo de `brand-blue-bg`; ahora color sólido `#0D1B2A` en footer, secciones oscuras y bloques internos

### Header
- Convertido a Client Component (`'use client'`)
- **Dropdown de Servicios** en escritorio con todas las categorías del catálogo
- **Menú hamburguesa** mejorado: acordeón de Servicios + botón *Acceder a mi panel* al final
- `<button type="button">` y `aria-expanded` correctamente configurados

### Footer
- Iconos SVG reales para **LinkedIn, Instagram, Facebook y YouTube**
- Teléfono y email convertidos en enlaces clicables (`tel:` / `mailto:`)

### Botón flotante WhatsApp
- Color cambiado de dorado a **verde WhatsApp** (`#25D366`)

### Divisores dorados
- Línea degradada `#D4A017` añadida tras el Hero (homepage) y antes del Footer (global)

### Páginas nuevas / mejoradas
| Ruta | Estado |
|---|---|
| `/terminos` | Nueva — términos y condiciones completos (ES) |
| `/sobre-mi` | Reescrita — bio, acreditaciones, idiomas, estadísticas |
| `/blog` | Nueva — listado con 6 artículos de ejemplo |
| `/contacto` | Mejorada — formulario con selector de área, datos de contacto, botón WhatsApp |
| `/planes/basico` | Nueva — Plan Básico 99 €/mes |
| `/planes/estandar` | Nueva — Plan Estándar 199 €/mes |
| `/planes/premium` | Nueva — Plan Premium 349 €/mes |
| `/servicios` | Rediseñada — tarjetas por categoría + CTA de planes |
| `/servicios/[categoria]` | Rediseñada — listado de servicios con cards |
| `/servicios/[categoria]/[servicio]` | Rediseñada — página de detalle con FAQ, sidebar CTA, relacionados |

### Catálogo de servicios (`lib/utils/catalog.ts`)
- 27 servicios individuales distribuidos en 7 categorías
- Cada servicio incluye: `name`, `shortDescription`, `description`, `price`, `duration`, `includes[]`, `faqs[]`
- Nuevas funciones exportadas: `getServicesByCategory`, `getService`, `getCategory`

### PWA
- `public/manifest.json` creado con `start_url: /dashboard`
- Manifest inyectado **solo** en `app/(protected)/layout.tsx` (dashboard y admin)
- Meta tags de PWA y Apple Web App añadidos en layout protegido

---

## [Fase 6] — WhatsApp & AI · 2026-05-04

### Integración AI (Anthropic Claude Haiku)
- `lib/integrations/ai.ts` conectado a la API de Anthropic (`claude-haiku-4-5-20251001`)
- Funciones: `classifyQuote`, `suggestServiceCategory`, `draftAdminReply`
- Logging de eventos en tabla `ai_logs` (Supabase)
- Fallback graceful si `ANTHROPIC_API_KEY` no está configurada

### Integración WhatsApp
- `lib/integrations/whatsapp.ts` — `logWhatsAppConversation` con insert real en `whatsapp_conversations`
- Variables de entorno preparadas: `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`

### Admin — Nuevas páginas
- `/admin/usuarios` — tabla de usuarios con cambio de rol inline (`UserRoleSelect`)
- `/admin/reportes` — KPIs y gráficos CSS: revenue por mes, casos por estado, funnel de presupuestos

### Admin — Nuevos endpoints
- `GET /api/admin/users` — lista usuarios con conteos de presupuestos y casos
- `PATCH /api/admin/users` — cambio de rol de usuario
- `GET /api/admin/reports` — métricas agregadas (últimos 6 meses)

### Base de datos
- Migración `20260504120000_add_whatsapp_ai.sql`:
  - Columnas `whatsapp_number` y `whatsapp_consent` en `profiles`
  - Tabla `ai_logs` con RLS
  - Tabla `whatsapp_conversations` con RLS

---

## [Fase 5] — Dashboards · 2026-05-03

### Dashboard de cliente (`/dashboard`)
- Resumen de casos, presupuestos y documentos
- Listado de expedientes con estado visual
- Acceso al portal de pagos (Stripe Customer Portal)

### Dashboard de admin (`/admin`)
- Vista general: métricas de usuarios, ingresos y suscripciones activas
- Gestión de casos y presupuestos

---

## [Fase 4] — Emails transaccionales · 2026-05-02

### Resend
- `lib/integrations/resend.ts` — emails de bienvenida, confirmación de presupuesto y notificaciones de caso
- Webhook de Resend en `/api/webhooks/resend` — logging de eventos en `email_events`
- Variables: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_FROM_EMAIL`

---

## [Fase 3] — Stripe Subscriptions · 2026-05-01

### Stripe
- Checkout de suscripciones con los 3 planes (Básico, Estándar, Premium)
- Customer Portal para gestión de suscripción desde el dashboard
- Webhook en `/api/webhooks/stripe` — maneja `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- Variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Price IDs: `STRIPE_PLAN_MONTHLY_99`, `STRIPE_PLAN_MONTHLY_199`, `STRIPE_PLAN_MONTHLY_349`

---

## [Fase 2] — Auth completo · 2026-04-30

### Supabase Auth
- Magic link (OTP por email) con `signInWithOtp`
- Google OAuth con redirect a `/auth/callback`
- `app/auth/callback/route.ts` — intercambio PKCE code → session
- `proxy.ts` — middleware con `createServerClient` (sesión bidireccional):
  - Redirige usuarios autenticados desde `/auth/login` y `/auth/signup` a `/dashboard`
  - Protege `/dashboard` y `/admin` redirigiendo a login si no hay sesión
  - Comprueba rol `admin` en Supabase para acceso a `/admin`

### Configuración Supabase
- Site URL: `https://kseniailicheva.com`
- Redirect URL: `https://kseniailicheva.com/auth/callback`
- Proyecto: `ybtpqscmqrrjjmuoryap`

---

## [Fase 1] — Estructura base · 2026-04-28

### Stack técnico
- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Stripe** (pagos y suscripciones)
- **Resend** (emails transaccionales)
- **Anthropic SDK** (AI — Claude Haiku)
- **Vercel** (deploy, edge functions)

### Estructura de rutas
```
app/
  (public)/          # Páginas sin autenticación
  (protected)/       # Dashboard cliente + admin (protegidas por proxy.ts)
  auth/              # Login, signup, callback
  api/               # Endpoints REST internos y webhooks externos
```

### Variables de entorno requeridas
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor) |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe |
| `STRIPE_PLAN_MONTHLY_99` | Price ID plan Básico |
| `STRIPE_PLAN_MONTHLY_199` | Price ID plan Estándar |
| `STRIPE_PLAN_MONTHLY_349` | Price ID plan Premium |
| `RESEND_API_KEY` | API key de Resend |
| `RESEND_WEBHOOK_SECRET` | Secret del webhook de Resend |
| `RESEND_FROM_EMAIL` | Dirección de envío |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |
| `ADMIN_EMAILS` | Emails con acceso de administrador |
| `META_WHATSAPP_ACCESS_TOKEN` | Token de acceso WhatsApp Business API |
| `META_WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono de WhatsApp |
| `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token de verificación del webhook |
