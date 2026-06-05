# Deploy Holded MCP on Vercel + Supabase persistence

Guía de despliegue del servidor MCP de Holded para Claude en Vercel, usando
Supabase Postgres como almacén persistente de OAuth.

---

## 1. Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20.x |
| Vercel CLI | `npm i -g vercel` (cualquier versión reciente) |
| Supabase proyecto | instancia existente (DB URL disponible) |

---

## 2. Configuración en Vercel

### Root directory

En el dashboard de Vercel (o en `vercel link`), establece:

```
Root Directory: apps/holded-mcp
```

El archivo `apps/holded-mcp/vercel.json` ya contiene toda la configuración
necesaria. Vercel lo detecta automáticamente cuando `rootDirectory` apunta a
esa carpeta.

### Runtime

El campo `"engines": { "node": "20.x" }` en `apps/holded-mcp/package.json`
ya especifica Node 20.

### Dominio

Asigna el dominio `claude.expertconsulting.es` al deployment en Vercel
(Settings → Domains → Add).

---

## 3. Variables de entorno requeridas

Configúralas en Vercel → Settings → Environment Variables.

| Variable | Valor | Notas |
|---|---|---|
| `BASE_URL` | `https://claude.expertconsulting.es` | URL canónica del servidor MCP |
| `DATABASE_URL` | `postgresql://...` | Connection string de Supabase Postgres |
| `OAUTH_JWT_SECRET` | `<random 64+ hex chars>` | Firma de tokens OAuth. Generar: `openssl rand -hex 32` |
| `OAUTH_DATA_ENCRYPTION_SECRET` | `<random 64+ hex chars>` | Cifrado AES-256 de API keys. Generar: `openssl rand -hex 32` |
| `OAUTH_CLIENT_ID` | `claude-holded-connector` | ID del cliente OAuth estático |
| `OAUTH_CLIENT_SECRET` | `<random 32+ chars>` | Secreto del cliente OAuth estático |
| `HOLDED_API_BASE` | `https://api.holded.com` | Solo si se necesita sobreescribir el default |
| `EXPERT_PUBLIC_URL` | `https://expertconsulting.es` | URL pública de EXPERT para links legales |
| `EXPERT_APP_URL` | `https://expertconsulting.es` | URL del backend EXPERT para llamadas server-to-server |
| `EXPERT_OAUTH_BRIDGE_ENABLED` | `0` | Mantener `0` hasta que estén listos los endpoints bridge |
| `EXPERT_CENTRAL_REGISTRY_ENABLED` | `0` | Mantener `0` hasta que esté listo el registry endpoint |
| `NODE_ENV` | `production` | Vercel lo inyecta automáticamente |

Variables opcionales (solo necesarias cuando se activa bridge mode):

| Variable | Valor | Notas |
|---|---|---|
| `SESSION_SECRET` | `<random 32+ chars>` | Requerido cuando `EXPERT_OAUTH_BRIDGE_ENABLED=1` |
| `EXPERT_APP_SHARED_SECRET` | `<random 32+ chars>` | Requerido cuando bridge o central registry están habilitados |

---

## 4. Supabase Postgres — conexión y SSL

El servidor detecta automáticamente si necesita SSL según el `DATABASE_URL`:

- Si la URL contiene `supabase.co` o `sslmode=require`, activa SSL con
  `rejectUnauthorized: false` (certificado autofirmado de Supabase es válido).
- En cualquier otro caso, SSL queda desactivado.

Connection string recomendada para Supabase:

```
postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Usa el **Transaction pooler** (puerto 6543) en lugar del Session pooler porque
Vercel es serverless y no mantiene conexiones largas.

---

## 5. Esquema de base de datos OAuth

Las tablas se crean automáticamente en el **primer request** que toque el
store OAuth (`ensurePersistentStore` en `auth.ts`). No se necesita migración
manual. Las tres tablas son:

```sql
-- Códigos de autorización (TTL 10 min por defecto)
holded_mcp_oauth_authorization_codes (
  code_hash text PRIMARY KEY,
  user_id text NOT NULL,
  client_id text NOT NULL,
  redirect_uri text NOT NULL,
  holded_api_key_enc text NOT NULL,   -- cifrado AES-256-GCM
  scope text NOT NULL,
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
)

