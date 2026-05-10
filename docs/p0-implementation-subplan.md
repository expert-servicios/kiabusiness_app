# EXPERT - Subplan P0 de implementacion

Ultima actualizacion: 2026-05-08

Estado: implementado en local; pendiente aplicar migracion y validar en Supabase remoto.

Nota sin Docker: usar `docs/supabase-no-docker-workflow.md` para aplicar y verificar la migracion via MCP, SQL Editor o CLI remoto.

## Objetivo P0

Estabilizar las piezas que pueden romper flujos existentes antes de seguir construyendo producto:

- schema Supabase alineado con el codigo actual,
- migraciones locales completas,
- sincronizacion Holded preparada como capa operativa del dashboard,
- variables y documentacion minima de despliegue al dia.

Este P0 no cambia contenido publico. Solo toca base de datos, integraciones internas, documentacion tecnica y verificacion.

## Principio Holded

Holded no es una pantalla aislada ni un sustituto de EXPERT.

Holded debe ser el sistema financiero externo que sincroniza datos con el dashboard de EXPERT:

- EXPERT capta, cobra, crea expediente, comunica y muestra estado operativo.
- Holded centraliza contactos, facturas, contabilidad y datos financieros.
- El dashboard de EXPERT debe poder mostrar si una operacion esta sincronizada con Holded, cual es el ID externo y si hubo error.

Regla P0:

> Toda accion que envie datos a Holded debe dejar rastro consultable en Supabase, no solo `console.error`.

## Alcance P0

### P0.1 - Auditoria de schema remoto

Antes de aplicar migraciones, confirmar el estado real en Supabase remoto:

- Existe `saas_leads`.
- Existe o no existe `holded_demos`.
- `cases` tiene o no tiene `admin_note`.
- `cases` tiene o no tiene `docs_checklist`.
- `case_state` contiene estados nuevos o solo legacy.
- `orders.metadata` existe y admite mapping Holded.
- `subscriptions` permite guardar o relacionar mapping Holded.

Criterio de aceptacion:

- Tenemos una lista exacta de diferencias entre migraciones locales y remoto.

### P0.2 - Migracion de expedientes

Problema detectado:

- El API de expedientes acepta estados nuevos:
  - `nuevo`
  - `docs_pendientes`
  - `docs_recibidos`
  - `en_tramitacion`
  - `pendiente_externo`
  - `resolucion_recibida`
  - `entregado`
  - `finalizado`
- La migracion inicial solo define estados legacy:
  - `pendiente_documentacion`
  - `en_revision`
  - `en_proceso`
  - `presentado`
  - `finalizado`
- El API escribe `admin_note` y `docs_checklist`, pero esas columnas no estan en migraciones locales.

Implementacion propuesta:

- Crear migracion para anadir valores nuevos a `public.case_state`.
- Mantener estados legacy por compatibilidad.
- Anadir a `public.cases`:
  - `admin_note text`
  - `docs_checklist jsonb not null default '[]'::jsonb`
  - `updated_at timestamptz not null default now()`
- Anadir a `public.quotes`:
  - `docs_checklist jsonb not null default '[]'::jsonb`
- Revisar si el admin debe seguir usando estados legacy o pasar al flujo nuevo de 8 etapas.

Criterio de aceptacion:

- `PATCH /api/cases/[id]` no falla por enum o columna inexistente.
- Los cambios de estado pueden disparar emails sin romper el expediente.
- El dashboard cliente puede leer checklist documental en fase siguiente.
- El checklist creado en onboarding/presupuesto se conserva hasta que Stripe cree el expediente.

### P0.3 - Migracion de `holded_demos`

Problema detectado:

- Existen rutas y UI para `holded_demos`.
- No hay migracion local que cree esa tabla.

Implementacion propuesta:

Crear `public.holded_demos` con:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `email text not null`
- `phone text`
- `company_name text not null`
- `company_type text`
- `employees_count text`
- `current_software text`
- `needs text`
- `status text not null default 'pending'`
- `notes text`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Estados admitidos:

- `pending`
- `demo_active`
- `onboarding_done`
- `training_done`
- `converted`
- `closed`

