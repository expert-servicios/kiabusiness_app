# KIA Visual Copilot — Contextual Avatar Response System

Fecha: 2026-09-09
Estado: Sprint 1 en implementación
Tracking: #171

## 1. Objetivo

Convertir KIA en un copiloto visual contextual dentro de EXPERT. La expresión del avatar debe acompañar el tipo de respuesta que KIA está dando —ayuda, explicación, análisis, aviso, empatía o éxito— sin convertir la selección visual en una decisión libre del modelo.

La función del avatar no es decorativa. Debe ayudar a:

- señalar visualmente qué tipo de respuesta está recibiendo el usuario;
- reducir fricción en respuestas complejas;
- reforzar la sensación de acompañamiento;
- distinguir estados de análisis, advertencia y confirmación;
- mantener una identidad de producto coherente entre respuestas.

## 2. Punto de partida real en EXPERT

La arquitectura KIA actual ya dispone de una decisión estructurada validada por Zod en `lib/ai/kia/kia-output-schema.ts`. Entre otros campos, `KiaDecision` expone:

- `intent`;
- `nextAction`;
- `confidence`;
- `requiresManualReview`;
- `missingData`;
- `warnings`;
- `quickReplies`.

El chat in-app ya existe en:

- `components/KiaCopilotWidget.tsx`;
- `POST /api/ai/kia`;
- `kia_sessions` para historial de sesión.

Por tanto, no se debe crear un segundo sistema de decisión. La nueva capa visual se sitúa después de `KiaDecision` y antes de renderizar la respuesta.

### Decisión arquitectónica

```text
Usuario
  ↓
POST /api/ai/kia
  ↓
runKiaDecision()
  ↓
KiaDecision estructurada
  ↓
resolveKiaAvatarState()
  ↓
{ reply, quickReplies, intent, nextAction, avatarState }
  ↓
KiaCopilotWidget
  ↓
Texto + expresión visual coherente
```

La IA sigue decidiendo y redactando dentro de los límites actuales. El backend controla la presentación crítica.

## 3. Principios de diseño

1. **Backend primero**: el servidor resuelve `avatarState`; el navegador no decide alertas, éxito o revisión manual.
2. **Señales estructuradas antes que texto libre**: `requiresManualReview`, `warnings`, `missingData`, `intent` y `nextAction` tienen prioridad.
3. **Fail-safe visual**: ante incertidumbre, usar `ayuda`; ante error/revisión manual, usar `aviso`.
4. **No dramatizar**: estados de alerta deben ser sobrios y excepcionales.
5. **No cambiar de cara sin motivo**: mantener un estado durante un bloque conversacional cuando no cambia la intención.
6. **No mezclar estado emocional con autoridad profesional**: la expresión acompaña; no sustituye disclaimers, validaciones ni revisión humana.
7. **Sin DDL en Sprint 1**: el estado puede guardarse dentro de `kia_sessions.data` JSONB.
8. **Accesibilidad**: el significado nunca depende solo de la imagen; el texto sigue siendo completo.
9. **Animación progresiva**: primero imagen estática, luego microanimación; nunca lipsync en la primera fase.

## 4. Catálogo maestro de estados

El sistema define 12 estados estables. El enum se mantiene desde Sprint 1 aunque solo seis tengan assets/activación automática inicial.

| Estado | Significado | Uso principal | Frecuencia esperada |
| --- | --- | --- | --- |
| `bienvenida` | recepción/reenganche | primera interacción, onboarding | media |
| `ayuda` | disposición a resolver | FAQ, duda general, fallback | alta |
| `explicacion` | guía profesional | pasos, fiscalidad, laboral, procedimientos | alta |
| `confianza` | confirmación tranquila | validación, orientación segura | media |
| `pensando` | procesamiento | tools, consultas, espera de backend | alta pero temporal |
| `aviso` | advertencia general | incidencia, revisión manual, riesgo no fiscal | media-baja |
| `alerta_fiscal` | riesgo tributario/plazo crítico | sanción, plazo, error fiscal material | excepcional |
| `empatia` | acompañamiento humano | frustración, preocupación, bloqueo | media-baja |
| `exito` | operación completada | trámite/listado/reporte terminado | media |
| `seguimiento` | estado en curso | expediente, tarea o revisión pendiente | media |
| `duda` | falta información | aclaración de datos/ambigüedad | media |
| `celebracion` | logro relevante | hito excepcional, cierre positivo | baja |

