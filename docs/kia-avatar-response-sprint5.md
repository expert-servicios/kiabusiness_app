# KIA Visual Copilot — Sprint 5

Fecha: 2026-09-10
Tracking: #192
Dependencias completadas: #172, #174, #177, #179, #187, #189

## Objetivo

Extender KIA fuera del chat flotante para que acompañe al usuario en superficies operativas del Espacio Cliente. La misma gramática visual de 12 estados debe reutilizarse allí donde el sistema ya conoce un estado fiable de UI o backend.

## Regla de arquitectura

No se añade una segunda llamada al LLM para elegir una expresión.

```text
estado UI / dato backend ya autorizado
  -> estado KIA determinista
  -> KiaGuidanceCard
  -> KiaAvatar existente
```

KIA sigue siendo una capa de orientación. No modifica datos, permisos, expedientes, Holded, Stripe ni acciones del usuario.

## Sprint 5A

Primera superficie: `/dashboard/expedientes`.

Mapping:

- uno o más expedientes activos -> `seguimiento`;
- cero activos y uno o más finalizados -> `exito`;
- ningún expediente -> `ayuda`.

El contenido mostrado deriva únicamente del resultado ya autorizado de `/api/cases` para ese usuario.

Se introduce `components/kia/KiaGuidanceCard.tsx` como superficie reusable para los siguientes pasos.

## Próximas superficies

### Onboarding

- inicio/perfil -> `bienvenida`;
- explicación de entidad -> `explicacion`;
- guardado -> `pensando`;
- validación/error -> `aviso`;
- configuración completa -> `exito`;
- decisión de omitir entidad -> `duda`.

### Detalle de expediente

- `pendiente_documentacion` -> `duda` o `aviso` según el requisito;
- `en_revision` / `en_proceso` -> `seguimiento`;
- `presentado` -> `confianza` solo con señal backend suficiente;
- `finalizado` -> `exito` o `celebracion` únicamente para hitos ya confirmados.

### Holded

- conexión no iniciada -> `ayuda`;
- conexión/configuración en curso -> `pensando`;
- integración activa/verificada -> `confianza`;
- error de conexión -> `aviso`.

## Accesibilidad

- el texto siempre explica el estado por sí mismo;
- el avatar es decorativo junto al mensaje;
- el componente reutiliza `KiaAvatar`, incluido `prefers-reduced-motion`;
- no se añade movimiento permanente.

## Seguridad y privacidad

- no se guardan nuevas inferencias emocionales;
- no se crea telemetría nueva en este bloque;
- no DDL;
- no datos financieros nuevos;
- no llamadas API nuevas desde `KiaGuidanceCard`;
- no se utiliza texto libre para concluir riesgo, éxito o cumplimiento.

## Criterios de aceptación de 5A

- componente reusable presente;
- `/dashboard/expedientes` muestra KIA con estado derivado de counts autorizados;
- la página no llama al LLM para seleccionar estado;
- los flujos y enlaces existentes de expedientes permanecen intactos;
- typecheck, lint y tests pasan;
- Vercel preview verificada antes de merge.