Seguridad:

- RLS habilitado.
- Public insert no directo: el formulario ya escribe server-side con service role.
- Admin gestiona via API server-side.
- Grant minimo a `service_role`.

Criterio de aceptacion:

- `/api/holded-demo` puede insertar solicitudes.
- `/admin/holded-demos` puede listar y cambiar estado.
- Los cambios de estado siguen enviando emails previstos.

### P0.4 - Registro de sincronizacion Holded

Problema detectado:

- El conector actual crea contacto/factura.
- Los errores quedan en consola.
- En algunos pagos se guarda `orders.metadata.holded`, pero no hay trazabilidad operativa uniforme.
- Para sincronizar el dashboard con Holded necesitamos estado visible y auditable.

Implementacion propuesta:

Crear una tabla generica `integration_sync_events` preparada para Holded y futuras integraciones:

- `id uuid primary key default gen_random_uuid()`
- `provider text not null` con valor inicial `holded`
- `direction text not null` (`to_external`, `from_external`)
- `operation text not null`
- `local_entity text`
- `local_id text`
- `external_entity text`
- `external_id text`
- `status text not null` (`pending`, `success`, `failed`, `skipped`)
- `attempt_count integer not null default 1`
- `request_payload jsonb`
- `response_payload jsonb`
- `error text`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Uso inicial:

- `syncOrderToHolded` registra intento, resultado y error.
- `syncSubscriptionToHolded` registra intento, resultado y error.
- Cuando Holded devuelve IDs, se guardan tambien en metadata de `orders` o `subscriptions`.
- `/admin/integraciones` muestra los eventos recientes de sincronizacion con Holded.

Criterio de aceptacion:

- El admin puede saber si una factura/contacto se sincronizo.
- Un fallo de Holded no rompe Stripe ni el expediente.
- Los errores quedan listos para una futura bandeja operativa.

### P0.5 - Variables y documentacion tecnica

Problema detectado:

- `.env.local` contiene `HOLDED_API_KEY`.
- `.env.example` y README no documentan esa variable.
- README dice que Holded esta pendiente, pero el codigo ya tiene base de conector.

Implementacion propuesta:

- Anadir `HOLDED_API_KEY=` a `.env.example`.
- Anadir variables opcionales:
  - `CALENDLY_ONBOARDING_URL=`
  - `CALENDLY_FORMACION_URL=`
- Actualizar README:
  - Holded como sincronizacion financiera externa.
  - P0 como prioridad actual.
  - No exponer claves reales.

Criterio de aceptacion:

- Una instalacion nueva sabe que variables necesita.
- No se versiona ningun secreto.

### P0.6 - Verificacion

Verificaciones locales:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git status --short`

Verificaciones Supabase:

- Migraciones aplicadas en remoto.
- Ejecutar `docs/p0-verification.sql`.
- Query de columnas/tablas criticas:
  - `cases`
  - `holded_demos`
  - `saas_leads`
  - `integration_sync_events`
- Prueba controlada de insercion server-side:
  - lead B2B,
  - solicitud Holded demo,
  - cambio de estado de expediente.

Verificacion Holded:

- Probar con una operacion controlada o entorno seguro.
- Confirmar formato real de contacto.
- Confirmar formato real de factura, impuestos e items.
- Confirmar que IDs externos quedan registrados en Supabase.

## Orden de ejecucion recomendado

1. Auditoria remoto/local de Supabase.
2. Crear migracion P0 de `cases`, `holded_demos` e `integration_sync_events`.
3. Ajustar conector Holded para registrar eventos de sincronizacion.
4. Ajustar README y `.env.example`.
5. Ejecutar typecheck/lint/build.
6. Aplicar migracion en remoto.
7. Validar flujos reales.

## Fuera de alcance P0

- Multi-tenant completo.
- UI nueva de sincronizacion Holded en dashboard.
- WhatsApp real.
- IA operativa.
- Reescritura del catalogo publico.
- Cambios de copy o navegacion publica.

Estos puntos quedan para P1/P2 una vez el schema deje de ser fragil.
