# EXPERT OS — Roadmap

> Última actualización: 2026-05-23  
> Estado: Aprobado · En implementación

## Visión

EXPERT OS convierte la gestoría en una plataforma digital operativa donde:

- **EXPERT** es la fuente de verdad de clientes, expedientes, documentos, comunicaciones, tareas, pagos y dashboards.
- **Holded** actúa exclusivamente como motor contable/fiscal para clientes con plan mensual activo.
- **Stripe** gestiona cobros.
- **GoCardless** gestiona conexión bancaria y movimientos.
- **Kia** es el asistente inteligente que capta, clasifica, detecta y opera.

## Decisiones cerradas (no reabrir sin aprobación)

| # | Decisión | Detalle |
|---|----------|---------|
| 1 | No duplicar CRM | EXPERT es el único CRM. No usar Holded CRM/Projects. |
| 2 | No clientes puntuales + Holded | Solo clientes con plan mensual activo conectan Holded. |
| 3 | No presentar impuestos automáticamente | Kia detecta y resume. La presentación es acción humana. |
| 4 | No modificar contabilidad sin validación | Cualquier cambio en Holded requiere confirmación del gestor. |
| 5 | No crear expediente por conversación casual | Expediente nace al contratar, al aceptar presupuesto, o por acción manual admin. |
| 6 | Estados de expediente cerrados | Los 7 estados listados en case-status.md son los únicos. |
| 7 | Tareas asignadas a Ksenia por defecto | Modelo preparado para equipo. `assigned_to` nullable. |
| 8 | API key Holded no expuesta | Nunca en logs, nunca en frontend, nunca en WhatsApp. |
| 9 | Kia no inventa datos de dashboard | Todo dato del Estado de empresa proviene de Holded sincronizado. |
| 10 | Sin Holded conectado → sin checkout mensual | Integración activa es prerequisito del checkout de plan mensual. |

## Fases de implementación

### Fase 1 — Base operativa
**Prioridad: CRÍTICA**

- [ ] Migration: tabla `cases` actualizada (estados + campos nuevos)
- [ ] Migration: tabla `internal_tasks`
- [ ] `lib/cases/case-status.ts` — constante de estados
- [ ] `lib/auth/roles.ts` — helpers de permisos
- [ ] Bloqueo checkout plan mensual sin Holded activo
- [ ] Holded obligatorio en flujo de alta plan mensual (Kia + portal)

### Fase 2 — Clasificación documental
**Prioridad: ALTA**

- [ ] Migration: tabla `document_classifications`
- [ ] `lib/documents/document-classifier.ts`
- [ ] `lib/documents/document-router.ts`
- [ ] `lib/documents/document-extractor.ts`
- [ ] Integración webhook WhatsApp → clasificación automática
- [ ] Integración Gmail → clasificación automática
- [ ] UI admin: bandeja de documentos pendientes de revisión
- [ ] UI admin: corrección de clasificación

### Fase 3 — Dashboard cliente "Estado de empresa"
**Prioridad: ALTA**

- [ ] `app/(protected)/dashboard/estado-empresa/page.tsx`
- [ ] Componentes `components/dashboard/company-status/`
- [ ] Lógica de upsell para no-mensuales
- [ ] Bloqueo con mensaje "Conecta Holded"
- [ ] Snapshot trimestral de datos Holded

### Fase 4 — Panel Gerente + Next Best Actions
**Prioridad: ALTA**

- [ ] `app/(protected)/admin/executive/page.tsx`
- [ ] Componentes `components/admin/executive/`
- [ ] Migration: tabla `next_best_actions`
- [ ] Engine NBA (Next Best Actions) automático
- [ ] Alertas globales en Panel Gerente

### Fase 5 — Rentabilidad automática
**Prioridad: MEDIA**

- [ ] Migration: `service_profitability_events`
- [ ] Migration: `service_profitability_snapshots`
- [ ] `lib/profitability/profitability-rules.ts`
- [ ] `lib/profitability/profitability-calculator.ts`
- [ ] Hooks en webhook WhatsApp, Gmail, changes de estado
- [ ] Panel admin: ranking de servicios por margen

### Fase 6 — Anomalías + conciliación avanzada
**Prioridad: MEDIA-BAJA**

- [ ] Motor de detección de anomalías contables
- [ ] Matching Stripe / GoCardless / Holded
- [ ] Kia contable avanzada (resúmenes 303, alertas críticas)

## Integraciones activas

| Sistema | Rol | Acceso |
|---------|-----|--------|
| Supabase | Base de datos + Auth + Storage | service_role |
| Holded | Contabilidad/fiscal (solo plan mensual) | encrypted API key |
| Stripe | Cobros | webhook + API key |
| GoCardless | Bancos (futuro) | webhook + OAuth |
| Meta WABA | WhatsApp entrante/saliente | webhook HMAC |
| Gmail / Google Workspace | Correo operativo | OAuth token |
| Anthropic/OpenAI | IA (Kia) | API key |

## Límites del sistema

- EXPERT **no** es Holded. No gestiona contabilidad en double-entry.
- EXPERT **no** es un sistema de RR.HH.
- EXPERT **no** presenta declaraciones. Prepara y alerta.
- Kia **no** reemplaza al gestor. Reduce su carga.
