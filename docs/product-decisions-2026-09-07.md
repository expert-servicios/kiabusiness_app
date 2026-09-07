# Decisiones de producto — 2026-09-07

Este documento fija decisiones de producto acordadas para EXPERT y evita que futuras implementaciones diverjan entre catálogo, checkout, KIA, operaciones y comunicaciones.

## 1. Servicios puntuales: dos modalidades de prestación

### Decisión

Los servicios puntuales de EXPERT se ofrecerán, cuando proceda, mediante una o ambas de estas modalidades:

1. **Servicio completo**
   - EXPERT realiza la gestión o tramitación de principio a fin.
   - El cliente aporta la documentación, confirma datos y firma cuando sea legalmente necesario.
   - El asesor humano conserva la supervisión y responsabilidad operativa.
   - KIA puede ayudar a recopilar datos, explicar el proceso, detectar documentación pendiente y preparar borradores, pero no sustituye las validaciones humanas exigibles.

2. **Trámite guiado / formación práctica**
   - Duración estándar de **1 o 2 horas**, según el servicio.
   - El cliente realiza el trámite con acompañamiento en directo.
   - Se combina **KIA Copiloto + asesor humano**.
   - KIA guía pasos, documentación, pantallas y comprobaciones; el asesor resuelve excepciones, valida decisiones y evita errores relevantes.
   - La duración y el alcance se definen servicio por servicio.

### Regla comercial

La existencia de una modalidad guiada no sustituye al servicio completo. Cuando ambas tengan sentido, el usuario podrá elegir entre:

- `Servicio completo`
- `Hacerlo conmigo / trámite guiado`

No se debe presentar una sesión de formación como si fuera una gestión completa, ni una gestión completa con el precio o alcance de una sesión guiada.

### Aplicación al catálogo

La actualización será progresiva y servicio por servicio. No se modifican automáticamente precios ni descripciones actuales hasta revisar cada servicio.

Objetivo de modelo futuro:

```ts
type DeliveryOption = {
  mode: 'full_service' | 'guided';
  label: string;
  description: string;
  price: string;
  duration?: string;
  includes: string[];
  notIncluded?: string[];
  stripePriceId?: string;
};
```

Cada servicio debería poder declarar `deliveryOptions[]` sin duplicar el servicio completo en el catálogo.

### Datos que deben persistirse en contratación

Cuando se implemente la selección de modalidad, checkout/pedido/expediente deberán conservar como mínimo:

- `service_slug`
- `delivery_mode = full_service | guided`
- duración contratada, si aplica
- empresa/autónomo/entidad a la que corresponde el servicio
- usuario contratante
- precio y moneda efectivos
- identificador Stripe correspondiente
- indicador de acompañamiento humano
- indicador de uso de KIA

Esto es especialmente importante para clientes con varias entidades o varias contrataciones simultáneas.

### CIRCE como primer caso de revisión

`Constitución de SL por CIRCE` debe ser uno de los primeros servicios migrados al nuevo modelo porque actualmente catálogo y alcance pueden confundirse entre gestión completa y formación guiada.

La revisión deberá separar explícitamente:

- **Constitución completa por EXPERT**
- **Constitución/trámite CIRCE guiado**, normalmente en sesión de 2 horas si el alcance lo permite

El precio final de cada modalidad se validará antes de publicar el cambio.

## 2. KIA dentro de los servicios guiados

KIA no se vende como sustituto del asesor. En una prestación guiada funciona como copiloto operativo:

- prepara checklist;
- explica requisitos y pasos;
- identifica datos/documentos que faltan;
- acompaña por el flujo del trámite;
- propone borradores o siguientes acciones;
- deja trazabilidad de la sesión;
- deriva al asesor humano cualquier excepción, decisión material o acción con riesgo.

Toda acción con efecto jurídico, fiscal, registral, financiero o sobre sistemas externos que requiera criterio profesional debe conservar confirmación humana cuando corresponda.

## 3. Telegram: de alertas salientes a canal bidireccional

### Estado actual

El repositorio ya dispone de envío saliente mediante Telegram Bot API.

