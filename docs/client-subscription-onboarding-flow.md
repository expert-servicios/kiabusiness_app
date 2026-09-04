# Flujo de alta de cliente con suscripción EXPERT

Última revisión: 4 de septiembre de 2026.

## Objetivo

Este documento define el flujo canónico de alta de un cliente que contrata una suscripción mensual o anual de EXPERT. Debe existir un único orden funcional en frontend, API, Stripe, webhooks, onboarding y dashboard.

Flujo canónico:

`Cuenta EXPERT → perfil → entidad/facturación → Stripe Checkout → suscripción activa → reunión de onboarding → conexión Holded → cierre de onboarding → dashboard operativo`

Holded **no es un requisito previo al pago**. La conexión contable se realiza después de que Stripe confirme una suscripción activa o `trialing`.

El cliente tampoco necesita crear una cuenta de Stripe. Stripe Checkout actúa como pasarela de pago; Stripe puede mantener internamente un Customer para cobros recurrentes, pero EXPERT no exige registro/login del cliente en Stripe.

## 1. Cuenta y configuración inicial

### Objetivo

Obtener la identidad mínima y la entidad fiscal que contratará el plan.

### Recorrido

1. El usuario se autentica en EXPERT.
2. Completa datos básicos de perfil.
3. Añade o selecciona la entidad fiscal.
4. Completa los datos de facturación necesarios.
5. Puede entrar al dashboard aunque posponga ciertos datos, pero no podrá contratar hasta que se cumplan los requisitos del checkout.

### Requisitos previos al checkout

El servidor valida:

- `profiles.profile_completed = true`;
- `profiles.billing_ready = true`;
- existe una entidad contratante;
- el usuario pertenece a esa entidad mediante `profile_companies`.

No se valida Holded en esta fase.

Código principal:

- `app/(protected)/dashboard/onboarding/page.tsx`
- `lib/checkout/plan-mensual-guard.ts`
- `app/api/subscriptions/checkout/route.ts`

## 2. Inicio del checkout de suscripción

### 2.1 Preflight obligatorio antes de generar un enlace

Antes de crear una sesión Stripe, tanto desde el cliente como desde Admin, debe comprobarse en una sola revisión coherente:

1. usuario EXPERT correcto y email confirmado;
2. `profile_completed = true`;
3. `billing_ready = true`;
4. entidad contratante exacta y membership válida;
5. no existe ya una suscripción `active` o `trialing` para la misma combinación cliente + entidad + plan;
6. no existe una Checkout Session `open` anterior que ya sea la sesión válida que debe reutilizarse;
7. si existe cualquier posible duplicado de Stripe, pedido, factura o integración financiera, se detiene el automatismo y se revisa manualmente;
8. el importe, periodicidad, impuestos y moneda coinciden con la oferta comercial vigente;
9. la URL de éxito es la ruta poscompra canónica;
10. se decide antes de crear la sesión cuál será el **único canal de comunicación** que entregará el enlace al cliente.

No debe crearse una sesión “de prueba” en producción para inspeccionarla y después crear otra definitiva. El objetivo es generar **una única sesión final**, verificarla y comunicar esa misma URL.

### Checkout del cliente

`POST /api/subscriptions/checkout`

El endpoint:

1. autentica al usuario;
2. valida plan permitido;
3. valida perfil, facturación, entidad y pertenencia;
4. resuelve el Stripe Customer de la entidad si existe;
5. crea una Checkout Session en `mode: subscription`;
6. incluye `user_id`, `company_id`, `plan_name` y modalidad de facturación en metadata;
7. registra la sesión en `checkout_sessions` con estado `open`;
8. si falla la persistencia local, expira la sesión Stripe para no dejar un checkout huérfano.

URLs canónicas:

- éxito: `/dashboard/post-compra?origin=subscription`;
- cancelación: `/dashboard/suscripciones`.

### Checkout generado desde Admin

`POST /api/admin/subscriptions/send-link`

Debe aplicar los mismos requisitos de perfil, facturación y entidad, sin exigir Holded antes del pago.