## 5. Estados MVP — Sprint 1

Activos inicialmente:

- `ayuda`;
- `explicacion`;
- `pensando`;
- `aviso`;
- `empatia`;
- `exito`.

Los seis estados restantes existen en el contrato, pero usan alias visuales hasta disponer de assets individuales aprobados:

| Estado futuro | Fallback Sprint 1 |
| --- | --- |
| `bienvenida` | `ayuda` |
| `confianza` | `explicacion` |
| `alerta_fiscal` | `aviso` |
| `seguimiento` | `explicacion` |
| `duda` | `ayuda` |
| `celebracion` | `exito` |

Esto permite ampliar el sistema sin modificar el contrato API.

## 6. Reglas de resolución — Sprint 1

### 6.1 Precedencia

La selección sigue este orden. La primera regla aplicable gana.

1. **Revisión/advertencia estructurada** → `aviso`
2. **Resultado positivo explícito** → `exito`
3. **Falta de datos / pregunta necesaria** → `ayuda`
4. **Señal de preocupación del usuario** → `empatia`
5. **Intención explicativa/analítica** → `explicacion`
6. **Fallback** → `ayuda`

El estado `pensando` es exclusivamente de UI mientras una petición está en curso.

### 6.2 Aviso

Debe ganar sobre cualquier estado positivo cuando:

- `requiresManualReview === true`;
- `nextAction === 'needs_review'`;
- `warnings.length > 0`;
- `intent === 'anomaly_review'`.

No inferir `aviso` únicamente porque la respuesta contiene palabras como “error” o “problema” si la decisión estructurada no lo respalda.

### 6.3 Éxito

Sprint 1 solo usa éxito cuando hay señal operativa suficientemente explícita:

- `intent === 'company_data_confirm'`;
- `nextAction === 'show_report_link'`.

No clasificar como éxito una respuesta simplemente porque su tono es positivo.

### 6.4 Ayuda

Usar cuando:

- `nextAction === 'ask_one_question'`;
- `missingData.length > 0`;
- `intent === 'greeting'` durante Sprint 1;
- no existe otra regla fiable.

### 6.5 Empatía

Sprint 1 permite una detección léxica limitada y conservadora sobre el mensaje del usuario, después de descartar señales críticas. Ejemplos de señales:

- “estoy preocupado/a”;
- “me preocupa”;
- “estoy agobiado/a”;
- “no entiendo nada”;
- “estoy bloqueado/a”.

No usar la expresión de empatía como sustituto de una alerta necesaria.

### 6.6 Explicación

Usar con intenciones que normalmente requieren interpretar o explicar información:

- `service_selection`;
- `viability`;
- `readiness`;
- `accounting_summary`;
- `document_classification`;
- `company_data_resolve`;
- `report_request`;
- `export_report`;
- `case_status` durante Sprint 1.

En Sprint 2, `case_status` migrará a `seguimiento` cuando el asset esté aprobado.

### 6.7 Pensando

El frontend debe mostrar `pensando` desde que envía la petición hasta recibir respuesta/error.

No persistirlo como resultado final del mensaje.

## 7. Contrato API

`POST /api/ai/kia` amplía la respuesta con:

```ts
interface KiaApiResponse {
  reply: string;
  quickReplies?: string[];
  intent?: string;
  nextAction?: string;
  avatarState?: KiaAvatarState;
  error?: string;
}
```

Ejemplo:

```json
{
  "reply": "Voy a explicarte los pasos para revisar este modelo.",
  "quickReplies": ["Ver requisitos"],
  "intent": "readiness",
  "nextAction": "run_readiness",
  "avatarState": "explicacion"
}
```

### Persistencia

Dentro de `kia_sessions.data`:

```json
{
  "last_message": "...",
  "last_reply": "...",
  "intent": "readiness",
  "next_action": "run_readiness",
  "avatar_state": "explicacion"
}
```

No se añade columna ni tabla en Sprint 1.

## 8. Assets visuales

### Fuente aprobada

La hoja de expresiones aportada por producto se considera fuente visual de Sprint 1.

### Convención

Directorio:

```text
public/avatars/kia/
```

Nombres:

```text
kia-ayuda.webp
kia-explicacion.webp
kia-pensando.webp
kia-aviso.webp
kia-empatia.webp
kia-exito.webp
```

### Requisitos MVP

