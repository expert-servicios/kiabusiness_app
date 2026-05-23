# Panel Gerente — Executive Dashboard

> Última actualización: 2026-05-23  
> Ruta: `app/(protected)/admin/executive/page.tsx`  
> Acceso: role = owner | admin

## Propósito

Dar a Ksenia una visión diaria de toda la operación de EXPERT en una sola pantalla. Sustituye o amplía el concepto de "resumen de estado" del admin actual.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Panel Gerente                          [fecha] [refresh]   │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Comercial   │  Operativo   │  Contable    │  Comunicación │
│  [6 KPIs]    │  [7 KPIs]    │  [6 KPIs]   │  [5 KPIs]     │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  Rentabilidad                                               │
│  [tabla: servicio | ingresos | margen | estado]            │
├─────────────────────────────────────────────────────────────┤
│  Qué hacer ahora                                           │
│  [lista priorizada de Next Best Actions]                   │
└─────────────────────────────────────────────────────────────┘
```

## Bloques y métricas

### 1. Resumen Comercial (`CommercialSummary`)

| Métrica | Fuente | Período |
|---------|--------|---------|
| Leads nuevos | `leads` WHERE created_at > 7d | 7 días |
| Leads calientes | `leads` WHERE state = 'contacted' | activos |
| Viabilidades completadas | `kia_reports` | 7 días |
| Readiness Holded completados | `service_readiness_assessments` | 7 días |
| Pagos pendientes | `checkout_sessions` WHERE status = 'pending' | activos |
| Checkouts no pagados (>24h) | `checkout_sessions` WHERE created_at < 24h ago AND status != 'completed' | activos |
| Llamadas preventa solicitadas | `appointments` WHERE type = 'presale' AND status = 'pending' | activos |
| Servicios contratados esta semana | `orders` + `cases` | 7 días |
| Servicios contratados este mes | `orders` + `cases` | 30 días |
| Ingresos cobrados | `pagos_expert` WHERE status = 'paid' | mes actual |
| Ingresos previstos | `orders` WHERE status = 'pending' | mes actual |

### 2. Resumen Operativo (`OperationsSummary`)

| Métrica | Fuente |
|---------|--------|
| Expedientes nuevos | `cases` WHERE status = 'nuevo' |
| Expedientes pendiente_cliente | `cases` WHERE status = 'pendiente_cliente' |
| Expedientes en_revision | `cases` WHERE status = 'en_revision' |
| Expedientes bloqueados | `cases` WHERE status = 'bloqueado' |
| Expedientes listo_para_presentar | `cases` WHERE status = 'listo_para_presentar' |
| Expedientes presentados (mes) | `cases` WHERE status = 'presentado' AND updated_at > 30d |
| Expedientes finalizados (mes) | `cases` WHERE status = 'finalizado' AND updated_at > 30d |
| Tareas vencidas | `internal_tasks` WHERE due_date < today AND status != 'completada' |
| Tareas próximas 7d | `internal_tasks` WHERE due_date < 7d AND status = 'pendiente' |
| Documentos pendientes revisión | `document_classifications` WHERE status = 'needs_review' |

### 3. Resumen Contable/Fiscal (`FiscalAccountingSummary`)

| Métrica | Fuente |
|---------|--------|
| Clientes plan mensual activos | `profiles` WHERE has_monthly_plan = true |
| Clientes Holded conectados | `client_integrations` WHERE provider='holded' AND status='active' |
| Clientes Holded con error | `client_integrations` WHERE provider='holded' AND status='failed' |
| Clientes sin sync reciente (>7d) | `client_integrations` WHERE last_sync_at < 7d |
| Resúmenes 303 generados (trim.) | `kia_reports` WHERE service_id LIKE '%303%' + `kia_sessions` data |
| Anomalías críticas | `next_best_actions` WHERE action_type='review_anomaly' AND priority='critica' |
| Bancos sin conciliar | GoCardless data (Fase 6) |
| Documentos contables pendientes | `document_classifications` WHERE detected_type IN ('factura_emitida','factura_recibida','excel_contable') AND status='needs_review' |

### 4. Resumen de Comunicación (`CommunicationSummary`)

| Métrica | Fuente |
|---------|--------|
| WhatsApp sin responder | `whatsapp_conversations` WHERE needs_review=true AND direction='inbound' |
| Gmail sin responder | `email_threads` WHERE needs_reply=true |
| Mensajes que requieren acción | SUM de los dos anteriores |
| Conversaciones nuevas hoy | `whatsapp_conversations` WHERE created_at > today |
| Mensajes vinculados a expedientes | `whatsapp_conversations` WHERE case_id IS NOT NULL |
| Documentos recibidos por WhatsApp | `document_classifications` WHERE source='whatsapp' AND created_at > 7d |

### 5. Resumen de Rentabilidad (`ProfitabilitySummary`)

Tabla con columnas: Servicio | Ingresos (mes) | Minutos estimados | Margen % | Estado

| Campo | Fuente |
|-------|--------|
| Ingresos por servicio | `service_profitability_snapshots` GROUP BY service_id |
| Minutos estimados | `service_profitability_events` SUM estimated_minutes |
| Margen estimado | revenue - (minutes × cost_rate) |
| Estado | `margin_status` del snapshot |

Colores:
- `rentable` → verde
- `ajustado` → amarillo
- `no_rentable` → rojo
- `revisar_precio` → naranja

### 6. Próxima Mejor Acción (`NextBestActions`)

Lista ordenada de `next_best_actions` WHERE status='open', ordenada por:
1. `priority` = 'critica' primero
2. `due_at` ASC
3. Impacto económico (`metadata.revenue_at_risk`)
4. Antigüedad (`created_at` ASC)

Cada item muestra:
- Icono por `action_type`
- Título + descripción breve
- Cliente / expediente vinculado
- Botón de acción directa (si aplica)
- Botón "Descartar"

## Componentes

```
components/admin/executive/
  ExecutiveOverview.tsx        -- página completa, orquesta todos
  CommercialSummary.tsx        -- bloque comercial
  OperationsSummary.tsx        -- bloque operativo
  FiscalAccountingSummary.tsx  -- bloque contable/fiscal
  CommunicationSummary.tsx     -- bloque comunicación
  ProfitabilitySummary.tsx     -- tabla de rentabilidad
  NextBestActions.tsx          -- lista de NBAs priorizada
  KpiCard.tsx                  -- tarjeta genérica de KPI
