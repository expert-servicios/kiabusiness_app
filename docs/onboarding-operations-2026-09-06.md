# Flujo operativo final de alta EXPERT

Última revisión: 6 de septiembre de 2026.

## Flujo canónico

`Cuenta → perfil + entidad → Checkout Stripe → suscripción activa → correo de activación → reserva Cal.com → correo de preparación Holded → conexión Holded → reunión onboarding → cierre manual Admin → bienvenida Espacio de Cliente Responsable EXPERT → valoración`

## Cliente

1. Completa perfil y entidad fiscal.
2. Contrata una suscripción para una entidad concreta.
3. Recibe la confirmación de activación.
4. Reserva la reunión de onboarding.
5. Recibe la confirmación de cita y un correo separado de preparación con material oficial de Holded Academy.
6. Revisa antes de la reunión: primeros pasos, datos fiscales/configuración, facturación, presupuestos, facturas de venta y registro de facturas/tickets de gasto.
7. Conecta Holded desde el área privada o mediante la autorización segura disponible.
8. Celebra la reunión y resuelve dudas concretas.
9. No puede auto-marcar el onboarding como completado.
10. Después del cierre por Admin recibe la bienvenida al **Espacio de Cliente Responsable EXPERT** y una solicitud de valoración.

## Admin

1. Client 360 muestra perfil, entidad, contratación, Stripe, onboarding, Holded y comunicaciones.
2. La tarea `Completar alta tras suscripción` permanece abierta hasta el cierre.
3. La acción `Finalizar alta y enviar bienvenida` solo se habilita si:
   - existe una suscripción activa/trialing pendiente de onboarding;
   - existe una reunión de onboarding no cancelada cuya fecha/hora ya ha pasado;
   - Holded está conectado por una vía válida.
4. Al confirmar, se actualiza exclusivamente la suscripción seleccionada.
5. El trigger existente completa la tarea y el expediente operacional de onboarding.
6. Se envía una única bienvenida idempotente y se crea/envía una única solicitud de valoración.

## Comunicaciones

- Todos los emails automáticos EXPERT se registran en `email_events`.
- Los nuevos emails guardan también el HTML renderizado para que Comunicaciones 360 pueda mostrar el contenido completo.
- Los emails incluyen metadata operacional (suscripción, entidad, caso, UID Cal.com o fase de onboarding cuando corresponde).

## Facturas y pagos

- Stripe continúa siendo la fuente de verdad.
- El panel cliente consulta en tiempo real hasta 50 facturas de la entidad activa.
- Se muestran estado, total, saldo pendiente, fecha y enlaces Stripe/PDF cuando existen.
- La consulta es solo lectura: no inserta, corrige ni sincroniza históricos financieros.

## Cal.com

Webhook esperado:

`https://expertconsulting.es/api/webhooks/cal`

Eventos:

- `BOOKING_CREATED`
- `BOOKING_CANCELLED`
- `BOOKING_RESCHEDULED`

La firma debe usar el mismo `CAL_WEBHOOK_SECRET` configurado en producción. Si Cal.com no entrega correctamente el webhook, la cita puede existir en Google Calendar pero no en `appointments`, y el cierre del onboarding permanecerá bloqueado hasta corregir la integración o realizar un backfill controlado.

## Reseñas

La aplicación utiliza enlaces de valoración con token y caducidad de 30 días. El 6/09/2026 se detectó drift entre el esquema de producción y el esquema que esperaba el código. Se aplicó una reparación exclusivamente aditiva, sin filas históricas afectadas.
