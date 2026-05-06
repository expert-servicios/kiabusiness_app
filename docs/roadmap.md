# EXPERT Platform — Roadmap de implementación

Última actualización: 2026-05-06

---

## Fases completadas ✓

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Auth (magic link + Google OAuth, middleware, roles) | ✓ |
| 2 | API core: presupuestos, pagos, expedientes, webhook Stripe | ✓ |
| 3 | Suscripciones Stripe + portal cliente | ✓ |
| 4 | 11 plantillas email transaccionales (Resend) | ✓ |
| 5 | Dashboards cliente y admin | ✓ |
| 6 | Stubs WhatsApp + AI (pendientes de API keys externas) | ✓ |
| 7a | Multi-empresa: expert_companies, switcher, crear/editar | ✓ |
| 7b | Storage bucket user-files, correo bienvenida, newsletter | ✓ |

---

## Phase 7 — Anti-spam y calidad de email (URGENTE)

**Problema**: correos de spam en formulario de contacto y newsletter sin plantilla branded.

### 7.1 Plantillas email en formulario de contacto
- [ ] Añadir `contactMessage()` y `contactAutoReply()` a `lib/email/templates.ts`
- [ ] Actualizar `/api/contact/route.ts` para usar `sendEmail()` + plantillas branded

### 7.2 Protección anti-spam — Honeypot
- [ ] Campo honeypot `hp_url` oculto en formulario de contacto
- [ ] Campo honeypot `hp_url` en `NewsletterForm.tsx`
- [ ] Validación honeypot en `/api/contact` y `/api/newsletter`

### 7.3 Protección anti-spam — Cloudflare Turnstile
- [ ] Widget Turnstile en formulario de contacto (activado por env var)
- [ ] Verificación server-side en `/api/contact` (solo si `TURNSTILE_SECRET_KEY` está definida)
- [ ] Variables a añadir en Vercel: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`

---

## Phase 8 — Panel Admin completo

### 8.1 Usuarios con empresa asociada
- [ ] `/admin/usuarios` muestra empresa activa y rol de cada cliente
- [ ] Filtro por empresa / sin empresa

### 8.2 Gestión de documentos (admin)
- [ ] `/admin/expedientes/[id]` muestra documentos subidos
- [ ] Aprobar / rechazar documentos con email automático

### 8.3 Analytics mejorado
- [ ] Gráfico de ingresos mensuales en `/admin/informes`
- [ ] Exportar CSV de pedidos

---

## Phase 9 — Integraciones externas (cuando estén disponibles las API keys)

### 9.1 WhatsApp Meta Cloud API
- [ ] Completar `lib/integrations/whatsapp.ts` (stubs → real API)
- [ ] Webhook verificado + recepción de mensajes
- [ ] Envío de notificaciones al cliente por WhatsApp

### 9.2 Claude API — Clasificación y asistente IA
- [ ] `classifyQuote()` — categoría de servicio automática
- [ ] `draftAdminReply()` — borrador de respuesta para admin
- [ ] `detectMissingDocuments()` — alerta de documentación incompleta

### 9.3 Blog CMS
- [ ] Decisión: MDX local vs. Sanity/Contentful
- [ ] Artículos reales con metadatos SEO
- [ ] Sitemap dinámico

---

## Phase 10 — Producción y monitorización (continuo)

### 10.1 Variables de entorno Vercel
- [ ] Auditar `.env.local` vs. variables en Vercel production
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`

### 10.2 Error monitoring
- [ ] Integrar Sentry (Next.js SDK)
- [ ] Alertas por email en errores críticos

### 10.3 SEO y rendimiento
- [ ] `next/image` en todas las imágenes
- [ ] Core Web Vitals audit (Lighthouse)
- [ ] Sitemap.xml + robots.txt

### 10.4 GDPR y legal
- [ ] Banner de cookies con consentimiento real (no solo enlace)
- [ ] Descarga de datos de usuario (RGPD art. 20)
- [ ] Gestión de baja de newsletter

---

## Orden de ejecución inmediato

```
Phase 7 (ahora) → Phase 8 (siguiente sesión) → Phase 9 (cuando haya API keys) → Phase 10 (continuo)
```