```

## Datos: cómo cargar

El servidor (`page.tsx`) ejecuta N queries en paralelo:

```typescript
const [commercial, operational, fiscal, communication, profitability, nba] =
  await Promise.all([
    fetchCommercialMetrics(admin),
    fetchOperationalMetrics(admin),
    fetchFiscalMetrics(admin),
    fetchCommunicationMetrics(admin),
    fetchProfitabilityMetrics(admin),
    fetchNextBestActions(admin),
  ]);
```

Cada función es un archivo en `lib/admin/metrics/`:
- `commercial-metrics.ts`
- `operational-metrics.ts`
- `fiscal-metrics.ts`
- `communication-metrics.ts`
- `profitability-metrics.ts`

## Refresco

- El panel se refresca con `router.refresh()` al hacer clic en el botón de actualizar.
- No hay polling automático (evitar coste Supabase).
- Los KPIs críticos (NBA, WhatsApp sin responder) se muestran con timestamp "hace X minutos".
- Futuro: Supabase Realtime para notificaciones push de cambios críticos.

## Acceso y seguridad

- Ruta protegida: solo role = 'owner' | 'admin'.
- Datos sensibles (revenue, márgenes) no se exponen al cliente.
- Los datos de Holded en este panel son solo conteos/estados, nunca datos financieros raw de otras empresas.