-- Access tokens (TTL 1h por defecto)
holded_mcp_oauth_access_tokens (
  token_hash text PRIMARY KEY,
  session_id text NOT NULL,
  user_id text NOT NULL,
  client_id text NOT NULL,
  holded_api_key_enc text NOT NULL,
  scope text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
)

-- Refresh tokens (TTL 30 días por defecto)
holded_mcp_oauth_refresh_tokens (
  token_hash text PRIMARY KEY,
  session_id text NOT NULL,
  user_id text NOT NULL,
  client_id text NOT NULL,
  holded_api_key_enc text NOT NULL,
  scope text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by_token_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
)
```

Las API keys de Holded se almacenan **siempre cifradas** con AES-256-GCM
usando `OAUTH_DATA_ENCRYPTION_SECRET`. Nunca se almacenan en texto plano.

---

## 6. Hardening de producción — DATABASE_URL obligatoria

En `NODE_ENV=production`, si `DATABASE_URL` no está definida, el servidor
**rechaza arrancar** con un error claro:

```
DATABASE_URL is required in production for the Claude MCP OAuth store.
Set ALLOW_STATELESS_OAUTH_IN_PRODUCTION=1 only for an emergency degraded rollout.
```

Para un rollout degradado de emergencia (sin DB), se puede pasar:

```
ALLOW_STATELESS_OAUTH_IN_PRODUCTION=1
```

Esto no es recomendable en producción: los tokens son stateless JWT y no se
pueden revocar de forma efectiva.

---

## 7. Pasos de despliegue

```bash
# 1. Desde la raíz del monorepo
cd apps/holded-mcp

# 2. Build local de verificación
npm run build
npm test

# 3. Link al proyecto Vercel (primera vez)
vercel link

# 4. Configurar variables de entorno (primera vez o actualizando)
#    Se puede hacer desde el dashboard o con la CLI:
vercel env add BASE_URL production
vercel env add DATABASE_URL production
vercel env add OAUTH_JWT_SECRET production
vercel env add OAUTH_DATA_ENCRYPTION_SECRET production
vercel env add OAUTH_CLIENT_ID production
vercel env add OAUTH_CLIENT_SECRET production

# 5. Deploy a producción
vercel --prod
```

---

## 8. Checklist de validación post-deploy

Una vez desplegado en `https://claude.expertconsulting.es`, verificar:

```bash
BASE="https://claude.expertconsulting.es"

# Health
curl -s $BASE/health | jq .
# Esperado: {"status":"ok","service":"holded-mcp","version":"1.0.0"}

# OAuth discovery
curl -s $BASE/.well-known/oauth-authorization-server | jq .issuer
# Esperado: "https://claude.expertconsulting.es"

# Protected resource
curl -s $BASE/.well-known/oauth-protected-resource | jq .resource
# Esperado: "https://claude.expertconsulting.es/mcp"

# Landing
curl -sI $BASE/ | grep "content-type"
# Esperado: content-type: text/html; charset=utf-8

# Redirecciones legales
curl -sI $BASE/docs | grep location
# Esperado: https://expertconsulting.es/holded/conectores/claude/docs

# Favicon / branding
curl -sI $BASE/favicon.ico | grep content-type
# Esperado: image/x-icon

curl -sI $BASE/logo.png | grep content-type
# Esperado: image/png

# MCP endpoint requiere auth (no credentials → 401)
curl -s -X POST $BASE/mcp | jq .error
# Esperado: "unauthorized" o "missing_token"
```

---

## 9. Añadir el conector en Claude

1. Ir a [claude.ai](https://claude.ai) → Settings → Connectors.
2. Añadir conector personalizado con URL:
   ```
   https://claude.expertconsulting.es/mcp
   ```
3. Claude descubre automáticamente los metadatos OAuth desde
   `/.well-known/oauth-authorization-server`.
4. Completar la autorización con la API key de Holded.

---

## 10. EXPERT bridge mode (pendiente de activar)

El bridge mode está scaffolded pero **desactivado** por defecto
(`EXPERT_OAUTH_BRIDGE_ENABLED=0`). Cuando estén listos los endpoints EXPERT,
activar con:

```
EXPERT_OAUTH_BRIDGE_ENABLED=1
SESSION_SECRET=<random 32+ chars>
EXPERT_APP_SHARED_SECRET=<random 32+ chars>
```

Ver [docs/bridge-endpoints-holded-claude.md](bridge-endpoints-holded-claude.md)
para los contratos de los endpoints requeridos.
