# KIA 2.0 — estrategia agentic para EXPERT

Fecha: 2026-09-15
Estado: arquitectura objetivo

## 1. Visión

KIA deja de entenderse como un chatbot conectado a herramientas y pasa a ser el **sistema operativo inteligente de EXPERT**.

Su misión será coordinar conocimiento, datos, herramientas, flujos, agentes especializados y acciones externas para ayudar a empresarios y profesionales a gestionar empresa, fiscalidad, contabilidad, laboral y trámites administrativos desde una sola plataforma.

La arquitectura objetivo debe soportar:

- razonamiento conversacional;
- recuperación de contexto y memoria;
- herramientas de negocio;
- herramientas de búsqueda y conocimiento;
- ejecución de código;
- generación y análisis de documentos;
- navegación web;
- computer use;
- MCP/connectors;
- agentes especializados;
- tareas largas y workflows;
- human-in-the-loop;
- multiempresa;
- multi-tenant;
- trazabilidad completa;
- routing OpenAI / Anthropic / otros proveedores.

KIA no será un wrapper de un modelo concreto.

---

## 2. Principio arquitectónico central

La arquitectura se divide en cinco capas:

```text
KIA EXPERIENCE
    │
KIA ORCHESTRATOR
    │
POLICY + CONTEXT + MEMORY
    │
CAPABILITY ROUTER
    │
EXECUTORS / PROVIDERS / CONNECTORS
```

### KIA Experience

Canales:

- dashboard;
- app móvil futura;
- WhatsApp;
- email;
- admin profesional;
- portal tenant;
- voz futura.

### KIA Orchestrator

Responsable de:

- entender objetivo;
- construir plan;
- dividir tarea;
- escoger agente/capacidad;
- gestionar dependencias;
- pedir confirmaciones;
- verificar resultados;
- cerrar workflow.

### Policy + Context + Memory

Decide:

- qué usuario actúa;
- para qué empresa;
- qué suscripción tiene;
- qué herramientas puede usar;
- qué representación tiene;
- qué datos puede consultar;
- qué acción necesita aprobación humana;
- qué memoria es válida para la tarea.

### Capability Router

No selecciona sólo modelo. Selecciona **capacidad + proveedor + executor**.

Ejemplos:

- explicación fiscal → modelo de razonamiento;
- búsqueda normativa → web search + fuentes oficiales;
- documento → file search + parser + model;
- Holded → MCP/API tools;
- cálculo → code execution;
- AEAT → Local Connector + browser/computer use;
- tarea compleja → managed agent o workflow persistente.

### Executors

- OpenAI Responses/Agents;
- Anthropic Messages/agentic tools;
- MCP;
- APIs directas;
- deterministic workflows;
- Playwright/browser;
- Local Connector;
- code sandbox;
- background jobs.

---

## 3. OpenAI: capacidades a explotar

La arquitectura debe prepararse para la plataforma moderna de agentes de OpenAI, sin obligar a migrar todo KIA en un único paso.

### 3.1 Responses API

Debe convertirse en la interfaz OpenAI preferida para nuevos flujos agentic.

Uso en EXPERT:

- razonamiento multi-step;
- tool calling;
- uso combinado de herramientas;
- workflows con estado;
- integración de capacidades nativas actuales y futuras.

No es necesario retirar inmediatamente Chat Completions del router actual. Se introduce un nuevo adapter `OpenAIResponsesProvider` y se migra por task type.

### 3.2 Agents API

La Agents API, lanzada en beta pública en septiembre de 2026, se evaluará para:

- agentes duraderos;
- delegación entre subagentes;
- gestión de tareas complejas;
- herramientas;
- ejecución en diferentes entornos;
- seguimiento de workflows.

No debe convertirse inicialmente en el sistema de verdad de EXPERT. El estado crítico sigue viviendo en Supabase/EXPERT.

### 3.3 Computer Use

Uso previsto:

- sedes electrónicas;
- portales sin API;
- formularios administrativos;
- validación visual;
- descarga de justificantes.

Computer Use nunca recibe control abierto del equipo. Se ejecuta dentro de un browser sandbox del Local Connector con:

- allowlist de dominios;
- sesión separada;
- límites de navegación;
- checkpoints humanos;
- screenshots efímeras;
- bloqueo de acceso a filesystem/otras apps salvo autorización explícita.

### 3.4 Web Search

Uso:

- normativa reciente;
- noticias regulatorias;
- documentación oficial;
- cambios fiscales/laborales;
- búsqueda contextual.

Debe seguir existiendo una preferencia explícita por fuentes oficiales para fiscal/laboral/jurídico.

### 3.5 File Search / retrieval

Uso:

- contratos;
- notificaciones;
- PDFs;
- documentación de clientes;
- manuales;
- convenios;
- Academy;
- base documental interna.

El retrieval debe respetar `tenant_id`, `client_id`, `company_id`, expediente y nivel de acceso.

### 3.6 Code execution

Uso:

- cálculos fiscales;
- conciliaciones;
- comprobaciones de nómina;
- conversiones;
- análisis de Excel/CSV;
- simulaciones;
- generación de artefactos.

Regla: resultados de cálculo no se convierten automáticamente en presentación o asiento sin validación de negocio.

### 3.7 MCP

EXPERT ya tiene `apps/holded-mcp`.

MCP debe convertirse en una pieza estratégica para exponer herramientas de EXPERT de forma portable a agentes autorizados.

Futuros servidores MCP:

- EXPERT Core MCP;
- Holded MCP;
- Knowledge MCP;
- Admin MCP;
- Academy MCP;
- futuro read-only Administrative Evidence MCP.

No exponer herramientas jurídicas irreversibles directamente por MCP sin policy gateway.

---

## 4. Anthropic: capacidades a explotar

Anthropic sigue siendo un proveedor de primer nivel dentro del capability router.

### 4.1 Tool use

La arquitectura actual ya lo utiliza. Debe mantenerse y modernizarse.

Uso:

- reasoning sobre servicios;
- análisis documental;
- planificación;
- selección de herramientas;
- copiloto profesional.

### 4.2 Computer use

Debe existir un adapter compatible para poder comparar rendimiento OpenAI vs Anthropic en:

- portales públicos;
- sedes;
- Holded UI;
- validación visual.

La decisión de proveedor debe poder configurarse por workflow, no hardcodearse.

### 4.3 MCP

Anthropic tiene una fuerte integración con MCP. `apps/holded-mcp` demuestra que EXPERT ya puede aprovechar esta vía.

La estrategia debe mantener MCP provider-neutral.

### 4.4 Web search y herramientas server-side

Cuando una capacidad nativa del proveedor resulte más robusta o económica que una implementación propia, el capability router podrá elegirla.

### 4.5 Agentes gestionados / workflows agentic

Si Anthropic ofrece managed agent runtimes adecuados para producción, se evaluarán con el mismo criterio que OpenAI Agents:

- no ceder sistema de verdad;
- no ceder permisos jurídicos;
- no ceder control de identidad;
- usar el proveedor como runtime, no como autoridad de negocio.

---

## 5. Arquitectura multi-provider

El router actual `kia-provider-router.ts` es insuficiente para KIA 2.0 porque enruta principalmente por task type/modelo.

Se sustituirá gradualmente por:

```text
Capability Request
   │
   ├─ reasoning
   ├─ vision
   ├─ web_search
   ├─ file_search
   ├─ code_execution
   ├─ computer_use
   ├─ mcp
   ├─ long_running_agent
   └─ structured_generation
        │
        ▼
Capability Router
        │
        ├─ policy
        ├─ cost
        ├─ latency
        ├─ quality
        ├─ data residency
        ├─ tool compatibility
        └─ health/fallback
        │
        ▼
Provider Adapter
```

Adapters iniciales:

- `OpenAIResponsesAdapter`;
- `OpenAIAgentsAdapter`;
- `AnthropicMessagesAdapter`;
- `AnthropicAgentAdapter` futuro;
- `DeterministicToolAdapter`;
- `McpAdapter`;
- `LocalComputerAdapter`.

---

## 6. Agentes especializados de KIA

KIA debe sentirse como una única copiloto, aunque internamente delegue.

Subagentes lógicos:

### KIA Fiscal

