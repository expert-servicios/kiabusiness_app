# Kia Commercial Flow — Audit de arquitectura

Ultima revision: 2026-05-23

---

## Resumen ejecutivo

Kia es el asistente conversacional de EXPERT integrado en WhatsApp Business (WABA v20). El motor corre en `lib/integrations/kia-engine.ts` (~1 200 lineas) como maquina de estados pura en TypeScript. La API recibe mensajes WABA, los pasa al motor y devuelve respuestas interactivas (botones, listas). El webhook esta en produccion y funciona.

Este documento recoge el estado actual del flujo comercial de Kia, los gaps criticos encontrados y las decisiones de arquitectura que deben mantenerse.

---

## Actualizacion 2026-05-23

Estado aplicado:

- Kia ya no usa la escalacion humana como salida comercial normal. Servicios complejos, respuestas de riesgo, requerimientos, sanciones, denegaciones o dudas llevan a llamada/reunion de 15 minutos, viabilidad, informacion del servicio o checkout.
- `needs_review` queda reservado para fallo tecnico, fallo/vacio de IA, ambiguedad extrema, conversaciones ya tomadas por humano/admin o errores de validacion que requieren atencion manual real.
- `btn_write_here` abre `flow='consult'` / `step='free_consult'` y permite que Kia aclare antes de recomendar llamada.
- Cuando el servicio tiene checkout, Kia envia enlace a `/contratar?service={catalogSlug}&source=whatsapp`; el slug se resuelve desde `stripePriceId` para no enviar IDs internos tipo `svc_irpf`.
- `/contratar` exige login y muestra `ProfileCompletionWizard`.
- `POST /api/services/checkout` exige sesion backend, `profile_completed=true` y `billing_ready=true` antes de crear Stripe Checkout.
- `ProfileCompletionWizard` recoge nombre, telefono, NIF/NIE/CIF, tipo de cliente, direccion de facturacion y domicilio habitual cuando aplica.
- El webhook de Stripe conserva el pago aunque Holded falle: registra `paid_invoice_error`, `holded_sync_error`, `holded_sync_event_id` y `holded_invoice_id` cuando existe factura.
- `commercial review` de Kia no implica `flow='human'`; la reunion/cita es la via humana comercial.

Los apartados historicos siguientes se mantienen como auditoria original; cuando contradigan esta actualizacion, prevalece el estado 2026-05-23.

---

## Estado actual del flujo

### Flujo de bienvenida → CTA

```
welcome → ask_name → ask_email → main_menu → service_area → service → precal_* → precal_cta
```

- **28 servicios** definidos en el motor, 12 con flujo precal (arraigo social/familiar/laboral, reagrupacion, renovacion residencia, nacionalidad espanola/menor, permiso inicial, IRPF, alta autonomo, certificados).
- **Bilingue** (ES/RU): el motor detecta idioma por seleccion inicial.
- **Captura de nombre y email** al inicio del flujo.
- **`precal_cta`** ofrece tres botones: `btn_check_viability`, `btn_pay_now`, `btn_book_call`.

### Paso de pago (precal_cta → btn_pay_now)

- El motor ejecuta el side effect `sendPaymentLink` desde `kia-engine.ts`.
- Este side effect **no valida autenticacion** del usuario — envia el link de pago directamente via WABA.
- No existe ruta `app/(public)/contratar/page.tsx` que sirva de gateway de pago con login obligatorio.
- No existe `ProfileCompletionWizard` para capturar datos antes de pagar.

---

## Decisiones de arquitectura (NO cambiar sin revisar)

| Regla | Razon |
|---|---|
| Login obligatorio antes de pago | No cobrar visitantes anonimos; enlazar pago a perfil |
| No crear Stripe Checkout desde frontend sin backend | Seguridad: validacion en servidor |
| Stripe cobra, Holded factura | Stripe no es sistema fiscal; Holded genera facturas legales |
| Kia es el unico widget flotante | Eliminar Calendly flotante (completado 2026-05-22) |
| No enviar pago automatico tras viabilidad | Siempre pedir confirmacion del usuario |
| No pedir justificantes al inicio | Primero datos, luego documentacion |
| Llamada 15 min solo preventa | No es asesoria completa |
| No duplicar perfil en tablas inconexas | Un solo perfil en `profiles` |
| No campanas fiscales hardcodeadas sin fecha fin | Usar sistema de tips con fecha de expiracion |
| No romper webhook WABA actual | El webhook en produccion no debe modificarse sin pruebas |

---

## Gaps criticos encontrados

### S1 — Tabla `viability_assessments` no existe

- **Impacto:** El resultado de la precalificacion no se persiste. La IA calcula viabilidad pero nada queda registrado.
- **Accion:** Crear migracion Supabase con `viability_assessments(id, lead_id, service_slug, score, factors, created_at)`.
- **Prioridad:** Alta.

