# Expedientes — Estados y Flujo de trabajo

> Última actualización: 2026-05-23  
> Fuente TypeScript: `lib/cases/case-status.ts`

## Estados permitidos

```typescript
type CaseStatus =
  | 'nuevo'
  | 'pendiente_cliente'
  | 'en_revision'
  | 'listo_para_presentar'
  | 'presentado'
  | 'finalizado'
  | 'bloqueado';
```

## Diagrama de transiciones

```
nuevo
  │
  ├──→ pendiente_cliente   (se piden documentos / acción del cliente)
  │          │
  │          └──→ en_revision   (gestor recibe documentos y revisa)
  │                    │
  │                    ├──→ pendiente_cliente  (faltan más cosas)
  │                    │
  │                    └──→ listo_para_presentar  (todo correcto)
  │                                │
  │                                └──→ presentado  (acción humana)
  │                                          │
  │                                          └──→ finalizado
  │
  └──→ bloqueado  (desde cualquier estado, por acción admin)
         │
         └──→ cualquier estado anterior  (al desbloquear)
```

## Definición de cada estado

### `nuevo`
- Expediente creado, sin acción aún.
- Fuentes: checkout Stripe, presupuesto aceptado, creación manual admin.
- Próxima acción automática: Kia genera NBA "revisar expediente nuevo".
- Tarea automática: "Revisar expediente nuevo — {service_name}" asignada a Ksenia.

### `pendiente_cliente`
- Gestor pide documentación o acción al cliente.
- Kia envía WhatsApp/email al cliente con la lista de documentos faltantes.
- NBA: "Recordar al cliente documentos pendientes" si >3 días sin respuesta.

### `en_revision`
- Gestor tiene los documentos y está revisando.
- Kia puede sugerir documentos faltantes comparando `received_documents_json` vs `checklist_json`.
- NBA interna: "Revisar expediente en revisión" si >5 días sin cambio de estado.

### `listo_para_presentar`
- Gestor ha revisado todo, está listo.
- **Requiere acción humana para pasar a `presentado`.**
- Kia notifica al cliente: "Tu expediente está listo para presentar."
- NBA: "Presentar expediente {service_name}" con urgencia alta si tiene fecha límite.

### `presentado`
- Trámite presentado ante la administración.
- Solo puede marcarse desde la UI admin (no automático).
- Kia notifica al cliente con confirmación.
- Rentabilidad: se cierra el evento de ingresos.

### `finalizado`
- Expediente completamente cerrado.
- Resolución recibida (o plazo cumplido sin respuesta).
- Solicita review al cliente si aplica.
- Snapshot de rentabilidad generado.

### `bloqueado`
- Expediente en pausa por motivo externo (requerimiento Hacienda, espera resolución, etc.).
- Siempre requiere `next_action` y motivo documentado.
- NBA crítica generada automáticamente.

## Reglas de transición

| Desde | Hacia | Quién | Automático |
|-------|-------|-------|------------|
| cualquiera | bloqueado | admin | No |
| bloqueado | cualquiera | admin | No |
| listo_para_presentar | presentado | admin | **No** — acción humana obligatoria |
| presentado | finalizado | admin | No |
| nuevo | pendiente_cliente | admin / Kia | Sí (al pedir documentos) |
| pendiente_cliente | en_revision | admin / sistema | Sí (al recibir documentos) |
| en_revision | listo_para_presentar | admin | No |
| en_revision | pendiente_cliente | admin / Kia | Sí (si faltan documentos) |

## Campos relacionados en `cases`

```sql
status          text CHECK (status IN ('nuevo','pendiente_cliente','en_revision',
                              'listo_para_presentar','presentado','finalizado','bloqueado'))
priority        text CHECK (priority IN ('baja','media','alta','critica'))
due_date        date nullable          -- para deadlines fiscales
next_action     text nullable          -- texto libre: "Pedir modelo 190"
assigned_to     uuid nullable          -- gestor responsable
```

## Creación automática de expedientes

Un expediente se crea **solo** cuando:

1. Checkout Stripe completado con éxito (`payment_intent.succeeded`).
2. Presupuesto aceptado y firmado (acción futura).
3. Admin lo crea manualmente desde el panel.

Un expediente **NO** se crea:
- Por conversación de WhatsApp casual.
- Por viabilidad positiva sin pago.
- Por un lead añadiendo servicios a la cesta sin pagar.

## Tareas automáticas por estado

| Evento | Tarea generada |
|--------|---------------|
| Caso creado (`nuevo`) | "Revisar nuevo expediente: {service_name}" |
| Caso → `pendiente_cliente` > 3 días | "Recordar al cliente: {client_name}" |
| Caso → `en_revision` > 5 días | "Revisar progreso: {service_name}" |
| Caso → `bloqueado` | "Gestionar bloqueo: {motivo}" — prioridad CRÍTICA |
| Caso `listo_para_presentar` con due_date < 7 días | "URGENTE: Presentar {service_name}" |

## Kia y los expedientes

Kia **puede**:
- Consultar el estado del expediente al cliente.
- Notificar cambios de estado al cliente.
- Sugerir documentos faltantes.
- Alertar sobre plazos próximos.
- Crear NBA relacionadas con el expediente.

Kia **no puede**:
- Cambiar el estado a `presentado` sin confirmación admin.
- Marcar un expediente como `finalizado` directamente.
- Crear expedientes definitivos por conversación.
- Eliminar o archivar expedientes.
