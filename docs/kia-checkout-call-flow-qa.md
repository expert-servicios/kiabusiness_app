# Kia Checkout + Call Flow QA

Fecha: 2026-05-23

## Regla de negocio

La escalacion humana no es una salida comercial normal. Si el usuario tiene dudas, el servicio es complejo o hay riesgo/plazos, Kia debe llevar a una de estas salidas:

- contratar online en `/contratar`;
- reservar llamada/reunion de 15 minutos;
- comprobar viabilidad;
- completar perfil/facturacion;
- pedir una aclaracion adicional.

`needs_review` queda reservado para fallo tecnico, IA vacia/fallida, ambiguedad extrema, conversacion ya tomada por humano/admin o validaciones que requieren atencion manual real.

## QA minimo

1. Servicio con checkout desde Kia:
   - seleccionar `svc_irpf` o `svc_alta_autonomo`;
   - pulsar `Contratar ahora`;
   - WhatsApp recibe enlace `/contratar?service=irpf` o `/contratar?service=alta-autonomo`;
   - no se crea Stripe Checkout desde WABA.

2. Servicio complejo:
   - seleccionar `Modelo 720`, `Constitucion SL` o servicio marcado en `COMPLEX_SERVICE_REVIEW`;
   - Kia responde con llamada/reunion, informacion o contratar si hay checkout;
   - no marca `needs_review`;
   - no entra en `flow='human'`.

3. Respuesta de precalificacion con riesgo:
   - elegir una opcion `opt.escalate=true`;
   - Kia guarda flags en `session.data`;
   - responde recomendando llamada de 15 minutos;
   - no marca `needs_review`.

4. Requerimiento/sancion/denegacion:
   - usuario escribe "tengo un requerimiento de Hacienda";
   - Kia recomienda llamada/reunion;
   - no marca `needs_review` salvo fallo de IA/envio.

5. Dudas:
   - pulsar `Tengo dudas` / `btn_write_here`;
   - session queda `flow='consult'`, `step='free_consult'`;
   - Kia pide aclaracion breve y no deriva automaticamente a humano.

6. Checkout:
   - entrar a `/contratar?service=irpf` sin login;
   - redirige a login con `next`;
   - entrar con login y perfil incompleto;
   - `/api/services/checkout` devuelve `409 profile_required`;
   - completar perfil pero no facturacion;
   - devuelve `409 billing_required`;
   - completar todo;
   - Stripe Checkout se crea.

7. Holded:
   - completar pago de servicio;
   - si Holded emite factura, `orders.holded_invoice_id` queda informado;
   - si Holded falla, el pago no se pierde y `orders.status='paid_invoice_error'` guarda `holded_sync_error`.
