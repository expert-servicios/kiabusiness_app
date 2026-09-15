# KIA Administración — auditoría del repositorio antes de implementación

Fecha: 2026-09-15
Repositorio: `expert-servicios/kiabusiness_app`
Rama: `docs/kia-administracion-inteligente`

## Objetivo

Auditar la arquitectura real de EXPERT/KIA antes de diseñar la nueva capa de ejecución de trámites ante Administraciones Públicas y el modelo de **asesoría inteligente por suscripción**.

La propuesta de valor objetivo es:

`Holded + EXPERT + KIA + ejecución administrativa supervisada + controles + asesor humano`

No se crea una segunda plataforma. Se amplía EXPERT y se transforma KIA gradualmente en una arquitectura agentic orientada a ejecución segura.

---

## Conclusión ejecutiva

EXPERT ya tiene una base suficientemente madura para reutilizar:

- autenticación y perfiles;
- aislamiento por cliente y empresa;
- contexto estructurado de KIA;
- herramientas tipadas y validadas en backend;
- allowlists de herramientas;
- decision logs y auditoría;
- redacción de secretos;
- expedientes con estados y transiciones;
- documentos privados;
- fuentes oficiales;
- integración Holded;
- Stripe, suscripciones y cobertura comercial por entidad;
- `subscription_entitlements`;
- notificaciones email/push;
- multi-tenant;
- patrón de subaplicación independiente (`apps/holded-mcp`);
- rate limits, límites de coste y feature flags.

No existe todavía en `main`:

- browser/computer-use execution;
- Playwright/Puppeteer;
- OpenAI Responses API para KIA;
- OpenAI Agents API;
- Anthropic Managed Agents;
- aplicación local de escritorio;
- pairing de dispositivos;
- canal backend ↔ ordenador local;
- modelo de representación/apoderamiento administrativo;
- ledger específico de actuaciones administrativas;
- tokens one-time de aprobación;
- adaptadores AEAT/TGSS/SEPE/etc.;
- verificación automática de justificantes/CSV/NRC.

Por tanto, **KIA Administración es una extensión profunda de KIA, no una reescritura total del producto**, aunque la capa de inteligencia actual debe considerarse transitoria y sustituible.

---

## Inventario: reutilizar / adaptar / crear

| Área | Estado | Decisión |
|---|---|---|
| KIA Decision Engine | Existe | Reutilizar temporalmente; sustituible por orquestador KIA 2.0 |
| KIA Context Builder | Existe | Reutilizar y ampliar |
| Tools + Zod | Existe | Reutilizar y ampliar |
| Tool Executor | Existe | Reutilizar como policy boundary |
| Provider Router | Anthropic + OpenAI | Rehacer gradualmente como provider/capability router |
| OpenAI actual | Chat Completions/functions | Migrar a Responses/Agents en flujos agentic |
| Anthropic actual | Messages/tool use | Ampliar a últimas capacidades agentic |
| Computer Use | No existe | Nuevo |
| Browser Use | No existe | Nuevo |
| Managed Agents | No existe | Evaluar/pilotar |
| MCP | `apps/holded-mcp` | Reutilizar patrón y ampliar catálogo MCP |
| Agent Skills | No existe como arquitectura de producto | Nuevo |
| Fuentes oficiales | Existe | Reutilizar |
| KIA Copilot UI | Dos superficies | Consolidar |
| Artifacts | report/table/link | Extender con acciones/aprobaciones/evidencias |
| Expedientes | Existe | Reutilizar |
| `listo_para_presentar → presentado` | Humano | Mantener |
| `audit_logs` | Existe | Reutilizar |
| `kia_decision_logs` | Existe | Reutilizar durante transición |
| Ledger de ejecución | No existe | Nuevo |
| Redacción secretos | Existe | Ampliar |
| Suscripciones | Existe | Reutilizar |
| Plan capabilities | No existe de forma canónica | Nuevo |
| Local Connector | No existe | Nuevo |
| Device pairing | No existe | Nuevo |
| Representación/apoderamiento | No existe | Nuevo |

---

## Base de KIA que conviene conservar

### Contexto autorizado

`lib/ai/kia/kia-context-builder.ts` ya resuelve:

- usuario/cliente;
- empresa activa;
- pertenencia a la empresa mediante `profile_companies`;
- CIF/NIF;
- cobertura comercial;
- estado Holded;
- expedientes;
- documentos;
- snapshots contables;
- conversación;
- memorias.

Debe ampliarse con:

- `administrativeCapabilities`;
- `connectorDevice`;
- `representationContext`;
- `pendingAdministrativeActions`;
- `administrativeEvidence`;
- `tenantPolicy`;
- `riskTier`.

### Herramientas tipadas

`lib/ai/kia/kia-tool-definitions.ts` ya usa Zod y schemas estrictos. El nuevo sistema debe mantener esta filosofía.

No se permitirá una herramienta genérica de navegación con permisos ilimitados. Las herramientas de producto deben ser de dominio, por ejemplo:

- `get_connector_status`;
- `get_representation_status`;
- `prepare_administrative_action`;
- `request_administrative_execution`;
- `get_administrative_action_status`;
- `get_administrative_evidence`;
- `cancel_administrative_action`.

### Executor como frontera de seguridad

`lib/ai/kia/kia-tool-executor.ts` ya valida argumentos y aplica contexto autorizado. Este patrón debe convertirse en una frontera estable entre el razonamiento del modelo y los efectos externos.

La IA **propone**. El policy engine y el backend **autorizan**. El executor **ejecuta**.

---

## Hallazgo: duplicidad de KIA Copilot

Existen dos superficies:

1. `components/KiaCopilotWidget.tsx` + `app/api/ai/kia/route.ts`.
2. `components/dashboard/KiaCopilotPanel.tsx` + `app/api/kia/copilot/route.ts`.

Los tests ya documentan esta duplicidad.

### Decisión

KIA 2.0 debe partir de una sola superficie canónica. La recomendación es conservar:

- `KiaCopilotWidget`;
- `/api/ai/kia`;
- `kia_sessions`;
- `buildKiaCopilotArtifacts`;
- aislamiento server-side por empresa.

La superficie legacy debe quedar congelada y eliminarse cuando exista paridad.

---

## Artifacts: buena base para approval UX

`lib/ai/kia/kia-copilot-artifacts.ts` ya evita que un resultado de herramienta previo se salte la decisión final validada y filtra URLs.

Tipos actuales:

- `report`;
- `table`;
- `link`.

Tipos futuros:

- `administrative_action`;
- `approval_request`;
- `execution_status`;
- `evidence`;
- `human_handoff`;
- `connector_setup`.

El artifact visible no debe contener el permiso de ejecución. La aprobación real se materializa en backend mediante token one-time vinculado a un snapshot hash.

---

## Expedientes y control humano

`lib/cases/case-status.ts` ya define:

- `listo_para_presentar`;
- `presentado`;
- `finalizado`.

Y marca como humanas:

- `listo_para_presentar → presentado`;
- `presentado → finalizado`.

Esta regla debe mantenerse.

Una presentación automatizada sólo podrá cambiar a `presentado` cuando existan simultáneamente:

1. autorización humana explícita;
2. ejecución completada;
3. evidencia verificable de recepción por el organismo;
4. coincidencia entre lo aprobado y lo presentado.

La ejecución técnica puede ser automatizada, pero la decisión jurídica de presentar sigue siendo humana.

---

## Auditoría existente y nueva

### Reutilizar `audit_logs`

Para eventos de alto nivel:

- `administrative_action.created`;
- `administrative_action.approved`;
- `administrative_action.completed`;
- `administrative_action.failed`;
- `connector.device.paired`;
- `connector.device.revoked`.

### Reutilizar `kia_decision_logs`

Para observabilidad de decisiones IA durante la transición.

### Crear ledger específico

Ni `audit_logs` ni `kia_decision_logs` bastan para reconstruir una actuación jurídica paso a paso.

Se requiere `administrative_action_events` como ledger append-only con:

- secuencia;
- action id;
- actor;
- modelo/proveedor cuando proceda;
- dispositivo;
- tipo de evento;
- hash de entrada/salida;
- timestamp;
- evidencia asociada;
- resultado.

---

## Redacción y secretos

`lib/ai/kia/kia-redaction.ts` ya redacciona email, teléfono, IBAN, API keys/tokens/secrets.

