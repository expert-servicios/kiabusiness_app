# Dashboard Cliente — Estado de Empresa

> Última actualización: 2026-05-23  
> Ruta: `app/(protected)/dashboard/estado-empresa/page.tsx`  
> Acceso: solo clientes con plan mensual activo + Holded conectado

## Propósito

Dar al cliente una visión trimestral de su situación fiscal-contable basada en datos reales de Holded. No es contabilidad definitiva — es un resumen de situación.

## Reglas de acceso (gates)

```
¿Tiene plan mensual? (profiles.has_monthly_plan = true)
    │
    NO → Mostrar upsell: "Este panel está disponible para clientes con plan mensual"
    │    Botón: "Ver planes" → /servicios/empresas-autonomos/plan-avanzado
    │
    SÍ → ¿Tiene Holded conectado? (client_integrations WHERE provider='holded' AND status='active')
              │
              NO → Mostrar: "Conecta Holded para ver tu Estado de empresa"
              │    Botón: "Conectar Holded" → /dashboard/integraciones/holded
              │
              SÍ → Mostrar dashboard completo
```

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Estado de empresa                    [selector trimestre]  │
├───────────────┬───────────────┬────────────────────────────┤
│  Ventas       │  Gastos       │  IVA                        │
│  {total}      │  {total}      │  Repercutido: {X}           │
│               │               │  Soportado: {Y}             │
│               │               │  Resultado estimado 303: {Z}│
├───────────────┴───────────────┴────────────────────────────┤
│  Gráfica: Ventas vs Gastos por mes (barras apiladas)        │
├────────────────────────────────────────────────────────────-┤
│  Facturas emitidas [N]  ·  Facturas recibidas [N]          │
├─────────────────────────────────────────────────────────────┤
│  Documentos pendientes [N]   ·  Anomalías Kia [N]          │
├─────────────────────────────────────────────────────────────┤
│  Alertas destacadas                                         │
├─────────────────────────────────────────────────────────────┤
│  Insights de Kia                                            │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ Texto legal obligatorio                                 │
└─────────────────────────────────────────────────────────────┘
```

## Datos mostrados

### Ventas del trimestre
- Fuente: Holded API — `GET /invoicing/v1/invoices` filtrado por fecha
- Suma de `total` de facturas emitidas en el trimestre seleccionado
- Desglose por mes

### Gastos / Compras
- Fuente: Holded API — `GET /invoicing/v1/bills` o `purchases`
- Suma de facturas recibidas del trimestre

### IVA (resumen 303 estimado)
- **IVA repercutido**: SUM(base_imponible × tipo_iva) de facturas emitidas
- **IVA soportado**: SUM(base_imponible × tipo_iva) de facturas recibidas
- **Resultado estimado Modelo 303**: IVA repercutido − IVA soportado
- Si positivo → "A ingresar"
- Si negativo → "A compensar" o "A devolver"
- **Este cálculo es estimado. No equivale a la liquidación oficial.**

### Facturas emitidas / recibidas
- Conteo total del trimestre
- Lista de las últimas 5 (con enlace al detalle si existe)

### Bancos sin conciliar
- Fuente: GoCardless (Fase 6) o Holded banking si disponible
- Mensaje placeholder hasta Fase 6: "Conciliación bancaria disponible próximamente"

### Documentos pendientes
- Fuente: `document_classifications` WHERE client_id = user AND status = 'needs_review'
- Con lista resumida

### Anomalías detectadas por Kia
- Fuente: `next_best_actions` WHERE client_id = user AND action_type = 'review_anomaly'
- Se muestran solo las de prioridad media o alta al cliente
- Las críticas también generan notificación

### Evolución mensual
- Gráfica de barras: ventas vs gastos últimos 6 meses
- Fuente: `holded_sync_jobs` snapshots o queries directas a Holded

### Alertas
- Facturas vencidas no cobradas
- Declaraciones próximas (fuente: `fiscal_obligations`)
- Holded con error de sincronización
- Documentos pendientes de subir

### Insights de Kia
- Resumen en lenguaje natural generado por IA
- Basado en los datos del trimestre
- Ejemplo: "Este trimestre has facturado un 12% más que el anterior. El IVA a ingresar estimado es de 1.234 €. Tienes 2 facturas recibidas sin contabilizar."
- **Nunca inventa datos. Solo resume lo que hay.**

## Selector de trimestre (`QuarterSelector`)

Permite elegir:
- T1 (Ene-Mar)
- T2 (Abr-Jun)
- T3 (Jul-Sep)
- T4 (Oct-Dic)

Del año actual y del anterior.

## Componentes

```
components/dashboard/company-status/
  CompanyStatusDashboard.tsx   -- orquestador principal
  QuarterSelector.tsx          -- selector de trimestre
  VatSummaryCard.tsx           -- tarjeta IVA con 303 estimado
  SalesPurchasesChart.tsx      -- gráfica ventas vs gastos
  PendingDocumentsCard.tsx     -- documentos pendientes
  AnomaliesCard.tsx            -- anomalías Kia
  ReconciliationCard.tsx       -- bancos (placeholder hasta Fase 6)
  KiaInsightsCard.tsx          -- resumen IA trimestral
```

## Texto legal obligatorio (siempre visible)

> **Resumen estimado generado a partir de datos sincronizados con Holded.**  
> Pendiente de revisión profesional antes de presentar cualquier declaración.  
> EXPERT no modifica tu contabilidad sin confirmación explícita.

## Cuándo se sincronizan datos de Holded

- Sync automático: cada 24h para clientes activos (`holded_sync_jobs`)
- Sync manual: botón "Actualizar datos" en el dashboard
- Si último sync > 48h: alerta naranja "Datos desactualizados"
- Si sync fallido: alerta roja "Error de conexión con Holded"

## Privacidad y seguridad

- Los datos de Holded de un cliente **nunca** se mezclan con los de otro.
- La API key de Holded no se expone en ningún endpoint de frontend.
- El token de sesión del cliente no tiene acceso a la API key de Holded.
- Solo el service_role puede leer `encrypted_api_key`.