Variables esperadas por el código actual:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`

La configuración en Vercel se considera **confirmada por la responsable del proyecto**. Los valores secretos no deben almacenarse en Git ni documentarse.

### Decisión

Telegram evolucionará a canal bidireccional y deberá integrarse en Operations 360, no mantenerse como un canal aislado.

Alcance objetivo:

1. **Recepción de mensajes**
   - webhook seguro de Telegram;
   - validación de origen/secret;
   - idempotencia por `update_id`;
   - almacenamiento auditable del mensaje recibido.

2. **Respuestas desde EXPERT**
   - responder a una conversación Telegram desde Admin;
   - preservar `chat_id`, `message_id` y relación con el mensaje anterior cuando exista;
   - mostrar entrega/error sin bloquear el resto de la operativa.

3. **Asignación a cliente / lead / empresa / expediente**
   - no inferir automáticamente identidad por nombre o email ambiguo;
   - permitir vinculación explícita desde Admin;
   - reutilizar el modelo cliente/empresa/expediente ya existente;
   - mantener la posibilidad de una conversación aún no identificada.

4. **Asignación a ticket/tarea**
   - una conversación o mensaje puede generar una tarea interna;
   - reutilizar `internal_tasks.assigned_to`, `client_id`, `lead_id` y `case_id` cuando corresponda;
   - evitar crear automáticamente un expediente sólo por recibir una conversación casual.

5. **Comandos**
   - comandos administrativos mínimos, con autorización por `chat_id`/usuario y tenant;
   - ejemplos futuros: `/pendientes`, `/cliente`, `/expediente`, `/asignar`, `/cerrar`;
   - los comandos con efecto externo requieren controles de autorización y confirmación adecuados.

6. **Operations 360**
   - Telegram debe aparecer junto a email, WhatsApp y mensajes de expediente en la ficha 360 del cliente;
   - cada evento debe conservar canal, dirección, fecha, identidad vinculada y contexto de empresa/expediente cuando exista.

### Criterios de seguridad

- nunca registrar ni devolver el bot token;
- endpoint webhook protegido con secreto específico;
- idempotencia de updates;
- rate limiting;
- autorización diferenciada entre admin, tenant admin y cliente;
- no ejecutar comandos peligrosos desde texto libre;
- confirmar antes de cambios con efecto financiero, fiscal, documental o externo;
- conservar trazabilidad de quién vinculó o reasignó una conversación.

### Implementación por fases

**Fase T1 — entrada segura**
- webhook;
- persistencia;
- idempotencia;
- pruebas unitarias y E2E de recepción.

**Fase T2 — inbox y respuesta**
- bandeja Telegram en Admin/Operations 360;
- respuesta manual;
- estados de entrega/error.

**Fase T3 — identidad y asignación**
- vincular conversación a lead/cliente/empresa/expediente;
- asignar responsable;
- crear tarea/ticket cuando proceda.

**Fase T4 — comandos**
- comandos de consulta primero;
- comandos de acción sólo con autorización/confirmación.

**Fase T5 — automatización controlada con KIA**
- clasificación de mensajes;
- borradores de respuesta;
- sugerencia de cliente/expediente sin auto-vinculación si hay ambigüedad;
- escalado al asesor humano.

## 4. Supabase de pago

La migración a un plan de pago queda deliberadamente aplazada.

Se reconsiderará cuando la relación coste/beneficio lo justifique, especialmente para:

- mejores opciones de backup y recuperación;
- protección adicional de autenticación;
- crecimiento de carga, almacenamiento o integraciones críticas;
- requisitos de continuidad de servicio más exigentes.

No se debe bloquear el trabajo actual por este cambio de plan, pero sí mantenerlo como decisión de infraestructura pendiente antes de aumentar de forma significativa la criticidad o volumen productivo.

## 5. Próximos pasos derivados

1. Revisar los servicios actuales del catálogo uno por uno y decidir si ofrecen:
   - completo;
   - guiado 1 h;
   - guiado 2 h;
   - o una combinación.
2. Definir precio, alcance, incluidos/excluidos y Stripe Price ID por modalidad.
3. Adaptar catálogo, UI y checkout para `deliveryOptions`.
4. Empezar por CIRCE y los trámites más repetibles.
5. Implementar Telegram T1/T2 antes de comandos avanzados.
6. Integrar Telegram en la ficha 360 y en el modelo de asignación ya existente.
7. Mantener la contratación del plan de pago de Supabase como decisión futura, con preflight específico cuando se vaya a ejecutar.
