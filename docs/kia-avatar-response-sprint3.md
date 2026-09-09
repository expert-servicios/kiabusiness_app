# KIA Visual Copilot — Sprint 3

Fecha: 2026-09-09
Tracking: #176
Dependencias completadas: #172, #174

## Objetivo

Añadir una sensación mínima de actividad a KIA sin convertir el copiloto en un elemento distractor. El movimiento es únicamente una capa de presentación y no participa en decisiones, permisos ni ejecución de herramientas.

## Decisión de producto para esta iteración

No se incorpora respiración permanente, parpadeo artificial ni animación continua en estados normales.

Sprint 3 activa únicamente una microanimación en `pensando` sobre superficies persistentes:

- avatar del header del copiloto;
- launcher flotante cuando está visible.

Los avatares asociados a cada mensaje permanecen estáticos. El indicador de carga dentro del historial conserva su spinner y texto `Pensando…`.

## Movimiento `pensando`

- duración: 1800 ms;
- desplazamiento máximo: 1 px vertical;
- escala máxima: 1.015;
- easing: `ease-in-out`;
- repetición solo mientras `state === pensando`;
- desaparece automáticamente al llegar la respuesta.

El objetivo es comunicar actividad, no llamar la atención.

## Accesibilidad

`prefers-reduced-motion: reduce` desactiva tanto:

- la transición corta entre estados;
- la microanimación de `pensando`.

El estado de carga sigue siendo comprensible sin movimiento mediante texto y `role=status`.

## Límites

No se incluye:

- lipsync;
- vídeo;
- audio automático;
- GIFs;
- movimiento perpetuo en `ayuda`, `bienvenida`, `confianza` o `seguimiento`;
- animación en todos los mensajes;
- inferencia emocional del usuario;
- cambios de DDL, Stripe, Holded o pagos.

## Estados reservados

`alerta_fiscal`, `confianza` y `celebracion` siguen sin activación automática adicional en esta iteración. Antes de habilitarlos deben existir señales estructuradas fiables, no heurísticas basadas en texto libre.

## Criterios de aceptación

- `pensando` se mueve solo cuando `animateOnChange` está activo;
- los mensajes repetidos no reciben movimiento;
- amplitud visual mínima;
- `prefers-reduced-motion` elimina toda animación;
- no cambia el contrato de herramientas ni decisiones KIA;
- typecheck, lint y tests pasan;
- preview Vercel validada antes del merge.
