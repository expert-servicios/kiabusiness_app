# Contrato de eventos MCP — holded_mcp_events

> Última actualización: 2026-06-15

## Propósito

La tabla `holded_mcp_events` es el canal de señalización entre el servidor MCP
(`claude.expertconsulting.es`) y el wizard post-compra (`PostCompraWizard`).
Cuando un usuario conecta Claude Desktop al servidor MCP de EXPERT, el servidor
inserta un evento en esta tabla. El wizard, suscrito via Supabase Realtime, detecta
el evento y marca el paso "Conectar Claude" como completado en tiempo real.

## Tabla

```sql
-- Definida en: supabase/migrations/20260529090000_holded_mcp_bridge_tables.sql
public.holded_mcp_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text        NOT NULL,
  event_type text        NOT NULL,
  channel    text,
  payload    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
)
```

## Evento que debe insertar el servidor MCP

El servidor MCP debe usar **service_role** (nunca el JWT del usuario) para insertar.

### INSERT obligatorio

```sql
INSERT INTO public.holded_mcp_events (user_email, event_type, channel)
VALUES ('<email del usuario>', 'user_connected', 'claude');
```

| Columna      | Valor obligatorio   | Notas |
|-------------|---------------------|-------|
| `user_email` | email del usuario   | Debe coincidir con `auth.users.email`. El wizard filtra por este campo. |
| `event_type` | `'user_connected'`  | También acepta `'first_activity'` para la primera herramienta usada. |
| `channel`    | `'claude'`          | Distingue Claude de otros clientes MCP futuros (ej. ChatGPT). |
| `payload`    | opcional            | Puede incluir metadata adicional (versión del cliente, tools list, etc.). |

### Momento de inserción

El servidor debe insertar el evento en **uno de estos dos momentos** (el primero que ocurra):

1. **`user_connected`** — Cuando el cliente MCP completa el handshake de autenticación OAuth con el servidor.
2. **`first_activity`** — Cuando el usuario ejecuta su primera herramienta MCP (`holded_*`).

Ambos tipos son aceptados por el wizard. Insertar `user_connected` lo antes posible
proporciona mejor UX (el wizard se cierra sin que el usuario tenga que ejecutar una herramienta).

## Cómo obtiene el email el servidor MCP

El servidor MCP ya conoce el email del usuario porque:
1. El flujo OAuth de Claude usa `expertconsulting.es` como authorization server.
2. El JWT devuelto por Supabase incluye el claim `email`.
3. El servidor extrae `jwt.email` en el middleware de autenticación.

## Política RLS

La tabla tiene dos políticas activas:

| Política | Tipo | Descripción |
|---------|------|-------------|
| `mcp_events_deny_anon` | ALL | Bloquea acceso a usuarios no autenticados |
| `users can read own mcp events` | SELECT | Permite a usuarios autenticados leer sus propios eventos (necesario para Realtime) |

**El INSERT del servidor MCP usa `service_role`**, que bypasea RLS.  
El SELECT del wizard usa el JWT del usuario, filtrado por la política `users can read own mcp events`.

## Flujo completo

```
Usuario hace click "Conectar Claude"
    ↓
PostCompraWizard abre claude.ai/mcp?... en nueva pestaña
    ↓
PostCompraWizard se suscribe a Realtime:
  channel: `mcp-wizard-${userEmail}`
  table: holded_mcp_events
  filter: user_email=eq.${userEmail}
  event: INSERT
    ↓
[Usuario en Claude Desktop acepta la conexión MCP]
    ↓
Servidor MCP recibe el callback OAuth
    ↓
Servidor MCP INSERT → holded_mcp_events (user_email, 'user_connected', 'claude')
    ↓
Supabase Realtime notifica al wizard
    ↓
Wizard marca Step 2 como completado ✅
```

## Verificación en Supabase Dashboard

Para comprobar que los eventos llegan correctamente:

```sql
SELECT user_email, event_type, channel, created_at
FROM public.holded_mcp_events
ORDER BY created_at DESC
LIMIT 20;
```

## Código relacionado

| Archivo | Rol |
|---------|-----|
| `components/dashboard/PostCompraWizard.tsx` | Suscripción Realtime + UI |
| `app/(protected)/dashboard/post-compra/page.tsx` | Server component que pasa `userEmail` |
| `app/api/integrations/holded/mcp-status/route.ts` | Endpoint HTTP alternativo para `handleRecheck` |
| `supabase/migrations/20260529090000_holded_mcp_bridge_tables.sql` | Schema de la tabla |
| `supabase/migrations/20260615000001_holded_mcp_events_user_read.sql` | Política SELECT para Realtime |
