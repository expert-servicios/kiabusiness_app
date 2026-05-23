# Next Best Actions (NBA) — Motor de Priorización

> Última actualización: 2026-05-23  
> Tabla: `next_best_actions`  
> Ruta panel: `components/admin/executive/NextBestActions.tsx`

## Propósito

NBA es la cola de trabajo de Ksenia: el sistema genera automáticamente la lista de "qué hacer ahora mismo" basándose en el estado de leads, expedientes, clientes y comunicaciones. Sustituye a tener que recordar manualmente qué sigue.

## Tabla `next_best_actions`

```sql
CREATE TABLE next_best_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type   text NOT NULL,
  priority      text NOT NULL CHECK (priority IN ('baja', 'media', 'alta', 'critica')),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  title         text NOT NULL,
  description   text,
  client_id     uuid REFERENCES profiles(id),
  lead_id       uuid REFERENCES leads(id),
  case_id       uuid REFERENCES cases(id),
  due_at        timestamptz,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  resolved_at   timestamptz,
  resolved_by   uuid REFERENCES profiles(id)
);
```

## `action_type` y cuándo se crea

### Comercial / Leads

| `action_type` | Trigger | Prioridad |
|--------------|---------|-----------|
| `follow_up_lead` | Lead con `state = 'contacted'` sin respuesta > 48h | media |
| `lead_sin_respuesta` | Lead nuevo sin mensaje de Kia en 2h | alta |
| `checkout_abandonado` | `checkout_sessions` pending > 24h | alta |
| `viabilidad_positiva` | Kia marcó lead como viable, sin checkout en 72h | alta |
| `llamada_preventa_pendiente` | `appointments` type=presale pendiente > 24h desde reserva | alta |
| `lead_caliente` | Lead preguntó precio y no contrató en 48h | media |

### Expedientes / Operativo

| `action_type` | Trigger | Prioridad |
|--------------|---------|-----------|
| `expediente_nuevo` | `cases.status = 'nuevo'` | alta |
| `cliente_sin_respuesta` | Caso `pendiente_cliente` > 3 días sin documentos | media |
| `expediente_bloqueado` | `cases.status = 'bloqueado'` | critica |
| `listo_para_presentar_urgente` | `listo_para_presentar` con `due_date < 7 días` | critica |
| `tarea_vencida` | `internal_tasks.due_date < today` | alta |
| `revision_lenta` | Caso `en_revision` > 5 días sin cambio | media |

### Documentación

| `action_type` | Trigger | Prioridad |
|--------------|---------|-----------|
| `documento_sin_clasificar` | `document_classifications.status = 'needs_review'` | media |
| `requerimiento_recibido` | Documento `detected_type = 'requerimiento'` | critica |
| `clasificacion_incorrecta` | Usuario o Kia señala error de clasificación | media |

### Holded / Fiscal

| `action_type` | Trigger | Prioridad |
|--------------|---------|-----------|
| `holded_desconectado` | Cliente mensual revoca integración Holded | alta |
| `holded_sync_error` | `client_integrations.status = 'failed'` | alta |
| `holded_sin_sync` | `last_sync_at < 7 días` para cliente activo | media |
| `review_anomaly` | Kia detecta anomalía contable en datos Holded | media/alta/critica |
| `cliente_sin_holded` | Cliente con `has_monthly_plan = true` pero sin integración activa | alta |

### Comunicación

| `action_type` | Trigger | Prioridad |
|--------------|---------|-----------|
| `whatsapp_sin_responder` | Mensaje inbound sin reply de admin > 2h | media |
| `email_sin_responder` | Email thread `needs_reply = true` > 4h | media |

### Rentabilidad

| `action_type` | Trigger | Prioridad |
|--------------|---------|-----------|
| `servicio_no_rentable` | Snapshot mensual con `margin_status = 'no_rentable'` | alta |

## Algoritmo de ordenación

Las NBAs abiertas se ordenan así en el Panel Gerente:

```
1. priority = 'critica'   primero (independientemente de fecha)
2. due_at ASC             (las más urgentes por fecha)
3. metadata.revenue_at_risk DESC   (mayor impacto económico primero)
4. created_at ASC         (más antiguas primero, tie-breaker)
```

## Reglas de deduplicación

El sistema **no crea una NBA duplicada** si ya existe una open del mismo tipo para el mismo objeto:

```typescript
// lib/nba/create-nba.ts
async function createNba(params: NbaParams): Promise<void> {
  const existing = await admin
    .from('next_best_actions')
    .select('id')
    .eq('action_type', params.action_type)
    .eq('status', 'open')
    .eq(params.case_id ? 'case_id' : params.lead_id ? 'lead_id' : 'client_id',
        params.case_id ?? params.lead_id ?? params.client_id)
    .maybeSingle();
  
  if (existing.data) return;  // ya existe, no duplicar
  
  await admin.from('next_best_actions').insert(params);
}
```

## Cierre automático de NBAs

Algunas NBAs se cierran (`status → 'done'`) automáticamente cuando el trigger desaparece:

| `action_type` | Se cierra cuando |
|--------------|-----------------|
| `expediente_nuevo` | Caso cambia de `nuevo` a otro estado |
| `cliente_sin_respuesta` | Caso recibe documentos o cambia de estado |
| `expediente_bloqueado` | Caso sale de `bloqueado` |
| `holded_desconectado` | Cliente reconecta Holded |
| `holded_sync_error` | Sync correcto registrado |
| `checkout_abandonado` | Pago completado |
| `documento_sin_clasificar` | Admin clasifica el documento |
| `whatsapp_sin_responder` | Admin responde el mensaje |

Las de tipo `review_anomaly` y `requerimiento_recibido` **no** se cierran automáticamente — requieren acción explícita de Ksenia.

## Descarte manual

Ksenia puede descartar una NBA desde el Panel Gerente. Al descartar:
1. `status → 'dismissed'`
2. `resolved_at = now()`, `resolved_by = admin_id`
3. NBA desaparece de la lista activa
4. No se regenera automáticamente hasta que vuelva a cumplirse el trigger

Excepción: NBAs de tipo `critica` muestran un modal de confirmación antes de descartar.

## Campo `metadata` por tipo

| `action_type` | `metadata` contenido |
|--------------|---------------------|
| `checkout_abandonado` | `{ checkout_id, service_name, amount_eur }` |
| `viabilidad_positiva` | `{ service_id, viabilidad_score, revenue_at_risk }` |
| `review_anomaly` | `{ anomaly_type, description, holded_document_id }` |
| `servicio_no_rentable` | `{ service_id, period, margin_pct, revenue_eur }` |
| `listo_para_presentar_urgente` | `{ days_remaining, service_name }` |
| `holded_desconectado` | `{ revoked_at, service_name }` |

## Display en Panel Gerente

Cada NBA muestra:
- Icono por `action_type` (❗ critica, ⚠️ alta, 📋 media, ℹ️ baja)
- Título + descripción breve
- Cliente / lead / expediente vinculado (con link)
- Tiempo desde creación ("hace 3h", "hace 2 días")
- Botón acción directa (si aplica: "Abrir expediente", "Ver cliente", "Responder WA")
- Botón "Descartar"

## Kia y las NBAs

Kia **puede** crear NBAs automáticamente (es el principal generador).  
Kia **no puede** cerrar ni descartar NBAs — solo Ksenia.  
Kia puede actualizar el `description` de una NBA existente si obtiene más contexto.

## Componentes

```
lib/nba/
  create-nba.ts         -- crea NBA con deduplicación
  close-nba.ts          -- cierra NBA cuando trigger desaparece
  nba-triggers.ts       -- funciones de evaluación de triggers (llamadas desde crons/webhooks)

components/admin/executive/
  NextBestActions.tsx   -- lista priorizada en Panel Gerente
  NbaItem.tsx           -- item individual con botones
```
