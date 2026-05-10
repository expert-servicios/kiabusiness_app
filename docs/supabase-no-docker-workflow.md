# EXPERT - Flujo Supabase local/remoto

Ultima actualizacion: 2026-05-09

## Contexto

Docker Desktop ya esta disponible y Supabase local puede usarse para validar migraciones antes de tocar remoto.

El proyecto mantiene dos rutas:

- Supabase local con Docker para validar migraciones,
- Supabase MCP en Claude,
- SQL Editor del dashboard Supabase,
- Supabase CLI contra remoto con `--db-url`, si la connection string resuelve correctamente.

## Estado actual

- `supabase/config.toml` existe y `project_id = "ksenia_expert"`.
- `supabase/seed.sql` existe como seed vacio para desarrollo local.
- Docker Desktop esta arrancado, pero `docker.exe` no esta en `PATH`.
- Ruta local encontrada para Docker CLI:
  - `C:\Users\info\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`
- Supabase local DB arranco correctamente:
  - `supabase_db_ksenia_expert` healthy.
- `supabase db reset --local --workdir .` aplico todas las migraciones locales hasta:
  - `20260509164929_add_external_mappings.sql`
- Verificacion local OK:
  - `public.integration_sync_events`
  - `public.external_mappings`
  - `public.holded_demos`
  - estados nuevos de `case_state`
- Supabase CLI remoto todavia no esta autenticado:
  - falta `supabase login` o `SUPABASE_ACCESS_TOKEN`.
- El proyecto remoto todavia no esta enlazado para la CLI:
  - falta `supabase link --project-ref ybtpqscmqrrjjmuoryap`.
- MCP de Supabase para Claude esta configurado en `.mcp.json`.
- El endpoint MCP responde, pero requiere autenticacion OAuth.
- `DATABASE_URL` existe en `.env.local`, pero el host directo `db.<project-ref>.supabase.co` no resuelve desde esta maquina.
- La migracion P0 esta preparada y validada localmente en:
  - `supabase/migrations/20260508174011_p0_schema_alignment.sql`
- La migracion de mappings externos esta preparada y validada localmente en:
  - `supabase/migrations/20260509164929_add_external_mappings.sql`
- Las queries de verificacion estan en:
  - `docs/p0-verification.sql`

## Ruta local con Docker

En esta maquina, antes de usar Supabase CLI, anadir Docker CLI al `PATH` de la sesion:

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;$env:PATH"
```

Comprobar estado local:

```powershell
supabase status --workdir .
supabase migration list --local --workdir .
```

Reset local completo:

```powershell
supabase db reset --local --workdir .
```

Verificacion directa de tablas criticas:

```powershell
docker exec supabase_db_ksenia_expert psql -U postgres -d postgres -tAc "select to_regclass('public.integration_sync_events'), to_regclass('public.external_mappings'), to_regclass('public.holded_demos');"
```

Nota: si `docker` no esta en `PATH`, usar la ruta absoluta:

```powershell
& "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe" ps
```

## Ruta recomendada: MCP en Claude

1. Abrir Claude Code en este proyecto.
2. Confirmar MCP:

```bash
claude mcp get supabase
```

Debe mostrar:

```txt
Status: Connected
```

3. En Claude, pedir:

```txt
Usa el MCP de Supabase para aplicar las migraciones locales pendientes:
- supabase/migrations/20260508174011_p0_schema_alignment.sql
- supabase/migrations/20260509164929_add_external_mappings.sql

Despues ejecuta docs/p0-verification.sql.
No modifiques datos de negocio. Reporta errores exactos si algo falla.
```

4. Revisar el resultado antes de seguir con pruebas reales.

## Ruta alternativa: SQL Editor Supabase

1. Abrir Supabase Dashboard.
2. Ir a SQL Editor.
3. Pegar y ejecutar:

```txt
supabase/migrations/20260508174011_p0_schema_alignment.sql
supabase/migrations/20260509164929_add_external_mappings.sql
```

4. Despues pegar y ejecutar:

```txt
docs/p0-verification.sql
```

5. Confirmar que existen:

- `public.holded_demos`
- `public.integration_sync_events`
- `public.external_mappings`
- `public.saas_leads`
- columnas `cases.admin_note`, `cases.docs_checklist`, `cases.updated_at`
- columna `subscriptions.metadata`
- RLS activado en tablas nuevas
- politicas admin creadas

## Ruta alternativa: Supabase CLI remoto

Primero autenticar la CLI:

```bash
supabase login
```

Despues enlazar el proyecto:

```bash
supabase link --project-ref ybtpqscmqrrjjmuoryap
```

Dry run seguro:

```bash
supabase db push --workdir . --dry-run
```

Aplicar migraciones:

```bash
supabase db push --workdir .
```

Ruta alternativa solo si tenemos una `DATABASE_URL` de Supabase que resuelva desde esta maquina:

Dry run seguro:

```bash
supabase --workdir "<ruta-del-proyecto>" db push --db-url "<DATABASE_URL>" --dry-run
```

Aplicar migraciones:

```bash
supabase --workdir "<ruta-del-proyecto>" db push --db-url "<DATABASE_URL>"
```

Si el host directo no resuelve, usar connection string del pooler desde:

```txt
Supabase Dashboard -> Project Settings -> Database -> Connection string
```

Preferir el modo Session pooler o Transaction pooler segun disponibilidad.

## Verificacion en app

Tras aplicar migracion:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. Entrar al admin.
5. Abrir `/admin/integraciones`.
6. Confirmar que carga sin error.
7. Lanzar una prueba controlada de sincronizacion Holded.
8. Confirmar que aparece un evento en `integration_sync_events`.

## Notas de seguridad

- No pegar claves reales en archivos versionados.
- `.env.local` debe seguir fuera de git.
- `HOLDED_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son secretos server-side.
- No usar claves `NEXT_PUBLIC_*` para operaciones privilegiadas.
