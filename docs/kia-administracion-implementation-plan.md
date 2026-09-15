# KIA Administración — plan completo de implementación

Fecha: 2026-09-15
Estado: roadmap propuesto

## 1. Objetivo de producto

Convertir EXPERT en una **asesoría inteligente por suscripción** donde KIA no sólo informe, sino que pueda preparar y ejecutar gestiones administrativas supervisadas, manteniendo el control humano sobre cualquier acción con efectos jurídicos o económicos.

Objetivo de experiencia:

> El cliente o profesional pide una gestión a KIA, KIA prepara el expediente, valida datos, ejecuta los pasos técnicos permitidos y se detiene en los checkpoints humanos. Tras la autorización, completa la actuación, verifica la evidencia y actualiza EXPERT.

---

## 2. Arquitectura objetivo

```text
KIA Experience
   │
KIA 2.0 Orchestrator
   │
Context + Memory + Policy
   │
Administrative Action Service
   │
Approval Service
   │
Command Broker
   │
EXPERT Local Connector
   │
Browser Sandbox
   │
Computer Use / deterministic browser automation
   │
Administración Pública
   │
Evidence Verifier
   │
EXPERT case + documents + audit
```

---

## 3. State machine administrativa

Tabla principal futura: `administrative_actions`.

Estados propuestos:

```text
draft
  ↓
prepared
  ↓
needs_review
  ↓
approved
  ↓
queued
  ↓
claimed
  ↓
running
  ↓
awaiting_user_auth
  ↓
running
  ↓
awaiting_final_approval
  ↓
running
  ↓
verifying
  ↓
completed
```

Estados alternativos:

- `blocked`;
- `cancelled`;
- `failed_safe`;
- `expired`;
- `manual_takeover`.

Nunca modelar una presentación jurídica como un único POST síncrono.

---

## 4. Modelo de datos nuevo

### 4.1 `administrative_actions`

Campos mínimos:

- id;
- tenant_id;
- client_id;
- company_id;
- case_id;
- organism;
- workflow_key;
- workflow_version;
- action_type;
- status;
- risk_tier;
- requested_by;
- prepared_by;
- representation_type;
- representation_id;
- target_period;
- data_snapshot jsonb;
- data_snapshot_hash;
- idempotency_key;
- claimed_by_device_id;
- approval_required;
- approval_id;
- result_summary;
- created_at;
- updated_at;
- expires_at.

### 4.2 `administrative_action_events`

Append-only ledger:

- id;
- action_id;
- sequence;
- event_type;
- actor_type;
- actor_id;
- provider;
- model;
- device_id;
- input_hash;
- output_hash;
- metadata;
- created_at.

### 4.3 `administrative_approvals`

- id;
- action_id;
- user_id;
- approval_scope;
- snapshot_hash;
- token_hash;
- expires_at;
- approved_at;
- consumed_at;
- revoked_at;
- ip/user agent opcional según política.

El token en claro no se persiste.

### 4.4 `connector_devices`

- id;
- tenant_id;
- owner_user_id;
- label;
- platform;
- public_key;
- status;
- last_seen_at;
- paired_at;
- revoked_at;
- capabilities;
- connector_version.

### 4.5 `connector_commands`

- id;
- action_id;
- device_id;
- command_type;
- encrypted_payload;
- status;
- idempotency_key;
- claimed_at;
- completed_at;
- result_metadata.

### 4.6 `administrative_evidence`

- id;
- action_id;
- evidence_type;
- storage_path;
- sha256;
- csv;
- nrc;
- receipt_number;
- filing_timestamp;
- organism;
- verified;
- verification_method;
- created_at.

### 4.7 `representations`

Registro operativo, no sustituto del registro oficial:

- client/company subject;
- representative user/entity;
- type: titular / representative / social_collaborator / delegated_collaborator / power_of_attorney / other;
- organism;
- scope;
- reference;
- valid_from;
- valid_until;
- verification_status;
- evidence_document_id.

---

## 5. Plan capabilities

Crear catálogo versionado de capacidades.

Ejemplo:

| capability | Guidance | Assisted | Operative | Professional |
|---|---:|---:|---:|---:|
| `kia_chat` | ✓ | ✓ | ✓ | ✓ |
| `kia_official_research` | ✓ | ✓ | ✓ | ✓ |
| `kia_client_data_read` |  | ✓ | ✓ | ✓ |
| `kia_admin_prepare` |  | ✓ | ✓ | ✓ |
| `kia_admin_read` |  |  | ✓ | ✓ |
| `kia_admin_submit_supervised` |  |  | ✓ | ✓ |
| `kia_batch_prepare` |  |  |  | ✓ |
| `kia_multi_client_operator` |  |  |  | ✓ |

La correspondencia exacta con los planes comerciales actuales se decidirá en sprint comercial. No duplicar productos Stripe por cada capability.

---

## 6. Local Connector

Ruta propuesta:

`apps/expert-local-connector/`

### Responsabilidades

- pairing con cuenta EXPERT;
- mantener conexión saliente segura;
- recibir comandos autorizados;
- abrir browser sandbox;
- ejecutar navegador;
- detectar prompts de certificado/autenticación;
- solicitar intervención local;
- devolver observaciones/resultados;
- descargar evidencia;
- cifrar payloads sensibles en tránsito;
- auto-update firmado futuro.

### No responsabilidades

- guardar `.pfx/.p12`;
- conocer password del certificado;
- exportar clave privada;
- recibir secretos por chat;
- navegar fuera de allowlist;
- ejecutar comandos shell arbitrarios;
- leer archivos personales arbitrarios.

### Tecnología a evaluar

MVP Windows:

- Tauri o Electron para shell;
- Playwright/Chromium para browser control;
- WebSocket saliente o long polling seguro;
- claves de dispositivo generadas localmente;
- Windows Certificate Store / selección nativa por browser.

La elección Tauri vs Electron se hará mediante spike técnico. Prioridades: seguridad, auto-update, Playwright compatibility y coste de mantenimiento.

---

## 7. Browser execution strategy

No usar un único enfoque.

### Nivel A — deterministic browser automation

Preferido para:

- selectores estables;
- formularios conocidos;
- downloads;
- navegación rutinaria.

Ventajas:

- barato;
- testeable;
- reproducible;
- menos alucinación.

### Nivel B — Computer Use

Usar cuando:

- cambia DOM/interfaz;
- hay componentes visuales difíciles;
- selector determinista falla;
- navegación requiere interpretación visual.

### Nivel C — human takeover

Activar cuando:

- captcha;
- firma/autenticación no automatizable;
- duda de identidad;
- resultado inesperado;
- riesgo R4/R5 sin evidencia suficiente.

---

## 8. Approval model

### Checkpoint 1 — autenticación

El usuario selecciona localmente certificado/Cl@ve cuando el organismo lo requiere.

### Checkpoint 2 — acción jurídica

Antes de firmar/enviar:

EXPERT muestra:

- sujeto;
- NIF;
- organismo;
- modelo/trámite;
- periodo;
- principales importes;
- efecto esperado;
- documentos;
- warnings;
- hash de snapshot.

El usuario pulsa **Autorizar**.

Backend genera approval one-time.

Si cualquier dato del snapshot cambia, la aprobación deja de ser válida.

### Checkpoint 3 — evidencia

Tras enviar, KIA no marca `presentado` hasta verificar justificante/CSV/NRC/recibo equivalente.

---

## 9. Organism Adapter Registry

Cada organismo tiene adapter versionado.

Interfaz conceptual:

```ts
interface OrganismAdapter {
  key: string;
  allowedDomains: string[];
  workflows: WorkflowDefinition[];
  detectAuthenticationState(...): ...;
  verifyEvidence(...): ...;
}
```

Primera secuencia:

1. AEAT;
2. DEHú;
3. Importass/TGSS lectura;
4. TGSS acciones supervisadas;
5. SEPE;
6. GVA/SUMA;
7. CIRCE/PAE;
8. DGT;
9. otros.

No desarrollar todos simultáneamente.

---

## 10. Primeros workflows AEAT

### AEAT-001 — abrir sede y verificar identidad

Read-only.

Objetivo:

- emparejar connector;
- abrir sede;
- usuario selecciona certificado;
- confirmar que sesión está autenticada;
- cerrar sin cambios.

### AEAT-002 — consultar Mis expedientes

- localizar expediente indicado;
- extraer estado;
- devolver metadata;
- ninguna modificación.