### S2 — Tabla `fiscal_obligations` no existe

- **Impacto:** El contexto fiscal de Kia (`lib/integrations/kia-engine.ts`) intenta consultar esta tabla; genera error silencioso.
- **Accion:** Crear migracion o eliminar la query si no hay datos reales.
- **Prioridad:** Alta.

### S3 — `orders.quote_id NOT NULL` bloquea pagos del catalogo

- **Impacto:** El webhook Stripe intenta crear una fila en `orders` tras pago directo de servicio de catalogo. Falla en silencio porque no hay `quote_id`.
- **Accion:** Hacer `quote_id` nullable y permitir `source: 'catalog_checkout'`.
- **Prioridad:** Alta.

### M1 — Checkout sin autenticacion

- **Impacto:** `client_reference_id` no se pasa a Stripe. No es posible asociar un pago a un usuario registrado.
- **Accion:** Exigir sesion activa en `/api/services/checkout`; pasar `client_reference_id: userId`.
- **Prioridad:** Media.

### M2 — `ProfileCompletionWizard` no existe

- **Impacto:** El flujo planificado (Kia → login → completar perfil → pagar) esta bloqueado en el paso del wizard.
- **Accion:** Crear componente en `components/profile/ProfileCompletionWizard.tsx`.
- **Prioridad:** Media.

### M3 — `lib/data/kia-contextual-tips.ts` no existe

- **Impacto:** El sistema de tips con fecha de expiracion planificado no puede ejecutarse.
- **Accion:** Crear el archivo con estructura `{ id, text, validFrom, validTo, serviceSlug? }[]`.
- **Prioridad:** Media.

### M4 — `lib/services/service-registry.ts` no existe

- **Impacto:** No hay fuente centralizada de servicios que una catalogo web + Kia + precal + checkout.
- **Accion:** Crear registro que exporte `ServiceDefinition[]` con campos de catalog, Kia y checkout.
- **Prioridad:** Media.

### M5 — Ruta `app/(public)/contratar/page.tsx` no existe

- **Impacto:** No hay gateway de contratacion con login obligatorio para flujos iniciados desde Kia.
- **Accion:** Crear la ruta con middleware de proteccion y redirect post-login.
- **Prioridad:** Media.

---

## Flujo objetivo (post-implementacion)

```
WABA → Kia precal_cta → btn_pay_now
  → API envia link https://expertconsulting.es/contratar?service=arraigo-social&token=...
  → /contratar verifica sesion
    → no sesion: redirect a /acceso?next=/contratar&service=...
    → sesion activa: ProfileCompletionWizard (nombre, telefono, NIE si aplica)
    → checkout: POST /api/services/checkout con client_reference_id=userId
    → Stripe Checkout
    → /gracias/pago
    → webhook Stripe: crea order + case (draft)
    → sync Holded: crea contacto + factura
```

---

## Widget flotante

### Antes de 2026-05-22

```tsx
<div className="fixed bottom-5 right-5 z-[70] flex flex-col items-center gap-3">
  <CalendlyFloatingButton url={CALENDLY_REUNION} />  {/* eliminado */}
  <WhatsAppChatWidget />
</div>
```

### Despues de 2026-05-22

```tsx
<div className="fixed bottom-5 right-5 z-[70] flex flex-col items-center gap-3">
  <WhatsAppChatWidget />
</div>
```

Calendly no se elimina del producto — solo desaparece el boton flotante. Los enlaces de reunion de Calendly pueden seguir apareciendo en emails transaccionales o en el dashboard de cliente cuando sea necesario solicitar una llamada de soporte.

---

## Archivos clave del sistema Kia

| Archivo | Proposito |
|---|---|
| `lib/integrations/kia-engine.ts` | Motor de estados (~1 200 lineas) |
| `app/api/waba/webhook/route.ts` | Entrada de mensajes WABA |
| `app/api/waba/send/route.ts` | Envio de mensajes WABA |
| `lib/integrations/waba.ts` | Cliente API Meta WABA v20 |
| `lib/data/services-kia.ts` (si existe) | Definiciones de servicio para Kia |
| `components/site/WhatsAppChatWidget.tsx` | Widget flotante WhatsApp |

---

## Historial de decisiones

| Fecha | Decision |
|---|---|
| 2026-05-22 | Eliminado CalendlyFloatingButton de layout publico |
| 2026-05-22 | Confirmado: Kia es el unico punto de entrada flotante |
| 2026-05-22 | Definido flujo objetivo con login obligatorio antes de pago |
| 2026-05-22 | Identificados gaps S1, S2, S3, M1–M5 pendientes de implementacion |
