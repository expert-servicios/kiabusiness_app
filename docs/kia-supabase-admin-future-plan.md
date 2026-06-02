# Plan Futuro - Kia, Supabase y Admin Operativo

Fecha: 2026-06-02

## Estado Actual

- Supabase CLI sigue bloqueada para Postgres directo por autenticacion/pooler.
- Supabase MCP funciona para el proyecto `ybtpqscmqrrjjmuoryap` y ya se uso para aplicar migraciones.
- Panel Admin de clientes ya permite gestionar personas, empresas, Stripe customer, Holded status, mappings y eventos sync.
- Migraciones aplicadas por MCP:
  - `admin_clients_operational_status`
  - `admin_orders_holded_traceability_repair`
- Validacion local reciente:
  - ESLint focalizado OK.
  - `npm run typecheck` OK.

## Hallazgos De Conversaciones Reales

- Holded laboral: un usuario pregunto en ruso si Holded permite fichar entrada/salida de empleados y si encaja con la normativa actual. Kia respondio con saludo generico y luego con una frase de ayuda sin informacion concreta.
- Precios Holded: en un hilo anterior, ante "Dime los precios", Kia respondio que no tenia importe fijo aunque ya tenemos precios publicados para Pack Starter y migraciones.
- Bajo interes/diversion: Kia repitio la misma frase de cierre varias veces en el mismo hilo, creando efecto bucle.
- Respuestas humanas/admin: el historial contiene respuestas humanas utiles y deben usarse como continuidad de tono, no copiarse literalmente.

## Ajustes Aplicados Hoy

- Guard determinista para preguntas informativas de Holded antes del motor de menus.
- Respuesta especifica para Holded laboral/control horario, con enlaces oficiales de Holded y CTA EXPERT.
- Respuesta general de Holded con informacion util y botones.
- Precio Holded en contexto Holded vuelve a usar precios publicados.
- Bajo interes/diversion: primer aviso, segundo aviso distinto y despues pausa sin repetir.
- Reactivacion: si un contacto marcado como bajo interes vuelve con una consulta real, Kia se reactiva y delega en IA/fallback.

## Riesgos Pendientes

1. RLS y grants
   - MCP detecto tablas con RLS desactivado.
   - No cambiar `public` por `api` todavia; la app usa muchas tablas `public` directamente.
   - Primero auditar tabla por tabla, luego aplicar RLS/grants de forma incremental.

2. Supabase Data API
   - Mantener `public` expuesto hasta migrar frontend/backend a un esquema `api` o endpoints server-side.
   - Crear esquema `api` solo para vistas/RPCs seguras cuando el modelo este listo.

3. Kia WABA
   - Evitar respuestas repetidas en hilos de bajo interes/diversion.
   - Responder preguntas concretas de Holded con informacion util antes de volver a menus.
   - Mantener idioma del ultimo mensaje.
   - Usar respuestas rapidas con ultima opcion `Otro` / `Другое`.

4. Holded knowledge
   - Crear una base viva de respuestas para:
     - Control horario / empleados.
     - API key y seguridad.
     - Pack Starter.
     - Migracion.
     - Formacion.
     - Plan mensual con Holded obligatorio.
   - Citar enlaces oficiales de Holded cuando proceda.

## Proximo Bloque Recomendado

1. Auditar RLS por MCP y crear `docs/supabase-rls-audit.md`.
2. Reparar solo tablas realmente expuestas y usadas por frontend.
3. Crear/actualizar tests canarios de Kia:
   - Pregunta concreta sobre Holded laboral.
   - Usuario ruso sobre Holded.
   - Repeticion de entretenimiento.
   - Precio Holded.
   - API key Holded.
4. Revisar conversaciones reales tras cada ajuste, sin copiar datos sensibles en docs.
5. Solo despues plantear esquema `api` y retirada gradual de `public`.

## Criterios de Aceptacion Futuros

- Kia no repite una salida literal mas de una vez en el mismo hilo.
- Kia responde preguntas concretas de Holded antes de ofrecer llamada o menu.
- Kia mantiene ruso si el ultimo mensaje esta en ruso.
- Holded nunca usa viabilidad juridica; usa readiness/preparacion.
- Panel Admin no depende de columnas inexistentes.
- RLS activado o justificado para cada tabla expuesta.
- Los cambios de Supabase quedan registrados como migraciones locales, aunque se apliquen via MCP.
