# Rentabilidad de Servicios — Motor de Cálculo

> Última actualización: 2026-05-23  
> Tablas: `service_profitability_events`, `service_profitability_snapshots`

## Propósito

Permitir a Ksenia saber si cada servicio que presta es rentable, cuánto tiempo consume realmente, y qué precio sería el adecuado. No es contabilidad — es un sistema de gestión operativa.

## Modelo mental

```
Cada interacción con un caso o cliente genera un "evento de tiempo".
La suma de eventos = minutos estimados invertidos en ese caso.
Comparado con los ingresos del caso = margen estimado.
```

## Tabla `service_profitability_events`

```sql
CREATE TABLE service_profitability_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid REFERENCES cases(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES profiles(id),
  service_id      text NOT NULL,
  event_type      text NOT NULL,
  estimated_minutes int NOT NULL,
  source          text NOT NULL,  -- 'auto' | 'manual'
  operator        text,           -- 'kia' | 'admin' | 'system'
  created_at      timestamptz DEFAULT now()
);
```

## Tipos de evento y minutos estimados

| `event_type` | Minutos | Quién lo registra |
|-------------|---------|-------------------|
| `whatsapp_message_handled` | 1 | Auto (webhook) |
| `email_handled` | 3 | Auto (email processor) |
| `document_reviewed` | 5 | Auto (document-classifier) |
| `document_classified_manual` | 8 | Auto (admin reclasifica) |
| `case_status_changed` | 2 | Auto (case update) |
| `form_submitted` | 5 | Auto (portal) |
| `holded_sync_reviewed` | 10 | Auto (sync job anomaly) |
| `appointment_held` | 30 | Manual (admin confirma) |
| `tax_form_prepared` | 45 | Manual (admin) |
| `tax_form_filed` | 15 | Manual (admin) |
| `document_prepared` | 20 | Manual (admin) |
| `client_call` | 15 | Manual (admin) |
| `custom` | variable | Manual (admin, campo libre) |

## Coste por minuto

Variable de entorno o parámetro de configuración en Supabase:

```
COST_PER_MINUTE_EUR = 0.50  (30 €/hora → 0.50 €/min)
```

No es el sueldo real — es el coste de oportunidad estimado de Ksenia.

## Tabla `service_profitability_snapshots`

Generado periódicamente (al finalizar un caso y al fin de cada mes):

```sql
CREATE TABLE service_profitability_snapshots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id         text NOT NULL,
  period             text NOT NULL,  -- 'YYYY-MM' o case_id para snapshot de caso
  scope              text NOT NULL,  -- 'monthly' | 'case'
  case_id            uuid REFERENCES cases(id),
  total_revenue_eur  numeric(10,2) NOT NULL DEFAULT 0,
  total_minutes      int NOT NULL DEFAULT 0,
  total_cost_eur     numeric(10,2) NOT NULL DEFAULT 0,
  margin_eur         numeric(10,2) GENERATED ALWAYS AS (total_revenue_eur - total_cost_eur) STORED,
  margin_pct         numeric(5,2)  GENERATED ALWAYS AS (
                       CASE WHEN total_revenue_eur = 0 THEN 0
                       ELSE ROUND(((total_revenue_eur - total_cost_eur) / total_revenue_eur) * 100, 2)
                       END) STORED,
  margin_status      text NOT NULL,  -- 'rentable' | 'ajustado' | 'no_rentable' | 'revisar_precio'
  generated_at       timestamptz DEFAULT now()
);
```

## Reglas de `margin_status`

| Condición | `margin_status` |
|-----------|----------------|
| `margin_pct >= 40` | `rentable` |
| `margin_pct >= 20 AND < 40` | `ajustado` |
| `margin_pct >= 0 AND < 20` | `no_rentable` |
| `margin_pct < 0` (pérdida) | `no_rentable` |
| `total_revenue_eur = 0` | `revisar_precio` |

## Cuándo se genera un snapshot

1. **Al finalizar un caso** (`status → 'finalizado'`): snapshot de scope `'case'` para ese `case_id`.
2. **Fin de mes** (cron job): snapshot de scope `'monthly'` por `service_id`, agregando todos los casos del mes.
3. **Manual**: Admin puede forzar refresh desde el Panel Gerente.

## Flujo de registro de evento (auto)

```typescript
// lib/profitability/register-event.ts
async function registerProfitabilityEvent(params: {
  caseId: string;
  clientId: string;
  serviceId: string;
  eventType: ProfitabilityEventType;
  source: 'auto' | 'manual';
  operator?: 'kia' | 'admin' | 'system';
  customMinutes?: number;
}): Promise<void>
```

Llamado desde:
- `app/api/webhooks/whatsapp/route.ts` → `whatsapp_message_handled`
- `lib/documents/document-classifier.ts` → `document_reviewed`
- `lib/cases/update-case-status.ts` → `case_status_changed`
- `app/(protected)/admin/casos/[id]/page.tsx` → eventos manuales

## Display en Panel Gerente

Tabla `ProfitabilitySummary`:

| Servicio | Ingresos (mes) | Mins invertidos | Coste est. | Margen % | Estado |
|---------|---------------|-----------------|-----------|---------|--------|
| Gestión mensual empresa | 2.400 € | 960 min | 480 € | 80 % | 🟢 rentable |
| IRPF 2025 | 1.200 € | 800 min | 400 € | 67 % | 🟢 rentable |
| Arraigo social | 600 € | 720 min | 360 € | 40 % | 🟡 ajustado |
| Certificado digital | 300 € | 400 min | 200 € | 33 % | 🟡 ajustado |

Colores en UI: verde (`rentable`), amarillo (`ajustado`), rojo (`no_rentable`), naranja (`revisar_precio`).

## Limitaciones del modelo

- Los minutos son estimados, no reales (no hay time-tracking).
- El coste por minuto es un parámetro fijo, no refleja variación real de carga de trabajo.
- Un servicio "no rentable" puede serlo por volumen bajo — interpretar en contexto.
- Los servicios de plan mensual (`svc_gestion_mensual`) tienen ingresos recurrentes — el snapshot mensual acumula la cuota, no el precio de alta.

## Fuentes de ingresos por tipo de caso

| Tipo de servicio | Fuente de ingresos |
|-----------------|-------------------|
| Servicio puntual (IRPF, arraigo, etc.) | `orders.amount_eur` (pago único Stripe) |
| Plan mensual (gestión continua) | `orders.amount_eur` × meses activos (cuota mensual) |
| Servicio sin precio (presupuesto) | `orders.amount_eur` cuando se cierra presupuesto |

## Alertas automáticas por rentabilidad

Si en el snapshot mensual un servicio tiene `margin_status = 'no_rentable'`:
1. NBA creada: "Revisar precio de {service_name} — margen negativo en {period}"
2. Priority: `alta`
3. Se muestra en Panel Gerente con color rojo
4. Ksenia decide si subir precio, reducir tiempo invertido, o absorber pérdida

## Componentes

```
lib/profitability/
  register-event.ts          -- registra evento individual
  generate-snapshot.ts       -- genera snapshot de caso o mensual
  profitability-metrics.ts   -- queries para Panel Gerente

components/admin/executive/
  ProfitabilitySummary.tsx   -- tabla en Panel Gerente
```
