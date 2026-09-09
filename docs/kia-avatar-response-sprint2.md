# KIA Visual Copilot — Sprint 2

Fecha: 2026-09-09
Tracking: #173
Dependencia: PR #172 / Sprint 1

## Objetivo

Completar el catálogo visual de KIA con 12 estados productivos y mejorar la precisión de presentación sin crear un segundo motor de decisión ni introducir DDL.

El flujo permanece:

```text
KiaDecision estructurada
  -> resolveKiaAvatarState()
  -> avatarState
  -> KiaAvatar / KiaCopilotWidget
```

## Assets activados

Los seis estados de Sprint 1 se mantienen:

- `ayuda`
- `explicacion`
- `pensando`
- `aviso`
- `empatia`
- `exito`

Sprint 2 añade assets propios para:

| Estado | Expresión fuente aprobada |
| --- | --- |
| `bienvenida` | Sonrisa amable |
| `confianza` | Confianza |
| `alerta_fiscal` | Preocupación |
| `seguimiento` | Atención |
| `duda` | Duda |
| `celebracion` | Alegría |

Todos se sirven como WebP 256x256 desde `public/avatars/kia/`. Los recortes de la hoja aprobada son suficientes para esta fase de producto. Un set maestro transparente y de mayor resolución puede prepararse después si una superficie mayor lo necesita.

## Reglas activas

Precedencia conservadora:

1. revisión manual, `needs_review`, warnings o `anomaly_review` -> `aviso`;
2. confirmación operativa explícita -> `exito`;
3. aclaración o datos faltantes -> `duda`;
4. señal limitada de preocupación del usuario -> `empatia`;
5. `greeting` -> `bienvenida`;
6. `case_status` -> `seguimiento`;
7. intención explicativa/analítica -> `explicacion`;
8. fallback -> `ayuda`.

`pensando` continúa siendo exclusivamente un estado temporal de UI durante la petición.

## Estados reservados

### `alerta_fiscal`

El asset existe, pero no se auto-selecciona todavía. El contrato `KiaDecision` actual no expone una señal fiscal crítica suficientemente específica. No se permite inferir una alerta fiscal por palabras como `plazo`, `sanción` o `impuesto` en texto libre.

Hasta ampliar el contrato estructurado, cualquier riesgo que llegue mediante `warnings` o revisión manual se presenta como `aviso`.

### `celebracion`

El asset existe, pero queda reservado para hitos excepcionales. No se activa por tono positivo genérico ni por una simple respuesta correcta. `exito` sigue siendo el estado profesional para operaciones completadas.

### `confianza`

El asset queda disponible para una futura regla estructurada de confirmación informativa. No se asigna a frases tranquilizadoras por heurística textual.

## Transición visual

Sprint 2 incorpora una transición corta de entrada para superficies persistentes:

- header del copiloto;
- launcher flotante.

Los avatares repetidos de cada mensaje permanecen estáticos para evitar ruido visual.

La transición:

- dura 160 ms;
- usa únicamente opacidad + escala leve;
- no se repite en bucle;
- se desactiva con `prefers-reduced-motion: reduce`.

## Accesibilidad

- El texto sigue siendo autosuficiente sin avatar.
- Los avatares repetidos son decorativos para lectores de pantalla.
- El estado visual nunca sustituye una advertencia textual.
- La microtransición no es necesaria para comprender el contenido.

## Persistencia y privacidad

`avatar_state` continúa guardándose dentro de `kia_sessions.data` para el último mensaje. No se crea una tabla específica.

La detección limitada de empatía afecta únicamente a la presentación de la respuesta actual. No se persiste un perfil emocional del usuario.

## Sin dependencia de Supabase Pro

Este Sprint no requiere DDL ni cambios de esquema. No modifica Stripe, Holded, pagos, expedientes financieros ni el ledger de migraciones de #143.

## Criterios de aceptación

- los 12 estados tienen un asset propio;
- ningún estado futuro depende de alias visuales;
- `greeting` usa `bienvenida`;
- `case_status` usa `seguimiento`;
- aclaraciones usan `duda`;
- revisión/warnings prevalecen sobre cualquier estado positivo;
- `alerta_fiscal` no se infiere desde texto libre;
- `celebracion` no se usa automáticamente sin señal excepcional;
- header/launcher tienen transición corta;
- mensajes no animan repetidamente;
- `prefers-reduced-motion` desactiva la transición;
- typecheck, lint y tests en verde;
- previews Vercel verificadas antes de merge.

## Validación CI de PR apilado

El workflow de calidad del repositorio se ejecuta únicamente en PRs cuya base es `main`. Por eso, mientras #172 siga abierto, #174 puede retargetearse temporalmente a `main` para disparar la validación completa sobre el head de Sprint 2. Una vez obtenido el resultado, la base vuelve a `feat/kia-avatar-response-sprint1` para mantener el diff revisable. Tras fusionar #172, #174 se retargetea definitivamente a `main` y se valida de nuevo antes de merge.

## Rollout

Este trabajo está apilado sobre Sprint 1. El PR de Sprint 2 debe tener como base temporal `feat/kia-avatar-response-sprint1` y no debe fusionarse antes de #172. Tras fusionar #172, se retargetea a `main`, se revalida CI y se hace un smoke test visual final de los seis estados nuevos.