### AEAT-003 — descargar justificante existente

- localizar declaración ya presentada;
- descargar PDF;
- hash;
- guardar en expediente;
- registrar evidence.

### AEAT-004 — consultar notificaciones

Inicialmente lectura solamente.

### AEAT-005 — cumplimentar borrador sin enviar

- preparar formulario;
- comparar importes;
- detener antes de firma.

### AEAT-006 — presentación supervisada

Sólo cuando 001-005 sean estables.

---

## 11. KIA 2.0 migration plan

### KIA-M0 — inventario y freeze

- declarar `/api/ai/kia` endpoint canónico;
- congelar crecimiento de `/api/kia/copilot`;
- mapear todas las tools actuales;
- clasificar read/write/risk;
- inventariar prompts y knowledge duplicados.

### KIA-M1 — capability router

Crear interfaces internas:

- reasoning;
- search;
- retrieval;
- code execution;
- computer use;
- long-running agent;
- MCP.

### KIA-M2 — OpenAI Responses adapter

- implementar sin retirar router actual;
- migrar 1-2 task types no críticos;
- logging comparable;
- shadow evaluation.

### KIA-M3 — Anthropic modern adapter

- normalizar tools/usage/results;
- mantener Messages;
- preparar computer use/MCP según disponibilidad.

### KIA-M4 — Tool Registry + policy

- registry canónico;
- risk tiers;
- roles;
- plan capability;
- human approval metadata;
- kill switches.

### KIA-M5 — Memory v2

- scopes;
- provenance;
- versioning;
- invalidation;
- privacy.

### KIA-M6 — Skills

- formato EXPERT Skill;
- loader;
- version registry;
- tests;
- primeros skills administrativos.

### KIA-M7 — Agent Orchestrator

- planner;
- task graph;
- subagents lógicos;
- verifier;
- escalation.

### KIA-M8 — eval platform

- provider comparisons;
- regression suites;
- shadow/canary;
- cost/latency dashboards.

---

## 12. KIA Administración roadmap

### KADM-0 — saneamiento previo

- resolver duplicidad Copilot;
- resolver Holded pre/post checkout;
- definir plan capabilities;
- auditar `cases.state` vs `cases.status`;
- ampliar redaction.

### KADM-1 — dominio y migraciones

- tablas nuevas;
- RLS;
- policies;
- índices;
- idempotency;
- append-only event semantics.

Regla: DDL mediante migraciones y Security Advisor después.

### KADM-2 — APIs administrativas sin ejecución

- crear action;
- preparar snapshot;
- revisar;
- aprobar;
- cancelar;
- consultar status/evidence.

Todavía sin browser.

### KADM-3 — Local Connector skeleton

- app;
- pairing;
- device key;
- health/heartbeat;
- revocation;
- command receive/ack.

### KADM-4 — Browser sandbox read-only

- allowlist;
- AEAT launch;
- browser lifecycle;
- screenshots temporales;
- manual authentication checkpoint.

### KADM-5 — AEAT read-only MVP

Workflows AEAT-001 a AEAT-003.

Objetivo de aceptación:

`KIA → EXPERT → Local Connector → AEAT → documento → EXPERT`

sin mutar nada en AEAT.

### KADM-6 — Computer Use adapter

- OpenAI Computer Use;
- fallback/experiment Anthropic Computer Use;
- observation normalization;
- safety boundaries;
- visual regression tests.

### KADM-7 — preparación de formularios

AEAT-005.

- datos desde EXPERT/Holded;
- comparación doble;
- snapshot;
- stop antes de firma.

### KADM-8 — supervised submit

AEAT-006.

- approval one-time;
- submit;
- evidence;
- idempotency;
- cambio de case status.

### KADM-9 — notificaciones y DEHú

- lectura;
- clasificación;
- creación de expediente/NBA;
- deadlines.

### KADM-10 — segunda Administración

Importass/TGSS con read-only primero.

### KADM-11 — cliente final

- instalación guiada;
- onboarding connector;
- capabilities por suscripción;
- Guided Mode.

### KADM-12 — Professional Operator

- cola multi-cliente;
- preparación batch;
- filtros;
- aprobaciones;
- evidencias;
- auditoría.

### KADM-13 — multi-tenant B2B