- 256 × 256 px;
- WebP;
- mismo encuadre visual;
- busto/cabeza;
- sin texto embebido;
- objetivo aproximado < 40 KB por asset;
- cargables desde `/avatars/kia/...`.

### Fase visual posterior

Regenerar los 12 assets definitivos con:

- fondo transparente;
- misma escala de rostro;
- hombros alineados;
- iluminación uniforme;
- blazer/top consistente;
- variantes de 256 y 512 px si se necesitan superficies mayores.

Los recortes de Sprint 1 son productivos para validar UX, pero no sustituyen el set maestro final.

## 9. Componente UI

Crear:

```text
components/kia/KiaAvatar.tsx
```

Responsabilidades:

- resolver asset/fallback;
- soportar tamaños `xs`, `sm`, `md`, `lg`;
- mantener recorte circular coherente;
- exponer `alt` accesible;
- no contener lógica de negocio.

El resolver de negocio vive en `lib/ai/kia`, no en React.

## 10. Integración en `KiaCopilotWidget`

Sprint 1 cambia cuatro superficies:

### Header

Sustituir el icono genérico de robot por KIA.

El header refleja el último estado de KIA; durante carga usa `pensando`.

### Mensajes assistant

Cada respuesta KIA muestra avatar pequeño a la izquierda de la burbuja.

Los mensajes del usuario no muestran avatar KIA.

### Loading

Mientras `loading === true`:

- avatar `pensando`;
- spinner/texto “Pensando…”.

### Error

Errores técnicos visibles se renderizan con `aviso`.

### Botón flotante

Cuando está cerrado puede mostrar el avatar KIA en vez del icono genérico. Cuando el panel está abierto, conserva `X` para accesibilidad y claridad.

## 11. Comportamiento conversacional

No cambiar expresión por cada fragmento. Una misma respuesta tiene un único `avatarState`.

Secuencia esperada:

```text
Usuario: "¿Cómo presento este trámite?"
KIA: ayuda

Usuario elige trámite
Frontend: pensando
KIA devuelve pasos
KIA: explicacion

Backend detecta revisión manual
KIA: aviso

Operación finalizada
KIA: exito
```

## 12. Seguridad y cumplimiento

- El avatar no altera autorizaciones, company scope, tools ni reglas KIA.
- `company_id` sigue validándose server-side antes de ejecutar KIA.
- No mostrar `exito` cuando existe `requiresManualReview` o `warnings`.
- No usar expresión para ocultar incertidumbre.
- No guardar inferencias emocionales sensibles como perfil permanente del usuario.
- La detección léxica de empatía solo influye en presentación del mensaje actual.
- No usar reconocimiento facial, biometría ni inferencias personales a partir del avatar.
- Los assets son estáticos y no contienen datos de cliente.

## 13. Accesibilidad

- `alt` descriptivo corto: `KIA — ayuda`, `KIA — aviso`, etc.
- El texto debe ser autosuficiente sin imagen.
- No usar color/expresión como único indicador de advertencia.
- Animaciones futuras deben respetar `prefers-reduced-motion`.
- Evitar GIFs infinitos/agresivos.

## 14. Rendimiento

Objetivos Sprint 1:

- WebP 256 × 256;
- carga individual bajo demanda;
- dimensiones explícitas para evitar layout shift;
- no precargar los seis assets simultáneamente salvo medición que lo justifique.

En Sprint 3 se evaluará WebM/APNG/Lottie según coste y accesibilidad.

## 15. Observabilidad

Sprint 1 registra `avatar_state` en `kia_sessions.data`.

Sprint 2 puede añadir métricas agregadas:

- distribución por estado;
- cambio de estado por conversación;
- tasa de fallback `ayuda`;
- correlación con feedback KIA;
- alertas por uso excesivo de `aviso`/`exito`;
- inconsistencias detectadas por Kia Auditor.

No es necesario crear tabla nueva hasta resolver #143 y justificar el dato.

## 16. Reglas para Kia Auditor

En una fase posterior, añadir checks:

- warning + estado positivo → error;
- `requiresManualReview` + estado distinto de `aviso`/`alerta_fiscal` → error;
- loading final persistido como `pensando` → error;
- exceso de `celebracion` → warning de tono;
- fallback repetido en conversación estructurada → warning de resolver incompleto.

## 17. Sprint 1 — alcance ejecutable

### Entregables

