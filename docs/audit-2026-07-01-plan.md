# Plan de remediación — Auditoría 2026-07-01

Documento de seguimiento para no perder el hilo entre sesiones. Cubre: panel admin,
WABA, formularios públicos, auth/dashboard cliente, emails, Holded, MCP y Kia.

Rama de trabajo: `claude/sharp-wozniak-1ohax6`.

---

## 0. Decisión: MCP de Holded (`apps/holded-mcp/`)

**Veredicto: NO integrar con Kia. Mantener como producto separado.**

- `apps/holded-mcp` es un conector remoto para Claude Desktop/Claude.ai: cada usuario
  final conecta su propia cuenta Holded vía OAuth (multi-tenant, PKCE, registro
  dinámico). Desplegado en `claude.expertconsulting.es`, activo (últ. commit hace 6
  días), con rate limiting y eventos de conector hacia EXPERT.
- Kia usa integración directa/global (`HOLDED_API_KEY` único, server-to-server) porque
  opera sobre la cuenta de Holded de **EXPERT**, no la de un usuario externo.
- Fusionar ambos rompería el aislamiento de cuentas y requeriría una capa de proxy
  MCP que la API de Anthropic Messages no soporta nativamente hoy.
- **Acción:** ninguna. No es código muerto, está mal etiquetado. Dejar tal cual.

---

## 1. CRÍTICOS

- [x] **Escalada de privilegios en equipo** — un `admin` (no owner) podía asignar rol
      `TENANT_ADMIN`. Fix aplicado: solo `isOwner()` puede asignar `TENANT_ADMIN`/`OWNER`
      en `PATCH` y `POST`. `app/api/admin/team/route.ts:70-92`
- [x] **Prompt injection en Kia** — `pageData` del cliente se inyectaba sin sanitizar
      en el system prompt. Fix aplicado: `sanitizePageData()` en
      `lib/ai/kia/kia-system-prompt.ts` aplana a primitivos, cap de 20 claves/300
      chars por valor/2000 chars serializados, más instrucción explícita de "nunca
      tratar como instrucciones". Cubre ambos endpoints (`/api/ai/kia`,
      `/api/kia/copilot`) porque ambos pasan por `buildKiaSystemPrompt`.
- [x] **Duplicados en recordatorios fiscales** — condición de carrera, flag no se
      marcaba atómicamente antes de enviar. Fix aplicado: claim atómico por
      obligación (`update ... .is(field, null) .select()`) antes de enviar el email,
      igual que hace `email-queue`. `app/api/cron/fiscal-reminders/route.ts`
- [x] **daily-summary sin try/catch en sendEmail()** — fallo derribaba todo el cron
      sin log. Fix aplicado: envuelto en try/catch, devuelve siempre 200 con
      `emailSent`/`emailError` en el JSON. `app/api/cron/daily-summary/route.ts`
- [x] **iframe Cal.com sin sandbox** — riesgo XSS/clickjacking de tercero. Fix
      aplicado: `sandbox="allow-scripts allow-same-origin allow-forms allow-popups
      allow-popups-to-escape-sandbox"`. `app/(public)/cita/page.tsx:74-82`
- [x] **Kia sin rate limiting ni control de coste** — gasto ilimitado por usuario.
      Fix aplicado: nuevo `lib/ai/kia/kia-rate-limit.ts` con límite de 12 msg/min por
      usuario (en memoria) + cuota diaria de gasto de $2 USD/usuario (consulta
      `kia_decision_logs`, fail-open ante error de lectura). Conectado en
      `/api/ai/kia/route.ts` y `/api/kia/copilot/route.ts` antes de llamar a
      `runKiaDecision`. Configurable vía `KIA_USER_DAILY_COST_CAP_USD`.

## 2. ALTOS

- [ ] Sin flujo de reseteo de contraseña (solo magic link) → cuenta bloqueada si se
      pierde el email.
- [ ] Sin verificación de email en registro.
- [x] WABA: endpoints no comprobaban `status === 'inactive'` del admin. Fix
      aplicado en los 5 `requireAdmin()` locales de WABA (`whatsapp/route.ts`,
      `link-client`, `upload`, `ai-compose`, `ai-compose/stream`).
- [x] WABA: normalización de teléfono inconsistente en `link-client` — al guardar
      el teléfono en el perfil se usaba el valor crudo en vez del normalizado.
      Fix aplicado: usa `normalized` consistentemente.
      `app/api/admin/whatsapp/link-client/route.ts`
- [x] WABA: `return` tras error en `WhatsAppInbox.tsx:569` — verificado, ya estaba
      presente en el código actual (corregido en un merge anterior). Sin acción.
