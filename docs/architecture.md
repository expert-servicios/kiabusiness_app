# Arquitectura EXPERT SaaS

## Módulos

1. **Marketing web (público)**: SEO, captación, formularios de contacto y presupuesto.
2. **Pipeline comercial**: leads → presupuesto → pago Stripe → expediente.
3. **Portal cliente**: seguimiento de expedientes, subida documental, mensajes, pagos.
4. **Admin backoffice**: operación integral, revisiones, métricas y contenido.
5. **Automatizaciones**: emails Resend, recordatorios, reseñas verificadas.

## Eventos clave

- `quote.accepted`: cliente acepta presupuesto.
- `stripe.checkout.session.completed`: marca presupuesto como pagado y crea expediente.
- `case.finalized`: genera solicitud reseña con token único.
- `review.submitted`: pasa a validación admin.

## Integraciones

- **Supabase Auth**: Magic link + Google OAuth.
- **Supabase Storage**: documentos con URLs firmadas.
- **Stripe**: one-time + subscriptions + customer portal.
- **Resend**: comunicaciones transaccionales.

## Seguridad

- RLS por defecto, políticas por recurso.
- Separación rol `admin` y `client`.
- Auditoría de acciones críticas.
- Consentimiento RGPD en formularios públicos.