- IVA;
- IRPF;
- IS;
- retenciones;
- IRNR;
- modelos;
- calendario fiscal;
- revisiones.

### KIA Contable

- Holded;
- P&G;
- balance;
- conciliación;
- anomalías;
- cierres;
- documentos.

### KIA Laboral

- contratos;
- convenio;
- nóminas;
- Seguridad Social;
- RED/SILTRA;
- costes;
- calendarios.

### KIA Mercantil

- SL;
- administradores;
- poderes;
- cuentas anuales;
- libros;
- Registro Mercantil.

### KIA Administración

- AEAT;
- TGSS/Importass;
- SEPE;
- DEHú;
- GVA;
- SUMA;
- DGT;
- CIRCE;
- Justicia/Registros cuando proceda.

### KIA Documental

- clasificación;
- OCR/extracción;
- checklist;
- comparación;
- detección de faltantes;
- evidencias.

### KIA Academy

- formación;
- explicación progresiva;
- ejercicios;
- tutoría;
- autogestión guiada.

### KIA Operator

Modo profesional para EXPERT/tenant_admin:

- colas de expedientes;
- acciones masivas supervisadas;
- QA;
- preparación de presentaciones;
- informes;
- seguimiento operativo.

---

## 7. Skills como unidad reutilizable de conocimiento operativo

KIA 2.0 debe incorporar el concepto de **skills** independientemente de cómo cada proveedor lo implemente.

Un skill EXPERT es un paquete versionado con:

- objetivo;
- requisitos;
- fuentes oficiales;
- reglas;
- herramientas permitidas;
- workflow;
- checkpoints humanos;
- outputs;
- tests;
- versión normativa.

Ejemplos:

- `aeat-modelo-303`;
- `aeat-certificado-tributario`;
- `tgss-alta-autonomo`;
- `dehu-consultar-notificaciones`;
- `holded-revision-trimestral`;
- `laboral-revision-nomina`;
- `circe-constitucion-sl`.

Esto permite evolucionar modelos sin perder el know-how de EXPERT.

---

## 8. Tool Registry canónico

Todas las herramientas deben vivir en un registro gobernado por EXPERT.

Campos mínimos:

- tool id;
- version;
- capability;
- provider/executor;
- read/write;
- risk tier;
- required roles;
- required plan capability;
- requires human approval;
- idempotency class;
- allowed data scopes;
- allowed domains;
- timeout;
- retry policy;
- audit level;
- feature flag.

Risk tiers propuestos:

- R0: lectura pública;
- R1: lectura de datos propios;
- R2: creación de borrador;
- R3: modificación reversible;
- R4: acción externa con efectos jurídicos/económicos;
- R5: acción irreversible o especialmente sensible.

KIA nunca decide por sí sola que una herramienta R4/R5 deja de requerir aprobación.

---

## 9. Memory architecture

La memoria no debe ser una única conversación larga.

Capas:

### Working memory

Contexto inmediato del workflow.

### User memory

Preferencias operativas y hechos estables autorizados.

### Company memory

Datos y decisiones por empresa.

### Case memory

Estado, documentos, decisiones y evidencias del expediente.

### Professional memory

Correcciones y criterios internos del asesor.

### Knowledge memory

Normativa, fuentes, guías, Academy y documentación de producto.

Cada memoria necesita:

- scope;
- provenance;
- timestamp;
- confidence;
- retention;
- permissions;
- invalidation/versioning.

---

## 10. Knowledge architecture / RAG

Fuentes:

- BOE;
- AEAT;
- Seguridad Social;
- SEPE;
- organismos autonómicos/locales;
- convenios;
- normativa;
- manuales Holded;
- documentación EXPERT;
- Academy;
- expedientes/documentos del cliente.

Se diferencian:

- conocimiento normativo versionado;
- conocimiento comercial;
- conocimiento operativo;
- documentos privados.

La respuesta profesional debe poder mostrar provenance y fecha de vigencia.

---

## 11. Workflow engine

Los agentes no deben sustituir una state machine cuando el proceso es predecible.

Regla:

> deterministic where possible, agentic where useful.

Ejemplo Modelo 303:

Determinista:

- resolver empresa;
- periodo;
- permisos;
- recopilar datos;
- validar totales;
- generar snapshot;
- pedir aprobación;
- verificar evidencia.

Agentic:

- interpretar anomalías;
- resolver cambios de interfaz AEAT;
- navegar visualmente;
- explicar incidencias;
- decidir si escalar.

---

## 12. KIA Administración + Local Connector

La nueva capa administrativa utilizará KIA 2.0 pero estará separada del conversational runtime.

Componentes:

- Administrative Action Service;
- Policy Engine;
- Approval Service;
- Command Broker;
- Local Connector;
- Browser Sandbox;
- Computer Use Adapter;
- Evidence Verifier;
- Organism Adapter Registry.

El certificado nunca se envía al cloud.

---

## 13. Observability y evaluación

Cada ejecución agentic debe registrar:

- provider;
- model;
- version;
- capabilities;
- tools;
- latencia;
- coste;
- success/failure;
- retries;
- human interventions;
- policy denials;
- evidence quality.

Crear eval suites por dominio:

- fiscal accuracy;
- tool selection;
- no cross-company leakage;
- hallucination resistance;
- administrative navigation;
- approval compliance;
- duplicate submission prevention;
- RU/ES terminology.

Canary obligatorio antes de promover modelos nuevos.

---

## 14. Provider governance

Nunca hardcodear que “OpenAI es fiscal” o “Anthropic es documental”.

El routing se gobierna con datos.

Métricas:

- task success;
- factual accuracy;
- structured output compliance;
- tool selection accuracy;
- cost per resolved task;
- latency;
- human correction rate;
- safety/policy violations.

Un modelo nuevo se incorpora mediante shadow/canary.

---

## 15. Arquitectura de futuro preparada para cambios de proveedor

Las APIs evolucionarán.

Por eso EXPERT define interfaces propias:

```ts
interface ReasoningProvider {}
interface SearchProvider {}
interface RetrievalProvider {}
interface CodeExecutionProvider {}
interface ComputerUseProvider {}
interface LongRunningAgentProvider {}
interface ToolTransport {}
```

Las implementaciones de OpenAI/Anthropic pueden cambiar sin reescribir KIA.

---

## 16. Relación con el modelo de suscripción

KIA no es un extra cosmético. Se convierte en parte del producto mensual.

Ejemplo de progresión comercial:

### Nivel Guidance

- preguntas;
- explicación;
- alertas;
- Academy;
- guías paso a paso.

### Nivel Assisted

- lectura de datos;
- preparación de trámites;
- documentos;
- borradores;
- validaciones.

### Nivel Operative

- Local Connector;
- ejecución supervisada;
- acciones administrativas;
- evidencia automática.

### Nivel Professional

- operador multiempresa;
- batch preparation;
- colas;
- QA;
- tenant/asesoría.

La capacidad real se determina por `plan_capabilities`, no por copy.

---

## 17. Decisiones estratégicas

1. KIA actual es arquitectura de transición.
2. Se permite refactor profundo antes de clientes externos.
3. Responses/Agents se introducen gradualmente.
4. Anthropic sigue como proveedor de primer nivel.
5. El producto es provider-neutral.
6. MCP es infraestructura estratégica.
7. Skills son propiedad intelectual versionada de EXPERT.
8. El backend EXPERT mantiene identidad, permisos y estado.
9. Los agentes no poseen autoridad jurídica.
10. Computer Use se encapsula.
11. Workflows críticos combinan determinismo + agentic reasoning.
12. Cada cambio de modelo requiere eval/canary.

---

## 18. Referencias oficiales investigadas

OpenAI:

- https://openai.com/index/introducing-the-agents-api/
- https://platform.openai.com/docs/guides/tools
- https://platform.openai.com/docs/guides/tools-computer-use
- https://platform.openai.com/docs/guides/tools-web-search
- https://platform.openai.com/docs/guides/tools-file-search
- https://platform.openai.com/docs/guides/tools-remote-mcp

Anthropic:

- https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
- https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool
- https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool
- https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector

Estas referencias deberán revisarse durante cada sprint de implementación porque las superficies de agentes y computer use evolucionan rápidamente.