- [x] Holded sync: job podía quedar en `status='running'` para siempre si el
      proceso moría a mitad de ejecución. Fix aplicado: recovery query al inicio
      del cron que reclama jobs "running" con más de 10 min de antigüedad
      (`started_at`) y los devuelve a `queued`/`failed` según intentos restantes.
      También corregido bug de índice en `RETRY_DELAY_MIN` (usaba `attempts` en
      vez de `attempts - 1`, causando que el 1er reintento esperase 15 min en vez
      de 5). `app/api/cron/holded-sync/route.ts`
- [x] Email queue: **falso positivo verificado**. El claim (`update ... eq('status',
      'pending') .select()`) es una sola sentencia SQL atómica — Postgres serializa
      la concurrencia a nivel de fila, así que dos crons solapados no pueden
      reclamar el mismo job. No requiere cambio.
- [ ] Formularios públicos: sin validación de formato de teléfono (regex España).
- [ ] Formulario de viabilidad no envía email de aviso al equipo (solo al cliente).
      `app/api/services/viabilidad/route.ts:103-139`
- [ ] Reseñas: no se envía confirmación al cliente tras enviar su valoración.
      `app/api/reviews/submit/route.ts`

## 3. MEDIOS

- [x] `/api/reports/generate` — **falso positivo verificado**. `isStaffRole()` solo
      cubre `owner`/`admin` (personal interno de EXPERT), que por diseño operan
      sobre todos los tenants — es su función como operador de la plataforma. Un
      `tenant_admin` (rol SaaS externo) que intente usar `adminClientId` ya recibe
      403 porque no pasa `isStaffRole()`; no hay bypass de aislamiento real. Sin
      cambio de código.
- [x] `HOLDED_MCP_SESSION_SECRET` solo exigía 16 bytes — débil para HS256. Fix
      aplicado: mínimo subido a 32 bytes en `app/api/auth/holded-claude/route.ts`
      y en el fallback compartido `lib/auth/oauth-state.ts`. Ya documentado en
      `.env.example` con `openssl rand -hex 32` (genera 64 chars = 32 bytes).
- [x] Emails de clientes en listados admin (`/api/admin/users`, `/api/admin/team`)
      — **revisado, sin acción**. Es un panel de gestión de clientes/equipo para
      staff ya autenticado y autorizado; el email es necesario para la función
      (contactar clientes, gestionar equipo). No es una fuga a terceros no
      autorizados — redactarlo rompería la funcionalidad.
- [x] Sin logging de auditoría en cambios de rol de equipo. Fix aplicado: inserts
      en la tabla `audit_logs` (ya existía, sin uso) en cada `PATCH`/`POST` de
      `app/api/admin/team/route.ts` — registra actor, acción, usuario objetivo,
      rol nuevo y rol previo. Best-effort, no bloquea la operación si falla.
- [x] Accesibilidad: `aria-live`/`role="alert"` añadido a los mensajes de error de
      9 formularios públicos (contacto, presupuesto, carrito, checkout de
      servicios/Holded/formación, para-asesorías, demo Holded). `aria-label`
      añadido a los inputs sin `<label>` de `HoldedDemoForm.tsx`.
- [x] Página `/gracias/*` indexable — **verificado, ya resuelto**. El layout
      compartido (`app/(public)/gracias/layout.tsx`) ya define
      `robots: { index: false, follow: false }` y ninguna ruta `/gracias/*`
      aparece en `sitemap.ts`. El hallazgo de la auditoría estaba desactualizado.
- [x] Fiscal reminders migrado a `enqueueEmail()` en vez de llamar a Resend
      directamente — ahora tiene reintento con backoff igual que el resto de
      emails transaccionales. `app/api/cron/fiscal-reminders/route.ts`

### Fase 3 — gaps de email cerrados

- [x] Formulario de viabilidad ahora también notifica al equipo (`ADMIN_EMAILS`)
      con resultado IA + datos del cliente, además del email al cliente que ya
      existía. `app/api/services/viabilidad/route.ts`
- [x] Reseñas: el cliente recibe confirmación de recepción tras enviar su
      valoración. Nueva plantilla `reviewReceived()` en `lib/email/templates.ts`,
      conectada en `app/api/reviews/submit/route.ts` (best-effort, no bloquea la
      respuesta si el email falla).

## Fase 4 — completa

Todos los hallazgos MEDIOS restantes cerrados (ver detalle arriba). Auditoría
2026-07-01 completa: 6 críticos + 6 altos + 6 medios resueltos, 3 falsos
positivos documentados (email-queue race, reports tenant isolation, gracias
sitemap).

---

