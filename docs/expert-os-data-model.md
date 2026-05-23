# EXPERT OS — Data Model

> Última actualización: 2026-05-23  
> Fuente de verdad: migraciones en `supabase/migrations/`

## Entidades principales

```
profiles ──── profile_companies ──── companies
    │                                     │
    ├── leads                             ├── client_integrations (Holded)
    ├── cases ──── internal_tasks         ├── holded_sync_jobs
    │       └──── document_classifications│
    │                                     └── kia_reports
    ├── kia_sessions
    ├── kia_cart_items
    ├── whatsapp_conversations
    ├── email_threads
    ├── next_best_actions
    └── service_profitability_events
```

---

## Tabla: `profiles`

Perfil extendido del usuario auth. Campos clave para EXPERT OS:

```sql
id               uuid PK
full_name        text
phone            text
email            text
role             text  -- client | admin | staff | owner
client_type      text  -- particular | empresa | autonomo
company          text  -- nombre empresa si tiene
tax_id           text  -- NIF/CIF
address          text
city             text
postal_code      text
province         text
billing_country  text
habitual_address text
has_monthly_plan boolean default false
plan_id          text nullable
profile_completed boolean default false
billing_ready     boolean default false
habitual_address_ready boolean default false
active_company_id uuid nullable → companies
```

**Regla:** `has_monthly_plan = true` requiere `client_integrations` con provider='holded' y status='active'.

---

## Tabla: `cases` (expedientes)

```sql
id                    uuid PK
client_id             uuid FK → profiles
company_id            uuid nullable FK → companies
service_id            text  -- svc_irpf, svc_alta_autonomo, etc.
service_name          text
category              text  -- declaraciones-impuestos, extranjeria-nacionalidad, etc.
status                text  -- ver case-status-workflow.md
assigned_to           uuid nullable FK → profiles  -- default: Ksenia
due_date              date nullable
priority              text  -- baja | media | alta | critica
checklist_json        jsonb default '[]'
missing_documents_json jsonb default '[]'
received_documents_json jsonb default '[]'
next_action           text nullable
source                text  -- checkout | presupuesto | admin_manual | kia
payment_id            text nullable  -- Stripe payment/subscription ID
holded_invoice_id     text nullable  -- solo si cliente mensual
created_at            timestamptz
updated_at            timestamptz
```

**RLS:** Cliente ve sus propios casos. Admin ve todos.

---

## Tabla: `internal_tasks`

```sql
id           uuid PK
case_id      uuid nullable FK → cases
client_id    uuid nullable FK → profiles
company_id   uuid nullable FK → companies
assigned_to  uuid nullable FK → profiles  -- default: DEFAULT_ADMIN_USER_ID (Ksenia)
title        text not null
description  text nullable
status       text  -- pendiente | en_progreso | completada | cancelada
priority     text  -- baja | media | alta | critica
due_date     date nullable
source       text  -- kia | admin | document | fiscal_calendar | anomaly | system
metadata     jsonb default '{}'
created_at   timestamptz
updated_at   timestamptz
```

**Regla:** `assigned_to` usa `DEFAULT_ADMIN_USER_ID` de config. No hardcodeado en lógica de negocio.

---

## Tabla: `document_classifications`

```sql
id                       uuid PK
document_id              uuid nullable  -- referencia a files/user_files
client_id                uuid nullable FK → profiles
company_id               uuid nullable FK → companies
case_id                  uuid nullable FK → cases
source                   text  -- whatsapp | gmail | portal | drive | admin_upload
original_filename        text
storage_path             text
detected_type            text  -- ver tipos en document-classification-flow.md
detected_subtype         text nullable
confidence               numeric(4,3)  -- 0.000 a 1.000
suggested_case_id        uuid nullable FK → cases
suggested_checklist_item_id text nullable
extracted_data           jsonb default '{}'
status                   text default 'classified'  -- classified | needs_review | corrected | rejected
reviewed_by              uuid nullable FK → profiles
reviewed_at              timestamptz nullable
created_at               timestamptz
updated_at               timestamptz
```

---

## Tabla: `next_best_actions`