**Precaución operativa:** este endpoint actualmente genera el checkout y además envía la invitación por email. No debe utilizarse como simple herramienta de prueba si después se pretende enviar el mismo enlace manualmente desde Outlook, porque podría generar comunicaciones duplicadas.

La arquitectura objetivo debe separar claramente:

- **generar y persistir checkout**;
- **verificar checkout**;
- **enviar comunicación**.

Hasta que exista esa separación, el equipo debe elegir un solo camino por operación: o envío automático desde Admin, o generación/verificación por una vía que no envíe email y posterior respuesta manual.

## 3. Stripe y persistencia de la suscripción

Stripe es la fuente de verdad del estado de pago/suscripción; Supabase mantiene la réplica operacional de EXPERT.

### Reglas fiscales del Checkout

Los importes publicados por EXPERT se expresan como base imponible cuando se indica “+ IVA”. El checkout debe aplicar la configuración fiscal correspondiente de Stripe y recopilar los datos de facturación necesarios para calcular correctamente el impuesto según el cliente y la operación.

No debe enviarse un enlace como “99 €/mes + IVA” si la sesión efectiva solo va a cobrar 99 € sin tratamiento fiscal configurado.

### `checkout.session.completed`

El webhook:

- marca la fila correspondiente de `checkout_sessions` como `completed`;
- obtiene la suscripción Stripe;
- llama a `upsertSubscriptionFromStripe`;
- conserva el contexto `client_id` + `company_id`;
- persiste `stripe_subscription_id`, `stripe_customer_id`, plan, estado y periodo.

### `customer.subscription.created` / `updated`

También actualizan la suscripción local de forma idempotente y generan las notificaciones correspondientes.

### Carrera webhook / redirección

Stripe puede redirigir al navegador antes de que el webhook haya terminado de persistir la suscripción. Por eso `/dashboard/post-compra` usa `PostCompraWaiting` cuando todavía no existe una suscripción `active` o `trialing`.

No debe iniciarse el onboarding poscompra basándose únicamente en que el navegador volvió desde Stripe.

Código principal:

- `app/api/stripe/webhook/route.ts`
- `app/(protected)/dashboard/post-compra/page.tsx`
- `components/dashboard/PostCompraWaiting.tsx`

## 4. Onboarding poscompra

Solo se muestra si existe una suscripción del usuario en estado `active` o `trialing` cuyo `post_purchase_onboarding_at` sigue vacío.

Orden obligatorio:

### Paso 1 — Agendar reunión de onboarding

El usuario reserva en el enlace Cal.com configurado por `getCalOnboardingUrl()`.

El webhook de Cal.com reconoce el slug `onboarding`, persiste la cita en `appointments` y puede crear el expediente operacional asociado.

Se considera reservado cuando existe para el email autenticado una cita no cancelada cuyo servicio corresponde al onboarding.

Rutas:

- `app/api/webhooks/cal/route.ts`
- `app/api/dashboard/citas/route.ts`
- `app/(protected)/dashboard/citas/page.tsx`

### Paso 2 — Conectar Holded

Solo después de reservar onboarding se presenta la conexión con Holded.

EXPERT reconoce dos vías:

1. **Conexión API directa por entidad** mediante `client_integrations`.
2. **Conexión autorizada / token de acceso** detectada mediante el flujo de conector y sus registros `holded_mcp_connections` / `holded_mcp_events`.

El onboarding se considera conectado si una de las dos vías es válida.

#### Estado de API de Holded

La documentación actual de Holded describe API v2 con `API Token`, permisos configurables y autenticación Bearer. El cliente directo histórico de EXPERT usa todavía endpoints/header del esquema anterior. No se debe transformar automáticamente una credencial existente ni migrar clientes a v2 sin una migración técnica controlada y pruebas de compatibilidad.

La UI debe usar terminología neutral/actual (`API Token` / conexión autorizada) y nunca pedir al usuario que envíe tokens por email o WhatsApp.

Rutas/componentes:

- `app/(protected)/dashboard/integraciones/holded/page.tsx`
- `components/integrations/HoldedConnectionCard.tsx`
- `components/integrations/HoldedApiKeyForm.tsx`
- `app/api/integrations/holded/status/route.ts`
- `app/api/integrations/holded/mcp-status/route.ts`

