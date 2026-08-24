# Stripe y conversión

## Enlace aprobado

```text
https://buy.stripe.com/6oU00kftqgMs9jU5gJ8EM0i
```

## CTAs

| Objetivo | Texto | Destino |
| --- | --- | --- |
| Compra | Inscribirme y pagar | Stripe Payment Link |
| Interés o dudas | Solicitar información | `#solicitar-info` y formulario específico |
| Entrevista | Reservar reunión informativa | Cal.com; fallback `/cita` |
| Evidencia | Descargar programa | PDF corporativo |
| Formación | Explorar manuales | `/docs/laboral` |

## Reglas del pago

- No crear un Price ID ficticio.
- No reutilizar el Price ID del Programa Superior.
- Mantener importe visible de 1.200 € en landing y Stripe.
- Indicar pago único.
- Mantener la redacción fiscal condicionada.
- Abrir Stripe en la misma pestaña para reducir abandono, salvo decisión analítica distinta.
- No añadir parámetros con datos personales al enlace.

## Confirmación

Mientras se usa Payment Link, la página de éxito se configura desde Stripe. Debe dirigir a una ruta propia, por ejemplo:

```text
/gracias/academy/gestion-laboral-integral
```

La página de éxito debe:

- confirmar recepción del pago sin mostrar datos sensibles;
- explicar que EXPERT contactará para revisión inicial;
- ofrecer reserva del primer encuentro;
- enlazar al panel si el acceso ya está creado;
- evitar afirmar que la matrícula está activa hasta que el webhook lo confirme.

## Webhook futuro

Al migrar a checkout interno o registrar Payment Link mediante webhook:

1. verificar firma Stripe;
2. procesar idempotentemente;
3. mapear producto/precio a `gestion-laboral-integral`;
4. crear o actualizar matrícula;
5. enviar confirmación;
6. registrar evento operativo;
7. no conceder acceso por parámetros de URL de éxito.

## Formulario específico

Campos:

- nombre;
- email;
- teléfono opcional;
- empresa;
- sector;
- número aproximado de empleados;
- herramienta de nómina actual;
- uso de Holded;
- uso de Sistema RED / SILTRA;
- idioma español/ruso;
- objetivo o duda principal;
- aceptación de privacidad.

No solicitar NIF, CCC, NAF, salarios ni credenciales en el formulario comercial.

## Eventos

| Evento | Momento |
| --- | --- |
| `course_view` | Carga de la landing. |
| `course_payment_click` | Clic en Stripe. |
| `course_contact_click` | Desplazamiento o clic al formulario. |
| `course_meeting_click` | Apertura de Cal.com o fallback. |
| `course_program_download` | Clic en el PDF. |
| `course_lead_submit` | Envío aceptado por servidor. |
| `course_checkout_success` | Confirmación por webhook. |

No enviar PII a la analítica.

