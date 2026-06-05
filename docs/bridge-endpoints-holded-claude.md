# Bridge endpoints — Holded Claude connector

Contratos de los endpoints que la app principal de EXPERT (`expertconsulting.es`)
debe exponer para activar el "EXPERT bridge mode" del conector Holded para Claude.

El bridge mode está **actualmente desactivado** (`EXPERT_OAUTH_BRIDGE_ENABLED=0`).
Este documento describe los contratos esperados para cuando se active.

---

## Autenticación server-to-server

Todas las llamadas del MCP server a la app EXPERT llevan el header:

```
x-expert-shared-secret: <valor de EXPERT_APP_SHARED_SECRET>
```

La app EXPERT debe validar este header en cada endpoint. Si no coincide,
responder `401 Unauthorized`.

---

## 1. GET /api/integrations/holded/connection-status

Consulta si un usuario tiene una conexión Holded activa en un canal dado.
Lo usa el MCP server en `isClaudeConnectionActive()` durante el flujo OAuth
para decidir si forzar re-login.

**Activado cuando:** `EXPERT_CENTRAL_REGISTRY_ENABLED=1`

### Request

```
GET /api/integrations/holded/connection-status?userId=<uid>&channel=claude
x-expert-shared-secret: <secret>
Accept: application/json
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `userId` | string | User.id de EXPERT (UUID o hash sha256 legacy) |
| `channel` | string | Siempre `claude` desde este conector |

### Response

```json
{ "ok": true, "active": true }
```

| Campo | Tipo | Descripción |
|---|---|---|
| `ok` | boolean | `true` si la consulta fue exitosa |
| `active` | boolean | `true` si hay una `ExternalConnection` con `status=connected` para ese usuario y canal |

**Errores:**

- `401` — shared secret inválido
- `400` — userId o channel faltantes
- `500` — error interno (el MCP server asume `active=true` si falla, para no bloquear el flujo)

---

## 2. POST /api/integrations/holded/upsert-from-key

Crea o actualiza el grafo `User → Tenant → Membership → ExternalConnection`
cuando el usuario introduce su API key de Holded en el consent screen OAuth.

**Activado cuando:** `EXPERT_CENTRAL_REGISTRY_ENABLED=1`

### Request

```
POST /api/integrations/holded/upsert-from-key
Content-Type: application/json
x-expert-shared-secret: <secret>
```

```json
{
  "personalEmail": "usuario@empresa.com",
  "holdedApiKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "channel": "claude",
  "source": "claude_consent_screen",
  "acceptedTerms": true,
  "acceptedPrivacy": true
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `personalEmail` | string | Email verificado del usuario |
| `holdedApiKey` | string | API key de Holded (32 hex chars) |
| `channel` | string | Siempre `claude` desde este conector |
| `source` | string | `claude_consent_screen` (identificación del origen) |
| `acceptedTerms` | boolean | El usuario aceptó los términos de uso |
| `acceptedPrivacy` | boolean | El usuario aceptó la política de privacidad |

### Response — éxito

```json
{
  "ok": true,
  "userId": "user-uuid-...",
  "tenantId": "tenant-uuid-...",
  "connectionId": "connection-uuid-...",
  "status": "connected",
  "legalAcceptedAt": "2026-06-05T12:00:00.000Z"
}
```

### Response — error

```json
{
  "ok": false,
  "stage": "probe",
  "reason": "invalid_api_key",
  "detail": "La API key no es válida o ha expirado"
}
```

Razones de error reconocidas por el MCP server:

| `reason` | HTTP status | Descripción |
|---|---|---|
| `invalid_personal_email` | 400 | Email con formato inválido |
| `missing_api_key` | 400 | API key no enviada |
| `legal_acceptance_required` | 400 | `acceptedTerms` o `acceptedPrivacy` es `false` |
| `invalid_channel` | 400 | Canal no reconocido |
| `invalid_api_key` | 400 | API key rechazada por Holded |
| `probe_failed` | 503 | No se pudo contactar con Holded |
| `persist_failed` | 500 | Error guardando en BD |
| `central_registry_unavailable` | 503 | El registry EXPERT no está disponible |

---

## 3. POST /api/integrations/holded/connector-event

Recibe eventos del ciclo de vida de la conexión Holded-Claude: primera
actividad, revocación por el usuario, etc.

**Activado cuando:** `EXPERT_CENTRAL_REGISTRY_ENABLED=1` o
`EXPERT_OAUTH_BRIDGE_ENABLED=1` (según el evento).

### Request

```
POST /api/integrations/holded/connector-event
Content-Type: application/json
x-expert-shared-secret: <secret>
```

```json
{
  "type": "revoked_by_user",
  "channel": "claude",
  "userId": "user-uuid-..."
}
```

```json
{
  "type": "first_activity",
  "channel": "claude",
  "userId": "user-uuid-...",
  "toolUsed": "list_documents"
}
```

| Tipo de evento | Descripción | Acción esperada en EXPERT |
|---|---|---|
| `revoked_by_user` | El usuario revocó el token desde Claude | Marcar `ExternalConnection` como `disconnected`; enviar email de despedida |
| `first_activity` | Primera llamada MCP tras la autorización | Registrar fecha de primera actividad; enviar email de bienvenida si aplica |

### Response

```json
{ "ok": true }
```

El MCP server dispara estos eventos como **fire-and-forget** — si el endpoint
falla, no interrumpe el flujo del usuario.

---

## 4. GET /auth/holded-claude (EXPERT_OAUTH_BRIDGE_ENABLED)

Pantalla de autenticación de EXPERT que el MCP server redirige cuando
`EXPERT_OAUTH_BRIDGE_ENABLED=1`. El usuario completa aquí el login (Google
OAuth o magic link) y la API key de Holded.

**Activado cuando:** `EXPERT_OAUTH_BRIDGE_ENABLED=1`

### Flujo completo con bridge

```
1. Claude → GET /oauth/authorize?client_id=...&redirect_uri=...&state=...
2. MCP server → 302 → /auth/holded-claude?source=holded_claude_entry&next=<authorize-url>
3. Usuario completa login + API key en EXPERT
4. /api/auth/holded-claude (EXPERT wrapper) llama a upsert-from-key (endpoint 2)
5. EXPERT wrapper mintea handoff JWT firmado con EXPERT_APP_SHARED_SECRET:
     { client_id, redirect_uri, state, scope, code_challenge, uid, tid, em, hak }
     audience: "holded-oauth-handoff"
     issuer: "holded-claude-wrapper"
     TTL: 60s
6. EXPERT → 302 → /oauth/finalize-from-form?handoff=<jwt>
7. MCP server verifica JWT, mintea authorization code, 302 → redirect_uri?code=...
```

### Query params que recibe /auth/holded-claude

| Parámetro | Descripción |
|---|---|
| `source` | `holded_claude_entry` o `holded_claude_post_revoke` |
| `next` | URL completa del authorize endpoint al que volver |

### Handoff JWT payload (que EXPERT debe generar)

```json
{
  "client_id": "holded-mcp-uuid-...",
  "redirect_uri": "https://claude.ai/oauth/callback",
  "state": "opaque-state",
  "scope": "holded:read holded:write",
  "code_challenge": "base64url-challenge",
  "code_challenge_method": "S256",
  "uid": "user-uuid-...",
  "tid": "tenant-uuid-...",
  "em": "usuario@empresa.com",
  "hak": "api-key-de-holded"
}
```

El JWT debe estar firmado con HS256 usando `EXPERT_APP_SHARED_SECRET`, con
`audience: "holded-oauth-handoff"` y `issuer: "holded-claude-wrapper"`.

---

## 5. Control de acceso — entitlement por plan

Cuando se activa el bridge, EXPERT puede controlar el acceso al conector según
el plan del tenant antes de emitir el handoff JWT.

### Lógica recomendada en /api/auth/holded-claude

```typescript
// Pseudo-código
const tenant = await getTenantByUserId(session.uid);

if (tenant.subscription_status !== 'active') {
  // Redirigir a página de upgrade en lugar de emitir handoff
  return redirect('/pricing?feature=holded-claude-connector');
}

// Si el plan es activo, continuar con el upsert-from-key y emitir handoff
```

### Integración con Stripe (si ya existe)

Si el proyecto ya tiene suscripciones en Stripe, el campo `subscription_status`
puede derivarse de `subscriptions.status = 'active'` en la tabla de Stripe
(o equivalente en Supabase).

Campos relevantes según el modelo de datos actual del proyecto:

- Tabla `subscriptions` (si existe): `status`, `plan_id`, `tenant_id`
- Tabla `orders`: `status`, `tenant_id`
- Tabla `manual_payments`: `status`, `case_id` (para pagos fuera de Stripe)

### Respuesta al usuario si no tiene plan

No bloquear en el servidor MCP directamente — hacerlo en el formulario EXPERT
antes de emitir el handoff JWT. El mensaje de bloqueo debe:

1. Explicar que el conector Holded para Claude requiere un plan activo.
2. Ofrecer un CTA directo a `/pricing` o al equipo de ventas.
3. No revelar detalles técnicos del JWT ni del flujo OAuth.

---

## Variables de entorno del MCP server requeridas para bridge

```
EXPERT_OAUTH_BRIDGE_ENABLED=1
EXPERT_CENTRAL_REGISTRY_ENABLED=1
EXPERT_APP_URL=https://expertconsulting.es
EXPERT_PUBLIC_URL=https://expertconsulting.es
EXPERT_APP_SHARED_SECRET=<mismo valor que usa EXPERT para firmar handoff JWTs>
SESSION_SECRET=<secreto para verificar cookie __session en el MCP server>
```
