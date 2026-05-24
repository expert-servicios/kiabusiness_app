# Kia Conversation Behavior Audit

Fecha: 2026-05-24

Estado: auditoria previa. Este documento revisa los ajustes propuestos antes de aplicarlos a produccion. No sustituye Kia Engine, Kia Decision Engine, WABA, Readiness, Viability, Checkout, Holded, Health Check ni Kia Auditor.

## Objetivo

Actualizar Kia para que responda de forma mas natural, contextual y no repetitiva:

- evitar repetir exactamente el mismo mensaje;
- revisar historial reciente antes de contestar;
- usar continuidad conversacional;
- preguntar cuando falte informacion;
- ofrecer respuestas rapidas cuando proceda;
- asegurar que la ultima opcion sea "Otro" o "Другое";
- mantener tono cercano, profesional y con emojis moderados;
- no romper flujos deterministas ni side effects existentes.

## Archivos revisados

- `app/api/webhooks/whatsapp/route.ts`
- `lib/integrations/kia-engine.ts`
- `lib/ai/kia/kia-response-variation.ts`
- `lib/ai/kia/kia-decision-engine.ts`
- `lib/ai/kia/kia-output-schema.ts`
- `lib/ai/kia/kia-system-prompt.ts`
- `lib/ai/kia/kia-context-builder.ts`
- `app/api/admin/whatsapp/ai-compose/route.ts`
- `lib/ai/kia/health/kia-health-grader.ts`
- `lib/ai/kia-auditor/kia-auditor-rules.ts`

## 1. Que mensajes ya usan anti-repeticion

### Kia Decision Engine

`lib/ai/kia/kia-decision-engine.ts` ya tiene la proteccion mas fuerte:

- construye contexto con `buildKiaContext`;
- extrae mensajes recientes de asistente con `getRecentAssistantTextsFromContext`;
- inyecta `buildNoRepeatInstruction`;
- valida `KiaDecision`;
- compara `decision.userMessage` con historial mediante `findSimilarRecentMessage`;
- si detecta similitud, hace un retry pidiendo reescritura;
- si aun hay riesgo, anade `repetition_risk_detected` y `anti_repetition_checked`.

Esto cubre bien los flujos estructurados.

### WABA fallback legacy

`app/api/webhooks/whatsapp/route.ts` ya usa historial reciente en `generateKiaAiResponse`:

- carga `conversationHistory`;
- extrae ultimos outbound con `recentAssistantTextsFromWabaHistory`;
- inyecta `buildNoRepeatInstruction`;
- pasa contexto de cliente/lead, expedientes y obligaciones;
- hace retry si el texto generado se parece al historial.

Este fallback ya esta alineado con la regla de no parecer repetitiva, aunque no fuerza todavia quick replies con "Otro".

### Admin AI Compose

`app/api/admin/whatsapp/ai-compose/route.ts` ya incluye:

- historial reciente;
- `replyTo` cuando el admin responde un mensaje seleccionado;
- `buildNoRepeatInstruction(recentOutboundTexts(history))`;
- instrucciones para no contestar todo el hilo cuando hay mensaje seleccionado.

La base es buena para continuidad, pero falta formalizar preguntas aclaratorias y quick replies.

### Kia Health

`lib/ai/kia/health/kia-health-grader.ts` ya puede validar repeticion con `maxSimilarityToRecent`.

Tambien existen anomalas de tipo `repeated_answer_loop` cuando el health check detecta similitud excesiva.

## 2. Que mensajes no pasan por anti-repeticion

### Respuestas deterministas de Kia Engine

El mayor hueco esta en `sendKiaReply` dentro de `app/api/webhooks/whatsapp/route.ts`.

Actualmente, si `processKiaStep` devuelve un `KiaReply` determinista:

- texto;
- botones;
- listas;

se envia directamente por `sendWhatsAppMessage` o `sendWhatsAppInteractive`.

Eso significa que las respuestas del Kia Engine pueden repetir:

- mismo cuerpo;
- misma apertura;
- mismo CTA;
- mismo link;
- misma estructura;
- mismos botones.

Ejemplos de riesgo:

- saludo inicial repetido;
- aviso de privacidad repetido;
- "Reserva llamada 15 min" repetido;
- enlaces de portal/checkout/cita repetidos;
- mensajes de "cuentame tu caso" repetidos.

### Envios interactivos directos

Ademas de `sendKiaReply`, hay envios directos a `sendWhatsAppInteractive` en la ruta WABA. Esos envios pueden saltarse cualquier helper nuevo si solo se modifica `sendKiaReply`.

