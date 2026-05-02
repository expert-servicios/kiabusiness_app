# Arquitectura EXPERT SaaS

## Datos de la empresa

- Empresa: `EXPERT ESTUDIOS PROFESIONALES, SLU`
- CIF: `B44991776`
- Dirección: `C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)`
- Email principal: `soy@kseniailicheva.com`
- WhatsApp Business: `+34 696 55 04 80`
- Dominio público: `kseniailicheva.com`

## Módulos

1. **Marketing web (público)**: SEO, captación, páginas de servicio, formularios de contacto y presupuesto.
2. **Pipeline comercial**: leads → presupuesto → pago Stripe → orden → expediente.
3. **Portal cliente**: seguimiento de casos, subida documental, mensajes, pagos, facturas y reseñas.
4. **Admin backoffice**: operación integral, métricas, gestión de servicios, casos, documentos, presupuestos, suscripciones y reseñas.
5. **Automatizaciones**: emails Resend, webhooks, notificaciones, solicitud de reseñas y preparación para WhatsApp/AI.

## Eventos clave

- `quote.received`: llega una solicitud de presupuesto.
- `quote.accepted`: cliente acepta presupuesto.
- `checkout.session.completed`: Stripe confirma pago y crea orden + expediente.
- `case.status.updated`: el estado del expediente cambia y se notifica.
- `case.completed`: se genera solicitud de reseña.
- `review.submitted`: reseña pasa a moderación.

## Integraciones

- **Supabase Auth**: Magic link + Google OAuth.
- **Supabase Storage**: documentos privados y entregables.
- **Stripe**: pagos one-time, suscripciones, checkout, customer portal, webhooks.
- **Resend**: emails transaccionales y webhook de eventos.
- **WhatsApp / Meta Cloud**: arquitectura preparada para notificaciones futuras.
- **AI**: capa de clasificación, respuestas y sugerencias con logged output.

## Seguridad

- RLS por defecto en tablas relevantes.
- Roles: `admin`, `client`.
- Separación clara entre ventas (`orders`) y operación (`cases`).
- Documentos privados por defecto.
- Webhooks de Stripe y Resend como fuente de la verdad.

## Diseño y experiencia

- La web pública actual se mantiene en `app/(public)` y se preserva para el dominio `kseniailicheva.com`.
- El portal cliente y admin se ubican en `app/(protected)` con control de sesión.
- Las páginas legales se publican en `/aviso-legal`, `/privacidad`, `/cookies` y `/condiciones`.