```sql
id          uuid PK
scope       text  -- admin | client | case | lead | company
client_id   uuid nullable FK → profiles
company_id  uuid nullable FK → companies
case_id     uuid nullable FK → cases
lead_id     uuid nullable FK → leads
action_type text  -- reply_message | request_document | review_document |
                  -- send_checkout | complete_profile | connect_holded |
                  -- review_anomaly | prepare_tax_summary | schedule_call |
                  -- close_case | review_profitability
title       text
description text
priority    text  -- baja | media | alta | critica
status      text default 'open'  -- open | done | dismissed
due_at      timestamptz nullable
metadata    jsonb default '{}'
created_at  timestamptz
updated_at  timestamptz
```

**Ordenación en Panel Gerente:** priority → due_at → impacto económico → antigüedad.

---

## Tabla: `service_profitability_events`

```sql
id               uuid PK
case_id          uuid nullable FK → cases
service_id       text nullable
client_id        uuid nullable FK → profiles
company_id       uuid nullable FK → companies
event_type       text  -- whatsapp_message | gmail_message | document_received |
                       -- document_classified | document_reviewed | call_scheduled |
                       -- call_completed | task_created | task_completed |
                       -- status_changed | payment_received | anomaly_reviewed | admin_note
estimated_minutes numeric(8,2)
cost_rate        numeric(8,4) nullable  -- €/min futuro
revenue_amount   numeric(10,2) nullable
metadata         jsonb default '{}'
created_at       timestamptz
```

---

## Tabla: `service_profitability_snapshots`

```sql
id                     uuid PK
case_id                uuid FK → cases
service_id             text
client_id              uuid FK → profiles
revenue_total          numeric(10,2) default 0
estimated_minutes_total numeric(10,2) default 0
estimated_cost_total   numeric(10,2) default 0
estimated_margin       numeric(10,2) default 0
activity_count         integer default 0
documents_count        integer default 0
messages_count         integer default 0
calls_count            integer default 0
tasks_count            integer default 0
margin_status          text  -- rentable | ajustado | no_rentable | revisar_precio
generated_at           timestamptz
created_at             timestamptz
updated_at             timestamptz
```

---

## Tabla: `client_integrations` (existente, extendida)

```sql
-- Campos relevantes para Holded:
provider            text  -- 'holded'
mode                text  -- 'client_account'
encrypted_api_key   text  -- AES-256-GCM, nunca en frontend
api_key_last4       text
permissions_detected jsonb
status              text  -- active | pending | failed | disabled | revoked
sync_mode           text  -- read_only | read_write
connected_by        uuid FK → profiles
company_id          uuid nullable FK → companies
client_id           uuid nullable FK → profiles
last_sync_at        timestamptz
last_success_at     timestamptz
last_error          text nullable
```

**Regla de negocio crítica:** Un cliente con `has_monthly_plan = true` debe tener exactamente una `client_integrations` con `provider='holded'` y `status='active'`. Sin ella, el checkout de plan mensual queda bloqueado.

---

## Tabla: `kia_cart_items` (existente)

```sql
id              uuid PK
phone_number    text
lead_id         uuid nullable FK → leads
client_id       uuid nullable FK → profiles
service_id      text
service_label   text
service_area    text
stripe_price_id text nullable
expires_at      timestamptz  -- now() + 48h
created_at      timestamptz
```

---

## Tabla: `kia_reports` (existente)

```sql
id               uuid PK
phone_number     text
lead_id          uuid nullable
client_id        uuid nullable
service_id       text
service_label    text
service_area     text
viabilidad       text  -- alta | media | baja | no_viable
documentos       jsonb
riesgo           text
precio_catalogo  numeric(10,2) nullable
siguientes_pasos text
precal_data      jsonb
perfil_data      jsonb
generated_by     text  -- kia | admin | system
lang             text  -- es | ru
viewed_at        timestamptz nullable
created_at       timestamptz
updated_at       timestamptz
```

---

## Convenciones globales

| Convención | Valor |
|-----------|-------|
| PK | `uuid` con `gen_random_uuid()` |
| Timestamps | `timestamptz not null default now()` |
| Soft delete | `deleted_at timestamptz nullable` (cuando aplica) |
| RLS | Siempre activado. `service_role` tiene acceso total. |
| Encrypted fields | Prefix `encrypted_` en nombre de columna |
| Status fields | `text` con CHECK constraint, nunca enum (migraciones más simples) |
| Foreign keys | `on delete set null` por defecto, `on delete cascade` solo en casos explícitos |