## 5. Cierre seguro del onboarding

`POST /api/dashboard/post-compra/complete`

La UI no es autoridad suficiente. El endpoint vuelve a validar en servidor:

1. usuario autenticado;
2. `subscriptionId` exacto pertenece al usuario;
3. suscripción `active` o `trialing`;
4. reunión de onboarding no cancelada;
5. conexión Holded directa para la entidad contratante **o** conexión autorizada del usuario;
6. solo entonces escribe `post_purchase_onboarding_at` para esa suscripción concreta.

Esto evita dos problemas:

- saltarse pasos llamando directamente a la API;
- cerrar accidentalmente varias suscripciones de un cliente con múltiples entidades.

La operación es idempotente.

## 6. Dashboard después de la compra

Mientras exista una suscripción activa con onboarding pendiente, `SubscriptionOnboardingStatus` permanece visible en el layout del dashboard.

Estados mostrados:

- `0/2`: reunión pendiente;
- `1/2`: reunión reservada, Holded pendiente;
- `2/2`: pasos detectados, pendiente pulsar finalizar;
- una vez persistido `post_purchase_onboarding_at`, el banner desaparece.

El dashboard no debe declarar “todo al día” si existe una acción de onboarding pendiente.

Código:

- `components/dashboard/SubscriptionOnboardingStatus.tsx`
- `app/(protected)/dashboard/layout.tsx`

## 7. Estados y fuentes de verdad

| Área | Fuente operacional |
| --- | --- |
| usuario | Supabase Auth + `profiles` |
| entidad | `companies` + `profile_companies` |
| checkout | Stripe + `checkout_sessions` |
| suscripción | Stripe + `subscriptions` |
| cita onboarding | Cal.com + `appointments` |
| Holded directo | `client_integrations` + secreto cifrado |
| Holded autorizado | `holded_mcp_connections` / `holded_mcp_events` |
| onboarding cerrado | `subscriptions.post_purchase_onboarding_at` |

No se deben corregir automáticamente registros financieros históricos para resolver incidencias de onboarding.

## 8. Recuperación de errores

### Checkout cancelado

El cliente vuelve a `/dashboard/suscripciones`; no se crea onboarding.

### Checkout expirado

El webhook `checkout.session.expired` marca la sesión local `expired`. No reutilizar URLs caducadas: generar una nueva sesión.

### Fallo al persistir checkout

El servidor intenta expirar inmediatamente la sesión Stripe. Si esa compensación falla, requiere revisión manual.

### Suscripción aún no visible tras pagar

Mostrar `PostCompraWaiting`; no inventar el estado ni forzar activación local.

### Cita cancelada

No cuenta como paso completado. El cliente debe volver a reservar.

### Holded sin permisos suficientes

No asumir que `status = active` implica que todos los endpoints funcionen. La prueba de permisos debe determinar qué módulos están disponibles y mostrar advertencias. No modificar la contabilidad del cliente sin autorización expresa.

### Cliente con varias entidades/suscripciones

Toda contratación debe conservar `company_id`. El cierre de onboarding recibe `subscriptionId` explícito y actualiza solo esa suscripción.

Para un mismo usuario con varias actividades o sociedades:

- cada entidad principal que contrata debe quedar identificada de forma explícita;
- no se debe compartir una suscripción entre entidades salvo que exista una regla comercial documentada para ello;
- si una segunda actividad está incluida comercialmente sin coste adicional, debe registrarse como alcance del servicio y no como una segunda suscripción Stripe ficticia;
- cualquier futura segunda suscripción debe generar su propio checkout, `company_id`, suscripción y onboarding asociado.

### Duplicados Stripe / pedidos / Holded

Detener automatismos y realizar revisión manual. No fusionar ni corregir históricos de forma automática.

## 9. Checklist E2E previo a producción

