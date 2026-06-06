# Kia F1-F8 Intelligence Roadmap

Ultima revision: 2026-06-04

Documentacion tecnica de las ocho fases del roadmap de inteligencia de Kia. Cada fase es un modulo independiente activado por la capa de flags existente.

---

## F1 — Model Routing

**Modulos:** `kia-provider-router.ts`, `kia-decision-engine.ts`

Enruta la decision al modelo optimo segun la tarea:

| Modelo | Tarea |
|--------|-------|
| `claude-sonnet-4-6` | Decisiones complejas (viabilidad, readiness, casos) |
| `claude-haiku-4-5-20251001` | Clasificacion rapida, respuestas sencillas |
| `gpt-4o` | OCR de imagenes/facturas, juicio externo critico |

El router intenta el proveedor primario y cae a fallback Anthropic/OpenAI si hay error. El modelo usado queda registrado en `kia_decision_logs.model`.

**Flag de control:** `KIA_AI_PROVIDER_ROUTER_ENABLED`

---

## F2 — Intent Classifier (Haiku Pre-clasificador)

**Modulo:** `kia-decision-engine.ts` (fase inicial del loop)

Antes de invocar Sonnet, Haiku clasifica si el mensaje es ambiguo. Si la ambiguedad es >= 0.7 devuelve directamente `ask_one_question` sin consumir tokens de Sonnet. Mensajes con intent claro (fiscal, holded, expediente) pasan al motor completo.

**Fixtures de validacion:** `tests/fixtures/kia/f2-intent-classifier.json`

---

## F3 — OCR + GPT-4o Judge

**Modulos:** `kia-ocr-extractor.ts`, `kia-decision-engine.ts`

Cuando el mensaje incluye una imagen de factura/documento:

1. GPT-4o Vision extrae los campos estructurados (proveedor, importe, IVA, fecha, NIF).
2. Si la confianza es baja o la accion es critica, GPT-4o actua como juez de segunda opinion.
3. El resultado OCR se inyecta en el contexto antes de la decision final.

**Flag de control:** `KIA_AI_DOCUMENT_CLASSIFICATION_ENABLED`

**Fixtures de validacion:** `tests/fixtures/kia/f3-ocr-invoice.json`

---

## F4 — SSE Streaming

**Endpoint:** `POST /api/admin/whatsapp/ai-compose/stream`

**Formato:** `text/event-stream` (Server-Sent Events)

Cada evento es un JSON en una linea `data: {...}\n\n`:

```
data: {"type":"thinking"}
data: {"type":"classifying"}
data: {"type":"tool_call","tool":"get_case_status","reason":"Revisar expediente del cliente"}
data: {"type":"tool_result","tool":"get_case_status","ok":true}
data: {"type":"complete","draft":"...","structured":true,"decision":{...}}
```

En error:
```
data: {"type":"error","message":"..."}
```

**Tipos de evento:**

| Tipo | Descripcion |
|------|-------------|
| `thinking` | Motor iniciado, construyendo contexto |
| `classifying` | Haiku clasificando intent |
| `tool_call` | Kia va a ejecutar una herramienta |
| `tool_result` | Resultado de la herramienta recibido |
| `judging` | GPT-4o evaluando decision critica |
| `complete` | Respuesta final lista |
| `error` | Fallo durante la generacion |

**Modulo de tipos:** `lib/ai/kia/kia-progress.ts` — `KiaProgressEvent`, `KiaProgressCallback`

**Integracion en UI:** `components/admin/WhatsAppInbox.tsx` — muestra el evento actual como texto de progreso bajo el boton de composicion.

---

## F5 — RAG Memory

**Modulos:** `kia-memory-store.ts`, `kia-memory-retriever.ts`, `kia-context-builder.ts`

### Almacenamiento

Despues de cada `waba_reply` con confianza >= 0.6, Kia guarda un resumen semantico en `kia_memories`:

```
viability | Quiero declarar la renta | Hemos iniciado la evaluacion de viabilidad fiscal | run_viability
```

El embedding se genera con `text-embedding-3-small` (1536 dimensiones).

### Recuperacion

Antes de construir el system prompt, se buscan memorias similares mediante pgvector:

```sql
-- RPC: kia_memories_search
SELECT id, content, memory_type, created_at, similarity
FROM kia_memories
WHERE client_id = $1 OR lead_id = $2 OR phone = $3
  AND embedding <=> $4 < (1 - 0.72)
ORDER BY similarity DESC
LIMIT 3;
```

Las memorias recuperadas se inyectan en el contexto como:

```xml
<kia_long_term_memory>
Conversaciones y hechos clave previos de este contacto (relevantes para el mensaje actual):
[1] viability | Quiero declarar la renta | ...
</kia_long_term_memory>
```

### Migraciones necesarias

- `supabase/migrations/20260604000000_kia_memories.sql` — tabla + indices pgvector
- `supabase/migrations/20260604000001_kia_memories_search_rpc.sql` — RPC de busqueda

---

## F6 — Feedback Loop

**Modulos:** `kia-feedback-store.ts`, `kia-few-shot-provider.ts`

### Botones de valoracion

Kia envia botones interactivos con IDs prefijados:

```
kia_fb_g:<decision_log_id>   →  valoracion positiva
kia_fb_b:<decision_log_id>   →  valoracion negativa
```