Riesgo:

- listas de seleccion de expediente;
- listas de categorias;
- botones de servicio seleccionado;
- respuestas interactivas generadas por IA legacy.

La mejora debe centralizarse lo maximo posible, pero sin romper IDs ni side effects.

### Respuestas de catalogo/servicio

Los textos generados por helpers como `serviceInfoReply`, `formalizeInterestCta`, `meetingRecommended`, `holdedReadinessCta`, `freeConsultPrompt` y `bookingConfirm` son estables y por tanto repetibles.

No son incorrectos, pero deben pasar por variacion antes de enviarse si ya aparecieron en el hilo.

## 3. Respuestas deterministas que se repiten

Mensajes con mas riesgo de sonar roboticos:

- `privacyNotice`: siempre se envia en inicios y reinicios.
- `welcome` / menus de bienvenida: buen tono, pero puede repetirse si el usuario escribe "hola" varias veces.
- `bookingConfirm`: repite el enlace de cita con la misma estructura.
- `freeConsultPrompt`: repite "Cuentame / describeme brevemente tu situacion".
- `unsureCta`: repite llamada gratuita como salida.
- `meetingRecommended`: repite "lo ideal es revisar este caso juntos".
- `formalizeInterestCta`: repite portal seguro y CTA.
- `holdedReadinessCta`: repite test de preparacion + prueba Holded + llamada.
- flujo `human/escalated`: repite que la conversacion queda derivada al equipo.

Estos textos deben conservar su decision operativa, pero variar:

- apertura;
- orden de frases;
- cierre;
- CTA;
- referencia al hilo previo.

## 4. Flujos que usan botones

Kia Engine ya usa botones/listas en muchos puntos:

- bienvenida lead;
- bienvenida cliente;
- seleccion de area/servicio;
- CTAs de contratacion;
- llamada de 15 min;
- dudas;
- readiness Holded;
- prueba Holded;
- precal/viabilidad;
- menus de cliente;
- servicio no claro;
- seleccion posterior a servicio.

La infraestructura de WABA interactive ya esta lista. No hace falta crear otro canal de botones.

## 5. Flujos que no ofrecen "Otro"

La regla "ultima opcion siempre Otro" no esta normalizada.

Ejemplos sin "Otro":

- bienvenida lead con tres opciones de negocio;
- bienvenida cliente;
- `formalizeInterestCta`: "Contratar ahora", "Llamada 15 min", "Tengo dudas";
- `unsureCta`: "Reservar llamada", "Escribeme aqui";
- `precalCta`: cesta, contratar, llamada o dudas;
- `meetingRecommended`: llamada, contratar/dudas/ver servicio;
- `holdedReadinessCta`: preparacion, prueba, llamada;
- menus de Holded/servicios;
- listas de categorias, que a veces tienen "No se..." pero no siempre una opcion final generica.

Recomendacion:

- aplicar "Otro" primero solo en flujos aclaratorios;
- no sacrificar botones criticos de pago, perfil, login o seguridad;
- en flujos con tres botones criticos, mostrar "Otro" en el siguiente mensaje o mediante lista;
- en listas, anadir una ultima fila "Otro" cuando no rompa seleccion de expediente o servicio.

## 6. Respuestas demasiado roboticas

Kia ya tiene tono amable y emojis, pero algunas frases pueden sonar repetidas porque son plantillas fijas.

Riesgos detectados:

- demasiadas respuestas empiezan con "Perfecto", "Genial", "Entendido" o "No te preocupes";
- se repite la llamada de 15 min como cierre generico;
- se repiten links si el usuario insiste;
- en algunos textos rusos hay copy heredado o menos natural que el espanol;
- los mensajes tecnicos de escalado/derivacion son correctos, pero frios;
- algunos textos explican mucho en una sola respuesta de WhatsApp.

Regla sugerida:

- conservar CTA y policy;
- variar forma;
- reconocer continuidad: "Como ya te pase el enlace..." / "Seguimos con esto...";
- si ya se pregunto algo, no volver a preguntarlo igual.

## 7. Respuestas que no consultan suficiente historial

### Lo que ya se consulta

El fallback IA y Decision Engine consultan historial reciente.

Admin Compose consulta historial y mensaje seleccionado.

`kia-context-builder.ts` consulta:

- contacto lead/cliente;
- perfil;
- company;
- service;
- expedientes abiertos desde contact resolver;
- documentos recientes;
- snapshot/anomalias contables;
- conversacion reciente;
- mensaje seleccionado.

### Gaps

