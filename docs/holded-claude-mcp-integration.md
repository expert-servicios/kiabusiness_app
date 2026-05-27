# Holded Claude MCP Integration

Fecha: 2026-05-27

## Estado actual

Se ha incorporado el conector Claude/Holded como aplicación aislada dentro de:

```text
apps/holded-mcp
```

No vive dentro de `app/` para evitar que Next.js lo compile como rutas públicas del
proyecto EXPERT. La app principal queda aislada y el conector se compila con sus
propias dependencias.

## Qué queda activo

- Servidor MCP remoto para Claude.
- OAuth 2.0 con dynamic client registration y PKCE.
- Validación de API key de Holded antes de emitir código OAuth.
- Tokens persistentes con PostgreSQL si existe `DATABASE_URL`.
- Fallback stateless solo si se habilita explícitamente.
- Páginas públicas EXPERT para landing, documentación, privacidad, DPA, términos y soporte.
- Redirecciones del MCP a las páginas públicas EXPERT.
- Herramientas Holded de lectura y una herramienta de creación de borrador de factura.

## Seguridad

El conector no debe exponer secretos en Git. Los ficheros `.env`, `.env.local` y
`.env.production.local` se mantienen ignorados. Solo se versiona `.env.example`.

La herramienta `create_invoice_draft` fuerza `approveDoc=false`; no emite, envía,
paga, borra ni finaliza facturas. El usuario debe revisar el borrador en Holded.

## Integración EXPERT

Modo actual: standalone.

Flags:

```text
EXPERT_OAUTH_BRIDGE_ENABLED=0
EXPERT_CENTRAL_REGISTRY_ENABLED=0
```

El puente con EXPERT está preparado, pero queda desactivado hasta crear estos
endpoints en la aplicación principal:

```text
/auth/holded-claude
/api/integrations/holded/upsert-from-key
/api/integrations/holded/connection-status
/api/integrations/holded/connector-event
```

Cuando esos endpoints existan, se podrán activar:

```text
EXPERT_OAUTH_BRIDGE_ENABLED=1
EXPERT_CENTRAL_REGISTRY_ENABLED=1
```

## Scripts

Desde la raíz:

```bash
npm run holded-mcp:build
npm run holded-mcp:test
npm run holded-mcp:dev
```

## Validación ejecutada

```text
npm run holded-mcp:build  -> OK
npm run holded-mcp:test   -> OK, 69 tests
npm run typecheck         -> OK
```

Aviso no bloqueante: npm muestra una advertencia de engine porque el conector
declara Node 20.x y el entorno local está usando Node 24. Para despliegue,
mantener Node 20.x.

## Vercel

Proyecto creado en Vercel:

```text
Scope: kiabusiness
Project: expert-holded-mcp
Project ID: prj_CMbPAXYGk4RU92IB2YvMb0DP23t6
Git: https://github.com/expertestudiospro/kiabusiness_app.git
Root Directory: apps/holded-mcp
Node.js: 20.x
Framework: Other
Production URL temporal: https://expert-holded-mcp.vercel.app
Dominio final añadido: https://claude.expertconsulting.es
```

Variables de producción configuradas en Vercel:

```text
BASE_URL
CORS_ALLOWED_ORIGINS
DATABASE_URL
ALLOW_STATELESS_OAUTH_IN_PRODUCTION
OAUTH_JWT_SECRET
OAUTH_DATA_ENCRYPTION_SECRET
OAUTH_AUTH_CODE_TTL_SECONDS
OAUTH_TOKEN_TTL_SECONDS
OAUTH_REFRESH_TOKEN_TTL_SECONDS
OAUTH_CLIENT_ID
OAUTH_CLIENT_SECRET
HOLDED_API_BASE
EXPERT_APP_URL
EXPERT_PUBLIC_URL
EXPERT_OAUTH_BRIDGE_ENABLED
EXPERT_CENTRAL_REGISTRY_ENABLED
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_REQUESTS
LOG_LEVEL
```

No se han documentado valores secretos. Los secretos OAuth de producción se han
generado nuevos para este proyecto.

Deploy de producción:

```text
Estado: READY
Alias temporal: https://expert-holded-mcp.vercel.app
Alias final Vercel: https://claude.expertconsulting.es
Origen: GitHub main
```

Validación remota temporal:

```text
https://expert-holded-mcp.vercel.app/health -> 200
https://expert-holded-mcp.vercel.app/.well-known/oauth-authorization-server -> 200
https://expert-holded-mcp.vercel.app/.well-known/oauth-protected-resource -> 200
https://expert-holded-mcp.vercel.app/docs -> 301 a EXPERT docs
POST https://expert-holded-mcp.vercel.app/oauth/register -> 201
POST https://expert-holded-mcp.vercel.app/mcp sin bearer -> 401
```

El metadata OAuth ya anuncia el dominio final:

```text
issuer=https://claude.expertconsulting.es
authorization_endpoint=https://claude.expertconsulting.es/oauth/authorize
resource=https://claude.expertconsulting.es/mcp
```

### DNS pendiente

Vercel ha añadido `claude.expertconsulting.es`, pero el DNS externo todavía no
resuelve. El proveedor actual usa:

```text
lunar.dns-parking.com
solar.dns-parking.com
```

Acción pendiente en el proveedor DNS:

```text
Tipo: A
Nombre/Host: claude
Valor: 76.76.21.21
TTL: automático o 300
```

Hasta que ese registro propague, `https://claude.expertconsulting.es/health`
no resolverá y Claude no podrá completar el OAuth con el dominio final.

## Páginas públicas añadidas

```text
/holded/conectores/claude
/holded/conectores/claude/docs
/holded/conectores/claude/privacy
/holded/conectores/claude/dpa
/holded/conectores/claude/terms
/holded/conectores/claude/soporte
```

También se han añadido al sitemap.

## Pendiente recomendado

1. Crear el puente de login EXPERT para no pedir API key fuera del portal cuando
   el conector pase a modo totalmente integrado.
2. Crear el registro central de conexión Holded/Claude en EXPERT.
3. Añadir health check productivo del MCP en el panel Kia Health.
4. Configurar `DATABASE_URL`, secretos OAuth y dominio real en el deploy del MCP.
5. Revisar documentos históricos dentro de `apps/holded-mcp` que venían del
   conector original antes de usarlos como documentación pública.