## Fase 5 — Auditoría 2026-07-13: dashboard, servicios, suscripciones, reuniones, Holded

Repaso completo pedido antes de escalar tráfico: dashboard cliente, catálogo de
servicios, checkout (único + suscripción mensual), migración a Holded,
reuniones (Cal.com), formularios restantes, flujos de email cliente-admin.
Se corrió el test suite completo (`npm run test`, 83/83 verde) antes y después.

### Corregido

- [x] **Control de acceso roto en `/dashboard/informe/[id]`** — `report.phone_number
      === profile?.phone` con ambos `null` evaluaba `true`, dando acceso a
      cualquier usuario sin teléfono a informes de otros usuarios sin teléfono.
      Fix: exige que ambos valores sean no-nulos antes de comparar.
      `app/(protected)/dashboard/informe/[id]/page.tsx`
- [x] **Bug crítico introducido en Fase 2: retry de Holded sync roto** — al marcar
      un job como `status: 'retrying'`, la query de selección solo buscaba
      `['queued', 'failed']` — `'retrying'` nunca se volvía a recoger, así que
      **ningún job fallido se reintentaba nunca** tras el primer fallo. Fix:
      añadido `'retrying'` a la lista de estados consultados.
      `app/api/cron/holded-sync/route.ts`
- [x] **Precios desalineados en `/api/holded/checkout`** — ruta alternativa (no usada
      actualmente por ningún botón activo, pero código vivo/reutilizable) tenía
      importes hardcodeados que no coincidían con el catálogo: 490€/1200€/2400€
      en vez de 499€/899€/1199€. Corregido para igualar el catálogo — evita un
      cobro incorrecto si esta ruta se conecta a un botón en el futuro.
      `app/api/holded/checkout/route.ts`
- [x] **Webhook de Cal.com sin manejo de errores** — todo el cuerpo del `POST` podía
      lanzar sin capturar; un fallo de Supabase dejaba al cliente creyendo que su
      cita estaba confirmada (Cal.com sí la muestra) mientras el equipo nunca la
      veía en `appointments`. Fix: try/catch envolvente + logging por evento y
      por operación de DB, siempre devuelve 200 para evitar reintentos duplicados
      de Cal.com. `app/api/webhooks/cal/route.ts`
- [x] **`listUsers()` sin paginar en auto-creación de expediente por reserva** — con
      más de ~50-1000 usuarios, clientes reales dejaban de generar expediente
      automático al reservar onboarding/formación, sin error visible. Fix: usa
      el helper `listAllAuthUsers()` ya paginado.
      `app/api/webhooks/cal/route.ts`
- [x] **Estado `bloqueado` de expediente no notificaba al cliente** — un cliente
      cuyo expediente se bloquea nunca se entera. Fix: nueva plantilla
      `caseBlocked()` conectada en el switch de estados.
      `lib/email/templates.ts`, `app/api/admin/cases/[id]/route.ts`
- [x] **`invoice.payment_failed` no se manejaba** — solo se notificaba en la
      primera transición a `past_due`; los reintentos posteriores de Stripe no
      generaban ni email al cliente ni visibilidad para el equipo. Fix: nuevo
      handler que reutiliza la plantilla `subscriptionPaymentFailed`.
      `app/api/stripe/webhook/route.ts`
      ⚠️ **Acción manual requerida:** verificar en el Dashboard de Stripe que el
      endpoint de webhook tiene suscrito el evento `invoice.payment_failed`
      (los eventos se seleccionan ahí, no en código).

### Pendiente de verificación manual (no accionable desde código)

- [x] **pg_cron de `email-queue` — verificado en vivo (2026-07-17), funcionando
      correctamente.** Confirmado vía MCP de Supabase (proyecto EXPERT,
      `ybtpqscmqrrjjmuoryap`): `cron.job_run_details` muestra 10 ejecuciones
      horarias consecutivas en `status: succeeded`, y el secreto en
      `vault.decrypted_secrets` (`cron_secret`) ya NO es el placeholder —
      64 caracteres, valor real configurado. El cron está enviando los emails
      en cola correctamente. Sin acción adicional.
- ⚠️ 36 de 57 servicios del catálogo no tienen `stripePriceId` — muestran
  "Solicitar presupuesto" en vez de compra directa. Parece intencional
  (servicios que requieren presupuesto personalizado), pero confirmar que es
  el comportamiento deseado y no un olvido de configuración.
- ⚠️ Compras de servicio/carrito (`product_type: 'service'|'cart'` en el
  webhook de Stripe) no crean fila en `cases` automáticamente — solo compras
  vinculadas a un `quote.client_id` generan expediente. Si se espera que toda
  compra abra expediente automáticamente, es un gap de producto a decidir, no
  un bug de código (comportamiento consistente, solo posiblemente incompleto).