No se ve todavia una consulta explicita de tareas internas o Next Best Actions pendientes dentro de `KiaContext`.

El usuario pidio que Kia revise:

- ficha de cliente;
- tareas pendientes de expedientes abiertos;
- historial reciente.

Ficha e historial estan bastante cubiertos. Expedientes tambien aparecen en contacto/contexto. Tareas pendientes/NBA necesitan ampliacion si la tabla o modelo ya existe.

Recomendacion:

- anadir a `KiaContext` un bloque pequeno `tasks` o `nextBestActions`;
- limitarlo a pendientes relevantes, no todo el CRM;
- no hacerlo en la misma primera pasada si el objetivo urgente es anti-repeticion, para no mezclar cambios de conversacion con cambios de datos.

## 8. Quick replies en salida estructurada

`lib/ai/kia/kia-output-schema.ts` aun no incluye `quickReplies`.

Consecuencia:

- el Decision Engine puede decidir `nextAction`, pero no tiene contrato formal para botones;
- WABA fallback legacy puede devolver botones en JSON propio;
- Kia Engine tiene botones deterministas;
- no hay una politica unica para "ultimo boton Otro".

Recomendacion:

- anadir `quickReplies` como campo opcional/default `[]`;
- validar maximo 3 para WABA;
- normalizar el ultimo boton a "Otro" / "Другое";
- convertir solo cuando el canal sea WABA;
- mantener texto puro en admin/email/dashboard si no aplica.

## 9. Politica "Hazme preguntas"

El prompt estructurado ya dice "Si faltan datos, pide el minimo dato siguiente".

Falta formalizar:

- una sola pregunta por turno;
- respuestas rapidas en aclaraciones;
- ultima opcion "Otro";
- maximo dos rondas antes de proponer accion;
- si pulsa "Otro", invitar a escribir libremente;
- no inventar servicio para evitar preguntar.

Recomendacion:

- crear `lib/ai/kia/prompts/kia-clarifying-policy.ts`;
- importarlo desde `kia-system-prompt.ts`;
- inyectarlo tambien en WABA fallback legacy y Admin Compose;
- anadir reglas aplicadas: `clarifying_questions_policy_applied`, `quick_reply_policy_applied`, `other_option_policy_applied`.

## 10. Kia Auditor y Kia Health

### Estado actual

Kia Auditor ya tiene reglas de:

- API key;
- secretos;
- lead/cliente;
- checkout;
- Holded/readiness;
- impuestos;
- contabilidad;
- needs_review;
- idioma;
- mensaje seleccionado;
- normativa.

Kia Health ya detecta:

- JSON invalido;
- flow incorrecto;
- API key;
- checkout indebido;
- impuestos;
- idioma;
- repeticion por similitud si el check lo configura.

### Gaps

Faltan reglas/canaries especificos para:

- mensaje exacto repetido;
- alta similitud >= 0.72;
- historial revisado antes de responder;
- pregunta aclaratoria cuando falta informacion;
- quick replies obligatorias en aclaraciones WABA;
- ultima opcion "Otro";
- tono cercano/profesional con emoji moderado;
- patron de loro en 3 mensajes consecutivos.

Estas reglas deben venir despues del cambio de schema/normalizacion para no generar falsos fallos.

## 11. Riesgos de aplicar todo de golpe

Aplicar todas las fases juntas es viable, pero aumenta el riesgo de:

- romper IDs de botones existentes;
- desplazar botones criticos como login, perfil, pago o conexion Holded;
- alterar side effects del Kia Engine;
- cambiar demasiado el contrato `KiaDecision` y romper fixtures/evals;
- duplicar anti-repeticion en varios sitios;
- registrar datos sensibles si se crea tabla de variaciones sin redaction;
- dejar canaries rojos por reglas nuevas antes de que el schema soporte `quickReplies`.

La implementacion debe ser incremental.

## 12. Plan recomendado de implementacion

### Paso 1 - Filtro global de envio WABA

Implementar `prepareKiaReplyForSending` en `app/api/webhooks/whatsapp/route.ts`.

Debe:

- cargar ultimos 6 outbound del telefono;
- limpiar prefijos `[Kia]`, `[Kia:AI]`, `[Kia:list]`;
- comparar contra `reply.body`;
- variar solo el cuerpo;
- conservar botones/listas/IDs;
- registrar warning si hay riesgo;
- no cambiar side effects;
- cubrir `text`, `buttons` y `list`.

Este paso reduce el problema mas visible sin tocar la logica comercial.

### Paso 2 - Extender `kia-response-variation.ts`