- [ ] onboarding inicial no contiene Holded como requisito previo;
- [ ] checkout cliente requiere perfil + facturación + entidad + membership;
- [ ] checkout admin aplica los mismos requisitos;
- [ ] checkout no exige cuenta/login de Stripe al cliente;
- [ ] Session Stripe usa `mode: subscription`;
- [ ] importe, periodicidad, moneda e impuestos coinciden con la oferta comercial;
- [ ] `success_url` es `/dashboard/post-compra?origin=subscription`;
- [ ] `cancel_url` vuelve a suscripciones;
- [ ] la sesión se persiste antes de entregar el enlace como válido;
- [ ] no existe otra sesión `open` válida para la misma contratación;
- [ ] webhook actualiza `checkout_sessions` y `subscriptions` de forma idempotente;
- [ ] poscompra espera `active`/`trialing`;
- [ ] paso 1 es reunión onboarding;
- [ ] paso 2 es Holded;
- [ ] Cal webhook registra reservas/cancelaciones/reagendados;
- [ ] Holded directo y autorizado se reconocen correctamente;
- [ ] endpoint de finalización vuelve a validar los dos pasos;
- [ ] se actualiza una sola suscripción por `subscriptionId`;
- [ ] dashboard mantiene visible la siguiente acción hasta completar;
- [ ] TypeScript, lint y tests pasan;
- [ ] preview Vercel pasa;
- [ ] tras merge, ambos despliegues de producción pasan;
- [ ] smoke test público no muestra errores 5xx;

## 10. Pruebas de regresión relevantes

- `tests/payments/subscription-checkout-flow.test.ts`
- `tests/payments/entity-scoped-subscriptions.test.ts`
- `tests/onboarding/end-to-end-flow.test.ts`
- `tests/onboarding/subscription-post-purchase-flow.test.ts`

Estas pruebas deben impedir que vuelva a aparecer la antigua regla de conectar Holded antes del pago y deben garantizar que la finalización del onboarding está protegida también en servidor.

## 11. Operación de enlaces de pago y comunicaciones

Un enlace enviado al cliente debe cumplir:

1. sesión Stripe nueva y abierta;
2. plan e importe correctos;
3. entidad correcta;
4. metadata de usuario/entidad correcta;
5. impuestos configurados de acuerdo con la oferta comercial;
6. redirección poscompra correcta;
7. no haber sido utilizado/expirado;
8. estar persistido en `checkout_sessions`;
9. probar el enlace antes de comunicarlo;
10. no generar un segundo email automático si se va a responder manualmente desde otro canal.

### Regla de canal único

Para cada checkout concreto debe existir **una sola comunicación de entrega**. Antes de generar la sesión se define el canal elegido:

- email automático EXPERT/Resend; o
- Outlook del asesor; o
- otro canal autorizado expresamente.

No deben coexistir para una misma sesión mensajes de Gmail, Outlook y Resend con instrucciones diferentes.

Si existe un borrador manual esperando el enlace:

1. generar la sesión final;
2. verificar Stripe y `checkout_sessions`;
3. insertar exactamente esa URL en el borrador;
4. enviar una sola vez;
5. releer el hilo/sent para confirmar entrega;
6. comprobar que no existe un envío automático duplicado.

Nunca enviar un enlace inventado, una URL antigua, una sesión expirada, un enlace genérico a Stripe ni un checkout de prueba como si fuera el definitivo.

## 12. Flujo resumido para soporte y Admin

Cuando un cliente informa de que no consigue finalizar el alta:

1. identificar el hilo y canal de comunicación autoritativo;
2. revisar si ya existe suscripción activa/trialing;
3. revisar si existe checkout abierto/completado/expirado;
4. validar perfil, facturación, entidad y membership;
5. no exigir Holded antes del pago;
6. generar una sola sesión final si realmente hace falta;
7. verificar plan, importe, impuestos, metadata y URLs;
8. entregar el enlace una sola vez;
9. esperar confirmación de Stripe/webhook;
10. comprobar que aparece la suscripción local;
11. dirigir al cliente a reunión de onboarding;
12. después conectar Holded;
13. cerrar onboarding solo cuando servidor valide ambos pasos;
14. dejar trazabilidad en auditoría/documentación del caso.