1. Documento operativo presente.
2. `KiaAvatarState` tipado con 12 estados.
3. Resolver determinista server-side.
4. Mapa de assets y aliases.
5. Seis WebP optimizados.
6. `KiaAvatar` reusable.
7. `avatarState` en API.
8. Persistencia en `kia_sessions.data`.
9. Integración visual en widget.
10. Tests unitarios/regresión.
11. CI y previews Vercel.

### Fuera de alcance

- DDL;
- animación;
- lip-sync;
- estados persistentes en una tabla propia;
- personalización por usuario;
- selección libre de expresión por el LLM;
- Telegram/WhatsApp visual;
- modificación de emails transaccionales.

## 18. Tests Sprint 1

Casos mínimos:

1. `requiresManualReview=true` → `aviso`.
2. `warnings` no vacío → `aviso`.
3. `anomaly_review` → `aviso`.
4. `company_data_confirm` → `exito`.
5. `show_report_link` → `exito`.
6. `ask_one_question` → `ayuda`.
7. `missingData` → `ayuda`.
8. mensaje de preocupación sin warning → `empatia`.
9. `readiness` → `explicacion`.
10. `case_status` → `explicacion` Sprint 1.
11. fallback → `ayuda`.
12. loading UI → `pensando`.
13. API devuelve `avatarState`.
14. sesión guarda `avatar_state`.
15. error visible → `aviso` en cliente.
16. aliases de estados futuros resuelven a asset existente.

## 19. Criterios de aceptación Sprint 1

- No existe ruta donde una revisión manual termine con avatar `exito`.
- El componente no decide reglas de negocio.
- El widget sigue funcionando si `avatarState` no llega (fallback `ayuda`).
- KIA sigue respondiendo con el mismo texto/quick replies; el cambio es aditivo.
- No se rompe el header, scrolling, reset ni envío de quick replies.
- Los assets pesan < 40 KB cada uno.
- Typecheck, lint y tests pasan.
- Preview Vercel validada en desktop y móvil.

## 20. Sprint 2 — catálogo completo y reglas por contexto

Objetivo: activar los 12 estados y mejorar precisión.

- assets maestros transparentes para los 12 estados;
- `bienvenida` para inicio/reenganche;
- `seguimiento` para `case_status`;
- `duda` para aclaraciones;
- `confianza` para confirmación informativa;
- `alerta_fiscal` mediante señales estructuradas fiscales, nunca keywords sueltas;
- `celebracion` solo en hitos de alto valor;
- reglas por servicio/canal;
- telemetría agregada;
- revisión Kia Auditor.

## 21. Sprint 3 — microanimación

Objetivo: dar sensación de presencia sin convertir KIA en un personaje invasivo.

Microanimaciones admitidas:

- parpadeo ocasional;
- respiración muy leve;
- inclinación sutil;
- transición/fade entre estados;
- `pensando`: pequeño movimiento controlado.

No admitido inicialmente:

- lipsync;
- bucles llamativos;
- movimientos grandes;
- audio automático.

## 22. Sprint 4 — expansión del copiloto visual

- onboarding;
- seguimiento de expedientes;
- centro de ayuda;
- estados de integración Holded;
- formularios guiados;
- análisis A/B de tamaño/frecuencia;
- configuración Admin si la analítica justifica control manual.

## 23. Rollout

1. PR Sprint 1 en draft/review.
2. CI verde.
3. Preview Vercel desktop/móvil.
4. Prueba interna con conversaciones reales no sensibles.
5. Confirmar que warning/review tienen prioridad.
6. Merge sin DDL.
7. Observar feedback y errores.
8. Diseñar assets maestros Sprint 2.

## 24. Kill switch / rollback

Sprint 1 es aditivo. El rollback más seguro es revertir la integración visual y mantener `POST /api/ai/kia` sin `avatarState`; no hay migración de datos que deshacer.

Si se desea feature flag en Sprint 2:

```env
NEXT_PUBLIC_KIA_CONTEXTUAL_AVATARS_ENABLED=true
```

No es necesario introducirlo en Sprint 1 si el PR se valida completamente en preview.

## 25. Decisión final

KIA debe tratarse como un sistema visual de conversación asistida, no como una colección de ilustraciones. La expresión se deriva de señales operativas estructuradas, con reglas conservadoras para alerta/éxito y un fallback estable. El Sprint 1 implementa la infraestructura completa sin depender de Supabase Pro ni del desbloqueo de #143.
