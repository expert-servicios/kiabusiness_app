# Decisiones de producto — actualización 2026-09-08

Este documento fija decisiones de producto acordadas para EXPERT y evita que futuras implementaciones diverjan entre catálogo, checkout, KIA, operaciones y comunicaciones.

## 1. Servicios puntuales: dos modalidades de prestación

### Decisión

Los servicios puntuales de EXPERT se ofrecerán, cuando proceda, mediante una o ambas modalidades:

1. **Servicio completo**
   - EXPERT realiza la gestión o tramitación de principio a fin.
   - El cliente aporta documentación, confirma datos y firma cuando sea legalmente necesario.
   - El asesor humano conserva la supervisión y responsabilidad operativa.
   - KIA puede ayudar a recopilar datos, explicar el proceso, detectar documentación pendiente y preparar borradores, pero no sustituye validaciones humanas exigibles.

2. **Trámite guiado / formación práctica**
   - Duración estándar de **1 o 2 horas**, según el servicio.
   - El cliente realiza el trámite con acompañamiento en directo.
   - Se combina **KIA Copiloto + asesor humano**.
   - KIA guía pasos, documentación, pantallas y comprobaciones; el asesor resuelve excepciones, valida decisiones y evita errores relevantes.
   - La duración y alcance se definen servicio por servicio.

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

El repositorio dispone de envío saliente mediante Telegram Bot API. Las variables secretas se configuran fuera de Git y sus valores nunca deben almacenarse en documentación pública.

### Decisión

Telegram evolucionará a canal bidireccional y deberá integrarse en Operations 360, no mantenerse como canal aislado.

Alcance objetivo:

1. **Recepción de mensajes**
   - webhook seguro de Telegram;
   - validación de origen/secret;
   - idempotencia por `update_id`;
   - almacenamiento auditable del mensaje recibido.

2. **Respuestas desde EXPERT**
   - responder desde Admin;
   - preservar `chat_id`, `message_id` y relación con el mensaje anterior cuando exista;
   - mostrar entrega/error sin bloquear el resto de la operativa.

3. **Asignación a cliente / lead / empresa / expediente**
   - no inferir automáticamente identidad por nombre o email ambiguo;
   - permitir vinculación explícita desde Admin;
   - reutilizar el modelo cliente/empresa/expediente ya existente;
   - mantener conversaciones aún no identificadas.

4. **Asignación a ticket/tarea**
   - una conversación o mensaje puede generar una tarea interna;
   - reutilizar `internal_tasks.assigned_to`, `client_id`, `lead_id` y `case_id` cuando corresponda;
   - evitar crear automáticamente un expediente sólo por recibir una conversación casual.

5. **Comandos**
   - comandos administrativos mínimos, con autorización por usuario/chat y tenant;
   - los comandos con efecto externo requieren controles de autorización y confirmación adecuados.

6. **Operations 360**
   - Telegram debe aparecer junto a email, WhatsApp y mensajes de expediente;
   - cada evento debe conservar canal, dirección, fecha, identidad vinculada y contexto de empresa/expediente cuando exista.

### Criterios de seguridad

- nunca registrar ni devolver el bot token;
- webhook protegido con secreto específico;
- idempotencia de updates;
- rate limiting;
- autorización diferenciada entre admin, tenant admin y cliente;
- no ejecutar comandos peligrosos desde texto libre;
- confirmar antes de cambios con efecto financiero, fiscal, documental o externo;
- conservar trazabilidad de quién vinculó o reasignó una conversación.

### Implementación por fases

**T1 — entrada segura:** webhook, persistencia, idempotencia y pruebas.

**T2 — inbox y respuesta:** bandeja Telegram, respuesta manual y estados de entrega/error.

**T3 — identidad y asignación:** vincular a lead/cliente/empresa/expediente, asignar responsable y crear tarea cuando proceda.

**T4 — comandos:** consultas primero; acciones sólo con autorización/confirmación.

**T5 — automatización controlada con KIA:** clasificación, borradores y sugerencias de vinculación sin autoasignación ambigua.

## 4. Supabase Pro y aislamiento de cambios de base de datos

### Decisión actualizada — 2026-09-08

Se aprueba la contratación de **Supabase Pro**. El detonante inmediato es la necesidad de disponer de una Development Branch desechable para reconciliar de forma segura el drift histórico del ledger de migraciones (#143) antes de aplicar nuevo DDL en producción.

La rama de Supabase se usará para:

- reproducir y auditar el historial de migraciones sin datos productivos;
- comprobar un baseline canónico del esquema;
- comparar la reconstrucción con el fingerprint read-only de producción;
- ensayar `migration repair` y migraciones forward-only;
- validar cambios de seguridad como `quote_items`, RLS y grants antes de producción.

### Reglas operativas

1. Crear ramas temporales sólo para trabajos que justifiquen aislamiento de base de datos.
2. Eliminar la rama al finalizar para evitar costes innecesarios.
3. **Nunca** usar `merge_branch` hacia producción como atajo para resolver drift histórico.
4. No ejecutar `migration repair`, DDL o cambios del ledger productivo sin preflight, evidencia y checkpoint explícito.
5. Después de cambios DDL/RLS/grants en producción, ejecutar Security Advisor y smoke tests.
6. Mantener backups/recuperación, seguridad de Auth y actualizaciones de Postgres dentro del plan de endurecimiento de producción.

La adopción de Pro no convierte automáticamente ningún cambio pendiente en seguro: #143 sigue siendo el gate para las migraciones preparadas que dependen del ledger.

## 5. Higiene de documentación y datos operativos

El repositorio es público. Por tanto:

- no incluir nombres de clientes asociados a casos internos;
- no incluir CIF/NIF, emails de facturación ni teléfonos;
- no incluir IDs reales de Stripe, Holded, pagos, facturas o suscripciones;
- usar fixtures sintéticos en tests y ejemplos;
- conservar evidencia real únicamente en conectores y sistemas autorizados.

## 6. Próximos pasos derivados

1. Revisar el catálogo servicio por servicio y definir completo/guiado 1h/guiado 2h.
2. Añadir `deliveryOptions` al modelo comercial y empezar por CIRCE.
3. Implementar Telegram T1/T2 antes de comandos avanzados.
4. Integrar Telegram en Operations 360 y el modelo de asignación existente.
5. En cuanto Pro esté activo, crear la Development Branch para #143 y validar baseline/reparación antes de desbloquear el DDL pendiente.
6. Mantener las migraciones de seguridad preparadas como draft hasta superar ese checkpoint.