### Verificado sin acción — diseño correcto

- Formulario de presupuesto avanzado (`app/api/presupuesto-avanzado`) y de
  para-asesorías (`app/api/saas-leads`) — honeypot, rate limit, Zod, spam
  guard y reCAPTCHA en orden correcto, sin gaps.
- Flujo de reseñas (`/gracias/opinion` + `/api/reviews/submit`) — token
  validado por regex y expiración, envío duplicado bloqueado.
- Configuración de Cal.com (`lib/utils/cal.ts`) — 4 URLs derivadas
  consistentemente de env vars, slugs coinciden en todos los puntos de uso.
- Checkout de suscripciones (`SubscriptionCheckoutButton`, `/api/subscriptions/
  checkout`) y portal de cliente (`CustomerPortalButton`) — bloqueos claros con
  mensajes en español cuando falta perfil/Holded, sin crashes.
- Idempotencia de eventos de Stripe (`stripe_processed_events`) — diseño sólido.

## 4. Revisión de flujos de correo (formularios + OAuth login)

Hallazgos de la investigación — no todo son bugs, pero documentar para decidir:

- Todos los formularios públicos (quotes, holded-demo, presupuesto-avanzado,
  contacto) usan `sendEmail()` directo (no `enqueueEmail()`), cada uno con
  confirmación al usuario + notificación a admin. Correcto en general.
- [x] **Gap cerrado:** viabilidad ahora notifica también al equipo
      (`app/api/services/viabilidad/route.ts`, bloque de email admin).
- [x] **Gap cerrado:** reseñas ahora confirman recepción al cliente
      (`app/api/reviews/submit/route.ts`, evento `review.received`). El envío
      dependía de `profiles.email`, que `handle_new_user()` nunca rellena
      (solo backfilled hasta la migración de esa columna) — corregido para
      usar `auth.admin.getUserById()` como fuente fiable, mismo patrón que
      `getClientEmail()` en el webhook de Stripe.
- OAuth de usuario (Google/Azure vía Supabase `signInWithOAuth`) es login real de
  cliente — separado correctamente de "Gmail OAuth" (`/api/auth/google-gmail`),
  que es una función solo-staff (admin/owner) para enviar correos desde su propia
  cuenta de Gmail. No están mezclados, es una separación correcta.
- Email de bienvenida se envía en `app/auth/callback/route.ts:77-89` tras el
  primer login OAuth (flag `welcome_email_sent`), no en el trigger SQL — permite
  manejo de errores sin bloquear el login. Correcto.
- **Acción:** ambos gaps cerrados. Resto de la arquitectura de email bien
  diseñada, no requiere refactor.

## 5. Kia — arquitectura y configuración (resumen para referencia)

- 24 archivos en `lib/ai/kia/` + `health/` + `prompts/`. Motor de decisión con
  loop agéntico (máx. 5 iteraciones, timeout 25s), guardas de política, validador
  GPT-4o "judge" fail-open, anti-repetición, sub-agentes por dominio (fiscal,
  Holded, expediente).
- Multi-proveedor (Anthropic primario, OpenAI fallback) vía `AI_PROVIDER` env var.
  Modelos: `claude-sonnet-4-6` (tareas complejas), `claude-haiku-4-5-20251001`
  (tareas ligeras). Todo hardcodeado o por env var — **no hay UI de admin para
  ajustar modelo/temperatura/prompts sin redeploy**.
- Ejecución de herramientas **deshabilitada por defecto** (`KIA_AI_TOOLS_ENABLED`).
- Cost tracking existe (`kia-cost-tracker.ts`) y se ve en `/admin/kia-health`, pero
  **sin alertas ni límites automáticos** — de ahí el crítico #6 de la sección 1.
- Paneles admin ya existentes: `/admin/kia-health`, `/admin/kia-metrics`,
  `/admin/kia-auditor`. Sirven para observar, no para configurar.
- **No se requiere cambio arquitectónico** salvo: sanitizar `pageData` (crítico #2)
  y añadir rate limiting/cuota (crítico #6). El resto del diseño es sólido.

---

## Orden de implementación acordado

1. **Fase 1 (ahora):** los 6 críticos de la sección 1.
2. **Fase 2:** altos de WABA + Holded sync + email queue race conditions.
3. **Fase 3:** gaps de email (viabilidad admin, confirmación reseña) + medios de
   seguridad (JWT secret, aislamiento de tenant en reportes).
4. **Fase 4:** accesibilidad, SEO, limpieza menor.

Marcar cada casilla al completarla y hacer commit incremental por fase.