El webhook WABA detecta estos IDs, persiste la valoracion en `kia_feedback` y responde con un ACK sin procesar el mensaje como conversacion normal.

### Few-shot de ejemplos positivos

Antes de construir el system prompt, se recuperan hasta 3 ejemplos con valoracion positiva del mismo `task_type`. Se formatean como:

```xml
<few_shot_positive_examples>
[Ejemplo 1]
Usuario: ...
Kia: ...
</few_shot_positive_examples>
```

### Migracion necesaria

- `supabase/migrations/20260604000002_kia_feedback.sql` — tabla `kia_feedback`

---

## F7 — Sub-agentes Especialistas

**Modulo:** `kia-sub-agent-router.ts`

Segun el `taskType` e `intent` detectado, se selecciona un perfil de sub-agente que anade un addendum al system prompt y puede ajustar `maxTokens`:

| Sub-agente | Intents cubiertos | Dominio |
|-----------|-------------------|---------|
| `fiscal` | viability, readiness (fiscal) | IRPF, Modelo 720, requerimientos Hacienda |
| `holded` | readiness, connect_holded, accounting_summary | ERP, plan de cuentas, modulos |
| `case` | case_status, send_documents, document_classification | Expedientes, arraigo, documentacion |

El addendum especializa el tono y reglas sin reemplazar el system prompt maestro.

**Fixtures de validacion:** `tests/fixtures/kia/f7-sub-agents.json`

---

## F8 — Cost Tracking

**Modulo:** `kia-cost-tracker.ts`

Tabla de precios (USD por millon de tokens):

| Modelo | Input | Output |
|--------|-------|--------|
| claude-sonnet-4-6 | 3.00 | 15.00 |
| claude-haiku-4-5-20251001 | 0.80 | 4.00 |
| gpt-4o | 5.00 | 15.00 |
| text-embedding-3-small | 0.02 | 0 |

El coste se acumula en cada iteracion del loop agentico y se persiste en `kia_decision_logs`:

```
tokens_in         INTEGER
tokens_out        INTEGER
estimated_cost_usd NUMERIC(10,6)
loop_iterations   INTEGER
```

**Migracion necesaria:** `supabase/migrations/20260604000003_kia_decision_logs_cost.sql`

---

## Endpoints nuevos

### POST /api/admin/whatsapp/ai-compose/stream

Genera una respuesta Kia con streaming SSE para el panel admin.

**Auth:** cookie de sesion admin (igual que `/api/admin/whatsapp/ai-compose`)

**Body:**
```json
{
  "contactId": "uuid",
  "contactType": "lead|client",
  "message": "texto del contacto",
  "selectedMessageId": "opcional — msg al que se responde"
}
```

**Response:** `text/event-stream` — ver F4 para el formato de eventos.

### GET /api/admin/kia-metrics

Devuelve metricas agregadas de los ultimos 30 dias para el dashboard de administracion.

**Auth:** cookie de sesion admin

**Response:**
```json
{
  "summary": {
    "totalDecisions": 0,
    "avgConfidence": 0.0,
    "totalCostUsd": 0.0,
    "feedbackPositive": 0,
    "feedbackNegative": 0,
    "memoriesStored": 0,
    "requiresManualReview": 0,
    "requiresMeeting": 0
  },
  "daily": [
    { "date": "2026-06-04", "decisions": 0, "costUsd": 0, "meetings": 0, "reviews": 0 }
  ],
  "taskTypes": [
    { "taskType": "waba_reply", "count": 0, "avgConfidence": 0.0 }
  ],
  "models": [
    { "model": "claude-sonnet-4-6", "count": 0, "totalCostUsd": 0.0 }
  ]
}
```

---

## Dashboard de metricas

**Ruta admin:** `/admin/kia-metrics`

**Componente:** `components/admin/KiaMetricsDashboard.tsx`

Incluye:
- 8 tarjetas de resumen (decisiones, confianza media, coste, feedback, memorias, revisiones manuales, reuniones)
- LineChart de decisiones diarias con coste superpuesto (14 dias)
- BarChart horizontal de distribuciones por tipo de tarea
- PieChart de uso de modelos
- BarChart apilado de feedback positivo/negativo por dia

---

## Variables de entorno (nuevas en F1-F8)

Todas las variables existentes en `.env.example`. No se anadieron variables nuevas; F5 reutiliza `OPENAI_API_KEY` para embeddings.

```env
KIA_AI_MEMORY_ENABLED=true        # activa F5 RAG memory
KIA_AI_FEEDBACK_ENABLED=true      # activa F6 feedback loop
KIA_AI_SUB_AGENTS_ENABLED=true    # activa F7 sub-agentes
```

---

## Tests

```bash
npm run kia:eval          # 182 fixtures estructurales (incluye F1-F8)
npm run kia:f1f8:test     # validador offline de suites F1-F8
npm run kia:auditor:test  # 13 fixtures del auditor
```

**Suites F1-F8 en `tests/fixtures/kia/`:**

| Archivo | Suite | Casos |
|---------|-------|-------|
| f1-model-routing.json | f1-model-routing | 5 |
| f2-intent-classifier.json | f2-intent-classifier | 5 |
| f3-ocr-invoice.json | f3-ocr-invoice | 3 |
| f6-feedback-flow.json | f6-feedback-flow | 3 |
| f7-sub-agents.json | f7-sub-agents | 5 |