- tenant policies;
- connector por despacho;
- operadores;
- branding;
- billing SaaS futuro.

---

## 13. Testing obligatorio

### Unit

- schemas;
- state transitions;
- policy;
- entitlement resolution;
- approval snapshot;
- idempotency.

### Integration

- action lifecycle;
- pairing;
- command broker;
- evidence storage;
- case transition.

### Browser fixtures

Crear páginas fixture que simulen:

- login;
- certificado prompt abstracto;
- formulario;
- error;
- confirmación;
- justificante.

No depender de AEAT real en CI.

### Canary real

Sólo cuentas/testers autorizados.

Orden:

1. read-only;
2. download;
3. fill-only;
4. submit sandbox/test si organismo lo permite;
5. real con supervisión interna.

---

## 14. Seguridad

### Kill switches

- global KIA agent tools;
- computer use;
- Local Connector;
- por organismo;
- por workflow;
- por tenant;
- por plan capability;
- submissions.

### Protección contra prompt injection

Todo contenido de páginas externas se considera datos no confiables.

El agente no debe obedecer instrucciones encontradas en una web que alteren sus reglas, pidan secretos o amplíen permisos.

### Domain isolation

Cada workflow define dominios exactos.

Redirección fuera de allowlist ⇒ abort.

### Sensitive UI

No enviar screenshots que contengan secretos cuando puedan evitarse.

El connector debe poder cubrir/recortar regiones sensibles antes de transmitir observaciones.

---

## 15. Evidence verifier

La verificación debe combinar:

- URL/domain;
- contenido del justificante;
- NIF;
- modelo/trámite;
- periodo;
- timestamp;
- importe;
- CSV/NRC/receipt id;
- hash del fichero.

Si no se puede verificar suficientemente:

`manual_takeover`, no `completed`.

---

## 16. UX cliente

Ejemplo futuro:

**KIA:** He preparado tu Modelo 303 de 3T 2026.

- IVA repercutido: …
- IVA deducible: …
- Resultado: …
- 1 aviso pendiente de revisión.

`[Revisar]`

Tras resolver:

`[Abrir AEAT y preparar presentación]`

Connector:

> Selecciona tu certificado en la ventana del navegador.

KIA completa hasta firma.

EXPERT:

> Vas a presentar Modelo 303 — 3T 2026 por X EUR.

`[Autorizar presentación]`

Después:

> Presentado correctamente. CSV X. Justificante guardado en tu expediente.

---

## 17. UX profesional

Panel **KIA Operator**:

| Cliente | Acción | Deadline | Estado | Riesgo | Siguiente paso |
|---|---|---|---|---|---|

Funciones:

- preparar seleccionados;
- detectar bloqueos;
- abrir connector;
- revisar snapshots;
- autorizar individualmente;
- batch de acciones read-only;
- nunca batch-submit sin diseño legal específico.

---

## 18. Métricas de producto

- % consultas resueltas sin humano;
- % workflows preparados automáticamente;
- % workflows completados con 1 intervención humana;
- tiempo medio por trámite;
- errores evitados por verifier;
- human takeover rate;
- cost per workflow;
- provider success rate;
- conversion a plan mensual;
- churn;
- utilización de KIA por plan.

---

## 19. Definición de MVP real

El MVP no es “presentar impuestos con IA”.

El MVP es:

> desde KIA, abrir AEAT en el ordenador autorizado, autenticar localmente, consultar un expediente o declaración existente, descargar un justificante, verificarlo y vincularlo automáticamente al expediente correcto en EXPERT.

Si ese flujo funciona de extremo a extremo con auditoría y aislamiento correctos, la arquitectura fundamental está validada.

---

## 20. Orden recomendado de ejecución

1. KIA-M0 + KADM-0.
2. Capability router y tool registry.
3. Responses adapter + evals.
4. Migraciones Administrative Action Service.
5. Local Connector skeleton.
6. AEAT read-only.
7. Computer Use dual-provider experimentation.
8. Fill-only.
9. Supervised submit.
10. DEHú/TGSS.
11. Packaging dentro de planes mensuales.
12. B2B multi-tenant.

Este orden minimiza deuda, evita construir automatización encima de la KIA duplicada actual y genera valor incremental antes de asumir riesgos jurídicos de presentación.