Debe ampliarse para impedir persistencia de:

- PEM;
- PKCS#12 / `.p12` / `.pfx`;
- passwords/PIN;
- OTP/SMS;
- códigos Cl@ve;
- cookies de sesiones administrativas;
- claves privadas;
- tokens de sesión del navegador;
- contenido de almacenes de certificados.

Regla absoluta: **el certificado y la clave privada permanecen en el dispositivo local**.

---

## Fuentes oficiales

`lib/integrations/official-sources.ts` ya cubre AEAT, TGSS/Importass, SEPE, Cl@ve, BOE, Justicia, Registradores, DGT, CIRCE/PAE, GVA, SUMA y otros dominios.

Esta capa debe seguir siendo de **conocimiento**.

La capa de **ejecución** utilizará un registro mucho más restrictivo de dominios y rutas permitidas por workflow. Encontrar una URL oficial no autoriza automáticamente a navegarla.

---

## Suscripciones y entitlements

`resolveCompanyCommercialCoverage()` ya distingue suscripción directa, trial, entidad incluida y ausencia de cobertura.

`subscription_entitlements` ya sirve para beneficios comerciales. Para KIA Administración no conviene mezclar catálogo de capacidades operativas con excepciones comerciales.

### Recomendación

Crear:

- `plan_capabilities` — capacidades estándar de cada plan;
- `subscription_capability_overrides` — excepciones concretas;
- mantener `subscription_entitlements` para beneficios comerciales/entidades incluidas.

Capacidades iniciales:

- `kia_admin_guidance`;
- `kia_admin_read`;
- `kia_admin_prepare`;
- `kia_admin_submit_supervised`;
- `kia_admin_multi_entity`;
- `kia_admin_professional_operator`.

---

## Hallazgo: inconsistencia de onboarding Holded

Hay una contradicción actual:

- `service-registry.ts` marca planes mensuales con `requiresHoldedConnectionBeforeCheckout: true`;
- `plan-mensual-guard.ts` dice que Holded se conecta después del pago;
- `/api/subscriptions/checkout` no exige Holded para crear el checkout.

### Decisión recomendada

Regla canónica:

> Se permite contratar sin Holded conectado, pero la suscripción no entra en estado operativo completo hasta completar onboarding e integraciones requeridas.

Esta misma lógica servirá más adelante para el Local Connector.

---

## Patrón de subaplicación existente

`apps/holded-mcp` demuestra que el repo ya admite componentes especializados fuera del frontend Next.js.

El Local Connector debe seguir el mismo principio:

`apps/expert-local-connector/`

No se recomienda incorporar Electron/Playwright/automatización de navegador dentro del paquete raíz de Next.js.

---

## Concurrencia e idempotencia

La email queue existente ya usa atomic claim y estados `pending/processing`.

El mismo patrón debe evolucionar para acciones administrativas:

- `idempotency_key` obligatoria;
- un solo dispositivo puede reclamar una ejecución;
- aprobación ligada a versión/hash;
- retries de lectura permitidos;
- retries de presentación prohibidos hasta verificar si ya se produjo efecto jurídico.

---

## Multi-tenant

La infraestructura multi-tenant existente abre una segunda línea futura:

**KIA Professional / KIA Administración para otras asesorías**.

El MVP será EXPERT, pero tablas y políticas nuevas deben incluir `tenant_id` desde el principio.

---

## Conclusión

EXPERT no parte de cero. La mayor parte de las piezas de identidad, control, contexto, suscripción, auditoría y workflow ya están construidas.

Los bloques realmente nuevos son:

1. **KIA Agent Runtime 2.0** — orquestación moderna multi-proveedor.
2. **Administrative Action Service** — state machine y policy engine.
3. **EXPERT Local Connector** — puente seguro con el ordenador/certificado.
4. **Browser/Computer Use execution layer** — navegación supervisada.
5. **Organism adapters** — AEAT primero; después TGSS, SEPE y demás.
6. **Capability/entitlement layer** — conexión directa con la suscripción mensual.

Ver también:

- `docs/kia-2-agentic-platform-strategy.md`
- `docs/kia-administracion-implementation-plan.md`
