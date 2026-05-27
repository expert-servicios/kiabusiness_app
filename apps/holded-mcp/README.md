# Holded MCP Server for EXPERT

Remote HTTPS MCP server for connecting Claude to a user's own Holded account.

- Public base URL: `https://claude.expertconsulting.es`
- MCP endpoint: `https://claude.expertconsulting.es/mcp`
- OAuth metadata: `https://claude.expertconsulting.es/.well-known/oauth-authorization-server`
- Public landing: `https://expertconsulting.es/holded/conectores/claude`
- Public docs: `https://expertconsulting.es/holded/conectores/claude/docs`
- Privacy: `https://expertconsulting.es/holded/conectores/claude/privacy`
- DPA: `https://expertconsulting.es/holded/conectores/claude/dpa`
- Terms: `https://expertconsulting.es/holded/conectores/claude/terms`
- Support: `https://expertconsulting.es/holded/conectores/claude/soporte`

The MCP server exposes `/docs`, `/privacy`, `/dpa`, `/terms`, `/support` and
`/soporte` as redirects to the canonical EXPERT public pages.

## Status

Current EXPERT integration mode is standalone:

- Claude uses OAuth 2.0 against this MCP server.
- The user provides their Holded API key in the connector authorization screen.
- The server validates the API key against Holded before issuing an OAuth code.
- Tokens are stored in PostgreSQL when `DATABASE_URL` exists.
- If no database exists, the server can use stateless OAuth only when explicitly allowed.

Future EXPERT bridge mode is already scaffolded but disabled by default:

- `EXPERT_OAUTH_BRIDGE_ENABLED=1` will route authorization through EXPERT auth.
- `EXPERT_CENTRAL_REGISTRY_ENABLED=1` will register the connection in EXPERT.
- Required future endpoints:
  - `/auth/holded-claude`
  - `/api/integrations/holded/upsert-from-key`
  - `/api/integrations/holded/connection-status`
  - `/api/integrations/holded/connector-event`

## Safety Scope

Most tools are read-only. The only write-capable tool is `create_invoice_draft`.
It creates a draft invoice only and forces `approveDoc=false` server-side.

The connector does not expose:

- invoice deletion
- invoice issuing/finalization
- payment execution
- money movement
- destructive accounting changes
- cross-service automation

## Public Surface

Runtime endpoints:

- `GET /health`
- `GET /.well-known/oauth-authorization-server`
- `GET /.well-known/oauth-protected-resource`
- `GET /docs`
- `GET /privacy`
- `GET /dpa`
- `GET /terms`
- `GET /support`
- `GET /soporte`
- `GET|POST /oauth/authorize`
- `POST /oauth/register`
- `POST /oauth/token`
- `POST /oauth/revoke`
- `POST /mcp`

## Tools

Read-only tools:

- `list_documents`
- `get_document`
- `get_document_pdf`
- `list_contacts`
- `get_contact`
- `list_crm_funnels`
- `list_leads`
- `list_products`
- `get_product`
- `list_products_stock`
- `list_warehouses`
- `list_taxes`
- `list_numbering_series`
- `list_projects`
- `get_project`
- `list_project_tasks`
- `list_time_records`
- `get_chart_of_accounts`
- `get_journal`
- `get_daily_book`
- `list_employees`
- `get_employee`
- `list_treasury_accounts`

Write-capable tool:

- `create_invoice_draft`

## Environment

Copy `.env.example` to `.env` for local development. Never commit `.env` files.

Important variables:

| Variable | Description |
| --- | --- |
| `BASE_URL` | Canonical public base URL for this MCP server |
| `DATABASE_URL` | PostgreSQL URL for persistent OAuth state |
| `OAUTH_JWT_SECRET` | Signing secret for OAuth artifacts |
| `OAUTH_DATA_ENCRYPTION_SECRET` | Encryption secret for stored Holded API keys |
| `OAUTH_CLIENT_ID` | Static compatibility client ID |
| `OAUTH_CLIENT_SECRET` | Static compatibility client secret |
| `HOLDED_API_BASE` | Holded API base URL |
| `EXPERT_APP_URL` | EXPERT app/backend URL for future registry calls |
| `EXPERT_PUBLIC_URL` | EXPERT public website URL |
| `EXPERT_OAUTH_BRIDGE_ENABLED` | Enable EXPERT auth bridge |
| `EXPERT_CENTRAL_REGISTRY_ENABLED` | Enable EXPERT connection registry |
| `EXPERT_APP_SHARED_SECRET` | Shared secret for EXPERT server-to-server calls |
| `SESSION_SECRET` | Bridge cookie secret when EXPERT auth bridge is enabled |

## Local Development

```bash
cd apps/holded-mcp
npm install
cp .env.example .env
npm run dev
```

Root workspace scripts:

```bash
npm run holded-mcp:build
npm run holded-mcp:test
npm run holded-mcp:dev
```

## Claude Setup

1. Open Claude settings and add a custom connector.
2. Use `https://claude.expertconsulting.es/mcp`.
3. Let Claude discover OAuth metadata automatically.
4. Complete authorization with the user's Holded API key.

## Validation

Current automated coverage includes:

- canonical OAuth metadata URLs
- CORS for Claude origins
- unauthenticated/invalid auth failures
- dynamic client registration
- token exchange and revocation
- standalone OAuth mode
- EXPERT bridge/central registry mode
- invalid Holded API key failure paths
- exact tool surface
- read/write tool safety annotations
- draft-only invoice creation
- Holded API URL and error handling regressions

Run:

```bash
npm run holded-mcp:build
npm run holded-mcp:test
```

## Deployment Checklist

- `BASE_URL=https://claude.expertconsulting.es`
- real `DATABASE_URL`
- real `OAUTH_JWT_SECRET`
- real `OAUTH_DATA_ENCRYPTION_SECRET`
- real `OAUTH_CLIENT_SECRET`
- `EXPERT_OAUTH_BRIDGE_ENABLED=0` until EXPERT bridge endpoints exist
- `EXPERT_CENTRAL_REGISTRY_ENABLED=0` until EXPERT registry endpoints exist

After deploy:

- verify `GET /health`
- verify `GET /.well-known/oauth-authorization-server`
- verify `GET /.well-known/oauth-protected-resource`
- verify `GET /docs` redirects to EXPERT docs
- add the connector in Claude with `/mcp`