Anadir:

- `isRepeatedKiaMessage`;
- `buildVariationRequest`;
- helper simple de variacion determinista si no se quiere llamar a IA.

Debe reutilizar `messageSimilarity` y `findSimilarRecentMessage`.

### Paso 3 - Normalizar "Otro" en Kia Engine

Crear `withOtherButton` y aplicarlo primero a flujos aclaratorios:

- `unsureCta`;
- `freeConsultPrompt` si pasa a botones;
- menus de duda;
- servicio no claro;
- readiness Holded cuando no sacrifica botones criticos;
- preguntas precal cuando proceda.

No aplicarlo agresivamente a:

- login obligatorio;
- perfil obligatorio;
- checkout protegido;
- conexion Holded segura;
- seleccion de expediente;
- confirmaciones de pago/perfil.

### Paso 4 - Manejar `btn_other`

En `processKiaStep`, al recibir:

- `btn_other`;
- `quick_other`;
- `otro`;
- `другое`;

debe:

- pasar a flow `consult`;
- step `free_text_other`;
- responder invitando a escribir libremente;
- activar IA fallback en el siguiente turno si escribe texto libre;
- no marcar `needs_review`;
- no crear lead/case solo por pulsar "Otro".

### Paso 5 - `quickReplies` en `KiaDecision`

Actualizar schema y normalizacion.

Despues:

- convertir quick replies a botones WABA si procede;
- asegurar ultimo boton "Otro";
- adaptar tests/evals;
- actualizar health grader.

### Paso 6 - Politica de preguntas aclaratorias

Crear prompt dedicado e importarlo desde:

- `kia-system-prompt.ts`;
- WABA fallback legacy;
- Admin Compose.

### Paso 7 - Auditor + Health

Anadir reglas y fixtures nuevos cuando ya existan `quickReplies` y `btn_other`.

Anadir canaries:

- repeticion;
- opcion Otro;
- pregunta aclaratoria;
- tono friendly;
- continuidad tras CTA ya enviado.

### Paso 8 - Variacion log opcional

Crear `kia_message_variation_events` solo cuando las migraciones remotas esten desbloqueadas.

Importante: aplicar redaction antes de guardar:

- no secretos;
- no API keys;
- no documentos completos;
- no datos sensibles innecesarios.

## 13. Cambios seguros que no deberian romper produccion

Seguros si se implementan con cuidado:

- variar solo `body`, no IDs de botones;
- anadir warnings sin bloquear envio;
- anadir `quickReplies` con default `[]`;
- anadir reglas `rulesApplied` nuevas;
- anadir prompt de clarificacion;
- anadir canaries nuevos no bloqueantes al principio;
- documentar DB opcional como fase posterior.

Cambios que requieren mas cuidado:

- cambiar menus principales;
- forzar "Otro" en todos los botones;
- convertir respuestas de texto a botones en flujos existentes;
- tocar side effects del Kia Engine;
- tocar checkout/login/profile;
- tocar readiness/viability routing.

## 14. Criterios de aceptacion para la implementacion

- Las respuestas deterministas pasan por anti-repeticion antes del envio.
- Kia no repite exactamente un outbound reciente.
- Si hay similitud >= 0.72, cambia cuerpo sin cambiar decision operativa.
- Los botones/listas mantienen IDs y side effects.
- Las aclaraciones WABA incluyen quick replies cuando procede.
- La ultima opcion rapida es "Otro" / "Другое" salvo excepcion critica documentada.
- `btn_other` no escala, no crea expediente y no marca `needs_review`.
- `KiaDecision` soporta `quickReplies` con default.
- Health/Auditor tienen reglas especificas de repeticion y "Otro".
- No se piden API keys por WhatsApp.
- No se rompe checkout protegido.
- No se rompe readiness Holded/Planes.
- No se rompe viabilidad fiscal/juridica.
- No se rompe flujo Lead/Cliente.
- Admin Compose sigue respondiendo al mensaje seleccionado.

## Conclusion

La propuesta es correcta y encaja con la arquitectura actual. El repo ya tiene una base solida de anti-repeticion para IA estructurada, fallback WABA y Admin Compose, pero todavia falta extender esa proteccion al punto mas importante: todos los mensajes deterministas que salen de Kia Engine y de envios interactivos directos.

La implementacion recomendada no debe empezar por reescribir prompts ni menus completos. Debe empezar por un filtro global de salida que preserve la decision operativa y solo mejore la redaccion. Despues se puede formalizar `quickReplies`, "Otro", nuevas reglas de Auditor y canaries de Health.
